import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStorage } from "~/utils/storage";
import { authenticatedMiddleware } from "./middleware";
import { database } from "~/db";
import { user } from "~/db/schema";
import { eq } from "drizzle-orm";

export const getPresignedUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      videoKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const presignedUrl = await storage.getPresignedUploadUrl(data.videoKey);

    return { presignedUrl, videoKey: data.videoKey };
  });

export const getPresignedImageUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      imageKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const presignedUrl = await storage.getPresignedUploadUrl(data.imageKey);

    return { presignedUrl, imageKey: data.imageKey };
  });

export const getImageUrlFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      imageKey: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { storage } = getStorage();
    const imageUrl = await storage.getPresignedUrl(data.imageKey);

    return { imageUrl };
  });

export const updateUserProfileFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      name: z.string().optional(),
      image: z.string().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    
    const updateData: { name?: string; image?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    
    if (data.image !== undefined) {
      updateData.image = data.image;
    }

    await database
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId));

    return { success: true };
  });

export const getProfileImageUploadUrlFn = createServerFn({ method: "POST" })
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
    
    const fileExtension = data.fileName.split('.').pop() || '';
    const imageKey = `profile-images/${userId}/${Date.now()}.${fileExtension}`;
    
    const { storage } = getStorage();
    const presignedUrl = await storage.getPresignedUploadUrl(imageKey, data.contentType);

    return { presignedUrl, imageKey };
  });

export const deleteUserAccountFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      email: z.string().email(),
    })
  )
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    
    // First, get the user's email to verify it matches
    const [userRecord] = await database
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (!userRecord) {
      throw new Error("User not found");
    }
    
    // Verify the email matches (case insensitive)
    if (userRecord.email.toLowerCase() !== data.email.toLowerCase()) {
      throw new Error("Email does not match your account email");
    }
    
    // Delete the user - this will cascade delete all related records
    await database
      .delete(user)
      .where(eq(user.id, userId));

    return { success: true };
  });
