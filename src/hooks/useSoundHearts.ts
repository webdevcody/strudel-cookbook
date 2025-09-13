import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleSoundHeartFn } from "~/fn/sound-hearts";
import { getSoundHeartStatusQuery, getSoundHeartCountQuery } from "~/queries/sound-hearts";
import { getErrorMessage } from "~/utils/error";

// Query hooks
export function useSoundHeartStatus(soundId: string, enabled = true) {
  return useQuery({
    ...getSoundHeartStatusQuery(soundId),
    enabled,
  });
}

export function useSoundHeartCount(soundId: string, enabled = true) {
  return useQuery({
    ...getSoundHeartCountQuery(soundId),
    enabled,
  });
}

// Mutation hooks
export function useToggleSoundHeart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (soundId: string) => toggleSoundHeartFn({ data: { soundId } }),
    onSuccess: (result, soundId) => {
      // Invalidate heart status and count for this sound
      queryClient.invalidateQueries({ queryKey: ["sound-heart-status", soundId] });
      queryClient.invalidateQueries({ queryKey: ["sound-heart-count", soundId] });
      
      // Update the cache immediately for better UX
      queryClient.setQueryData(["sound-heart-status", soundId], result);
      queryClient.setQueryData(["sound-heart-count", soundId], { heartCount: result.heartCount });
      
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
export function useSoundHeartManagement(soundId: string) {
  const heartStatus = useSoundHeartStatus(soundId);
  const heartCount = useSoundHeartCount(soundId);
  const toggleHeart = useToggleSoundHeart();
  
  const invalidateHeartData = () => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: ["sound-heart-status", soundId] });
    queryClient.invalidateQueries({ queryKey: ["sound-heart-count", soundId] });
  };
  
  return {
    heartStatus,
    heartCount,
    toggleHeart,
    invalidateHeartData,
    isLoading: heartStatus.isLoading || heartCount.isLoading || toggleHeart.isPending,
  };
}