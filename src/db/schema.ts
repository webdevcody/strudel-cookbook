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

export const sound = pgTable("sound", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  strudelCode: text("strudel_code").notNull(),
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

export const soundComment = pgTable("sound_comment", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  soundId: text("sound_id")
    .notNull()
    .references(() => sound.id, { onDelete: "cascade" }),
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

export const tag = pgTable("tag", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const soundTag = pgTable("sound_tag", {
  id: text("id").primaryKey(),
  soundId: text("sound_id")
    .notNull()
    .references(() => sound.id, { onDelete: "cascade" }),
  tagId: text("tag_id")
    .notNull()
    .references(() => tag.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const soundHeart = pgTable("sound_heart", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  soundId: text("sound_id")
    .notNull()
    .references(() => sound.id, { onDelete: "cascade" }),
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

export const soundRelations = relations(sound, ({ one, many }) => ({
  user: one(user, {
    fields: [sound.userId],
    references: [user.id],
  }),
  comments: many(soundComment),
  soundTags: many(soundTag),
  soundHearts: many(soundHeart),
}));

export const soundCommentRelations = relations(soundComment, ({ one }) => ({
  user: one(user, {
    fields: [soundComment.userId],
    references: [user.id],
  }),
  sound: one(sound, {
    fields: [soundComment.soundId],
    references: [sound.id],
  }),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  soundTags: many(soundTag),
}));

export const soundTagRelations = relations(soundTag, ({ one }) => ({
  sound: one(sound, {
    fields: [soundTag.soundId],
    references: [sound.id],
  }),
  tag: one(tag, {
    fields: [soundTag.tagId],
    references: [tag.id],
  }),
}));

export const soundHeartRelations = relations(soundHeart, ({ one }) => ({
  user: one(user, {
    fields: [soundHeart.userId],
    references: [user.id],
  }),
  sound: one(sound, {
    fields: [soundHeart.soundId],
    references: [sound.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  songs: many(song),
  hearts: many(heart),
  sounds: many(sound),
  soundComments: many(soundComment),
  soundHearts: many(soundHeart),
}));

export type Song = typeof song.$inferSelect;
export type CreateSongData = typeof song.$inferInsert;
export type UpdateSongData = Partial<Omit<CreateSongData, "id" | "createdAt">>;

export type User = typeof user.$inferSelect;
export type Heart = typeof heart.$inferSelect;
export type CreateHeartData = typeof heart.$inferInsert;

export type Sound = typeof sound.$inferSelect;
export type CreateSoundData = typeof sound.$inferInsert;
export type UpdateSoundData = Partial<
  Omit<CreateSoundData, "id" | "createdAt">
>;

export type SoundComment = typeof soundComment.$inferSelect;
export type CreateSoundCommentData = typeof soundComment.$inferInsert;
export type UpdateSoundCommentData = Partial<
  Omit<CreateSoundCommentData, "id" | "createdAt">
>;

export type Tag = typeof tag.$inferSelect;
export type CreateTagData = typeof tag.$inferInsert;

export type SoundTag = typeof soundTag.$inferSelect;
export type CreateSoundTagData = typeof soundTag.$inferInsert;

export type SoundHeart = typeof soundHeart.$inferSelect;
export type CreateSoundHeartData = typeof soundHeart.$inferInsert;

export type SubscriptionPlan = "free" | "basic" | "pro";
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "incomplete";
