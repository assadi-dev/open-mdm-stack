import { describe, expect, it } from "vitest";
import { QueryBuilder } from "drizzle-orm/pg-core";
import { deviceOverview } from "@drizzle/schemas/device-overview-view";
import { toCollectionClauses } from "@features/paginations/services";
import { deviceCollectionQuerySchema } from "../dto/schema";
import { deviceRepositoryFactory } from "../factory/repositories";

// Builds the SQL of the devices list for a query string, without touching a database.
const toSql = (query: Record<string, string>) => {
    const config = deviceRepositoryFactory.toCollectionConfig(deviceOverview);
    const { where, orderBy, limit, offset } = toCollectionClauses(deviceCollectionQuerySchema.parse(query), config);

    return new QueryBuilder()
        .select(deviceRepositoryFactory.toSelectCollection(deviceOverview))
        .from(deviceOverview)
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset)
        .toSQL();
};

describe("devices list SQL", () => {
    it("searches the name, model, serial number, android id, brand and assigned user", () => {
        const { sql, params } = toSql({ search: "934739" });

        for (const column of ["display_name", "model", "serial", "android_id", "brand", "assigned_to_name"]) {
            expect(sql).toMatch(new RegExp(`"${column}" ilike \\$\\d+`));
        }
        expect(params.filter((param) => param === "%934739%")).toHaveLength(6);
    });

    it("returns the android id in every row", () => {
        expect(toSql({}).sql).toContain('"android_id"');
    });

    it("sorts on the displayed name", () => {
        expect(toSql({ sort: "-displayName" }).sql).toContain('order by "display_name" desc');
    });
});
