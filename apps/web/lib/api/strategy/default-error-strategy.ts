import { HTTP_ERROR } from "../intefaces/http-errors";
import type { ErrorResult, IErrorStrategy } from "../intefaces/interfaces";

export class DefaultErrorStrategy implements IErrorStrategy {
    supports(_error: unknown): _error is unknown {
        return true;
    }

    handle(_error: unknown): ErrorResult {
        return {
            message: HTTP_ERROR.INTERNAL_ERROR.message,
            code: HTTP_ERROR.INTERNAL_ERROR.code,
        };
    }
}
