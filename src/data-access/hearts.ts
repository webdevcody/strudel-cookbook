import { eq, and, count } from "drizzle-orm";
import { database } from "~/db";
import { heart, type CreateHeartData } from "~/db/schema";

export async function createHeart(data: CreateHeartData) {
  const [newHeart] = await database.insert(heart).values(data).returning();
  return newHeart;
}

export async function deleteHeart(userId: string, songId: string) {
  const [deletedHeart] = await database
    .delete(heart)
    .where(and(eq(heart.userId, userId), eq(heart.songId, songId)))
    .returning();
  return deletedHeart;
}

export async function findHeartByUserAndSong(userId: string, songId: string) {
  const [existingHeart] = await database
    .select()
    .from(heart)
    .where(and(eq(heart.userId, userId), eq(heart.songId, songId)))
    .limit(1);
  return existingHeart;
}

export async function getHeartCountForSong(songId: string) {
  const [result] = await database
    .select({ count: count() })
    .from(heart)
    .where(eq(heart.songId, songId));
  return result?.count || 0;
}
