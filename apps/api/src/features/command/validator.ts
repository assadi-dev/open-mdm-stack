import z from "zod";
import { HTTPNotFoundException } from "@core/exception";
import { commandDecoder, CreateCommandInput } from "./dto/schema";

export const validateCreateCommandInput = (body: unknown): CreateCommandInput => {
    const result = commandDecoder.create(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

/** Device ids are UUIDs; anything else can't exist (and would make Postgres throw). */
export const validateDeviceIdParam = (deviceId: string): string => {
    if (!z.uuid().safeParse(deviceId).success) {
        throw new HTTPNotFoundException("Device not found");
    }
    return deviceId;
};
