
import { relations } from "drizzle-orm";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { updatedAndCreatedAt, deletedAt } from "../timestampable";

export const tenants = pgTable("tenants", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    logo: text("logo"),
    phoneNumber: text("phone_number"),
    address: text("address"),
    ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "set null" }),
    ...updatedAndCreatedAt,
    ...deletedAt,
});

export const tenantRelations = relations(tenants, ({ one }) => ({
    owner: one(user, {
        fields: [tenants.ownerId],
        references: [user.id],
    }),
}));