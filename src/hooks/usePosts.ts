import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postsQueryOptions, postQueryOptions } from "~/queries/posts";

// Query hooks
export function usePosts(enabled = true) {
  return useQuery({
    ...postsQueryOptions(),
    enabled,
  });
}

export function usePost(postId: string, enabled = true) {
  return useQuery({
    ...postQueryOptions(postId),
    enabled: enabled && !!postId,
  });
}

// Combined hook for post management
export function usePostManagement() {
  const queryClient = useQueryClient();
  
  const invalidatePostsData = (postId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    
    if (postId) {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    }
  };
  
  const refreshPosts = () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };
  
  const refreshPost = (postId: string) => {
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
  };
  
  return {
    posts: usePosts(),
    invalidatePostsData,
    refreshPosts,
    refreshPost,
  };
}