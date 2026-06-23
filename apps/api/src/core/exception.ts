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