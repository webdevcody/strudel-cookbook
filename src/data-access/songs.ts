import { eq, desc, sql } from "drizzle-orm";
import { database } from "~/db";
import { song, type Song, type CreateSongData, type UpdateSongData } from "~/db/schema";
import { getStorage } from "~/utils/storage";

export type SongWithUrls = Song & {
  audioUrl: string;
  coverImageUrl?: string;
};

async function generatePresignedUrls(song: Song): Promise<SongWithUrls> {
  const { storage } = getStorage();
  
  const audioUrl = song.audioKey 
    ? await storage.getPresignedUrl(song.audioKey)
    : '';
  
  const coverImageUrl = song.coverImageKey 
    ? await storage.getPresignedUrl(song.coverImageKey)
    : undefined;
  
  return {
    ...song,
    audioUrl,
    coverImageUrl,
  };
}

export async function findSongById(id: string): Promise<Song | null> {
  const [result] = await database
    .select()
    .from(song)
    .where(eq(song.id, id))
    .limit(1);

  return result || null;
}

export async function createSong(songData: CreateSongData): Promise<Song> {
  const [newSong] = await database
    .insert(song)
    .values({
      ...songData,
      updatedAt: new Date(),
    })
    .returning();

  return newSong;
}

export async function findPopularSongs(limit: number = 10): Promise<Song[]> {
  return await database
    .select()
    .from(song)
    // Temporarily show all songs regardless of status
    // .where(eq(song.status, "published"))
    .orderBy(desc(song.playCount))
    .limit(limit);
}

export async function findRecentSongs(limit: number = 10): Promise<Song[]> {
  return await database
    .select()
    .from(song)
    // Temporarily show all songs regardless of status
    // .where(eq(song.status, "published"))
    .orderBy(desc(song.createdAt))
    .limit(limit);
}

export async function updateSong(id: string, songData: UpdateSongData): Promise<Song | null> {
  const [updatedSong] = await database
    .update(song)
    .set({
      ...songData,
      updatedAt: new Date(),
    })
    .where(eq(song.id, id))
    .returning();

  return updatedSong || null;
}

export async function findSongByIdWithUrls(id: string): Promise<SongWithUrls | null> {
  const songData = await findSongById(id);
  if (!songData) return null;
  return await generatePresignedUrls(songData);
}

export async function findPopularSongsWithUrls(limit: number = 10): Promise<SongWithUrls[]> {
  const songs = await findPopularSongs(limit);
  return await Promise.all(songs.map(generatePresignedUrls));
}

export async function findRecentSongsWithUrls(limit: number = 10): Promise<SongWithUrls[]> {
  const songs = await findRecentSongs(limit);
  return await Promise.all(songs.map(generatePresignedUrls));
}

export async function findSongsByUserId(userId: string): Promise<Song[]> {
  return await database
    .select()
    .from(song)
    .where(eq(song.userId, userId))
    .orderBy(desc(song.createdAt));
}

export async function findSongsByUserIdWithUrls(userId: string): Promise<SongWithUrls[]> {
  const songs = await findSongsByUserId(userId);
  return await Promise.all(songs.map(generatePresignedUrls));
}

export async function deleteSong(id: string): Promise<boolean> {
  const result = await database
    .delete(song)
    .where(eq(song.id, id))
    .returning();

  return result.length > 0;
}

export async function incrementPlayCount(id: string): Promise<Song | null> {
  const [updatedSong] = await database
    .update(song)
    .set({
      playCount: sql`${song.playCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(song.id, id))
    .returning();

  return updatedSong || null;
}