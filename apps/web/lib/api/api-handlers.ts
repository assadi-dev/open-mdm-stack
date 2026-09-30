import { NextResponse } from "next/server";
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalError,
    LimitExceeded,
    NotFound,
    NotImplemented,
    Unauthorized,
    UnprocessableEntity,
    createHttpError,
} from "./intefaces/http-errors";
import { DefaultErrorStrategy } from "./strategy/default-error-strategy";
import { ErrorContextStrategy } from "./strategy/error-strategy";
import { InstanceErrorStrategy } from "./strategy/instance-error-strategy";

const API_VERSION = "v1"

export const BACKEND_API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/${API_VERSION}`;


const errorContext = new ErrorContextStrategy(
    [
        new InstanceErrorStrategy(BadRequest),
        new InstanceErrorStrategy(Unauthorized),
        new InstanceErrorStrategy(Forbidden),
        new InstanceErrorStrategy(NotFound),
        new InstanceErrorStrategy(Conflict),
        new InstanceErrorStrategy(UnprocessableEntity),
        new InstanceErrorStrategy(LimitExceeded),
        new InstanceErrorStrategy(NotImplemented),
        new InstanceErrorStrategy(InternalError),
    ],
    new DefaultErrorStrategy(),
);

const parseJson = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
}

const extractMessage = (body: unknown): string | undefined =>
    typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : undefined;

export const handleResponse = async <T>(response: Response): Promise<T> => {
    const text = await response.text();
    const body = text ? parseJson(text) : undefined;

    if (!response.ok) {
        throw createHttpError(response.status, extractMessage(body));
    }
    if (text && body === undefined) {
        throw new InternalError("Invalid response from server");
    }
    return body as T;
}


export const handleApiError = async (error: unknown) => {
    const { message, code } = errorContext.handle(error);
    debugApiError(error);
    return NextResponse.json({ message }, { status: code });
}


export const debugApiError = (error: unknown) => {
    if (error instanceof Error) {
        console.error(error.message);
    }

}

export const buildUrl = (path: string) => {
    const url = `${BACKEND_API_BASE_URL}/${path.trim()}`;
    console.log("call api external resource ---->", url)
    return url
}
