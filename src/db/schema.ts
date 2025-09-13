import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"),
  plan: text("plan").$default(() => "free").notNull(),
  subscriptionStatus: text("subscription_status"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const song = pgTable("song", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  genre: text("genre"),
  description: text("description"),
  audioKey: text("audio_key"),
  coverImageKey: text("cover_image_key"),
  status: text("status")
    .$default(() => "processing")
    .notNull(),
  duration: integer("duration"),
  playCount: integer("play_count")
    .$default(() => 0)
    .notNull(),
  downloadCount: integer("download_count")
    .$default(() => 0)
    .notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const heart = pgTable("heart", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  songId: text("song_id")
    .notNull()
    .references(() => song.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const playlist = pgTable("playlist", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public")
    .$default(() => false)
    .notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const playlistSong = pgTable("playlist_song", {
  id: text("id").primaryKey(),
  playlistId: text("playlist_id")
    .notNull()
    .references(() => playlist.id, { onDelete: "cascade" }),
  songId: text("song_id")
    .notNull()
    .references(() => song.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const songRelations = relations(song, ({ one, many }) => ({
  user: one(user, {
    fields: [song.userId],
    references: [user.id],
  }),
  hearts: many(heart),
  playlistSongs: many(playlistSong),
}));

export const heartRelations = relations(heart, ({ one }) => ({
  user: one(user, {
    fields: [heart.userId],
    references: [user.id],
  }),
  song: one(song, {
    fields: [heart.songId],
    references: [song.id],
  }),
}));

export const playlistRelations = relations(playlist, ({ one, many }) => ({
  user: one(user, {
    fields: [playlist.userId],
    references: [user.id],
  }),
  playlistSongs: many(playlistSong),
}));

export const playlistSongRelations = relations(playlistSong, ({ one }) => ({
  playlist: one(playlist, {
    fields: [playlistSong.playlistId],
    references: [playlist.id],
  }),
  song: one(song, {
    fields: [playlistSong.songId],
    references: [song.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  songs: many(song),
  hearts: many(heart),
  playlists: many(playlist),
}));

export type Song = typeof song.$inferSelect;
export type CreateSongData = typeof song.$inferInsert;
export type UpdateSongData = Partial<
  Omit<CreateSongData, "id" | "createdAt">
>;

export type User = typeof user.$inferSelect;
export type Heart = typeof heart.$inferSelect;
export type CreateHeartData = typeof heart.$inferInsert;

export type Playlist = typeof playlist.$inferSelect;
export type CreatePlaylistData = typeof playlist.$inferInsert;
export type UpdatePlaylistData = Partial<
  Omit<CreatePlaylistData, "id" | "createdAt">
>;

export type PlaylistSong = typeof playlistSong.$inferSelect;
export type CreatePlaylistSongData = typeof playlistSong.$inferInsert;

export type SubscriptionPlan = "free" | "basic" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "unpaid" | "incomplete";
