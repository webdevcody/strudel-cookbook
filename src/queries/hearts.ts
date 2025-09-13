import { queryOptions } from "@tanstack/react-query";
import { getHeartStatusFn, getHeartCountFn } from "~/fn/hearts";

export const getHeartStatusQuery = (songId: string) =>
  queryOptions({
    queryKey: ["heart-status", songId],
    queryFn: () => getHeartStatusFn({ data: { songId } }),
  });

export const getHeartCountQuery = (songId: string) =>
  queryOptions({
    queryKey: ["heart-count", songId],
    queryFn: () => getHeartCountFn({ data: { songId } }),
  });