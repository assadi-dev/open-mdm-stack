import { db as defaultDb } from "@drizzle/instance";
import {
    enrollmentChallenges,
    EnrollmentChallengeSqlInferInsert,
    enrollmentOtps,
} from "@drizzle/schemas/device-schema";
import { and, eq, gt, isNull, lte } from "drizzle-orm";
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

export class OtpRepository {

    constructor(private readonly db: NodePgDatabase = defaultDb) { }

    /**
     * Registers [code] as a pending OTP, in a single statement so two concurrent generations can never both get the
     * same code: the partial unique index (`code` where `consumed_at is null`) arbitrates.
     *
     * - nobody holds the code → inserted;
     * - a row holds it but expired without being used → that row is recycled with the new expiry;
     * - a row holds it and is still usable → nothing is written and `undefined` is returned: the caller draws
     *   another code.
     *
     * Dates are compared as parameters, not with SQL `now()`: the columns are `timestamp` (no time zone), written
     * through Drizzle as UTC, so the comparison has to go through the same conversion.
     */
    async issue({ code, expiresAt }: { code: string; expiresAt: Date }, now: Date = new Date()) {
        const [row] = await this.db
            .insert(enrollmentOtps)
            .values({ code, expiresAt })
            .onConflictDoUpdate({
                target: enrollmentOtps.code,
                targetWhere: isNull(enrollmentOtps.consumedAt),
                set: { expiresAt, createdAt: now, updatedAt: now },
                setWhere: lte(enrollmentOtps.expiresAt, now),
            })
            .returning();
        return row;
    }

    /**
     * Marks the pending, unexpired OTP matching [code] as consumed and returns it, or `undefined` when there is none
     * (unknown, expired or already used). One `UPDATE … RETURNING`: of two concurrent verifications of the same code,
     * exactly one gets the row.
     */
    async consume(code: string, now: Date = new Date()) {
        const [row] = await this.db
            .update(enrollmentOtps)
            .set({ consumedAt: now })
            .where(and(
                eq(enrollmentOtps.code, code),
                isNull(enrollmentOtps.consumedAt),
                gt(enrollmentOtps.expiresAt, now),
            ))
            .returning();
        return row;
    }
}
