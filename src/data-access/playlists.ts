import { eq, desc, count, and } from "drizzle-orm";
import { database } from "~/db";
import { 
  playlist, 
  playlistSong, 
  song,
  user,
  type Playlist, 
  type CreatePlaylistData, 
  type UpdatePlaylistData,
  type PlaylistSong,
  type CreatePlaylistSongData,
  type Song 
} from "~/db/schema";

export type PlaylistWithSongs = Playlist & {
  songs: (Song & { position: number })[];
  songCount: number;
};

export async function findPlaylistById(id: string): Promise<Playlist | null> {
  const [result] = await database
    .select()
    .from(playlist)
    .where(eq(playlist.id, id))
    .limit(1);

  return result || null;
}

export async function createPlaylist(playlistData: CreatePlaylistData): Promise<Playlist> {
  const [newPlaylist] = await database
    .insert(playlist)
    .values({
      ...playlistData,
      updatedAt: new Date(),
    })
    .returning();

  return newPlaylist;
}

export async function updatePlaylist(id: string, playlistData: UpdatePlaylistData): Promise<Playlist | null> {
  const [updatedPlaylist] = await database
    .update(playlist)
    .set({
      ...playlistData,
      updatedAt: new Date(),
    })
    .where(eq(playlist.id, id))
    .returning();

  return updatedPlaylist || null;
}

export async function deletePlaylist(id: string): Promise<boolean> {
  const result = await database
    .delete(playlist)
    .where(eq(playlist.id, id))
    .returning();

  return result.length > 0;
}

export type PlaylistWithSongCount = Playlist & {
  songCount: number;
  firstSongCoverKey?: string | null;
};

export async function findPlaylistsByUserId(userId: string): Promise<PlaylistWithSongCount[]> {
  const playlists = await database
    .select()
    .from(playlist)
    .where(eq(playlist.userId, userId))
    .orderBy(desc(playlist.createdAt));

  // Get song counts and first song cover for each playlist
  const playlistsWithCounts = await Promise.all(
    playlists.map(async (p) => {
      const [songCountResult] = await database
        .select({ count: count() })
        .from(playlistSong)
        .where(eq(playlistSong.playlistId, p.id));

      // Get the first song's cover image
      const [firstSong] = await database
        .select({ coverImageKey: song.coverImageKey })
        .from(playlistSong)
        .innerJoin(song, eq(playlistSong.songId, song.id))
        .where(eq(playlistSong.playlistId, p.id))
        .orderBy(playlistSong.position)
        .limit(1);

      return {
        ...p,
        songCount: songCountResult?.count || 0,
        firstSongCoverKey: firstSong?.coverImageKey || null,
      };
    })
  );

  return playlistsWithCounts;
}

export async function countPlaylistsByUserId(userId: string): Promise<number> {
  const [result] = await database
    .select({ count: count() })
    .from(playlist)
    .where(eq(playlist.userId, userId));

  return result?.count || 0;
}

export async function findPlaylistByIdWithSongs(id: string): Promise<PlaylistWithSongs | null> {
  const playlistData = await findPlaylistById(id);
  if (!playlistData) return null;

  const playlistSongs = await database
    .select({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      genre: song.genre,
      description: song.description,
      audioKey: song.audioKey,
      coverImageKey: song.coverImageKey,
      status: song.status,
      duration: song.duration,
      playCount: song.playCount,
      downloadCount: song.downloadCount,
      userId: song.userId,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt,
      position: playlistSong.position,
    })
    .from(playlistSong)
    .innerJoin(song, eq(playlistSong.songId, song.id))
    .where(eq(playlistSong.playlistId, id))
    .orderBy(playlistSong.position);

  return {
    ...playlistData,
    songs: playlistSongs,
    songCount: playlistSongs.length,
  };
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<PlaylistSong> {
  const maxPosition = await database
    .select({ maxPos: count() })
    .from(playlistSong)
    .where(eq(playlistSong.playlistId, playlistId));

  const position = (maxPosition[0]?.maxPos || 0) + 1;

  const [newPlaylistSong] = await database
    .insert(playlistSong)
    .values({
      id: crypto.randomUUID(),
      playlistId,
      songId,
      position,
    })
    .returning();

  return newPlaylistSong;
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<boolean> {
  const result = await database
    .delete(playlistSong)
    .where(and(
      eq(playlistSong.playlistId, playlistId),
      eq(playlistSong.songId, songId)
    ))
    .returning();

  return result.length > 0;
}

export async function reorderPlaylistSongs(playlistId: string, songOrders: { songId: string; position: number }[]): Promise<boolean> {
  try {
    // Update all song positions in a transaction
    await database.transaction(async (tx) => {
      for (const { songId, position } of songOrders) {
        await tx
          .update(playlistSong)
          .set({ position })
          .where(and(
            eq(playlistSong.playlistId, playlistId),
            eq(playlistSong.songId, songId)
          ));
      }
    });

    return true;
  } catch (error) {
    console.error('Error reordering playlist songs:', error);
    return false;
  }
}

export async function checkPlaylistOwnership(playlistId: string, userId: string): Promise<boolean> {
  const [result] = await database
    .select({ id: playlist.id })
    .from(playlist)
    .where(and(
      eq(playlist.id, playlistId),
      eq(playlist.userId, userId)
    ))
    .limit(1);

  return !!result;
}

export async function findPublicPlaylists(limit: number = 10): Promise<Playlist[]> {
  return await database
    .select()
    .from(playlist)
    .where(eq(playlist.isPublic, true))
    .orderBy(desc(playlist.createdAt))
    .limit(limit);
}