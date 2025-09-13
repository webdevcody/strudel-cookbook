import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  createHeart,
  deleteHeart,
  findHeartByUserAndSong,
  getHeartCountForSong,
} from "~/data-access/hearts";

export const toggleHeartFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ songId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { songId } = data;
    const userId = context.userId;

    // Check if heart already exists
    const existingHeart = await findHeartByUserAndSong(userId, songId);

    if (existingHeart) {
      // Remove heart
      await deleteHeart(userId, songId);
      const heartCount = await getHeartCountForSong(songId);
      return { isHearted: false, heartCount };
    } else {
      // Add heart
      await createHeart({
        id: crypto.randomUUID(),
        userId,
        songId,
      });
      const heartCount = await getHeartCountForSong(songId);
      return { isHearted: true, heartCount };
    }
  });

export const getHeartStatusFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ songId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { songId } = data;
    const userId = context.userId;

    const existingHeart = await findHeartByUserAndSong(userId, songId);
    const heartCount = await getHeartCountForSong(songId);

    return {
      isHearted: !!existingHeart,
      heartCount,
    };
  });

export const getHeartCountFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ songId: z.string() }))
  .handler(async ({ data }) => {
    const { songId } = data;
    const heartCount = await getHeartCountForSong(songId);
    return { heartCount };
  });