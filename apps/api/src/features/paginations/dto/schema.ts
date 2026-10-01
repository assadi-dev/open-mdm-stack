import z from "zod";
import {
    DEFAULT_LIMIT,
    DEFAULT_PAGE,
    DESC_SORT_PREFIX,
    LIST_SEPARATOR,
    MAX_LIMIT,
    SEARCH_MAX_LENGTH,
} from "../domain/paginations";
import type { CollectionQuery } from "../domain/interface";

// A filter value comes from the query string, so its schema must accept a string (`z.coerce.number<string>()` for numbers).
type QueryValueSchema = z.ZodType<unknown, string>;

type CollectionQueryConfig<TSortable extends string, TFilters extends Record<string, QueryValueSchema>> = {
    /** Columns the client may sort on, named like the TanStack column ids (= API field names). */
    sortable: readonly [TSortable, ...TSortable[]];
    /** Columns the client may filter on, with the schema of one value. The operator is the repository's call. */
    filters?: TFilters;
};

// Express 5 hands back a string, or an array when the key is repeated: both become one flat list.
const toList = (value: string | string[]) =>
    [value]
        .flat()
        .flatMap((part) => part.split(LIST_SEPARATOR))
        .map((part) => part.trim())
        .filter(Boolean);

const queryList = z.union([z.string(), z.array(z.string())]).transform(toList);

// `security=` means "no filter", not "match nothing".
const listOf = <TItem extends QueryValueSchema>(item: TItem) =>
    queryList.pipe(z.array(item)).transform((values) => (values.length > 0 ? values : undefined));

const toSortItem = (token: string) =>
    token.startsWith(DESC_SORT_PREFIX)
        ? { id: token.slice(DESC_SORT_PREFIX.length), desc: true }
        : { id: token, desc: false };

// `-createdAt,ssid` → [{ id: "createdAt", desc: true }, { id: "ssid", desc: false }], the TanStack `SortingState`.
const sortOf = <TSortable extends string>(sortable: readonly [TSortable, ...TSortable[]]) =>
    queryList
        .transform((tokens) => tokens.map(toSortItem))
        .pipe(z.array(z.object({ id: z.enum(sortable), desc: z.boolean() })));

/**
 * Parses `req.query` of a collection endpoint:
 * `?page=2&limit=20&search=office&sort=-createdAt,ssid&security=WPA2,WPA3`
 * → `{ page, limit, search, sort: [{ id, desc }], filters: { security: [...] } }`.
 * Unknown sort columns and invalid filter values are rejected (400), unknown keys are ignored.
 */
export const createCollectionQuerySchema = <
    TSortable extends string,
    TFilters extends Record<string, QueryValueSchema> = {},
>({ sortable, filters }: CollectionQueryConfig<TSortable, TFilters>) => {
    type FilterValues = { [TColumn in keyof TFilters]: z.output<TFilters[TColumn]> };

    const filterShape = Object.fromEntries(
        Object.entries(filters ?? {}).map(([column, item]) => [column, listOf(item).optional()]),
    );

    // The return type is spelled out: the project isn't `strict`, so Zod's own inference degrades to `any` here.
    return z
        .object({
            page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
            limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
            search: z.string().trim().max(SEARCH_MAX_LENGTH).optional(),
            sort: sortOf(sortable).default([]),
            ...filterShape,
        })
        .transform(({ page, limit, search, sort, ...filterLists }): CollectionQuery<TSortable, FilterValues> => ({
            page,
            limit,
            search: search || undefined,
            sort,
            filters: filterLists as CollectionQuery<TSortable, FilterValues>["filters"],
        }));
};
