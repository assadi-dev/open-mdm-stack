import { and, asc, desc, ilike, or, type SQL } from "drizzle-orm";
import type {
    CollectionColumn,
    CollectionConfig,
    CollectionQuery,
    PaginationMetadata,
    PaginationResponse,
    SortItem,
} from "./domain/interface";

// `%` and `_` typed in the search box are literal characters, not wildcards.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

const toSearchCondition = (search: string | undefined, columns: CollectionColumn[]) =>
    search ? or(...columns.map((column) => ilike(column, `%${escapeLike(search)}%`))) : undefined;

const toFilterConditions = (
    filters: Record<string, unknown[] | undefined>,
    conditions: Record<string, (values: unknown[]) => SQL>,
) => Object.entries(filters).flatMap(([column, values]) => (values ? [conditions[column](values)] : []));

const toOrderBy = <TColumn extends string>(sort: SortItem<TColumn>[], columns: Record<TColumn, CollectionColumn>) =>
    sort.map(({ id, desc: isDesc }) => (isDesc ? desc(columns[id]) : asc(columns[id])));

/** Turns a parsed collection query into the clauses of the repository's `select` (and of its count, for `where`). */
export const toCollectionClauses = <TQuery extends CollectionQuery<string, Record<string, unknown>>>(
    { page, limit, search, sort, filters }: TQuery,
    config: CollectionConfig<TQuery>,
) => ({
    where: and(toSearchCondition(search, config.searchable), ...toFilterConditions(filters, config.filters)),
    orderBy: [...toOrderBy(sort.length > 0 ? sort : config.defaultSort, config.sortable), asc(config.tieBreaker)],
    limit,
    offset: (page - 1) * limit,
});

export const buildPaginatedData = <T>(
    data: T[],
    { page, limit, total }: Pick<PaginationMetadata, "page" | "limit" | "total">,
): PaginationResponse<T> => ({
    data,
    metadata: { page, limit, total, totalPages: Math.ceil(total / limit) },
});
