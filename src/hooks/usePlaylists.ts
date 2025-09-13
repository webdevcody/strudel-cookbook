import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPlaylistFn,
  updatePlaylistFn,
  deletePlaylistFn,
  addSongToPlaylistFn,
  removeSongFromPlaylistFn,
  addSongToSelectedPlaylistFn,
  getOrCreateDefaultPlaylistFn,
  loadPlaylistWithUrlsFn,
  reorderPlaylistSongsFn,
} from "~/fn/playlists";
import {
  getPlaylistsQuery,
  getPublicPlaylistsQuery,
  getPlaylistByIdQuery,
  getOrCreateDefaultPlaylistQuery,
  getLastPlaylistQuery,
} from "~/queries/playlists";
import { getErrorMessage } from "~/utils/error";
import { authClient } from "~/lib/auth-client";

// Query hooks
export function usePlaylists(enabled = true) {
  const { data: session } = authClient.useSession();

  return useQuery({
    ...getPlaylistsQuery(),
    enabled: enabled && !!session?.user, // Only run if authenticated
  });
}

export function usePublicPlaylists(enabled = true) {
  return useQuery({
    ...getPublicPlaylistsQuery(),
    enabled,
  });
}

export function usePlaylistById(id: string, enabled = true) {
  const { data: session } = authClient.useSession();

  return useQuery({
    ...getPlaylistByIdQuery(id),
    enabled: enabled && !!id && !!session?.user, // Only run if authenticated
  });
}

export function useDefaultPlaylist(enabled = true) {
  const { data: session } = authClient.useSession();

  return useQuery({
    ...getOrCreateDefaultPlaylistQuery(),
    enabled: enabled && !!session?.user, // Only run if authenticated
  });
}

export function useLastPlaylist(enabled = true) {
  const { data: session } = authClient.useSession();

  return useQuery({
    ...getLastPlaylistQuery(),
    enabled: enabled && !!session?.user, // Only run if authenticated
  });
}

// Mutation hooks
export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof createPlaylistFn>[0]["data"]) =>
      createPlaylistFn({ data }),
    onSuccess: (newPlaylist) => {
      toast.success("Playlist created successfully!", {
        description: `"${newPlaylist.name}" is ready for your music.`,
      });

      // Invalidate playlists queries
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      queryClient.invalidateQueries({ queryKey: ["public-playlists"] });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);

      if (
        errorMessage === "PLAYLIST_LIMIT_FREE" ||
        errorMessage === "PLAYLIST_LIMIT_BASIC" ||
        errorMessage === "SUBSCRIPTION_EXPIRED"
      ) {
        toast.error("Playlist limit reached", {
          description: "Please upgrade your plan to create more playlists.",
        });
      } else {
        toast.error("Failed to create playlist", {
          description: errorMessage,
        });
      }
    },
  });
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof updatePlaylistFn>[0]["data"]) =>
      updatePlaylistFn({ data }),
    onSuccess: (updatedPlaylist, variables) => {
      toast.success("Playlist updated successfully!", {
        description: `Changes to "${updatedPlaylist.name}" have been saved.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      queryClient.invalidateQueries({ queryKey: ["playlist", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["public-playlists"] });
    },
    onError: (error) => {
      toast.error("Failed to update playlist", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePlaylistFn({ data: { id } }),
    onSuccess: (_, playlistId) => {
      toast.success("Playlist deleted successfully", {
        description: "Your playlist has been permanently removed.",
      });

      // Invalidate playlists queries
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      queryClient.invalidateQueries({ queryKey: ["public-playlists"] });

      // Remove the specific playlist from cache
      queryClient.removeQueries({ queryKey: ["playlist", playlistId] });
    },
    onError: (error) => {
      toast.error("Failed to delete playlist", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useAddSongToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { playlistId: string; songId: string }) =>
      addSongToPlaylistFn({ data }),
    onSuccess: (_, { playlistId, songId }) => {
      toast.success("Song added to playlist!");

      // Invalidate playlist data
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
    onError: (error) => {
      toast.error("Failed to add song to playlist", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useRemoveSongFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { playlistId: string; songId: string }) =>
      removeSongFromPlaylistFn({ data }),
    onSuccess: (_, { playlistId, songId }) => {
      toast.success("Song removed from playlist");

      // Invalidate playlist data
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
    onError: (error) => {
      toast.error("Failed to remove song from playlist", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useAddSongToSelectedPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { playlistId: string; songId: string }) =>
      addSongToSelectedPlaylistFn({ data }),
    onSuccess: (_, { playlistId, songId }) => {
      toast.success("Song added to selected playlist!");

      // Invalidate playlist data
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
    onError: (error) => {
      toast.error("Failed to add song to selected playlist", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useGetOrCreateDefaultPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getOrCreateDefaultPlaylistFn,
    onSuccess: (defaultPlaylist) => {
      // Update queries
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
      queryClient.invalidateQueries({ queryKey: ["default-playlist"] });

      // Set the data immediately
      queryClient.setQueryData(["default-playlist"], defaultPlaylist);
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);

      if (
        errorMessage === "PLAYLIST_LIMIT_FREE" ||
        errorMessage === "PLAYLIST_LIMIT_BASIC" ||
        errorMessage === "SUBSCRIPTION_EXPIRED"
      ) {
        toast.error("Unable to create playlist", {
          description: "Please check your subscription plan.",
        });
      } else {
        toast.error("Failed to create default playlist", {
          description: errorMessage,
        });
      }
    },
  });
}

export function useLoadPlaylistWithUrls() {
  return useMutation({
    mutationFn: loadPlaylistWithUrlsFn,
    onError: (error: Error) => {
      toast.error(error.message || "Failed to load playlist");
    },
  });
}

export function useReorderPlaylistSongs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { playlistId: string; songOrders: { songId: string; position: number }[] }) =>
      reorderPlaylistSongsFn({ data }),
    onSuccess: (_, { playlistId }) => {
      // Invalidate playlist data to refetch with new order
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
    },
    onError: (error) => {
      toast.error("Failed to reorder songs", {
        description: getErrorMessage(error),
      });
    },
  });
}
