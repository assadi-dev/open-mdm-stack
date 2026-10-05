import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { commandRepoMock, deviceRepoMock, publishJsonMock } = vi.hoisted(() => ({
    commandRepoMock: {
        create: vi.fn(),
        listByDevice: vi.fn(),
        findDeliverable: vi.fn(),
        findPendingForOnlineDevices: vi.fn(),
        markSent: vi.fn(),
        applyAck: vi.fn(),
        expireOverdue: vi.fn(),
        findById: vi.fn(),
        expire: vi.fn(),
    },
    deviceRepoMock: {
        findDeviceById: vi.fn(),
        setPresence: vi.fn(),
        setScreenOn: vi.fn(),
    },
    publishJsonMock: vi.fn(),
}));

vi.mock("@features/command/repository", () => ({
    CommandRepository: vi.fn(function () {
        return commandRepoMock;
    }),
}));

vi.mock("@features/device/repository", () => ({
    DeviceRepository: vi.fn(function () {
        return deviceRepoMock;
    }),
}));

vi.mock("@lib/mqtt", () => ({
    mqttGateway: { publishJson: publishJsonMock },
    mqttTopics: { commands: (id: string) => `mdm/devices/${id}/commands` },
}));

import { CommandService, REFRESH_TIMEOUT_MS } from "../service";

const DEVICE_ID = "7f1c2e4a-9b3d-4c5e-8f6a-1b2c3d4e5f60";
const COMMAND_ID = "0b6f1d2e-3c4a-4b5c-9d6e-7f8091a2b3c4";

const commandRow = (overrides: object = {}) => ({
    id: COMMAND_ID,
    deviceId: DEVICE_ID,
    type: "lock",
    payload: {},
    status: "pending",
    createdAt: new Date("2026-09-23T10:00:00Z"),
    expiresAt: new Date("2026-09-24T10:00:00Z"),
    ...overrides,
});

