import { NextResponse } from "next/server";
import {
    BadRequest,
    Conflict,
    Forbidden,
    InternalError,
    LimitExceeded,
    NotImplemented,
    Unauthorized,
    UnprocessableEntity,
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
        new InstanceErrorStrategy(Conflict),
        new InstanceErrorStrategy(UnprocessableEntity),
        new InstanceErrorStrategy(LimitExceeded),
        new InstanceErrorStrategy(NotImplemented),
        new InstanceErrorStrategy(InternalError),
    ],
    new DefaultErrorStrategy(),
);

export const handleResponse = async <T>(response: Response): Promise<T> => {
    const json = await response.json();
    if (!response.ok) {
        throw json;
    }
    return json;
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
