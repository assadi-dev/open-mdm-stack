import z from "zod";
import { HTTPNotFoundException } from "@core/exception";
import {
    wifiNetworkDecoder,
    CreateWifiNetworkInput,
    DeleteWifiNetworksInput,
    UpdateWifiNetworkInput,
    WifiNetworkCollectionQuery,
} from "./dto/schema";

export const validateCreateWifiNetworkInput = (body: unknown): CreateWifiNetworkInput => {
    const result = wifiNetworkDecoder.create(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateUpdateWifiNetworkInput = (body: unknown): UpdateWifiNetworkInput => {
    const result = wifiNetworkDecoder.update(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateDeleteWifiNetworksInput = (body: unknown): DeleteWifiNetworksInput => {
    const result = wifiNetworkDecoder.deleteMany(body);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

export const validateWifiNetworkCollectionQuery = (query: unknown): WifiNetworkCollectionQuery => {
    const result = wifiNetworkDecoder.collection(query);
    if (!result.success) {
        throw result.error;
    }
    return result.data;
};

/** Wifi network ids are UUIDs; anything else can't exist (and would make Postgres throw). */
export const validateWifiNetworkIdParam = (id: string): string => {
    if (!z.uuid().safeParse(id).success) {
        throw new HTTPNotFoundException("Wifi network not found");
    }
    return id;
};
