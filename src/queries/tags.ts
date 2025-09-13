import { queryOptions } from "@tanstack/react-query";
import { getAllTagsFn, searchTagsFn, getTagsBySoundIdFn } from "~/fn/tags";

export const getAllTagsQuery = () =>
  queryOptions({
    queryKey: ["tags"],
    queryFn: () => getAllTagsFn(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const searchTagsQuery = (searchTerm: string) =>
  queryOptions({
    queryKey: ["tags", "search", searchTerm],
    queryFn: () => searchTagsFn({ data: { searchTerm } }),
    enabled: Boolean(searchTerm.trim()),
    staleTime: 30 * 1000, // 30 seconds for search results
  });

export const getTagsBySoundIdQuery = (soundId: string) =>
  queryOptions({
    queryKey: ["sound-tags", soundId],
    queryFn: () => getTagsBySoundIdFn({ data: { soundId } }),
    enabled: Boolean(soundId),
  });