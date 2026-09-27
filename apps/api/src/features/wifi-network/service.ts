import { HTTPNotFoundException } from "@core/exception";
import { WifiNetworkRepository } from "./repository";
import { CreateWifiNetworkInput, UpdateWifiNetworkInput } from "./dto/schema";

export class WifiNetworkService {
    private repository: WifiNetworkRepository;

    constructor() {
        this.repository = new WifiNetworkRepository();
    }

    async create(input: CreateWifiNetworkInput) {
        return this.repository.create(input);
    }

    async list() {
        return this.repository.listOptions();
    }

    async getById(id: string) {
        const wifiNetwork = await this.repository.findById(id);
        if (!wifiNetwork) {
            throw new HTTPNotFoundException("Wifi network not found");
        }
        return wifiNetwork;
    }

    async update(id: string, input: UpdateWifiNetworkInput) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new HTTPNotFoundException("Wifi network not found");
        }
        return this.repository.update(id, input);
    }

    async delete(id: string) {
        const deleted = await this.repository.delete(id);
        if (!deleted) {
            throw new HTTPNotFoundException("Wifi network not found");
        }
        return deleted;
    }
}
