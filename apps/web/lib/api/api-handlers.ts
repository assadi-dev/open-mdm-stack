import { NextResponse } from "next/server";
import type { z } from "zod";
import {
    BadGateway,
    BadRequest,
    Conflict,
    Forbidden,
    GatewayTimeout,
    InternalError,
    LimitExceeded,
    NotFound,
    NotImplemented,
    ServiceUnavailable,
    Unauthorized,
    UnprocessableEntity,
    createHttpError,
} from "./intefaces/http-errors";
import { HTTP_ERROR } from "./intefaces/http-status";
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
        new InstanceErrorStrategy(BadGateway),
        new InstanceErrorStrategy(ServiceUnavailable),
        new InstanceErrorStrategy(GatewayTimeout),
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


// Le corps d'une écriture (POST, PATCH) : un objet JSON. Son contenu n'est pas validé ici, c'est l'API qui le fait.
export const readJsonBody = async (request: Request): Promise<Record<string, unknown>> => {
    const body: unknown = await request.json().catch(() => undefined);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw new BadRequest(HTTP_ERROR.BAD_REQUEST.message);
    }
    return body as Record<string, unknown>;
}


// Valide le corps d'une écriture avec le schéma Zod de la ressource et renvoie les données reconnues (les clés inconnues sont retirées).
// Un corps invalide répond 400 avant tout appel à l'API.
export const validateBody = <TSchema extends z.ZodType>(schema: TSchema, body: unknown): z.output<TSchema> => {
    const result = schema.safeParse(body);
    if (!result.success) {
        const issues = result.error.issues.map(({ path, message }) => (path.length ? `${path.join(".")}: ${message}` : message));
        throw new BadRequest(issues.join(", "));
    }
    return result.data;
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

// Le proxy relaie la query string telle quelle (pagination, tri, recherche, filtres) : c'est l'API qui la valide.
export const withSearchParams = (path: string, searchParams?: URLSearchParams) => {
    const query = searchParams?.toString();
    return query ? `${path}?${query}` : path;
}

export const buildUrl = (path: string) => {
    const url = `${BACKEND_API_BASE_URL}/${path.trim()}`;
    console.log("call api external resource ---->", url)
    return url
}
