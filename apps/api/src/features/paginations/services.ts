import { QueryResult } from "pg"
import { PaginationMetadata, PaginationResponse } from "./domain/interface"


export const buildPaginatedData = <T>(data: T[], metadata: PaginationMetadata): PaginationResponse<T> => {
    return {
        data,
        metadata,

    }
}