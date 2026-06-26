import { db } from "@drizzle/instance";
import { devices, enrollmentTokens } from "@drizzle/schemas/device-schema";
import { and, eq, gt, isNull } from "drizzle-orm";

export class DeviceRepository {
    async createToken(input: {
        token: string;
        expiresAt: Date;
        createdBy?: string | null;
        qrFileName?: string | null;
    }) {
        const rows = (await db
            .insert(enrollmentTokens)
            .values({
                token: input.token,
                expiresAt: input.expiresAt,
                createdBy: input.createdBy ?? null,
                qrFileName: input.qrFileName ?? null,
            })
            .returning()) as Array<typeof enrollmentTokens.$inferSelect>;
        return rows[0];
    }

    async findTokenById(id: string) {
        const [row] = await db
            .select()
            .from(enrollmentTokens)
            .where(eq(enrollmentTokens.id, id))
            .limit(1);
        return row;
    }

    /** Returns the token only if it exists, is unused and not expired. */
    async findUsableToken(token: string) {
        const [row] = await db
            .select()
            .from(enrollmentTokens)
            .where(
                and(
                    eq(enrollmentTokens.token, token),
                    eq(enrollmentTokens.isUsed, false),
                    gt(enrollmentTokens.expiresAt, new Date()),
                    isNull(enrollmentTokens.deviceId),
                ),
            )
            .limit(1);
        return row;
    }

    async markTokenUsed(tokenId: string, deviceId: string) {
        await db
            .update(enrollmentTokens)
            .set({ isUsed: true, usedAt: new Date(), deviceId })
            .where(eq(enrollmentTokens.id, tokenId));
    }

    async createDevice(input: {
        enrollmentTokenId: string;
        serial: string;
        model: string;
        manufacturer: string;
        osVersion: string;
    }) {
        const rows = (await db
            .insert(devices)
            .values({
                enrollmentTokenId: input.enrollmentTokenId,
                serial: input.serial,
                model: input.model,
                manufacturer: input.manufacturer,
                osVersion: input.osVersion,
                status: "enrolled",
            })
            .returning()) as Array<typeof devices.$inferSelect>;
        return rows[0];
    }

    async findDeviceById(id: string) {
        const [row] = await db.select().from(devices).where(eq(devices.id, id)).limit(1);
        return row;
    }

    async touchHeartbeat(id: string) {
        await db
            .update(devices)
            .set({ lastHeartbeatAt: new Date() })
            .where(eq(devices.id, id));
    }
}
