import { createServerFn } from "@tanstack/react-start";
import {
  findRecentSounds,
  createSound,
  findSoundById,
  updateSound,
  findSoundsByUserId,
  deleteSound,
  searchSoundsByTitle,
} from "~/data-access/sounds";
import { updateSoundTags, findSoundsByTagName, findTagsByName } from "~/data-access/tags";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";

export const getRecentSoundsFn = createServerFn().handler(async () => {
  return await findRecentSounds(20);
});

export const getSoundsByTagFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ tag: z.string() }))
  .handler(async ({ data }) => {
    return await findSoundsByTagName(data.tag);
  });

export const createSoundFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
      strudelCode: z.string().min(1, "Strudel code is required").max(5000, "Code must be less than 5000 characters"),
      tags: z.array(z.string()).optional().default([]),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { tags, ...soundData } = data;
    
    const soundPayload = {
      id: crypto.randomUUID(),
      ...soundData,
      userId: context.userId,
    };

    const newSound = await createSound(soundPayload);
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      await updateSoundTags(newSound.id, tags);
    }
    
    return newSound;
  });

export const getSoundByIdFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const sound = await findSoundById(data.id);
    if (!sound) {
      throw new Error("Sound not found");
    }
    return sound;
  });

export const updateSoundFn = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      id: z.string(),
      title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
      strudelCode: z.string().min(1, "Strudel code is required").max(5000, "Code must be less than 5000 characters").optional(),
      tags: z.array(z.string()).optional(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { id, tags, ...updateData } = data;
    
    // First check if the sound exists and belongs to the user
    const existingSound = await findSoundById(id);
    if (!existingSound) {
      throw new Error("Sound not found");
    }
    
    if (existingSound.userId !== context.userId) {
      throw new Error("Unauthorized: You can only edit your own sounds");
    }

    const updatedSound = await updateSound(id, updateData);
    if (!updatedSound) {
      throw new Error("Failed to update sound");
    }
    
    // Update tags if provided
    if (tags !== undefined) {
      await updateSoundTags(id, tags);
    }
    
    return updatedSound;
  });

export const getUserSoundsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    return await findSoundsByUserId(context.userId);
  });

export const deleteSoundFn = createServerFn({
  method: "POST",
})
  .validator(z.object({ id: z.string() }))
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const { id } = data;
    
    // First check if the sound exists and belongs to the user
    const existingSound = await findSoundById(id);
    if (!existingSound) {
      throw new Error("Sound not found");
    }
    
    if (existingSound.userId !== context.userId) {
      throw new Error("Unauthorized: You can only delete your own sounds");
    }

    const deleted = await deleteSound(id);
    if (!deleted) {
      throw new Error("Failed to delete sound");
    }
    
    return { success: true };
  });

export const searchSoundsByTitleFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data }) => {
    return await searchSoundsByTitle(data.query);
  });

export const getTagSuggestionsFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ query: z.string() }))
  .handler(async ({ data }) => {
    if (!data.query.trim()) {
      return [];
    }
    return await findTagsByName(data.query);
  });