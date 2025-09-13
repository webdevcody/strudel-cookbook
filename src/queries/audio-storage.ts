import { queryOptions } from "@tanstack/react-query";
import { getAudioUrlFn, getCoverImageUrlFn } from "~/fn/audio-storage";

export const getAudioUrlQuery = (audioKey: string) =>
  queryOptions({
    queryKey: ["audio-url", audioKey],
    queryFn: () => getAudioUrlFn({ data: { audioKey } }),
    // Cache for a shorter time since presigned URLs expire
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

export const getCoverImageUrlQuery = (coverKey: string) =>
  queryOptions({
    queryKey: ["cover-image-url", coverKey],
    queryFn: () => getCoverImageUrlFn({ data: { coverKey } }),
    // Cache for a shorter time since presigned URLs expire
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });