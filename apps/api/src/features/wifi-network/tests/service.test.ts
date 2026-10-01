import { beforeEach, describe, expect, it, vi } from "vitest";

const { repoMock } = vi.hoisted(() => ({
    repoMock: {
        create: vi.fn(),
        listOptions: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
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

// What the repository/DB actually holds — password is the AES-256-GCM
// ciphertext (iv:authTag:ciphertext, see lib/crypto.ts), never the plaintext.
const wifiNetworkRow = (overrides: object = {}) => ({
    id: NETWORK_ID,
    name: "Office",
    ssid: "office-ssid",
    password: "ZmFrZS1pdg==:ZmFrZS10YWc=:ZmFrZS1jaXBoZXJ0ZXh0",
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
        it("encrypts the password before persisting it and never returns it", async () => {
            repoMock.create.mockResolvedValue(wifiNetworkRow());

            const result = await service.create({
                name: "Office",
                ssid: "office-ssid",
                password: "s3cr3t!",
                security: "WPA2",
            });

            expect(repoMock.create).toHaveBeenCalledTimes(1);
            const persisted = repoMock.create.mock.calls[0][0];
            expect(persisted.name).toBe("Office");
            expect(persisted.ssid).toBe("office-ssid");
            expect(persisted.security).toBe("WPA2");
            // Never the plaintext, and not trivially reversible-looking either.
            expect(persisted.password).not.toBe("s3cr3t!");
            expect(persisted.password.split(":")).toHaveLength(3);

            expect(result).not.toHaveProperty("password");
        });
    });

    describe("list", () => {
        it("returns the lightweight options (no password) from the repository", async () => {
            const options = [{ id: NETWORK_ID, name: "Office", ssid: "office-ssid" }];
            repoMock.listOptions.mockResolvedValue(options);

            const result = await service.list();

            expect(result).toEqual(options);
        });
    });

    describe("getById", () => {
        it("returns the wifi network without its password when it exists", async () => {
            repoMock.findById.mockResolvedValue(wifiNetworkRow());

            const result = await service.getById(NETWORK_ID);

            expect(repoMock.findById).toHaveBeenCalledWith(NETWORK_ID);
            expect(result).not.toHaveProperty("password");
            expect(result).toMatchObject({ id: NETWORK_ID, ssid: "office-ssid" });
        });

        it("throws a 404 when the wifi network doesn't exist", async () => {
            repoMock.findById.mockResolvedValue(undefined);

            await expect(service.getById(NETWORK_ID)).rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe("update", () => {
        it("updates an existing wifi network and leaves the password untouched when not provided", async () => {
            repoMock.findById.mockResolvedValue(wifiNetworkRow());
            repoMock.update.mockResolvedValue(wifiNetworkRow({ ssid: "new-ssid" }));

            const result = await service.update(NETWORK_ID, { ssid: "new-ssid" });

            expect(repoMock.update).toHaveBeenCalledWith(NETWORK_ID, { ssid: "new-ssid", password: undefined });
            expect(result).not.toHaveProperty("password");
            expect(result?.ssid).toBe("new-ssid");
        });

        it("encrypts the new password instead of storing it in clear", async () => {
            repoMock.findById.mockResolvedValue(wifiNetworkRow());
            repoMock.update.mockResolvedValue(wifiNetworkRow());

            await service.update(NETWORK_ID, { password: "n3wp4ss!" });

            const persisted = repoMock.update.mock.calls[0][1];
            expect(persisted.password).not.toBe("n3wp4ss!");
            expect(persisted.password.split(":")).toHaveLength(3);
        });

        it("throws a 404 instead of updating a wifi network that doesn't exist", async () => {
            repoMock.findById.mockResolvedValue(undefined);

            await expect(service.update(NETWORK_ID, { ssid: "new-ssid" })).rejects.toMatchObject({ statusCode: 404 });
            expect(repoMock.update).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("deletes an existing wifi network without returning its password", async () => {
            repoMock.delete.mockResolvedValue(wifiNetworkRow());

            const result = await service.delete(NETWORK_ID);

            expect(repoMock.delete).toHaveBeenCalledWith(NETWORK_ID);
            expect(result).not.toHaveProperty("password");
        });

        it("throws a 404 when the wifi network doesn't exist", async () => {
            repoMock.delete.mockResolvedValue(undefined);

            await expect(service.delete(NETWORK_ID)).rejects.toMatchObject({ statusCode: 404 });
        });
    });

    describe("deleteMany", () => {
        it("deletes the given wifi networks in a single repository call", async () => {
            repoMock.deleteMany.mockResolvedValue(undefined);

            await service.deleteMany([NETWORK_ID, "0b8f4d2c-6a1e-4f3b-9c7d-5e2a1b3c4d5e"]);

            expect(repoMock.deleteMany).toHaveBeenCalledTimes(1);
            expect(repoMock.deleteMany).toHaveBeenCalledWith([NETWORK_ID, "0b8f4d2c-6a1e-4f3b-9c7d-5e2a1b3c4d5e"]);
        });
    });
});
