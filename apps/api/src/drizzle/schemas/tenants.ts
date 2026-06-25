
import { relations } from "drizzle-orm";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const tenants = pgTable("tenants", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    logo: text("logo"),
    phoneNumber: text("phone_number"),
    address: text("address"),
    ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    deletedAt: timestamp("deleted_at"),
});

export const tenantRelations = relations(tenants, ({ one }) => ({
    owner: one(user, {
        fields: [tenants.ownerId],
        references: [user.id],
    }),
}));