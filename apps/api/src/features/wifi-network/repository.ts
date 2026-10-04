import { db as defaultDb } from "@drizzle/instance";
import { wifiNetworks, wifiSecurityType } from "@drizzle/schemas/wifi-network-schema";
import { desc, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { wifiNetworkRepositoryFactory } from "./factory/repositories";
import { buildPaginatedData, toCollectionClauses } from "@features/paginations/services";
import type { WifiNetworkCollectionQuery } from "./dto/schema";

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

    async collection(collectionQuery: WifiNetworkCollectionQuery) {
        const selection = wifiNetworkRepositoryFactory.toSelectCollection(wifiNetworks);
        const config = wifiNetworkRepositoryFactory.toCollectionConfig(wifiNetworks);
        const { where, orderBy, limit, offset } = toCollectionClauses(collectionQuery, config);

        const [data, total] = await Promise.all([
            this.db.select(selection).from(wifiNetworks).where(where).orderBy(...orderBy).limit(limit).offset(offset),
            this.db.$count(wifiNetworks, where),
        ]);
        return buildPaginatedData(data, { page: collectionQuery.page, limit, total });
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

    async deleteMany(ids: string[]) {
        await this.db.delete(wifiNetworks).where(inArray(wifiNetworks.id, ids));
    }
}
