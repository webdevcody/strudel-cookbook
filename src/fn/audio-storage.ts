import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStorage } from "~/utils/storage";
import { authenticatedMiddleware } from "./middleware";

export const getPresignedAudioUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      fileName: z.string(),
      contentType: z.string(),
    })
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Generate unique song ID and create S3 key
    const songId = crypto.randomUUID();
    const fileExtension = data.fileName.split(".").pop() || "";
    const audioKey = `music/${userId}/${songId}/audio.${fileExtension}`;

    const { storage } = getStorage();
    const presignedUrl = await storage.getPresignedUploadUrl(
      audioKey,
      data.contentType
    );

    return { presignedUrl, audioKey, songId };
  });

export const getPresignedCoverImageUploadUrlFn = createServerFn({
  method: "POST",
})
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      songId: z.string(),
      fileName: z.string(),
      contentType: z.string(),
    })
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const fileExtension = data.fileName.split(".").pop() || "";
    const coverKey = `music/${userId}/${data.songId}/cover.${fileExtension}`;

    const { storage } = getStorage();
    const presignedUrl = await storage.getPresignedUploadUrl(
      coverKey,
      data.contentType
    );

    return { presignedUrl, coverKey };
  });

export const getAudioUrlFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      audioKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const audioUrl = await storage.getPresignedUrl(data.audioKey);

    return { audioUrl };
  });

export const getCoverImageUrlFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      coverKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const coverUrl = await storage.getPresignedUrl(data.coverKey);
    return { coverUrl };
  });
