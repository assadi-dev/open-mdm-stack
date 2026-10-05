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

export class NotFound extends Error {
    code: number;
    constructor(message: string, code: number = 404) {
        super(message)
        this.name = HTTP_ERROR.NOT_FOUND.name
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

// Une réponse de l'API qui dépend d'un appareil ou d'un service en aval : l'appareil a échoué (502), le broker est
// injoignable (503), l'appareil n'a pas répondu à temps (504).
export class BadGateway extends Error {
    code: number;
    constructor(message: string, code: number = 502) {
        super(message)
        this.name = HTTP_ERROR.BAD_GATEWAY.name
        this.code = code
    }
}

export class ServiceUnavailable extends Error {
    code: number;
    constructor(message: string, code: number = 503) {
        super(message)
        this.name = HTTP_ERROR.SERVICE_UNAVAILABLE.name
        this.code = code
    }
}

export class GatewayTimeout extends Error {
    code: number;
    constructor(message: string, code: number = 504) {
        super(message)
        this.name = HTTP_ERROR.GATEWAY_TIMEOUT.name
        this.code = code
    }
}

const HTTP_ERROR_CLASSES = [
    [HTTP_ERROR.BAD_REQUEST, BadRequest],
    [HTTP_ERROR.UNAUTHORIZED, Unauthorized],
    [HTTP_ERROR.FORBIDDEN, Forbidden],
    [HTTP_ERROR.NOT_FOUND, NotFound],
    [HTTP_ERROR.CONFLICT, Conflict],
    [HTTP_ERROR.UNPROCESSABLE_ENTITY, UnprocessableEntity],
    [HTTP_ERROR.LIMIT_EXCEEDED, LimitExceeded],
    [HTTP_ERROR.NOT_IMPLEMENTED, NotImplemented],
    [HTTP_ERROR.BAD_GATEWAY, BadGateway],
    [HTTP_ERROR.SERVICE_UNAVAILABLE, ServiceUnavailable],
    [HTTP_ERROR.GATEWAY_TIMEOUT, GatewayTimeout],
] as const;

// `reason` : le code stable que l'API joint à certains refus (ex. `DEVICE_BLOCKED` sur un 403), pour distinguer deux
// erreurs de même statut sans lire le message. Il est relayé par le proxy et se lit avec `getHttpErrorReason`.
export const createHttpError = (status: number, message?: string, reason?: string) => {
    const match = HTTP_ERROR_CLASSES.find(([definition]) => definition.code === status);
    const error = match ? new match[1](message ?? match[0].message) : new InternalError(message ?? HTTP_ERROR.INTERNAL_ERROR.message);
    return reason ? Object.assign(error, { reason }) : error;
}

export const getHttpErrorReason = (error: unknown): string | undefined =>
    typeof error === "object" && error !== null && "reason" in error && typeof error.reason === "string"
        ? error.reason
        : undefined;

// L'erreur d'une réponse non `ok`, avec le message et la raison du corps JSON quand il y en a un.
export const readHttpError = async (response: Response) => {
    const body: unknown = await response.json().catch(() => undefined);
    const field = (name: string) =>
        typeof body === "object" && body !== null && name in body && typeof (body as Record<string, unknown>)[name] === "string"
            ? ((body as Record<string, unknown>)[name] as string)
            : undefined;
    return createHttpError(response.status, field("message"), field("reason"));
}
