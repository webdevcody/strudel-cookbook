import { eq, and, count } from "drizzle-orm";
import { database } from "~/db";
import { soundHeart, type CreateSoundHeartData } from "~/db/schema";

export async function createSoundHeart(data: CreateSoundHeartData) {
  const [newSoundHeart] = await database.insert(soundHeart).values(data).returning();
  return newSoundHeart;
}

export async function deleteSoundHeart(userId: string, soundId: string) {
  const [deletedSoundHeart] = await database
    .delete(soundHeart)
    .where(and(eq(soundHeart.userId, userId), eq(soundHeart.soundId, soundId)))
    .returning();
  return deletedSoundHeart;
}

export async function findSoundHeartByUserAndSound(userId: string, soundId: string) {
  const [existingSoundHeart] = await database
    .select()
    .from(soundHeart)
    .where(and(eq(soundHeart.userId, userId), eq(soundHeart.soundId, soundId)))
    .limit(1);
  return existingSoundHeart;
}

export async function getSoundHeartCountForSound(soundId: string) {
  const [result] = await database
    .select({ count: count() })
    .from(soundHeart)
    .where(eq(soundHeart.soundId, soundId));
  return result?.count || 0;
}