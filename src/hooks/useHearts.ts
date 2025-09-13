import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleHeartFn } from "~/fn/hearts";
import { getHeartStatusQuery, getHeartCountQuery } from "~/queries/hearts";
import { getErrorMessage } from "~/utils/error";

// Query hooks
export function useHeartStatus(songId: string, enabled = true) {
  return useQuery({
    ...getHeartStatusQuery(songId),
    enabled,
  });
}

export function useHeartCount(songId: string, enabled = true) {
  return useQuery({
    ...getHeartCountQuery(songId),
    enabled,
  });
}

// Mutation hooks
export function useToggleHeart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (songId: string) => toggleHeartFn({ data: { songId } }),
    onSuccess: (result, songId) => {
      // Invalidate heart status and count for this song
      queryClient.invalidateQueries({ queryKey: ["heart-status", songId] });
      queryClient.invalidateQueries({ queryKey: ["heart-count", songId] });
      
      // Update the cache immediately for better UX
      queryClient.setQueryData(["heart-status", songId], result);
      queryClient.setQueryData(["heart-count", songId], { heartCount: result.heartCount });
      
      // Show success message
      toast.success(
        result.isHearted ? "Added to favorites" : "Removed from favorites",
        {
          description: `${result.heartCount} ${result.heartCount === 1 ? 'heart' : 'hearts'}`
        }
      );
    },
    onError: (error) => {
      toast.error("Failed to update heart", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Combined hook for common use case
export function useHeartManagement(songId: string) {
  const heartStatus = useHeartStatus(songId);
  const heartCount = useHeartCount(songId);
  const toggleHeart = useToggleHeart();
  
  const invalidateHeartData = () => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: ["heart-status", songId] });
    queryClient.invalidateQueries({ queryKey: ["heart-count", songId] });
  };
  
  return {
    heartStatus,
    heartCount,
    toggleHeart,
    invalidateHeartData,
    isLoading: heartStatus.isLoading || heartCount.isLoading || toggleHeart.isPending,
  };
}