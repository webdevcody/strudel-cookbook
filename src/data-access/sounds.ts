import { eq, desc, ilike } from "drizzle-orm";
import { database } from "~/db";
import { sound, type Sound, type CreateSoundData, type UpdateSoundData } from "~/db/schema";
import { findTagsBySoundId } from "./tags";

export async function findSoundById(id: string): Promise<(Sound & { tags: Array<{id: string, name: string}> }) | null> {
  const [result] = await database
    .select()
    .from(sound)
    .where(eq(sound.id, id))
    .limit(1);

  if (!result) {
    return null;
  }

  const tags = await findTagsBySoundId(id);
  
  return {
    ...result,
    tags: tags.map(tag => ({ id: tag.id, name: tag.name }))
  };
}

export async function createSound(soundData: CreateSoundData): Promise<Sound> {
  const [newSound] = await database
    .insert(sound)
    .values({
      ...soundData,
      updatedAt: new Date(),
    })
    .returning();

  return newSound;
}

export async function updateSound(id: string, soundData: UpdateSoundData): Promise<Sound | null> {
  const [updatedSound] = await database
    .update(sound)
    .set({
      ...soundData,
      updatedAt: new Date(),
    })
    .where(eq(sound.id, id))
    .returning();

  return updatedSound || null;
}

export async function findSoundsByUserId(userId: string): Promise<Sound[]> {
  return await database
    .select()
    .from(sound)
    .where(eq(sound.userId, userId))
    .orderBy(desc(sound.createdAt));
}

export async function deleteSound(id: string): Promise<boolean> {
  const result = await database
    .delete(sound)
    .where(eq(sound.id, id))
    .returning();

  return result.length > 0;
}

export async function findRecentSounds(limit: number = 10): Promise<Array<Sound & { tags: Array<{id: string, name: string}> }>> {
  const sounds = await database
    .select()
    .from(sound)
    .orderBy(desc(sound.createdAt))
    .limit(limit);

  // Fetch tags for each sound
  const soundsWithTags = await Promise.all(
    sounds.map(async (sound) => {
      const tags = await findTagsBySoundId(sound.id);
      return {
        ...sound,
        tags: tags.map(tag => ({ id: tag.id, name: tag.name }))
      };
    })
  );

  return soundsWithTags;
}

export async function searchSoundsByTitle(searchTerm: string, limit: number = 20): Promise<Array<Sound & { tags: Array<{id: string, name: string}> }>> {
  const sounds = await database
    .select()
    .from(sound)
    .where(ilike(sound.title, `%${searchTerm}%`))
    .orderBy(desc(sound.createdAt))
    .limit(limit);

  // Fetch tags for each sound
  const soundsWithTags = await Promise.all(
    sounds.map(async (sound) => {
      const tags = await findTagsBySoundId(sound.id);
      return {
        ...sound,
        tags: tags.map(tag => ({ id: tag.id, name: tag.name }))
      };
    })
  );

  return soundsWithTags;
}