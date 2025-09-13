import { queryOptions } from "@tanstack/react-query";
import { getPopularSongsFn, getRecentSongsFn, getSongByIdFn, getUserSongsFn } from "~/fn/songs";

export const getRecentSongsQuery = () =>
  queryOptions({
    queryKey: ["recent-songs"],
    queryFn: () => getRecentSongsFn(),
  });

export const getPopularSongsQuery = () =>
  queryOptions({
    queryKey: ["popular-songs"],
    queryFn: () => getPopularSongsFn(),
  });

export const getSongByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["song", id],
    queryFn: () => getSongByIdFn({ data: { id } }),
  });

export const getUserSongsQuery = () =>
  queryOptions({
    queryKey: ["user-songs"],
    queryFn: () => getUserSongsFn(),
  });