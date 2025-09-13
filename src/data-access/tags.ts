import { eq, desc, like, and } from "drizzle-orm";
import { database } from "~/db";
import { 
  tag, 
  soundTag, 
  sound,
  type Tag, 
  type CreateTagData, 
  type SoundTag,
  type CreateSoundTagData 
} from "~/db/schema";

export async function findAllTags(): Promise<Tag[]> {
  return await database
    .select()
    .from(tag)
    .orderBy(tag.name);
}

export async function findTagsByName(searchTerm: string): Promise<Tag[]> {
  return await database
    .select()
    .from(tag)
    .where(like(tag.name, `%${searchTerm}%`))
    .orderBy(tag.name)
    .limit(10);
}

export async function findTagByName(name: string): Promise<Tag | null> {
  const [result] = await database
    .select()
    .from(tag)
    .where(eq(tag.name, name))
    .limit(1);

  return result || null;
}

export async function createTag(tagData: CreateTagData): Promise<Tag> {
  const [newTag] = await database
    .insert(tag)
    .values(tagData)
    .returning();

  return newTag;
}

export async function findOrCreateTag(name: string): Promise<Tag> {
  const existingTag = await findTagByName(name);
  if (existingTag) {
    return existingTag;
  }

  return await createTag({
    id: crypto.randomUUID(),
    name: name.trim().toLowerCase(),
  });
}

export async function findTagsBySoundId(soundId: string): Promise<Tag[]> {
  return await database
    .select({
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
    })
    .from(tag)
    .innerJoin(soundTag, eq(tag.id, soundTag.tagId))
    .where(eq(soundTag.soundId, soundId))
    .orderBy(tag.name);
}

export async function addTagToSound(soundId: string, tagId: string): Promise<SoundTag> {
  const [newSoundTag] = await database
    .insert(soundTag)
    .values({
      id: crypto.randomUUID(),
      soundId,
      tagId,
    })
    .returning();

  return newSoundTag;
}

export async function removeTagFromSound(soundId: string, tagId: string): Promise<boolean> {
  const result = await database
    .delete(soundTag)
    .where(and(
      eq(soundTag.soundId, soundId),
      eq(soundTag.tagId, tagId)
    ))
    .returning();

  return result.length > 0;
}

export async function updateSoundTags(soundId: string, tagNames: string[]): Promise<void> {
  // First, remove all existing tags for this sound
  await database
    .delete(soundTag)
    .where(eq(soundTag.soundId, soundId));

  // Then add the new tags
  for (const tagName of tagNames) {
    if (tagName.trim()) {
      const tag = await findOrCreateTag(tagName.trim());
      await addTagToSound(soundId, tag.id);
    }
  }
}

export async function findSoundsByTagName(tagName: string): Promise<Array<{
  id: string;
  title: string;
  strudelCode: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{id: string, name: string}>;
}>> {
  const sounds = await database
    .select({
      id: sound.id,
      title: sound.title,
      strudelCode: sound.strudelCode,
      userId: sound.userId,
      createdAt: sound.createdAt,
      updatedAt: sound.updatedAt,
    })
    .from(sound)
    .innerJoin(soundTag, eq(sound.id, soundTag.soundId))
    .innerJoin(tag, eq(soundTag.tagId, tag.id))
    .where(eq(tag.name, tagName.toLowerCase()))
    .orderBy(desc(sound.createdAt));

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