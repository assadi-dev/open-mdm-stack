import { beforeEach, describe, expect, it, vi } from "vitest";

const { commandRepoMock, deviceRepoMock, publishJsonMock } = vi.hoisted(() => ({
    commandRepoMock: {
        create: vi.fn(),
        listByDevice: vi.fn(),
        findDeliverable: vi.fn(),
        findPendingForOnlineDevices: vi.fn(),
        markSent: vi.fn(),
        applyAck: vi.fn(),
        expireOverdue: vi.fn(),
    },
    deviceRepoMock: {
        findDeviceById: vi.fn(),
        setPresence: vi.fn(),
        setScreenLocked: vi.fn(),
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

import { CommandService } from "../service";

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

        it("rejects a device that is not enrolled", async () => {
            deviceRepoMock.findDeviceById.mockResolvedValue({ id: DEVICE_ID, enrollmentStatus: "revoked" });

            await expect(service.create(DEVICE_ID, { type: "lock" })).rejects.toMatchObject({ statusCode: 404 });
            expect(commandRepoMock.create).not.toHaveBeenCalled();
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

        it("marks the screen locked when a 'lock' command succeeds", async () => {
            commandRepoMock.applyAck.mockResolvedValue(commandRow({ type: "lock", status: "succeeded" }));

            await service.handleDeviceMessage(DEVICE_ID, "acks", { commandId: COMMAND_ID, status: "succeeded" });

            expect(deviceRepoMock.setScreenLocked).toHaveBeenCalledWith(DEVICE_ID, true);
        });

        it("marks the screen unlocked when an 'unlock' command succeeds", async () => {
            commandRepoMock.applyAck.mockResolvedValue(commandRow({ type: "unlock", status: "succeeded" }));

            await service.handleDeviceMessage(DEVICE_ID, "acks", { commandId: COMMAND_ID, status: "succeeded" });

            expect(deviceRepoMock.setScreenLocked).toHaveBeenCalledWith(DEVICE_ID, false);
        });

        it("does not touch the screen lock state for a non lock/unlock command", async () => {
            commandRepoMock.applyAck.mockResolvedValue(commandRow({ type: "reboot", status: "succeeded" }));

            await service.handleDeviceMessage(DEVICE_ID, "acks", { commandId: COMMAND_ID, status: "succeeded" });

            expect(deviceRepoMock.setScreenLocked).not.toHaveBeenCalled();
        });

        it("does not touch the screen lock state for a mere 'acknowledged' ack", async () => {
            commandRepoMock.applyAck.mockResolvedValue(commandRow({ type: "lock", status: "acknowledged" }));

            await service.handleDeviceMessage(DEVICE_ID, "acks", { commandId: COMMAND_ID, status: "acknowledged" });

            expect(deviceRepoMock.setScreenLocked).not.toHaveBeenCalled();
        });
    });
});
