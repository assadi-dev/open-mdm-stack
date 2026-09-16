import { db } from "@drizzle/instance";
import { enrollmentTokens, EnrollmentTokenSqlInferInsert } from "@drizzle/schemas/device-schema";
import { eq } from "drizzle-orm";


export class EnrollmentTokenRepository {

    async create(input: EnrollmentTokenSqlInferInsert) {
        const row = await db.insert(enrollmentTokens).values({ ...input }).returning();
        return row[0];
    }

    async getOne(id: string) {
        const [row] = await db.select().from(enrollmentTokens).where(eq(enrollmentTokens.id, id));
        return row;
    }

    async byToken(token: string) {
        const [row] = await db.select().from(enrollmentTokens).where(eq(enrollmentTokens.token, token));
        return row;
    }

    async markConsumed(token: string) {
        const [row] = await db.update(enrollmentTokens).set({ consumedAt: new Date() }).where(eq(enrollmentTokens.token, token)).returning();
        return row;
    }

    async markUnused(token: string) {
        const [row] = await db.update(enrollmentTokens).set({ consumedAt: null }).where(eq(enrollmentTokens.token, token)).returning();
        return row;
    }

    async update(id: string, input: Record<string, any>) {
        const [row] = await db.update(enrollmentTokens).set(input).where(eq(enrollmentTokens.id, id)).returning();
        return row;
    }

    async delete(id: string) {
        await db.delete(enrollmentTokens).where(eq(enrollmentTokens.id, id));
    }


}