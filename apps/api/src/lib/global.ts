import { HTTPBadRequestException } from "@core/exception";
import express from "express";
import { ZodError } from "zod";



export const HttpError = (err: unknown) => {

    if (err instanceof HTTPBadRequestException) {
        return {
            statusCode: err.statusCode,
            message: err.message,
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
        });
    }
}