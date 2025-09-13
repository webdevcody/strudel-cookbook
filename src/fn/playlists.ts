import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  updatePlaylist,
  findPlaylistsByUserId,
  findPlaylistByIdWithSongs,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  checkPlaylistOwnership,
  findPublicPlaylists,
} from "~/data-access/playlists";
import {
  CreatePlaylistInput,
  createPlaylistUseCase,
  PlaylistLimitError,
} from "~/use-cases/createPlaylistUseCase";
import {
  GetOrCreateDefaultPlaylistInput,
  getOrCreateDefaultPlaylistUseCase,
} from "~/use-cases/getOrCreateDefaultPlaylistUseCase";
import {
  DeletePlaylistInput,
  deletePlaylistUseCase,
  PlaylistNotFoundError,
  UnauthorizedPlaylistAccessError,
} from "~/use-cases/deletePlaylistUseCase";
import { getAudioUrlFn, getCoverImageUrlFn } from "./audio-storage";

export const getPlaylistsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findPlaylistsByUserId(context.userId);
  });

export const getPublicPlaylistsFn = createServerFn().handler(async () => {
  return await findPublicPlaylists(20);
});

export const getPlaylistByIdFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const playlist = await findPlaylistByIdWithSongs(data.id);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    return playlist;
  });

export const createPlaylistFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().default(false),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { userId } = context;

    try {
      const input: CreatePlaylistInput = {
        userId,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
      };

      const newPlaylist = await createPlaylistUseCase(input);
      return newPlaylist;
    } catch (error) {
      if (error instanceof PlaylistLimitError) {
        // Re-throw as a regular Error with the error code as the message
        // This maintains the existing client-side error handling
        throw new Error(error.errorCode);
      }
      // Re-throw any other errors as-is
      throw error;
    }
  });

export const updatePlaylistFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().optional(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { id, ...updateData } = data;

    const isOwner = await checkPlaylistOwnership(id, context.userId);
    if (!isOwner) {
      throw new Error("Unauthorized: You can only edit your own playlists");
    }

    const updatedPlaylist = await updatePlaylist(id, updateData);
    if (!updatedPlaylist) {
      throw new Error("Failed to update playlist");
    }

    return updatedPlaylist;
  });

export const deletePlaylistFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { id } = data;
    const { userId } = context;

    try {
      const input: DeletePlaylistInput = {
        playlistId: id,
        userId,
      };

      const result = await deletePlaylistUseCase(input);
      return result;
    } catch (error) {
      if (error instanceof PlaylistNotFoundError) {
        throw new Error("Playlist not found");
      }
      if (error instanceof UnauthorizedPlaylistAccessError) {
        throw new Error("Unauthorized: You can only delete your own playlists");
      }
      // Re-throw any other errors as-is
      throw error;
    }
  });

export const addSongToPlaylistFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      playlistId: z.string(),
      songId: z.string(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { playlistId, songId } = data;

    const isOwner = await checkPlaylistOwnership(playlistId, context.userId);
    if (!isOwner) {
      throw new Error("Unauthorized: You can only modify your own playlists");
    }

    const playlistSong = await addSongToPlaylist(playlistId, songId);
    return playlistSong;
  });

export const removeSongFromPlaylistFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      playlistId: z.string(),
      songId: z.string(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { playlistId, songId } = data;

    const isOwner = await checkPlaylistOwnership(playlistId, context.userId);
    if (!isOwner) {
      throw new Error("Unauthorized: You can only modify your own playlists");
    }

    const removed = await removeSongFromPlaylist(playlistId, songId);
    if (!removed) {
      throw new Error("Failed to remove song from playlist");
    }

    return { success: true };
  });

export const addSongToSelectedPlaylistFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      playlistId: z.string(),
      songId: z.string(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { playlistId, songId } = data;

    const isOwner = await checkPlaylistOwnership(playlistId, context.userId);
    if (!isOwner) {
      throw new Error("Unauthorized: You can only modify your own playlists");
    }

    const playlistSong = await addSongToPlaylist(playlistId, songId);
    return playlistSong;
  });

export const getOrCreateDefaultPlaylistFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    try {
      const input: GetOrCreateDefaultPlaylistInput = {
        userId,
      };

      const playlist = await getOrCreateDefaultPlaylistUseCase(input);
      return playlist;
    } catch (error) {
      if (error instanceof PlaylistLimitError) {
        // Re-throw as a regular Error with the error code as the message
        // This maintains the existing client-side error handling
        throw new Error(error.errorCode);
      }
      // Re-throw any other errors as-is
      throw error;
    }
  });

export const getLastPlaylistFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    // Get the most recent playlist for the user
    const playlists = await findPlaylistsByUserId(userId);
    if (playlists.length > 0) {
      // Return the most recently created playlist with songs
      const latestPlaylist = await findPlaylistByIdWithSongs(playlists[0].id);
      return latestPlaylist;
    }

    return null;
  });

export const loadPlaylistWithUrlsFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const playlist = await findPlaylistByIdWithSongs(data.id);
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    if (playlist.songs.length === 0) {
      return {
        playlist,
        songsWithUrls: [],
      };
    }

    // Convert songs to include URLs
    const songsWithUrls = await Promise.all(
      playlist.songs.map(async (song) => {
        const [audioUrlResult, coverUrlResult] = await Promise.all([
          song.audioKey
            ? getAudioUrlFn({ data: { audioKey: song.audioKey } })
            : Promise.resolve(null),
          song.coverImageKey
            ? getCoverImageUrlFn({ data: { coverKey: song.coverImageKey } })
            : Promise.resolve(null),
        ]);

        return {
          ...song,
          audioUrl: audioUrlResult?.audioUrl || "",
          coverImageUrl: coverUrlResult?.coverUrl || null,
        };
      })
    );

    return {
      playlist,
      songsWithUrls,
    };
  });

export const reorderPlaylistSongsFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      playlistId: z.string(),
      songOrders: z.array(
        z.object({
          songId: z.string(),
          position: z.number(),
        })
      ),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { playlistId, songOrders } = data;

    const isOwner = await checkPlaylistOwnership(playlistId, context.userId);
    if (!isOwner) {
      throw new Error("Unauthorized: You can only reorder your own playlists");
    }

    const success = await reorderPlaylistSongs(playlistId, songOrders);
    if (!success) {
      throw new Error("Failed to reorder playlist songs");
    }

    return { success: true };
  });
