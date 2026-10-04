
export const HTTP_ERROR = {
    BAD_REQUEST: {
        message: "Bad Request",
        code: 400,
        name: "BadRequest"
    },
    UNAUTHORIZED: {
        message: "Unauthorized",
        code: 401,
        name: "Unauthorized"
    },
    NOT_FOUND: {
        message: "Not Found",
        code: 404,
        name: "NotFound"
    },
    INTERNAL_ERROR: {
        message: "Internal Error",
        code: 500,
        name: "InternalError"
    },
    FORBIDDEN: {
        message: "Forbidden",
        code: 403,
        name: "Forbidden"
    },
    CONFLICT: {
        message: "Conflict",
        code: 409,
        name: "Conflict"
    },
    NOT_IMPLEMENTED: {
        message: "Not Implemented",
        code: 501,
        name: "NotImplemented"
    },
    LIMIT_EXCEEDED: {
        message: "Limit Exceeded",
        code: 429,
        name: "LimitExceeded"
    },
    UNPROCESSABLE_ENTITY: {
        message: "Unprocessable Entity",
        code: 422,
        name: "UnprocessableEntity"
    },
    BAD_GATEWAY: {
        message: "Bad Gateway",
        code: 502,
        name: "BadGateway"
    },
    SERVICE_UNAVAILABLE: {
        message: "Service Unavailable",
        code: 503,
        name: "ServiceUnavailable"
    },
    GATEWAY_TIMEOUT: {
        message: "Gateway Timeout",
        code: 504,
        name: "GatewayTimeout"
    },
}