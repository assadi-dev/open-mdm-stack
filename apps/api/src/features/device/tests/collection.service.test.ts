import { beforeEach, describe, expect, it, vi } from "vitest";

const { repoMock, challengeRepoMock } = vi.hoisted(() => ({
    repoMock: {
        collection: vi.fn(),
        summary: vi.fn(),
    },
    challengeRepoMock: {
        create: vi.fn(),
        byChallenge: vi.fn(),
        markConsumed: vi.fn(),
    },
}));

vi.mock("@features/device/repository", () => ({
    // `new`-able: a plain arrow function has no [[Construct]] and can't
    // stand in for a class constructor here.
    DeviceRepository: vi.fn(function () {
        return repoMock;
    }),
}));

vi.mock("@features/enrollment/repositories", () => ({
    ChallengeRepository: vi.fn(function () {
        return challengeRepoMock;
    }),
}));

vi.mock("@lib/auth", () => ({
    auth: { api: {} },
}));

import { DeviceService } from "../service";

describe("DeviceService devices list", () => {
    let service: DeviceService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DeviceService();
    });

    describe("collection", () => {
        it("hands the query to the repository and returns its page untouched", async () => {
            const query = { page: 1, limit: 20, sort: [], filters: {} };
            const page = { data: [], metadata: { page: 1, limit: 20, total: 0, totalPages: 0 } };
            repoMock.collection.mockResolvedValue(page);

            await expect(service.collection(query)).resolves.toBe(page);

            expect(repoMock.collection).toHaveBeenCalledWith(query);
        });
    });

    describe("summary", () => {
        it("fills in every status, with 0 for those no device has", async () => {
            repoMock.summary.mockResolvedValue({
                byStatus: [
                    { status: "online", count: 7 },
                    { status: "offline", count: 3 },
                ],
                androidVersions: [],
                brands: [],
                models: [],
            });

            const result = await service.summary();

            expect(result.byStatus).toEqual({ pending: 0, offline: 3, commandRunning: 0, online: 7 });
        });

        it("totals the statuses and passes the Android versions through", async () => {
            const androidVersions = [
                { sdkVersion: 34, androidVersion: "14", count: 8 },
                { sdkVersion: 29, androidVersion: "10", count: 2 },
            ];
            repoMock.summary.mockResolvedValue({
                byStatus: [
                    { status: "online", count: 6 },
                    { status: "commandRunning", count: 1 },
                    { status: "pending", count: 3 },
                ],
                androidVersions,
                brands: [],
                models: [],
            });

            const result = await service.summary();

            expect(result.total).toBe(10);
            expect(result.androidVersions).toBe(androidVersions);
        });

        it("passes the brands and models of the fleet through, for the list's filters", async () => {
            const brands = ["Google", "samsung"];
            const models = ["Galaxy A54", "Pixel 8"];
            repoMock.summary.mockResolvedValue({ byStatus: [], androidVersions: [], brands, models });

            const result = await service.summary();

            expect(result.brands).toBe(brands);
            expect(result.models).toBe(models);
        });

        it("reports an empty fleet as all zeros", async () => {
            repoMock.summary.mockResolvedValue({ byStatus: [], androidVersions: [], brands: [], models: [] });

            await expect(service.summary()).resolves.toEqual({
                total: 0,
                byStatus: { pending: 0, offline: 0, commandRunning: 0, online: 0 },
                androidVersions: [],
                brands: [],
                models: [],
            });
        });
    });
});
