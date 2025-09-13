import { queryOptions } from "@tanstack/react-query";
import { fetchPostsFn, fetchPostFn } from "~/fn/posts";

export const postsQueryOptions = () =>
  queryOptions({
    queryKey: ["posts"],
    queryFn: () => fetchPostsFn(),
  });

export const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ["post", postId],
    queryFn: () => fetchPostFn({ data: postId }),
  });