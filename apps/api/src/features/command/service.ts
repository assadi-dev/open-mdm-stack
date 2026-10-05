import { ENV } from "@config/env";
import {
    HTTPBadGatewayException,
    HTTPConflictException,
    HTTPForbiddenException,
    HTTPGatewayTimeoutException,
    HTTPNotFoundException,
    HTTPServiceUnavailableException,
} from "@core/exception";
import { mqttGateway, mqttTopics, DeviceMessageKind } from "@lib/mqtt";
import { DeviceCommandSqlInferSelect } from "@drizzle/schemas/command-schema";
import { DeviceRepository } from "@features/device/repository";
import { CommandRepository } from "./repository";
import { commandDecoder, CreateCommandInput } from "./dto/schema";

/**
 * How long an admin request waits for a device to answer a `refresh`. The command itself stays deliverable a
 * little longer than that, and no longer: a refresh replayed hours later, when the device reconnects, would only
 * be noise (the default `COMMAND_TTL_SECONDS` is for commands that must land eventually).
 */
export const REFRESH_TIMEOUT_MS = 15_000;
const REFRESH_TTL_MS = REFRESH_TIMEOUT_MS + 5_000;
const REFRESH_POLL_MS = 500;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Remote commands over MQTT. Delivery is at-least-once: a command is
 * (re)published until the device acks it, so the agent must dedupe by `id`.
 *
 *   create ──publish ok──> sent ──ack──> acknowledged ──> succeeded | failed
 *     │                      └──── no ack before expiresAt ────> expired
 *     └─ broker down: stays pending, flushed when the device comes online
 *        or the API reconnects to the broker.
 */
export class CommandService {
    private repository: CommandRepository;
    private deviceRepository: DeviceRepository;

    constructor() {
        this.repository = new CommandRepository();
        this.deviceRepository = new DeviceRepository();
    }

    async create(deviceId: string, input: CreateCommandInput) {
        const device = await this.deviceRepository.findDeviceById(deviceId);
        if (!device || device.enrollmentStatus !== "enrolled") {
            throw new HTTPNotFoundException("Device not found");
        }

        const command = await this.repository.create({
            deviceId,
            type: input.type,
            payload: "payload" in input ? input.payload : {},
            expiresAt: new Date(Date.now() + ENV.COMMAND_TTL_SECONDS * 1000),
        });

        if (await this.publish(command)) {
            return (await this.repository.markSent(command.id)) ?? command;
        }
        return command;
    }

    async list(deviceId: string) {
        return this.repository.listByDevice(deviceId);
    }

    /**
     * Asks a device to push its heartbeat and telemetry now (command `refresh`) and waits for its answer, so the
     * caller can read fresh data right after. The device writes through its usual endpoints; the ack only says it
     * is done.
     *
     *   404  the device doesn't exist or is no longer listed (revoked, unenrolled)
     *   403  it is blocked (see DeviceService.block)
     *   409  it is offline (or still pending): it can't answer, so nothing is sent
     *   503  the broker is unreachable
     *   502  the device answered `failed` (e.g. an agent too old to know `refresh`)
     *   504  no answer within `REFRESH_TIMEOUT_MS`
     *
     * A silent device is reported, never marked offline: `online` belongs to the MQTT status alone (see
     * `handleStatus`), and writing it here would stick until the device reconnects, even though it may be fine.
     */
    async refresh(deviceId: string) {
        const device = await this.deviceRepository.findDeviceById(deviceId);
        if (!device || device.enrollmentStatus === "revoked" || device.enrollmentStatus === "unenrolled") {
            throw new HTTPNotFoundException("Device not found");
        }
        // It would answer through the HTTP endpoints, which `requireDeviceAuth` refuses to a blocked device.
        if (device.blockedAt) {
            throw new HTTPForbiddenException("Device is blocked");
        }
        if (device.enrollmentStatus === "pending" || !device.online) {
            throw new HTTPConflictException("Device is offline");
        }

        const command = await this.repository.create({
            deviceId,
            type: "refresh",
            payload: {},
            expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        });

        if (!(await this.publish(command))) {
            await this.repository.expire(command.id);
            throw new HTTPServiceUnavailableException("Message broker unreachable");
        }
        await this.repository.markSent(command.id);

        await this.waitForCompletion(command.id);
    }

