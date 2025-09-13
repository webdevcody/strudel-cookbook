import { Play, Trash2, Music, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { usePlaylist, toPlaylistSong } from "~/components/playlist-provider";
import { formatDuration } from "~/utils/song";
import { EmptyState } from "~/components/EmptyState";
import { usePlaylists, usePlaylistById, useRemoveSongFromPlaylist } from "~/hooks/usePlaylists";
import { useAudioUrl, useCoverImageUrl } from "~/hooks/useAudioStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Temporary imports for complex loading logic - to be refactored later
import { getCoverImageUrlFn, getAudioUrlFn } from "~/fn/audio-storage";
import { getPlaylistByIdFn } from "~/fn/playlists";
import { CreatePlaylistDialog } from "~/components/CreatePlaylistDialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface PlaylistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlaylistSheet({ open, onOpenChange }: PlaylistSheetProps) {
  const {
    playlist,
    currentIndex,
    playSong,
    removeFromPlaylist,
    currentPlaylistName,
    selectedPlaylistId,
    isAuthenticated,
    setSelectedPlaylist,
    loadSavedPlaylist,
  } = usePlaylist();

  const [localSelectedPlaylistId, setLocalSelectedPlaylistId] =
    useState<string>("");

  const queryClient = useQueryClient();

  // Load saved playlist ID from localStorage on mount
  useEffect(() => {
    if (isAuthenticated) {
      const savedPlaylistId = localStorage.getItem("lastSelectedPlaylistId");
      if (savedPlaylistId) {
        setLocalSelectedPlaylistId(savedPlaylistId);
      }
    }
  }, [isAuthenticated]);

  // Fetch user's playlists using hook
  const { data: userPlaylists = [] } = usePlaylists();

  // Load saved playlist mutation
  const loadPlaylistMutation = useMutation({
    mutationFn: getPlaylistByIdFn,
    onSuccess: async (playlistData) => {
      // Convert songs to PlaylistSong format with URLs
      const playlistSongs = await Promise.all(
        playlistData.songs.map(async (song) => {
          const [audioUrlResult, coverUrlResult] = await Promise.all([
            song.audioKey
              ? getAudioUrlFn({ data: { audioKey: song.audioKey } })
              : Promise.resolve(null),
            song.coverImageKey
              ? getCoverImageUrlFn({ data: { coverKey: song.coverImageKey } })
              : Promise.resolve(null),
          ]);

          return toPlaylistSong({
            ...song,
            audioUrl: audioUrlResult?.audioUrl || "",
            coverImageUrl: coverUrlResult?.coverUrl || undefined,
          });
        })
      );

      loadSavedPlaylist(playlistData.id, playlistData.name, playlistSongs);

      // Don't show toast for automatic playlist loading on app start
      // Toast only shows for manual playlist selections
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to load playlist");
    },
  });

  // Use remove song from playlist hook
  const removeSongMutation = useRemoveSongFromPlaylist();

  // Auto-load saved playlist when playlists are available
  useEffect(() => {
    if (
      isAuthenticated &&
      localSelectedPlaylistId &&
      userPlaylists.length > 0 &&
      !selectedPlaylistId
    ) {
      const savedPlaylist = userPlaylists.find(
        (p) => p.id === localSelectedPlaylistId
      );
      if (savedPlaylist) {
        setSelectedPlaylist(localSelectedPlaylistId, savedPlaylist.name);
        loadPlaylistMutation.mutate({ data: { id: localSelectedPlaylistId } });
      }
    }
  }, [
    isAuthenticated,
    localSelectedPlaylistId,
    userPlaylists,
    selectedPlaylistId,
    setSelectedPlaylist,
  ]);

  const handlePlaylistSelect = (playlistId: string) => {
    setLocalSelectedPlaylistId(playlistId);

    // Save to localStorage
    if (isAuthenticated) {
      localStorage.setItem("lastSelectedPlaylistId", playlistId);
    }

    // Find the playlist name and set it as selected for adding songs
    const playlist = userPlaylists.find((p) => p.id === playlistId);
    if (playlist) {
      setSelectedPlaylist(playlistId, playlist.name);
    }

    loadPlaylistMutation.mutate({ data: { id: playlistId } });
  };

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handlePlaylistCreated = (playlistId: string, playlistName: string) => {
    setLocalSelectedPlaylistId(playlistId);

    // Save to localStorage
    if (isAuthenticated) {
      localStorage.setItem("lastSelectedPlaylistId", playlistId);
    }

    // Also update the global selected playlist for adding songs
    setSelectedPlaylist(playlistId, playlistName);
  };

  const handleSongClick = (songId: string, index: number) => {
    const song = playlist.find((s) => s.id === songId);
    if (song) {
      playSong(song, index);
    }
  };

  const handleRemoveSong = (songId: string) => {
    // For authenticated users with a selected playlist, remove from database
    if (isAuthenticated && selectedPlaylistId) {
      removeSongMutation.mutate({
        data: {
          playlistId: selectedPlaylistId,
          songId: songId,
        },
      });
    }

    // Always remove from in-memory playlist (handles both auth and anonymous users)
    removeFromPlaylist(songId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[500px] flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Playlist</SheetTitle>
        </SheetHeader>
        {/* Header with Playlist Selector */}
        <div className="flex flex-col py-4 pr-16 px-6 border-b space-y-3">
          {/* Playlist Selector Dropdown */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Select
                value={localSelectedPlaylistId || selectedPlaylistId || ""}
                onValueChange={handlePlaylistSelect}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a playlist">
                    {(() => {
                      const playlist = userPlaylists.find(
                        (p) =>
                          p.id ===
                          (localSelectedPlaylistId || selectedPlaylistId)
                      );
                      return playlist ? playlist.name : "Select playlist";
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {userPlaylists.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No saved playlists
                    </div>
                  ) : (
                    userPlaylists.map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        {playlist.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <CreatePlaylistDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onPlaylistCreated={handlePlaylistCreated}
              />
            </div>
          ) : (
            <h2 className="text-lg font-semibold">
              {currentPlaylistName || "Current Queue"}
            </h2>
          )}

          {/* Song Count */}
          <p className="text-sm text-muted-foreground">
            {playlist.length === 0
              ? "Add songs to get started"
              : `${playlist.length} song${playlist.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Songs List - Clean and Spacious */}
        {playlist.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={<Music className="h-12 w-12 text-primary/60" />}
              title="No songs in queue"
              description="Add songs from browse or load a saved playlist"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 px-6 py-4">
              {playlist.map((song, index) => {
                const isCurrentSong = currentIndex === index;

                return (
                  <SongItem
                    key={`${song.id}-${index}`}
                    song={song}
                    index={index}
                    isCurrentSong={isCurrentSong}
                    onSongClick={handleSongClick}
                    onRemove={handleRemoveSong}
                  />
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Separate component for individual song items to handle cover image loading
interface SongItemProps {
  song: any;
  index: number;
  isCurrentSong: boolean;
  onSongClick: (songId: string, index: number) => void;
  onRemove: (songId: string) => void;
}

function SongItem({
  song,
  index,
  isCurrentSong,
  onSongClick,
  onRemove,
}: SongItemProps) {
  // Get the cover image URL from the coverImageKey
  const { data: coverUrlData } = useQuery({
    queryKey: ["cover-url", song.coverImageKey],
    queryFn: () =>
      getCoverImageUrlFn({ data: { coverKey: song.coverImageKey! } }),
    enabled: !!song.coverImageKey,
  });

  const displayCoverUrl = coverUrlData?.coverUrl;

  return (
    <div
      onClick={() => onSongClick(song.id, index)}
      className={`group flex items-center space-x-3 p-2 rounded-md transition-colors hover:bg-muted/50 cursor-pointer ${
        isCurrentSong ? "bg-muted ring-1 ring-primary/20" : ""
      }`}
    >
      {/* Album art and play button */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <div className="w-full h-full bg-muted rounded overflow-hidden">
          {displayCoverUrl ? (
            <img
              src={displayCoverUrl}
              alt={`${song.title} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Music className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Play button overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded ${
            isCurrentSong ? "opacity-100" : ""
          }`}
        >
          <Play className="h-4 w-4" fill="currentColor" />
        </div>
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          {/* Title - clickable link to song detail */}
          <Link
            to="/song/$id"
            params={{ id: song.id }}
            onClick={(e) => e.stopPropagation()}
            className={`font-medium truncate block hover:underline ${
              isCurrentSong ? "text-primary" : "text-foreground"
            }`}
          >
            {song.title}
          </Link>

          {/* Artist and album info */}
          <div>
            <p className="text-sm text-muted-foreground truncate">
              {song.artist}
              {song.album && ` • ${song.album}`}
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              {song.duration && <span>{formatDuration(song.duration)}</span>}
              {song.genre && song.duration && <span className="mx-1">•</span>}
              {song.genre && <span className="capitalize">{song.genre}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(song.id);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
}
