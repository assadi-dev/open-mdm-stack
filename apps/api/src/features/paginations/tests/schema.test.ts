import { describe, expect, it } from "vitest";
import z from "zod";
import { createCollectionQuerySchema } from "@features/paginations/dto/schema";

// A made-up resource: the schema is generic, these tests don't depend on any real table.
const schema = createCollectionQuerySchema({
    sortable: ["name", "createdAt"],
    filters: { status: z.enum(["ACTIVE", "LOCKED"]) },
});

const parse = (query: Record<string, unknown>) => schema.safeParse(query);

describe("createCollectionQuerySchema", () => {
    it("falls back to the first page, the default limit, no sort and no filter", () => {
        expect(parse({}).data).toEqual({ page: 1, limit: 20, sort: [], filters: {} });
    });

    it("parses a full query string", () => {
        const result = parse({
            page: "2",
            limit: "50",
            search: "  office ",
            sort: "-createdAt,name",
            status: "ACTIVE,LOCKED",
        });

        expect(result.data).toEqual({
            page: 2,
            limit: 50,
            search: "office",
            sort: [
                { id: "createdAt", desc: true },
                { id: "name", desc: false },
            ],
            filters: { status: ["ACTIVE", "LOCKED"] },
        });
    });

    it("accepts repeated keys like comma-separated values", () => {
        const result = parse({ sort: ["-createdAt", "name"], status: ["ACTIVE", "LOCKED"] });

        expect(result.data?.sort).toEqual([
            { id: "createdAt", desc: true },
            { id: "name", desc: false },
        ]);
        expect(result.data?.filters).toEqual({ status: ["ACTIVE", "LOCKED"] });
    });

    it("treats empty values as absent", () => {
        expect(parse({ search: "  ", sort: "", status: "" }).data).toEqual({
            page: 1,
            limit: 20,
            sort: [],
            filters: {},
        });
    });

    it("ignores unknown keys", () => {
        expect(parse({ foo: "bar" }).success).toBe(true);
    });

    it.each([
        ["a column outside the sortable list", { sort: "password" }],
        ["an invalid filter value", { status: "DELETED" }],
        ["a limit above the maximum", { limit: "500" }],
        ["a page below 1", { page: "0" }],
        ["a page that isn't a number", { page: "abc" }],
    ])("rejects %s", (_, query) => {
        expect(parse(query).success).toBe(false);
    });
});
