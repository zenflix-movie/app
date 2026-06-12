import { relations } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `zenflix_${name}`);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d.timestamp({ mode: "date", withTimezone: true }),
  image: d.varchar({ length: 255 }),
  firstName: d.varchar({ length: 255 }),
  lastName: d.varchar({ length: 255 }),
  phone: d.varchar({ length: 50 }),
  birthDate: d.timestamp({ mode: "date" }),
  passwordHash: d.text(),
  role: d.varchar({ length: 20 }).notNull().default("member"),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  profiles: many(profiles),
  reviews: many(reviews),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const profiles = createTable("profile", (d) => ({
  id: d
    .uuid()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }).notNull(),
  avatarUrl: d.varchar({ length: 512 }),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  watchHistory: many(watchHistory),
}));

export const categories = createTable("category", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }).notNull().unique(),
  description: d.text(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  videoCategories: many(videoCategories),
}));

export const videos = createTable(
  "video",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    duration: d.integer(), // seconds
    releaseYear: d.integer(),
    fileUrl: d.varchar({ length: 1024 }).notNull(),
    thumbnailUrl: d.varchar({ length: 1024 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("video_name_idx").on(t.name)],
);

export const videosRelations = relations(videos, ({ many }) => ({
  videoCategories: many(videoCategories),
  reviews: many(reviews),
  watchHistory: many(watchHistory),
}));

export const videoCategories = createTable(
  "video_category",
  (d) => ({
    videoId: d
      .uuid()
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    categoryId: d
      .integer()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  }),
  (t) => [
    primaryKey({ columns: [t.videoId, t.categoryId] }),
    index("video_category_category_idx").on(t.categoryId),
  ],
);

export const videoCategoriesRelations = relations(videoCategories, ({ one }) => ({
  video: one(videos, {
    fields: [videoCategories.videoId],
    references: [videos.id],
  }),
  category: one(categories, {
    fields: [videoCategories.categoryId],
    references: [categories.id],
  }),
}));

export const reviews = createTable(
  "review",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    comment: d.text(),
    rating: d.integer().notNull(),
    videoId: d
      .uuid()
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    unique("review_video_user_unique").on(t.videoId, t.userId),
    index("review_video_idx").on(t.videoId),
  ],
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  video: one(videos, { fields: [reviews.videoId], references: [videos.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const watchHistory = createTable(
  "watch_history",
  (d) => ({
    id: d
      .uuid()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    watchDuration: d.integer().notNull().default(0),
    completed: d.boolean().notNull().default(false),
    videoId: d
      .uuid()
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    profileId: d
      .uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    lastWatchedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    unique("watch_history_video_profile_unique").on(t.videoId, t.profileId),
    index("watch_history_profile_idx").on(t.profileId),
  ],
);

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  video: one(videos, { fields: [watchHistory.videoId], references: [videos.id] }),
  profile: one(profiles, {
    fields: [watchHistory.profileId],
    references: [profiles.id],
  }),
}));
