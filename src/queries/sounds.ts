import { queryOptions } from "@tanstack/react-query";
import {
  getRecentSoundsFn,
  getSoundByIdFn,
  getUserSoundsFn,
  getSoundsByTagFn,
  searchSoundsByTitleFn,
  getTagSuggestionsFn
} from "~/fn/sounds";

export const getRecentSoundsQuery = () =>
  queryOptions({
    queryKey: ["recent-sounds"],
    queryFn: () => getRecentSoundsFn(),
  });

export const getSoundByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["sound", id],
    queryFn: () => getSoundByIdFn({ data: { id } }),
  });

export const getUserSoundsQuery = () =>
  queryOptions({
    queryKey: ["user-sounds"],
    queryFn: () => getUserSoundsFn(),
  });

export const getSoundsByTagQuery = (tag: string) =>
  queryOptions({
    queryKey: ["sounds-by-tag", tag],
    queryFn: () => getSoundsByTagFn({ data: { tag } }),
  });

export const searchSoundsByTitleQuery = (query: string | undefined) =>
  queryOptions({
    queryKey: ["search-sounds", query],
    queryFn: () => searchSoundsByTitleFn({ data: { query: query || "" } }),
    enabled: !!query && query.trim().length > 0,
  });

export const getTagSuggestionsQuery = (query: string | undefined) =>
  queryOptions({
    queryKey: ["tag-suggestions", query],
    queryFn: () => getTagSuggestionsFn({ data: { query: query || "" } }),
    enabled: !!query && query.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });