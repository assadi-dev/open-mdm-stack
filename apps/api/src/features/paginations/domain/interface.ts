

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