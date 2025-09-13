import { queryOptions } from "@tanstack/react-query";
import { 
  getPlaylistsFn,
  getPublicPlaylistsFn,
  getPlaylistByIdFn,
  getOrCreateDefaultPlaylistFn,
  getLastPlaylistFn
} from "~/fn/playlists";

export const getPlaylistsQuery = () =>
  queryOptions({
    queryKey: ["user-playlists"],
    queryFn: () => getPlaylistsFn(),
  });

export const getPublicPlaylistsQuery = () =>
  queryOptions({
    queryKey: ["public-playlists"],
    queryFn: () => getPublicPlaylistsFn(),
  });

export const getPlaylistByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["playlist", id],
    queryFn: () => getPlaylistByIdFn({ data: { id } }),
  });

export const getOrCreateDefaultPlaylistQuery = () =>
  queryOptions({
    queryKey: ["default-playlist"],
    queryFn: () => getOrCreateDefaultPlaylistFn(),
  });

export const getLastPlaylistQuery = () =>
  queryOptions({
    queryKey: ["last-playlist"],
    queryFn: () => getLastPlaylistFn(),
  });