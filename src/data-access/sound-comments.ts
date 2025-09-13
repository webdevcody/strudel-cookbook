import { desc, eq } from "drizzle-orm";
import { database } from "~/db";
import {
  soundComment,
  user,
  type SoundComment,
  type CreateSoundCommentData,
  type UpdateSoundCommentData,
} from "~/db/schema";

export async function findCommentsBySoundId(soundId: string) {
  return await database
    .select({
      id: soundComment.id,
      content: soundComment.content,
      soundId: soundComment.soundId,
      userId: soundComment.userId,
      createdAt: soundComment.createdAt,
      updatedAt: soundComment.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(soundComment)
    .leftJoin(user, eq(soundComment.userId, user.id))
    .where(eq(soundComment.soundId, soundId))
    .orderBy(desc(soundComment.createdAt));
}

export async function findCommentById(id: string) {
  const result = await database
    .select()
    .from(soundComment)
    .where(eq(soundComment.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createSoundComment(
  data: CreateSoundCommentData
): Promise<SoundComment> {
  const result = await database.insert(soundComment).values(data).returning();
  return result[0];
}

export async function updateSoundComment(
  id: string,
  data: UpdateSoundCommentData
): Promise<SoundComment | null> {
  const result = await database
    .update(soundComment)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(soundComment.id, id))
    .returning();

  return result[0] || null;
}

export async function deleteSoundComment(id: string): Promise<boolean> {
  const result = await database
    .delete(soundComment)
    .where(eq(soundComment.id, id))
    .returning();

  return result.length > 0;
}
