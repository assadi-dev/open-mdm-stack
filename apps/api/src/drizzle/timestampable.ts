
import { timestamp } from "drizzle-orm/pg-core";

/**
 * Ajout des champs created_at et updated_at
 */
export const updatedAndCreatedAt = {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
};

/**
 * Ajout des champs deleted_at
 */
export const deletedAt = {
    deletedAt: timestamp("deleted_at"),
};
