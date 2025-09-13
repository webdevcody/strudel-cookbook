import { createServerFn } from "@tanstack/react-start";
import {
  findRecentSongs,
  findPopularSongs,
  createSong,
  findSongById,
  updateSong,
  findRecentSongsWithUrls,
  findPopularSongsWithUrls,
  findSongByIdWithUrls,
  findSongsByUserIdWithUrls,
  deleteSong,
  incrementPlayCount,
} from "~/data-access/songs";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";

export const getRecentSongsFn = createServerFn().handler(async () => {
  return await findRecentSongsWithUrls(20);
});

export const getPopularSongsFn = createServerFn().handler(async () => {
  return await findPopularSongsWithUrls(20);
});

export const createSongFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      title: z.string().min(2).max(100),
      artist: z.string().min(1).max(50),
      album: z.string().max(100).optional().or(z.literal("")),
      genre: z.string().max(50).optional().or(z.literal("")),
      description: z.string().max(500).optional(),
      audioKey: z.string().min(1, "Audio key is required"),
      coverImageKey: z.string().optional().or(z.literal("")),
      status: z
        .enum(["processing", "published", "private", "unlisted"])
        .default("processing"),
      duration: z.number().int().min(1).optional(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const songData = {
      id: crypto.randomUUID(),
      ...data,
      userId: context.userId,
    };

    const newSong = await createSong(songData);
    return newSong;
  });

export const getSongByIdFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const song = await findSongByIdWithUrls(data.id);
    if (!song) {
      throw new Error("Song not found");
    }
    return song;
  });

export const updateSongFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      id: z.string(),
      title: z.string().min(2).max(100).optional(),
      artist: z.string().min(1).max(50).optional(),
      album: z.string().max(100).optional().or(z.literal("")),
      genre: z.string().max(50).optional().or(z.literal("")),
      description: z.string().max(500).optional(),
      status: z
        .enum(["processing", "published", "private", "unlisted"])
        .optional(),
      coverImageKey: z.string().optional().or(z.literal("")),
      audioKey: z.string().optional(),
      duration: z.number().int().min(1).optional(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { id, ...updateData } = data;
    
    // First check if the song exists and belongs to the user
    const existingSong = await findSongById(id);
    if (!existingSong) {
      throw new Error("Song not found");
    }
    
    if (existingSong.userId !== context.userId) {
      throw new Error("Unauthorized: You can only edit your own songs");
    }

    const updatedSong = await updateSong(id, updateData);
    if (!updatedSong) {
      throw new Error("Failed to update song");
    }
    
    return updatedSong;
  });

export const getUserSongsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findSongsByUserIdWithUrls(context.userId);
  });

export const deleteSongFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { id } = data;
    
    // First check if the song exists and belongs to the user
    const existingSong = await findSongById(id);
    if (!existingSong) {
      throw new Error("Song not found");
    }
    
    if (existingSong.userId !== context.userId) {
      throw new Error("Unauthorized: You can only delete your own songs");
    }

    const deleted = await deleteSong(id);
    if (!deleted) {
      throw new Error("Failed to delete song");
    }
    
    return { success: true };
  });

export const incrementPlayCountFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ songId: z.string() }))
  .handler(async ({ data }) => {
    const { songId } = data;
    
    const updatedSong = await incrementPlayCount(songId);
    if (!updatedSong) {
      throw new Error("Failed to increment play count");
    }
    
    return { success: true, playCount: updatedSong.playCount };
  });