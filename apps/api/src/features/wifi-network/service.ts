import { HTTPNotFoundException } from "@core/exception";
import { encryptSecret } from "@lib/crypto";
import { WifiNetworkSqlInferSelect } from "@drizzle/schemas/wifi-network-schema";
import { WifiNetworkRepository } from "./repository";
import { CreateWifiNetworkInput, UpdateWifiNetworkInput, WifiNetworkCollectionQuery } from "./dto/schema";

export class WifiNetworkService {
    private repository: WifiNetworkRepository;

    constructor() {
        this.repository = new WifiNetworkRepository();
    }

    async create(input: CreateWifiNetworkInput) {
        const wifiNetwork = await this.repository.create({
            ...input,
            password: input.password ? encryptSecret(input.password) : null,
        });
        return this.toPublic(wifiNetwork);
    }

    async list() {
        return this.repository.listOptions();
    }

    async getById(id: string) {
        const wifiNetwork = await this.repository.findById(id);
        if (!wifiNetwork) {
            throw new HTTPNotFoundException("Wifi network not found");
        }
        return this.toPublic(wifiNetwork);
    }

    async collection(query: WifiNetworkCollectionQuery) {
        return this.repository.collection(query);
    }

    async update(id: string, input: UpdateWifiNetworkInput) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new HTTPNotFoundException("Wifi network not found");
        }
        const updated = await this.repository.update(id, {
            ...input,
            password: input.password ? encryptSecret(input.password) : undefined,
        });
        return this.toPublic(updated);
    }

    async delete(id: string) {
        const deleted = await this.repository.delete(id);
        if (!deleted) {
            throw new HTTPNotFoundException("Wifi network not found");
        }
        return this.toPublic(deleted);
    }

    /** Idempotent: ids that no longer exist are ignored, so a stale selection can't make the request fail. */
    async deleteMany(ids: string[]) {
        await this.repository.deleteMany(ids);
    }

    /** Write-only from the admin's point of view: never hand the (encrypted) password back over the API. */
    private toPublic(wifiNetwork: WifiNetworkSqlInferSelect) {
        const { password, ...rest } = wifiNetwork;
        return rest;
    }
}
