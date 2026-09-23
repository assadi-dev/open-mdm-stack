import {
    HTTPBadRequestException,
    HTTPInternalServerErrorException,
    HTTPNotFoundException,
    HTTPUnauthorizedException,
} from "@core/exception";
import { APIError } from "better-auth";
import express from "express";
import { ZodError } from "zod";



export const HttpError = (err: unknown) => {

    if (
        err instanceof HTTPBadRequestException ||
        err instanceof HTTPUnauthorizedException ||
        err instanceof HTTPNotFoundException ||
        err instanceof HTTPInternalServerErrorException
    ) {
        return {
            statusCode: err.statusCode,
            message: err.message,
        };
    } else if (err instanceof APIError) {
        // Better Auth's own error (e.g. auth.api.signInEmail on a wrong
        // password, or signUpEmail on an already-registered email) — it
        // isn't one of our HTTP*Exception classes, so without this branch it
        // silently fell through to the generic 500 below instead of the 401/
        // 422/etc it actually carries.
        return {
            statusCode: err.statusCode,
            message: err.body?.message ?? err.message,
            code: err.statusCode
        };
    } else {
        return {
            statusCode: 500,
            message: "Internal Server Error",
        };
    }

}


export const errorHandler = async (
    err: unknown,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): Promise<express.Response | void> => {
    if (err instanceof ZodError) {
        console.warn(`Caught Validation Error for ${req.path}`);
        return res.status(400).json({
            message: "Validation Failed",
            details: JSON.parse(err?.message),
        });
    } else {
        console.log(err);
        const error = HttpError(err);
        return res.status(error.statusCode).json({
            message: error.message,
            ...("code" in error && error.code ? { code: error.code } : {}),
        });
    }
}