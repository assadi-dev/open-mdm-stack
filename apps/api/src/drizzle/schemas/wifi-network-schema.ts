import { pgTable, text, uuid, pgEnum } from "drizzle-orm/pg-core";
import { updatedAndCreatedAt } from "../timestampable";

// Mirrors the security types accepted by PROVISIONING_WIFI_SECURITY_TYPE
// (see features/enrollment/dto/schema.ts / utils/generators.ts).
export const wifiSecurityType = ["NONE", "WEP", "WPA", "WPA2", "WPA3", "EAP"] as const;
export const wifiSecurityTypeEnum = pgEnum("wifi_security_type", wifiSecurityType);

export const wifiNetworks = pgTable("wifi_networks", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    ssid: text("ssid").notNull(),
    password: text("password").notNull(),
    security: wifiSecurityTypeEnum("security").notNull(),
    ...updatedAndCreatedAt,
});

export type WifiNetworkSqlInferSelect = typeof wifiNetworks.$inferSelect;
export type WifiNetworkSqlInferInsert = typeof wifiNetworks.$inferInsert;
