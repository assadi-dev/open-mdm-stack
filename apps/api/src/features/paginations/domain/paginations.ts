import { PaginationResponse } from "./interface";

export const DEFAULT_LIMIT = 20;
export const DEFAULT_PAGE = 1;
export const DEFAULT_ORDER = "desc";
export const MAX_LIMIT = 100;
export const SEARCH_MAX_LENGTH = 100;

// Query string conventions: `sort=-createdAt,ssid` and `security=WPA2,WPA3`.
export const LIST_SEPARATOR = ",";
export const DESC_SORT_PREFIX = "-";


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