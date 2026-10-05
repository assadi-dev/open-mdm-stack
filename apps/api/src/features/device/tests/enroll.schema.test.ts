import { describe, expect, it } from "vitest";
import { enrollDeviceSchema } from "../dto/schema";

const enrollment = {
    challenge: "the-challenge",
    timestamp: "2026-01-01T00:00:00.000Z",
    signature: "c2lnbmF0dXJl",
    device: { model: "Pixel 8", manufacturer: "Google", release: "14", sdkVersion: 34, publicKey: "cHVibGljS2V5" },
};

const parseName = (name: unknown) => {
    const result = enrollDeviceSchema.safeParse({ ...enrollment, ...(name !== undefined && { name }) });
    return result.success ? { ok: true as const, name: result.data.name } : { ok: false as const };
};

describe("enrollDeviceSchema `name` (the device name carried by the provisioning QR)", () => {
    it("is optional: an enrollment without one is valid and has no name", () => {
        expect(parseName(undefined)).toEqual({ ok: true, name: undefined });
    });

    it("keeps a name, trimmed", () => {
        expect(parseName("  Terrain-Lyon ")).toEqual({ ok: true, name: "Terrain-Lyon" });
    });

    it("reads a null or blank name as no name", () => {
        expect(parseName(null)).toEqual({ ok: true, name: undefined });
        expect(parseName("")).toEqual({ ok: true, name: undefined });
        expect(parseName("   ")).toEqual({ ok: true, name: undefined });
    });

    it("accepts a name of 100 characters and refuses a longer one", () => {
        expect(parseName("a".repeat(100))).toEqual({ ok: true, name: "a".repeat(100) });
        expect(parseName("a".repeat(101))).toEqual({ ok: false });
    });

    it("refuses a name that is not a text", () => {
        expect(parseName(42)).toEqual({ ok: false });
        expect(parseName({ value: "x" })).toEqual({ ok: false });
    });
});
