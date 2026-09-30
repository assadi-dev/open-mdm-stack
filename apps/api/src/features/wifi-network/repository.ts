import { db as defaultDb } from "@drizzle/instance";
import { wifiNetworks, wifiSecurityType } from "@drizzle/schemas/wifi-network-schema";
import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { wifiNetworkRepositoryFactory } from "./factory/repositories";
import { buildPaginatedData } from "@features/paginations/services";
import { DEFAULT_PAGINATION_DATA } from "@features/paginations/domain/paginations";

export class WifiNetworkRepository {

    constructor(private readonly db: NodePgDatabase = defaultDb) { }

    async create(input: {
        name?: string;
        ssid: string;
        password?: string;
        security: typeof wifiSecurityType[number];
    }) {
        const [row] = await this.db.insert(wifiNetworks).values(input).returning();
        return row;
    }

    async collection(filters: { fields?: any } = {}) {
        const selection = wifiNetworkRepositoryFactory.toSelectCollection(wifiNetworks);
        const query = this.db.select(selection).from(wifiNetworks);
        query.orderBy(desc(wifiNetworks.createdAt))
        const resultData = await query
        return buildPaginatedData(resultData, DEFAULT_PAGINATION_DATA.metadata);

    }

    async listOptions() {
        return this.db.select({ id: wifiNetworks.id, name: wifiNetworks.name, ssid: wifiNetworks.ssid, security: wifiNetworks.security }).from(wifiNetworks).orderBy(wifiNetworks.name, wifiNetworks.ssid);
    }

    async findAll() {
        return this.db.select().from(wifiNetworks).orderBy(desc(wifiNetworks.createdAt));
    }

    async findById(id: string) {
        const [row] = await this.db.select().from(wifiNetworks).where(eq(wifiNetworks.id, id)).limit(1);
        return row;
    }

    async update(id: string, input: {
        name?: string | null;
        ssid?: string;
        password?: string;
        security?: typeof wifiSecurityType[number];
    }) {
        const [row] = await this.db
            .update(wifiNetworks)
            .set(input)
            .where(eq(wifiNetworks.id, id))
            .returning();
        return row;
    }

    async delete(id: string) {
        const [row] = await this.db.delete(wifiNetworks).where(eq(wifiNetworks.id, id)).returning();
        return row;
    }
}
