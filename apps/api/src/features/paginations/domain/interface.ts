import type { AnyColumn, SQL } from "drizzle-orm";

export type PaginationMetadata = {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
    search?: string;
}


export type PaginationResponse<T> = {
    metadata: PaginationMetadata;
    data: T[];
}


// Same shape as the TanStack `SortingState` items.
export type SortItem<TColumn extends string = string> = {
    id: TColumn;
    desc: boolean;
}


// What a collection endpoint hands to its repository: every filter is a list, the repository picks the operator.
export type CollectionQuery<TSortable extends string = string, TFilters extends Record<string, unknown> = {}> = {
    page: number;
    limit: number;
    search?: string;
    sort: SortItem<TSortable>[];
    filters: { [TColumn in keyof TFilters]?: TFilters[TColumn][] };
}


// A table column, or a computed column of a view (`sql<…>\`…\`.as("name")`), which Drizzle types as `SQL.Aliased`.
export type CollectionColumn = AnyColumn | SQL.Aliased;


// What a repository declares once so its table can serve a `CollectionQuery`.
export type CollectionConfig<TQuery extends CollectionQuery<string, Record<string, unknown>>> = {
    /** One column per sortable id of the query schema. */
    sortable: Record<TQuery["sort"][number]["id"], CollectionColumn>;
    /** Used when the client asks for no sort. */
    defaultSort: TQuery["sort"];
    /** A unique column, sorted last so a row never shows up on two pages. */
    tieBreaker: AnyColumn;
    /** Text columns matched by `search` (ILIKE, OR-ed). Not enums: Postgres has no ILIKE on them. */
    searchable: CollectionColumn[];
    /** The SQL condition of each filter, given the requested values. */
    filters: { [TColumn in keyof TQuery["filters"]]-?: (values: NonNullable<TQuery["filters"][TColumn]>) => SQL };
}