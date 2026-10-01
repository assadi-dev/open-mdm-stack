import { db as defaultDb } from "@drizzle/instance";
import {
    enrollmentChallenges,
    EnrollmentChallengeSqlInferInsert,
} from "@drizzle/schemas/device-schema";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

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