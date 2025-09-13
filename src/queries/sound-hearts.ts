import { queryOptions } from "@tanstack/react-query";
import { getSoundHeartStatusFn, getSoundHeartCountFn } from "~/fn/sound-hearts";

export const getSoundHeartStatusQuery = (soundId: string) =>
  queryOptions({
    queryKey: ["sound-heart-status", soundId],
    queryFn: () => getSoundHeartStatusFn({ data: { soundId } }),
  });

export const getSoundHeartCountQuery = (soundId: string) =>
  queryOptions({
    queryKey: ["sound-heart-count", soundId],
    queryFn: () => getSoundHeartCountFn({ data: { soundId } }),
  });