import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  createSoundCommentFn, 
  deleteSoundCommentFn, 
  updateSoundCommentFn 
} from "~/fn/sound-comments";
import { getErrorMessage } from "~/utils/error";

// Hook for creating comments
export function useCreateSoundComment(soundId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createSoundCommentFn>[0]['data']) => 
      createSoundCommentFn({ data }),
    onSuccess: () => {
      toast.success("Comment posted successfully!", {
        description: "Your comment has been added to the sound.",
      });
      // Invalidate comments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["sound-comments", soundId] });
    },
    onError: (error) => {
      toast.error("Failed to post comment", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Hook for updating comments
export function useUpdateSoundComment(soundId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof updateSoundCommentFn>[0]['data']) => 
      updateSoundCommentFn({ data }),
    onSuccess: () => {
      toast.success("Comment updated successfully!", {
        description: "Your comment changes have been saved.",
      });
      // Invalidate comments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["sound-comments", soundId] });
    },
    onError: (error) => {
      toast.error("Failed to update comment", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Hook for deleting comments
export function useDeleteSoundComment(soundId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteSoundCommentFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Comment deleted successfully", {
        description: "Your comment has been removed.",
      });
      // Invalidate comments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["sound-comments", soundId] });
    },
    onError: (error) => {
      toast.error("Failed to delete comment", {
        description: getErrorMessage(error),
      });
    },
  });
}