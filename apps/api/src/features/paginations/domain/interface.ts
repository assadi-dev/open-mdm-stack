

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