describe("CommandService", () => {
    let service: CommandService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CommandService();
    });

    describe("create", () => {
        it("persists the command, publishes it on the device topic and marks it sent", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus: "enrolled" });
            commandRepoMock.create.mockResolvedValue(commandRow());
            commandRepoMock.markSent.mockResolvedValue(commandRow({ status: "sent", sentAt: new Date() }));
            publishJsonMock.mockResolvedValue(true);

            const result = await service.create(DEVICE_ID, { type: "lock" });

            expect(publishJsonMock).toHaveBeenCalledWith(`mdm/devices/${DEVICE_ID}/commands`, expect.objectContaining({
                id: COMMAND_ID,
                type: "lock",
            }));
            expect(commandRepoMock.markSent).toHaveBeenCalledWith(COMMAND_ID);
            expect(result.status).toBe("sent");
        });

        it("keeps the command pending when the broker is unreachable", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus: "enrolled" });
            commandRepoMock.create.mockResolvedValue(commandRow());
            publishJsonMock.mockResolvedValue(false);

            const result = await service.create(DEVICE_ID, { type: "lock" });

            expect(commandRepoMock.markSent).not.toHaveBeenCalled();
            expect(result.status).toBe("pending");
        });

        it("stores the payload of set_lock_message", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus: "enrolled" });
            commandRepoMock.create.mockResolvedValue(commandRow({ type: "set_lock_message" }));
            publishJsonMock.mockResolvedValue(true);

            await service.create(DEVICE_ID, { type: "set_lock_message", payload: { message: "Propriété ACME" } });

            expect(commandRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({
                type: "set_lock_message",
                payload: { message: "Propriété ACME" },
            }));
        });

        it("answers 404 for a device that doesn't exist", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue(undefined);

            await expect(service.create(DEVICE_ID, { type: "lock" })).rejects.toMatchObject({ statusCode: 404 });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
        });

        it.each(["pending", "revoked", "unenrolled"])("refuses a %s device with 403 DEVICE_NOT_ENROLLED", async (enrollmentStatus) => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus });

            await expect(service.create(DEVICE_ID, { type: "lock" })).rejects.toMatchObject({
                statusCode: 403,
                message: "Device is not enrolled",
                reason: "DEVICE_NOT_ENROLLED",
            });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
        });

        it("refuses a blocked device with 403 DEVICE_BLOCKED", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus: "enrolled", blockedAt: new Date() });

            await expect(service.create(DEVICE_ID, { type: "lock" })).rejects.toMatchObject({
                statusCode: 403,
                message: "Device is blocked",
                reason: "DEVICE_BLOCKED",
            });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
        });
    });

    describe("refresh", () => {
        const NOW = new Date("2026-10-03T12:00:00Z");
        const onlineDevice = { id: DEVICE_ID, enrollmentStatus: "enrolled", online: true };

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(NOW);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        const deviceAnswers = (...statuses: object[]) => {
            commandRepoMock.create.mockResolvedValue(commandRow({ type: "refresh" }));
            publishJsonMock.mockResolvedValue(true);
            statuses.forEach((status) => commandRepoMock.findById.mockResolvedValueOnce(commandRow(status)));
        };

        it("sends a short-lived refresh command and returns once the device reports it succeeded", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue(onlineDevice);
            deviceAnswers({ status: "sent" }, { status: "acknowledged" }, { status: "succeeded" });

            const done = service.refresh(DEVICE_ID);
            await vi.advanceTimersByTimeAsync(1_000);
            await done;

            expect(commandRepoMock.create).toHaveBeenCalledWith({
                deviceId: DEVICE_ID,
                type: "refresh",
                payload: {},
                // Not the 24 h default: a refresh replayed on reconnect would be noise.
                expiresAt: new Date(NOW.getTime() + REFRESH_TIMEOUT_MS + 5_000),
            });
            expect(publishJsonMock).toHaveBeenCalledWith(`mdm/devices/${DEVICE_ID}/commands`, expect.objectContaining({
                id: COMMAND_ID,
                type: "refresh",
            }));
            expect(commandRepoMock.markSent).toHaveBeenCalledWith(COMMAND_ID);
            expect(commandRepoMock.findById).toHaveBeenCalledTimes(3);
            expect(commandRepoMock.expire).not.toHaveBeenCalled();
        });

        it("answers 502 with the device's own error when it reports the command failed", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue(onlineDevice);
            deviceAnswers({ status: "failed", error: "Unknown command type: refresh" });

            await expect(service.refresh(DEVICE_ID)).rejects.toMatchObject({
                statusCode: 502,
                message: "Unknown command type: refresh",
            });
            expect(commandRepoMock.expire).not.toHaveBeenCalled();
        });

        it("answers 504 once the timeout is over, expires the command and leaves the presence alone", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue(onlineDevice);
            deviceAnswers();
            commandRepoMock.findById.mockResolvedValue(commandRow({ status: "sent" }));

            const outcome = expect(service.refresh(DEVICE_ID)).rejects.toMatchObject({ statusCode: 504 });

            await vi.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS - 1_000);
            expect(commandRepoMock.expire).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(2_000);
            await outcome;
            expect(commandRepoMock.expire).toHaveBeenCalledWith(COMMAND_ID);
            expect(deviceRepoMock.setPresence).not.toHaveBeenCalled();
        });

        it("answers 409 without creating or sending anything when the device is offline", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ ...onlineDevice, online: false });

            await expect(service.refresh(DEVICE_ID)).rejects.toMatchObject({ statusCode: 409 });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
            expect(publishJsonMock).not.toHaveBeenCalled();
        });

        it("answers 404 when the device is unknown", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue(undefined);

            await expect(service.refresh(DEVICE_ID)).rejects.toMatchObject({ statusCode: 404 });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
        });

        it.each(["pending", "revoked", "unenrolled"])("refuses a %s device with 403 DEVICE_NOT_ENROLLED", async (enrollmentStatus) => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ ...onlineDevice, enrollmentStatus });

            await expect(service.refresh(DEVICE_ID)).rejects.toMatchObject({ statusCode: 403, reason: "DEVICE_NOT_ENROLLED" });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
        });

        it("refuses a blocked device with 403 DEVICE_BLOCKED, even when it is online", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ ...onlineDevice, blockedAt: new Date() });

            await expect(service.refresh(DEVICE_ID)).rejects.toMatchObject({ statusCode: 403, reason: "DEVICE_BLOCKED" });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
        });

        it("answers 503 and expires the command when the broker is unreachable", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue(onlineDevice);
            commandRepoMock.create.mockResolvedValue(commandRow({ type: "refresh" }));
            publishJsonMock.mockResolvedValue(false);

            await expect(service.refresh(DEVICE_ID)).rejects.toMatchObject({ statusCode: 503 });
            expect(commandRepoMock.expire).toHaveBeenCalledWith(COMMAND_ID);
            expect(commandRepoMock.markSent).not.toHaveBeenCalled();
            expect(commandRepoMock.findById).not.toHaveBeenCalled();
        });
    });

    describe("handleDeviceMessage — status", () => {
        it("marks the device online and redelivers unacknowledged commands", async () => {
            commandRepoMock.findDeliverable.mockResolvedValue([commandRow(), commandRow({ id: "second", status: "sent" })]);
            publishJsonMock.mockResolvedValue(true);

            await service.handleDeviceMessage(DEVICE_ID, "status", { state: "online" });

            expect(deviceRepoMock.setPresence).toHaveBeenCalledWith(DEVICE_ID, true);
            expect(commandRepoMock.expireOverdue).toHaveBeenCalledWith(DEVICE_ID);
            expect(publishJsonMock).toHaveBeenCalledTimes(2);
        });

        it("marks the device offline (Last Will) without publishing", async () => {
            await service.handleDeviceMessage(DEVICE_ID, "status", { state: "offline" });

            expect(deviceRepoMock.setPresence).toHaveBeenCalledWith(DEVICE_ID, false);
            expect(publishJsonMock).not.toHaveBeenCalled();
        });

        it("ignores a malformed status", async () => {
            await service.handleDeviceMessage(DEVICE_ID, "status", "online");

            expect(deviceRepoMock.setPresence).not.toHaveBeenCalled();
        });
    });

    describe("handleDeviceMessage — acks", () => {
        it("scopes the ack to the publishing device and only moves forward", async () => {
            commandRepoMock.applyAck.mockResolvedValue(commandRow({ status: "succeeded" }));

            await service.handleDeviceMessage(DEVICE_ID, "acks", {
                commandId: COMMAND_ID,
                status: "succeeded",
                result: { locked: true },
            });

            expect(commandRepoMock.applyAck).toHaveBeenCalledWith({
                id: COMMAND_ID,
                deviceId: DEVICE_ID,
                status: "succeeded",
                allowedFrom: ["pending", "sent", "acknowledged"],
                result: { locked: true },
                error: undefined,
            });
        });

        it("does not let a late 'acknowledged' overwrite a final status", async () => {
            await service.handleDeviceMessage(DEVICE_ID, "acks", { commandId: COMMAND_ID, status: "acknowledged" });

            expect(commandRepoMock.applyAck).toHaveBeenCalledWith(expect.objectContaining({
                allowedFrom: ["pending", "sent"],
            }));
        });

        it("ignores a malformed ack", async () => {
            await service.handleDeviceMessage(DEVICE_ID, "acks", { commandId: "not-a-uuid", status: "succeeded" });

            expect(commandRepoMock.applyAck).not.toHaveBeenCalled();
        });

    });

    describe("handleDeviceMessage — screen", () => {
        it("records the reported screen-on state", async () => {
            await service.handleDeviceMessage(DEVICE_ID, "screen", { on: true });

            expect(deviceRepoMock.setScreenOn).toHaveBeenCalledWith(DEVICE_ID, true);
        });

        it("records a screen-off report", async () => {
            await service.handleDeviceMessage(DEVICE_ID, "screen", { on: false });

            expect(deviceRepoMock.setScreenOn).toHaveBeenCalledWith(DEVICE_ID, false);
        });

        it("ignores a malformed screen report", async () => {
            await service.handleDeviceMessage(DEVICE_ID, "screen", { on: "yes" });

            expect(deviceRepoMock.setScreenOn).not.toHaveBeenCalled();
        });
    });
});
