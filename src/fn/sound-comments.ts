import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import {
  findCommentsBySoundId,
  createSoundComment,
  updateSoundComment,
  deleteSoundComment,
  findCommentById,
} from "~/data-access/sound-comments";

export const getSoundCommentsFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      soundId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    return await findCommentsBySoundId(data.soundId);
  });

export const createSoundCommentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      content: z
        .string()
        .min(1, "Comment cannot be empty")
        .max(1000, "Comment must be less than 1000 characters"),
      soundId: z.string(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    const commentData = {
      id: crypto.randomUUID(),
      ...data,
      userId: context.userId,
    };

    return await createSoundComment(commentData);
  });

export const updateSoundCommentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
      content: z
        .string()
        .min(1, "Comment cannot be empty")
        .max(1000, "Comment must be less than 1000 characters"),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Check if the comment exists and belongs to the user
    const existingComment = await findCommentById(data.id);
    if (!existingComment) {
      throw new Error("Comment not found");
    }
    if (existingComment.userId !== context.userId) {
      throw new Error("You can only edit your own comments");
    }

    return await updateSoundComment(data.id, {
      content: data.content,
    });
  });

export const deleteSoundCommentFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string(),
    })
  )
  .middleware([authenticatedMiddleware])
  .handler(async ({ data, context }) => {
    // Check if the comment exists and belongs to the user
    const existingComment = await findCommentById(data.id);
    if (!existingComment) {
      throw new Error("Comment not found");
    }
    if (existingComment.userId !== context.userId) {
      throw new Error("You can only delete your own comments");
    }

    const deleted = await deleteSoundComment(data.id);
    if (!deleted) {
      throw new Error("Failed to delete comment");
    }

    return { success: true };
  });