    /** Entry point for every device message received by the backend MQTT client. */
    async handleDeviceMessage(deviceId: string, kind: DeviceMessageKind, payload: unknown) {
        if (kind === "status") {
            await this.handleStatus(deviceId, payload);
        } else if (kind === "screen") {
            await this.handleScreen(deviceId, payload);
        } else {
            await this.handleAck(deviceId, payload);
        }
    }

    /** Called on each (re)connection of the API to the broker. */
    async flushPendingForOnlineDevices() {
        await this.repository.expireOverdue();
        const rows = await this.repository.findPendingForOnlineDevices();
        for (const { command } of rows) {
            if (await this.publish(command)) {
                await this.repository.markSent(command.id);
            }
        }
    }

    private async handleStatus(deviceId: string, payload: unknown) {
        const parsed = commandDecoder.status(payload);
        if (!parsed.success) {
            console.warn(`MQTT: invalid status from device ${deviceId}`);
            return;
        }

        const online = parsed.data.state === "online";
        await this.deviceRepository.setPresence(deviceId, online);
        if (online) {
            await this.redeliver(deviceId);
        }
    }

    private async handleAck(deviceId: string, payload: unknown) {
        const parsed = commandDecoder.ack(payload);
        if (!parsed.success) {
            console.warn(`MQTT: invalid ack from device ${deviceId}`);
            return;
        }

        const { commandId, status, result, error } = parsed.data;
        const updated = await this.repository.applyAck({
            id: commandId,
            // Topic-derived and ACL-enforced: a device can only ack its own commands.
            deviceId,
            status,
            allowedFrom: status === "acknowledged" ? ["pending", "sent"] : ["pending", "sent", "acknowledged"],
            result,
            error,
        });
        if (!updated) {
            console.warn(`MQTT: ignored ack ${status} for command ${commandId} (device ${deviceId})`);
        }
    }

    /** The device reports its screen power state whenever it changes, independently of any command (see mdm/devices/{id}/screen). */
    private async handleScreen(deviceId: string, payload: unknown) {
        const parsed = commandDecoder.screen(payload);
        if (!parsed.success) {
            console.warn(`MQTT: invalid screen state from device ${deviceId}`);
            return;
        }

        await this.deviceRepository.setScreenOn(deviceId, parsed.data.on);
    }

    /** Re-sends everything not yet acknowledged, e.g. when the device reconnects. */
    private async redeliver(deviceId: string) {
        await this.repository.expireOverdue(deviceId);
        const commands = await this.repository.findDeliverable(deviceId);
        for (const command of commands) {
            if (await this.publish(command)) {
                await this.repository.markSent(command.id);
            }
        }
    }

    /** Polls the command until the device completes it. Gives up (and expires it) after `REFRESH_TIMEOUT_MS`. */
    private async waitForCompletion(commandId: string) {
        const deadline = Date.now() + REFRESH_TIMEOUT_MS;
        for (;;) {
            const command = await this.repository.findById(commandId);
            if (command?.status === "succeeded") return;
            if (command?.status === "failed") {
                throw new HTTPBadGatewayException(command.error ?? "Device failed to refresh");
            }
            if (Date.now() >= deadline) break;
            await sleep(REFRESH_POLL_MS);
        }

        await this.repository.expire(commandId);
        throw new HTTPGatewayTimeoutException("Device did not answer");
    }

    private publish(command: DeviceCommandSqlInferSelect) {
        return mqttGateway.publishJson(mqttTopics.commands(command.deviceId), {
            id: command.id,
            type: command.type,
            payload: command.payload,
            issuedAt: command.createdAt.toISOString(),
            expiresAt: command.expiresAt.toISOString(),
        });
    }
}
