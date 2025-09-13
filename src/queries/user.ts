import { queryOptions } from "@tanstack/react-query";
import { getImageUrlFn } from "~/fn/storage";
import { getUserProfileFn, getUserSoundsByIdFn } from "~/fn/users";

export const getUserAvatarQuery = (imageKey: string | null) =>
  queryOptions({
    queryKey: ["avatar-url", imageKey],
    queryFn: async (): Promise<{ imageUrl: string | null }> => {
      if (!imageKey) {
        return { imageUrl: null };
      }
      
      try {
        const result = await getImageUrlFn({
          data: { imageKey },
        });
        return { imageUrl: result.imageUrl };
      } catch (error) {
        console.error('Error fetching avatar URL:', error);
        return { imageUrl: null };
      }
    },
    enabled: !!imageKey,
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const getUserProfileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["user-profile", userId],
    queryFn: () => getUserProfileFn({ data: { userId } }),
  });

export const getUserSoundsByIdQuery = (userId: string) =>
  queryOptions({
    queryKey: ["user-sounds", userId],
    queryFn: () => getUserSoundsByIdFn({ data: { userId } }),
  });