import { beforeEach, describe, expect, it, vi } from "vitest";

const { repoMock } = vi.hoisted(() => ({
    repoMock: {
        create: vi.fn(),
        findAll: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("@features/wifi-network/repository", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    WifiNetworkRepository: vi.fn(function () {
        return repoMock;
    }),
}));

import { WifiNetworkService } from "../service";

const NETWORK_ID = "7f1c2e4a-9b3d-4c5e-8f6a-1b2c3d4e5f60";

const wifiNetworkRow = (overrides: object = {}) => ({
    id: NETWORK_ID,
    name: "Office",
    ssid: "office-ssid",
    password: "s3cr3t!",
    security: "WPA2",
    createdAt: new Date("2026-09-23T10:00:00Z"),
    updatedAt: new Date("2026-09-23T10:00:00Z"),
    ...overrides,
});

describe("WifiNetworkService", () => {
    let service: WifiNetworkService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new WifiNetworkService();
    });

    describe("create", () => {
        it("persists the wifi network", async () => {
            repoMock.create.mockResolvedValue(wifiNetworkRow());

            const result = await service.create({
                name: "Office",
                ssid: "office-ssid",
                password: "s3cr3t!",
                security: "WPA2",
            });

            expect(repoMock.create).toHaveBeenCalledWith({
                name: "Office",
                ssid: "office-ssid",
                password: "s3cr3t!",
                security: "WPA2",
            });
            expect(result).toEqual(wifiNetworkRow());
        });
    });

    describe("list", () => {
        it("returns every wifi network", async () => {
            repoMock.findAll.mockResolvedValue([wifiNetworkRow()]);

            const result = await service.list();

            expect(result).toEqual([wifiNetworkRow()]);
        });
    });

    describe("getById", () => {
        it("returns the wifi network when it exists", async () => {
            repoMock.findById.mockResolvedValue(wifiNetworkRow());

            const result = await service.getById(NETWORK_ID);

            expect(repoMock.findById).toHaveBeenCalledWith(NETWORK_ID);
            expect(result).toEqual(wifiNetworkRow());
        });

        it("throws a 404 when the wifi network doesn't exist", async () => {
            repoMock.findById.mockResolvedValue(undefined);

            await expect(service.getById(NETWORK_ID)).rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe("update", () => {
        it("updates an existing wifi network", async () => {
            repoMock.findById.mockResolvedValue(wifiNetworkRow());
            repoMock.update.mockResolvedValue(wifiNetworkRow({ ssid: "new-ssid" }));

            const result = await service.update(NETWORK_ID, { ssid: "new-ssid" });

            expect(repoMock.update).toHaveBeenCalledWith(NETWORK_ID, { ssid: "new-ssid" });
            expect(result?.ssid).toBe("new-ssid");
        });

        it("throws a 404 instead of updating a wifi network that doesn't exist", async () => {
            repoMock.findById.mockResolvedValue(undefined);

            await expect(service.update(NETWORK_ID, { ssid: "new-ssid" })).rejects.toMatchObject({ statusCode: 404 });
            expect(repoMock.update).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("deletes an existing wifi network", async () => {
            repoMock.delete.mockResolvedValue(wifiNetworkRow());

            const result = await service.delete(NETWORK_ID);

            expect(repoMock.delete).toHaveBeenCalledWith(NETWORK_ID);
            expect(result).toEqual(wifiNetworkRow());
        });

        it("throws a 404 when the wifi network doesn't exist", async () => {
            repoMock.delete.mockResolvedValue(undefined);

            await expect(service.delete(NETWORK_ID)).rejects.toMatchObject({ statusCode: 404 });
        });
    });
});
