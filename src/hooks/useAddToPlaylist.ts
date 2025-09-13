import { useCallback } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { usePlaylist, type PlaylistSong } from "~/components/playlist-provider";
import { addSongToSelectedPlaylistFn, getOrCreateDefaultPlaylistFn, getPlaylistByIdFn } from "~/fn/playlists";
import { getAudioUrlFn, getCoverImageUrlFn } from "~/fn/audio-storage";
import { toPlaylistSong } from "~/components/playlist-provider";

export function useAddToPlaylist() {
  const { 
    playlist, 
    addToPlaylist, 
    selectedPlaylistId, 
    isAuthenticated,
    setSelectedPlaylist,
    currentPlaylistId,
    loadSavedPlaylist 
  } = usePlaylist();
  const queryClient = useQueryClient();

  // Fetch the selected playlist for authenticated users to check song membership
  const { data: selectedPlaylistData } = useQuery({
    queryKey: ["playlist", selectedPlaylistId],
    queryFn: () => selectedPlaylistId ? getPlaylistByIdFn({ data: { id: selectedPlaylistId } }) : null,
    enabled: isAuthenticated && !!selectedPlaylistId,
  });

  const isInPlaylist = useCallback((songId: string) => {
    if (isAuthenticated && selectedPlaylistData) {
      // For authenticated users, check if song is in their selected database playlist
      return selectedPlaylistData.songs.some(song => song.id === songId);
    } else {
      // For anonymous users, check the in-memory playlist
      return playlist.some(song => song.id === songId);
    }
  }, [isAuthenticated, selectedPlaylistData, playlist]);

  // Mutation to get or create default playlist
  const getOrCreatePlaylistMutation = useMutation({
    mutationFn: getOrCreateDefaultPlaylistFn,
    onSuccess: (defaultPlaylist) => {
      // Set this as the selected playlist
      setSelectedPlaylist(defaultPlaylist.id, defaultPlaylist.name);
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      
      if (errorMessage === "PLAYLIST_LIMIT_FREE" || 
          errorMessage === "PLAYLIST_LIMIT_BASIC" || 
          errorMessage === "SUBSCRIPTION_EXPIRED") {
        // For these specific errors, we'll show a more user-friendly message
        // The proper error dialog should be handled at a higher level
        toast.error("Unable to create playlist. Please check your subscription plan.");
      } else {
        toast.error(errorMessage || "Failed to create playlist");
      }
    }
  });

  // Mutation to add song to database playlist
  const addToDbPlaylistMutation = useMutation({
    mutationFn: addSongToSelectedPlaylistFn,
    onSuccess: async (_, variables) => {
      const playlistId = variables.data.playlistId;
      
      // Invalidate playlist queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      
      // Invalidate the specific playlist that was updated
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      
      // If the updated playlist is currently loaded in the player, reload it
      if (currentPlaylistId === playlistId) {
        try {
          const updatedPlaylistData = await getPlaylistByIdFn({ data: { id: playlistId } });
          
          // Convert songs to PlaylistSong format with URLs
          const playlistSongs = await Promise.all(
            updatedPlaylistData.songs.map(async (song) => {
              const [audioUrlResult, coverUrlResult] = await Promise.all([
                song.audioKey ? getAudioUrlFn({ data: { audioKey: song.audioKey } }) : Promise.resolve(null),
                song.coverImageKey ? getCoverImageUrlFn({ data: { coverKey: song.coverImageKey } }) : Promise.resolve(null),
              ]);

              return toPlaylistSong({
                ...song,
                audioUrl: audioUrlResult?.audioUrl || "",
                coverImageUrl: coverUrlResult?.coverUrl || undefined,
              });
            })
          );

          // Reload the playlist in the player
          loadSavedPlaylist(updatedPlaylistData.id, updatedPlaylistData.name, playlistSongs);
        } catch (error) {
          console.error("Failed to reload current playlist:", error);
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add song to playlist");
    }
  });

  const handleAddToPlaylist = useCallback(async (song: PlaylistSong) => {
    if (isInPlaylist(song.id)) {
      toast.info(`"${song.title}" is already in your playlist`, {
        description: "This song is already added to your current playlist"
      });
      return;
    }

    // For authenticated users, add to database playlist
    if (isAuthenticated) {
      try {
        let targetPlaylistId = selectedPlaylistId;
        
        // If no playlist is selected, get or create default playlist
        if (!targetPlaylistId) {
          const defaultPlaylist = await getOrCreatePlaylistMutation.mutateAsync(undefined);
          targetPlaylistId = defaultPlaylist.id;
        }

        // Add song to database playlist
        if (targetPlaylistId) {
          await addToDbPlaylistMutation.mutateAsync({
            data: {
              playlistId: targetPlaylistId,
              songId: song.id,
            }
          });

          toast.success(`Added "${song.title}" to playlist`, {
            description: `by ${song.artist}`
          });
        }
      } catch (error) {
        // Error handling is done in mutations
        return;
      }
    } else {
      // For anonymous users, use in-memory playlist
      addToPlaylist(song);
      toast.success(`Added "${song.title}" to playlist`, {
        description: `by ${song.artist}`
      });
    }
  }, [
    isInPlaylist, 
    isAuthenticated, 
    selectedPlaylistId, 
    setSelectedPlaylist,
    addToPlaylist,
    getOrCreatePlaylistMutation,
    addToDbPlaylistMutation
  ]);

  return {
    handleAddToPlaylist,
    isInPlaylist,
    isLoading: getOrCreatePlaylistMutation.isPending || addToDbPlaylistMutation.isPending
  };
}