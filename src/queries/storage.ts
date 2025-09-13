import { queryOptions } from "@tanstack/react-query";
import { getImageUrlFn } from "~/fn/storage";

export const getImageUrlQuery = (imageKey: string) =>
  queryOptions({
    queryKey: ["image-url", imageKey],
    queryFn: () => getImageUrlFn({ data: { imageKey } }),
    // Cache for a shorter time since presigned URLs expire
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });