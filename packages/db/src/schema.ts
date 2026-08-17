import {
    boolean,
    check,
    index,
    pgEnum,
    pgTable,
    primaryKey,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const authorizationRole = pgEnum("authorization_role", [
    "player",
    "administrator",
])

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
})

export const credentials = pgTable(
    "credentials",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        email: varchar("email", { length: 320 }).notNull(),
        passwordHash: varchar("password_hash", { length: 255 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("credentials_user_id_unique").on(table.userId),
        uniqueIndex("credentials_email_unique").on(table.email),
    ],
)

export const userAuthorizations = pgTable(
    "user_authorizations",
    {
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        role: authorizationRole("role").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [primaryKey({ columns: [table.userId, table.role] })],
)

export const bootstrapAdministrators = pgTable(
    "bootstrap_administrators",
    {
        singleton: boolean("singleton").primaryKey().default(true),
        userId: uuid("user_id")
            .notNull()
            .unique()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        check(
            "bootstrap_administrators_singleton_check",
            sql`${table.singleton}`,
        ),
    ],
)

export const refreshTokens = pgTable(
    "refresh_tokens",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        sessionId: uuid("session_id").notNull(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        tokenHash: varchar("token_hash", { length: 64 }).notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("refresh_tokens_token_hash_unique").on(table.tokenHash),
        index("refresh_tokens_session_id_idx").on(table.sessionId),
        index("refresh_tokens_user_id_idx").on(table.userId),
        index("refresh_tokens_expires_at_idx").on(table.expiresAt),
    ],
)

export const games = pgTable("games", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("waiting"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
