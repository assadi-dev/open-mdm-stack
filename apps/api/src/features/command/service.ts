import { ENV } from "@config/env";
import { HTTPNotFoundException } from "@core/exception";
import { mqttGateway, mqttTopics, DeviceMessageKind } from "@lib/mqtt";
import { DeviceCommandSqlInferSelect } from "@drizzle/schemas/command-schema";
import { DeviceRepository } from "@features/device/repository";
import { CommandRepository } from "./repository";
import { commandDecoder, CreateCommandInput } from "./dto/schema";

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

    /** Entry point for every device message received by the backend MQTT client. */
    async handleDeviceMessage(deviceId: string, kind: DeviceMessageKind, payload: unknown) {
        if (kind === "status") {
            await this.handleStatus(deviceId, payload);
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
            return;
        }

        if (status === "succeeded" && updated.type === "lock") {
            await this.deviceRepository.setScreenLocked(deviceId, true);
        } else if (status === "succeeded" && updated.type === "unlock") {
            await this.deviceRepository.setScreenLocked(deviceId, false);
        }
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
