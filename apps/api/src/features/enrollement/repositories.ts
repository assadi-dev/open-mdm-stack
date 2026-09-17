import { db as defaultDb } from "@drizzle/instance";
import {
    enrollmentChallenges,
    EnrollmentChallengeSqlInferInsert,
    enrollmentTokens,
    EnrollmentTokenSqlInferInsert,
} from "@drizzle/schemas/device-schema";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";


export class EnrollmentTokenRepository {

    /** Accepts a transaction handle so token consumption can be committed atomically with device creation. */
    constructor(private readonly db: NodePgDatabase = defaultDb) { }

    async create(input: EnrollmentTokenSqlInferInsert) {
        const row = await this.db.insert(enrollmentTokens).values({ ...input }).returning();
        return row[0];
    }

    async getOne(id: string) {
        const [row] = await this.db.select().from(enrollmentTokens).where(eq(enrollmentTokens.id, id));
        return row;
    }

    async byToken(token: string) {
        const [row] = await this.db.select().from(enrollmentTokens).where(eq(enrollmentTokens.token, token));
        return row;
    }

    async markConsumed(token: string) {
        const [row] = await this.db.update(enrollmentTokens).set({ consumedAt: new Date() }).where(eq(enrollmentTokens.token, token)).returning();
        return row;
    }

    async markUnused(token: string) {
        const [row] = await this.db.update(enrollmentTokens).set({ consumedAt: null }).where(eq(enrollmentTokens.token, token)).returning();
        return row;
    }

    async update(id: string, input: Record<string, any>) {
        const [row] = await this.db.update(enrollmentTokens).set(input).where(eq(enrollmentTokens.id, id)).returning();
        return row;
    }

    async delete(id: string) {
        await this.db.delete(enrollmentTokens).where(eq(enrollmentTokens.id, id));
    }


}

export class ChallengeRepository {

    /** Accepts a transaction handle so challenge consumption can be committed atomically with device creation. */
    constructor(private readonly db: NodePgDatabase = defaultDb) { }

    async create(input: EnrollmentChallengeSqlInferInsert) {
        const [row] = await this.db.insert(enrollmentChallenges).values({ ...input }).returning();
        return row;
    }

    async byChallenge(challenge: string) {
        const [row] = await this.db.select().from(enrollmentChallenges).where(eq(enrollmentChallenges.challenge, challenge));
        return row;
    }

    async markConsumed(challenge: string) {
        const [row] = await this.db.update(enrollmentChallenges).set({ consumedAt: new Date() }).where(eq(enrollmentChallenges.challenge, challenge)).returning();
        return row;
    }
}