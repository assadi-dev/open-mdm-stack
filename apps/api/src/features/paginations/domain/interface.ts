
export type PaginationResponse<T> = {
    meta: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
        search?: string;
    };
    data: T[];
}