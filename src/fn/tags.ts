import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  findAllTags,
  findTagsByName,
  findTagsBySoundId,
} from "~/data-access/tags";

export const getAllTagsFn = createServerFn().handler(async () => {
  return await findAllTags();
});

export const searchTagsFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ searchTerm: z.string() }))
  .handler(async ({ data }) => {
    if (!data.searchTerm.trim()) {
      return await findAllTags();
    }
    return await findTagsByName(data.searchTerm);
  });

export const getTagsBySoundIdFn = createServerFn({
  method: "GET",
})
  .validator(z.object({ soundId: z.string() }))
  .handler(async ({ data }) => {
    return await findTagsBySoundId(data.soundId);
  });