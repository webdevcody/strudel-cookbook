import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createSoundFn, deleteSoundFn, updateSoundFn } from "~/fn/sounds";
import { getErrorMessage } from "~/utils/error";

// Hook for creating sounds
export function useCreateSound() {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createSoundFn>[0]['data']) => 
      createSoundFn({ data }),
    onSuccess: (sound) => {
      toast.success("Sound created successfully!", {
        description: "Your Strudel sound has been saved and is ready to view.",
      });
      navigate({ to: `/sounds/${sound.id}` });
    },
    onError: (error) => {
      toast.error("Failed to create sound", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Hook for updating sounds
export function useUpdateSound() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof updateSoundFn>[0]['data']) => 
      updateSoundFn({ data }),
    onSuccess: (sound) => {
      toast.success("Sound updated successfully!", {
        description: "Your sound changes have been saved.",
      });
      // Invalidate sound-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["sound", sound.id] });
      queryClient.invalidateQueries({ queryKey: ["user-sounds"] });
      queryClient.invalidateQueries({ queryKey: ["recent-sounds"] });
      // Navigate back to sound details page
      navigate({ to: `/sounds/${sound.id}` });
    },
    onError: (error) => {
      toast.error("Failed to update sound", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Hook for deleting sounds
export function useDeleteSound(redirectAfterDelete = false) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (id: string) => deleteSoundFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Sound deleted successfully", {
        description: "Your sound has been permanently removed.",
      });
      // Invalidate user sounds query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["user-sounds"] });
      // Also invalidate recent sounds in case the deleted sound was there
      queryClient.invalidateQueries({ queryKey: ["recent-sounds"] });
      // Navigate to My Sounds page if redirectAfterDelete is true (when deleting from edit page)
      if (redirectAfterDelete) {
        navigate({ to: "/my-sounds" });
      }
    },
    onError: (error) => {
      toast.error("Failed to delete sound", {
        description: getErrorMessage(error),
      });
    },
  });
}