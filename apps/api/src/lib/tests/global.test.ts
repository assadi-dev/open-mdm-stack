import { describe, expect, it } from "vitest";
import {
    HTTPBadGatewayException,
    HTTPGatewayTimeoutException,
    HTTPServiceUnavailableException,
} from "@core/exception";
import { HttpError } from "../global";

describe("HttpError", () => {
    it.each([
        ["bad gateway", new HTTPBadGatewayException("Device failed to refresh"), 502],
        ["service unavailable", new HTTPServiceUnavailableException("Message broker unreachable"), 503],
        ["gateway timeout", new HTTPGatewayTimeoutException("Device did not answer"), 504],
    ])("keeps the status and the message of a %s", (_label, error, statusCode) => {
        expect(HttpError(error)).toEqual({ statusCode, message: error.message, code: statusCode });
    });

    it("hides anything it doesn't know behind a 500", () => {
        expect(HttpError(new Error("secret detail"))).toEqual({ statusCode: 500, code: 500, message: "Internal Server Error" });
    });
});
