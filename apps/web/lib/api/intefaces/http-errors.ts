import { HTTP_ERROR } from "./http-status";


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
