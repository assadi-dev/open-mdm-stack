import { PaginationResponse } from "./interface";

export const DEFAULT_LIMIT = 20;
export const DEFAULT_PAGE = 1;
export const DEFAULT_ORDER = "desc";


export const DEFAULT_PAGINATION_DATA: PaginationResponse<unknown> = {
    metadata: {
        limit: DEFAULT_LIMIT,
        page: DEFAULT_PAGE,
        total: 0,
        totalPages: 0,
        search: "",
    },
    data: []
}