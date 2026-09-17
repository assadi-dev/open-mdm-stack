import { beforeEach, describe, expect, it, vi } from "vitest";

const { repoMock } = vi.hoisted(() => ({
    repoMock: {
        createDevice: vi.fn(),
        findDeviceById: vi.fn(),
        touchHeartbeat: vi.fn(),
    },
}));

vi.mock("@features/device/repository", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    DeviceRepository: vi.fn(function () {
        return repoMock;
    }),
}));

import { DeviceService } from "../service";

describe("DeviceService", () => {
    let service: DeviceService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DeviceService();
    });

    it("recordHeartbeat refreshes the device's last-seen timestamp", async () => {
        await service.recordHeartbeat("device-1");

        expect(repoMock.touchHeartbeat).toHaveBeenCalledWith("device-1");
    });

    it("recordInventory also refreshes the heartbeat timestamp (an inventory push counts as a check-in)", async () => {
        await service.recordInventory("device-1", {
            os: "Android 14",
            model: "Pixel 8",
            manufacturer: "Google",
            serial: "abc123",
            storage: { totalBytes: 1000, freeBytes: 500 },
            apps: [],
        });

        expect(repoMock.touchHeartbeat).toHaveBeenCalledWith("device-1");
    });
});
