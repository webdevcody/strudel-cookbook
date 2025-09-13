import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createSongFn, deleteSongFn, updateSongFn } from "~/fn/songs";
import { getErrorMessage } from "~/utils/error";

// Hook for creating songs
export function useCreateSong() {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createSongFn>[0]['data']) => 
      createSongFn({ data }),
    onSuccess: (song) => {
      toast.success("Song created successfully!", {
        description: "Your song has been saved and is ready for publishing.",
      });
      navigate({ to: `/song/${song.id}` });
    },
    onError: (error) => {
      toast.error("Failed to create song", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Hook for updating songs
export function useUpdateSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Parameters<typeof updateSongFn>[0]['data']) => 
      updateSongFn({ data }),
    onSuccess: (song) => {
      toast.success("Song updated successfully!", {
        description: "Your song changes have been saved.",
      });
      // Invalidate song-related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["song", song.id] });
      queryClient.invalidateQueries({ queryKey: ["user-songs"] });
      queryClient.invalidateQueries({ queryKey: ["popular-songs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-songs"] });
    },
    onError: (error) => {
      toast.error("Failed to update song", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Hook for deleting songs
export function useDeleteSong() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteSongFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Song deleted successfully", {
        description: "Your song has been permanently removed.",
      });
      // Invalidate user songs query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["user-songs"] });
      // Also invalidate popular and recent songs in case the deleted song was there
      queryClient.invalidateQueries({ queryKey: ["popular-songs"] });
      queryClient.invalidateQueries({ queryKey: ["recent-songs"] });
    },
    onError: (error) => {
      toast.error("Failed to delete song", {
        description: getErrorMessage(error),
      });
    },
  });
}