import { describe, expect, it } from "vitest";
import z from "zod";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createCollectionQuerySchema } from "@features/paginations/dto/schema";
import type { CollectionConfig } from "@features/paginations/domain/interface";
import { buildPaginatedData, toCollectionClauses } from "@features/paginations/services";

// A made-up resource: the helpers are generic, these tests don't depend on any real table.
// `drizzle.mock()` only renders SQL, no Postgres connection is ever opened.
const deviceStatus = pgEnum("device_status", ["ACTIVE", "LOCKED"]);
const devices = pgTable("devices", {
    id: uuid("id").primaryKey(),
    name: text("name"),
    serial: text("serial").notNull(),
    status: deviceStatus("status").notNull(),
    createdAt: timestamp("created_at").notNull(),
});

const schema = createCollectionQuerySchema({
    sortable: ["name", "createdAt"],
    filters: { status: z.enum(["ACTIVE", "LOCKED"]) },
});

const config: CollectionConfig<z.infer<typeof schema>> = {
    sortable: { name: devices.name, createdAt: devices.createdAt },
    defaultSort: [{ id: "createdAt", desc: true }],
    tieBreaker: devices.id,
    searchable: [devices.name, devices.serial],
    filters: { status: (values) => inArray(devices.status, values) },
};

const db = drizzle.mock();

const toSQL = (query: Record<string, unknown>) => {
    const { where, orderBy, limit, offset } = toCollectionClauses(schema.parse(query), config);
    return db.select({ id: devices.id }).from(devices).where(where).orderBy(...orderBy).limit(limit).offset(offset).toSQL();
};

describe("toCollectionClauses", () => {
    it("sorts by the default sort, then by the tie breaker, on the first page", () => {
        expect(toSQL({})).toEqual({
            sql: 'select "id" from "devices" order by "devices"."created_at" desc, "devices"."id" asc limit $1',
            params: [20],
        });
    });

    it("replaces the default sort by the requested one", () => {
        expect(toSQL({ sort: "-name" }).sql).toContain('order by "devices"."name" desc, "devices"."id" asc');
    });

    it("skips the rows of the previous pages", () => {
        const { sql, params } = toSQL({ page: "3", limit: "10" });

        expect(sql).toContain("limit $1 offset $2");
        expect(params).toEqual([10, 20]);
    });

    it("searches every searchable column", () => {
        const { sql, params } = toSQL({ search: "office" });

        expect(sql).toContain('where ("devices"."name" ilike $1 or "devices"."serial" ilike $2)');
        expect(params.slice(0, 2)).toEqual(["%office%", "%office%"]);
    });

    it("matches `%` and `_` literally", () => {
        expect(toSQL({ search: "50%_off" }).params[0]).toBe("%50\\%\\_off%");
    });

    it("applies each requested filter, alongside the search", () => {
        const { sql, params } = toSQL({ search: "office", status: "ACTIVE,LOCKED" });

        expect(sql).toContain('and "devices"."status" in ($3, $4)');
        expect(params.slice(2, 4)).toEqual(["ACTIVE", "LOCKED"]);
    });
});

describe("buildPaginatedData", () => {
    it("counts the pages, the last one partially filled", () => {
        expect(buildPaginatedData([], { page: 1, limit: 20, total: 41 }).metadata).toEqual({
            page: 1,
            limit: 20,
            total: 41,
            totalPages: 3,
        });
    });

    it("has no page when there is no row", () => {
        expect(buildPaginatedData([], { page: 1, limit: 20, total: 0 }).metadata.totalPages).toBe(0);
    });
});
