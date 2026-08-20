import { authorizationRoles } from "@board-games/contracts"
import {
    check,
    index,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const authorizationRole = pgEnum("authorization_role", [
    authorizationRoles.player,
    authorizationRoles.administrator,
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

export const deckTypes = pgTable(
    "deck_types",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [uniqueIndex("deck_types_name_unique").on(table.name)],
)

export const deckTypeInclusions = pgTable(
    "deck_type_inclusions",
    {
        deckTypeId: uuid("deck_type_id")
            .notNull()
            .references(() => deckTypes.id, { onDelete: "cascade" }),
        includedDeckTypeId: uuid("included_deck_type_id")
            .notNull()
            .references(() => deckTypes.id, { onDelete: "restrict" }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.deckTypeId, table.includedDeckTypeId] }),
        check(
            "deck_type_inclusions_distinct_check",
            sql`${table.deckTypeId} <> ${table.includedDeckTypeId}`,
        ),
        index("deck_type_inclusions_included_deck_type_id_idx").on(
            table.includedDeckTypeId,
        ),
    ],
)

export const games = pgTable("games", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("waiting"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
