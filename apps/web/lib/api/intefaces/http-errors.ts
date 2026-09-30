
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
}

export class BadRequest extends Error {
    code: number;
    constructor(message: string, code: number = HTTP_ERROR.BAD_REQUEST.code) {
        super(message)
        this.name = HTTP_ERROR.BAD_REQUEST.name
        this.code = code
    }
}

export class Unauthorized extends Error {
    code: number;
    constructor(message: string, code: number = 401) {
        super(message)
        this.name = HTTP_ERROR.UNAUTHORIZED.name
        this.code = code
    }
}

export class InternalError extends Error {
    code: number;
    constructor(message: string, code: number = 500) {
        super(message)
        this.name = HTTP_ERROR.INTERNAL_ERROR.name
        this.code = code
    }
}

export class Forbidden extends Error {
    code: number;
    constructor(message: string, code: number = 403) {
        super(message)
        this.name = HTTP_ERROR.FORBIDDEN.name
        this.code = code
    }
}

export class Conflict extends Error {
    code: number;
    constructor(message: string, code: number = 409) {
        super(message)
        this.name = HTTP_ERROR.CONFLICT.name
        this.code = code
    }
}

export class NotImplemented extends Error {
    code: number;
    constructor(message: string, code: number = 501) {
        super(message)
        this.name = HTTP_ERROR.NOT_IMPLEMENTED.name
        this.code = code
    }
}

export class LimitExceeded extends Error {
    code: number;
    constructor(message: string, code: number = 429) {
        super(message)
        this.name = HTTP_ERROR.LIMIT_EXCEEDED.name
        this.code = code
    }
}

export class UnprocessableEntity extends Error {
    code: number;
    constructor(message: string, code: number = 422) {
        super(message)
        this.name = HTTP_ERROR.UNPROCESSABLE_ENTITY.name
        this.code = code
    }
}
