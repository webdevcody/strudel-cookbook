import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  createSoundHeart,
  deleteSoundHeart,
  findSoundHeartByUserAndSound,
  getSoundHeartCountForSound,
} from "~/data-access/sound-hearts";

export const toggleSoundHeartFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ soundId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { soundId } = data;
    const userId = context.userId;

    // Check if heart already exists
    const existingHeart = await findSoundHeartByUserAndSound(userId, soundId);

    if (existingHeart) {
      // Remove heart
      await deleteSoundHeart(userId, soundId);
      const heartCount = await getSoundHeartCountForSound(soundId);
      return { isHearted: false, heartCount };
    } else {
      // Add heart
      await createSoundHeart({
        id: crypto.randomUUID(),
        userId,
        soundId,
      });
      const heartCount = await getSoundHeartCountForSound(soundId);
      return { isHearted: true, heartCount };
    }
  });

export const getSoundHeartStatusFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ soundId: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { soundId } = data;
    const userId = context.userId;

    const existingHeart = await findSoundHeartByUserAndSound(userId, soundId);
    const heartCount = await getSoundHeartCountForSound(soundId);

    return {
      isHearted: !!existingHeart,
      heartCount,
    };
  });

export const getSoundHeartCountFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ soundId: z.string() }))
  .handler(async ({ data }) => {
    const { soundId } = data;
    const heartCount = await getSoundHeartCountForSound(soundId);
    return { heartCount };
  });