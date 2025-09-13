import { queryOptions } from "@tanstack/react-query";
import { getSoundCommentsFn } from "~/fn/sound-comments";

export function getSoundCommentsQuery(soundId: string) {
  return queryOptions({
    queryKey: ["sound-comments", soundId],
    queryFn: () => getSoundCommentsFn({ data: { soundId } }),
  });
}