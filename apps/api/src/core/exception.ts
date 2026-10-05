export interface ExceptionResponse extends Error {
    statusCode: number;

}



export class HTTPBadRequestException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 400;
        this.name = "HTTPBadRequestException";
    }
}

export class HTTPUnauthorizedException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 401;
        this.name = "HTTPUnauthorizedException";
    }
}

export class HTTPForbiddenException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 403;
        this.name = "HTTPForbiddenException";
    }
}

export class HTTPNotFoundException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 404;
        this.name = "HTTPNotFoundException";
    }
}

export class HTTPInternalServerErrorException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 500;
        this.name = "HTTPInternalServerErrorException";
    }
}

export class HTTPConflictException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 409;
        this.name = "HTTPConflictException";
    }
}

export class HTTPBadGatewayException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 502;
        this.name = "HTTPBadGatewayException";
    }
}

export class HTTPServiceUnavailableException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 503;
        this.name = "HTTPServiceUnavailableException";
    }
}

export class HTTPGatewayTimeoutException implements ExceptionResponse {
    public readonly statusCode: number;
    public readonly name: string;
    public readonly message: string;
    constructor(message: string) {
        this.message = message;
        this.statusCode = 504;
        this.name = "HTTPGatewayTimeoutException";
    }
}
