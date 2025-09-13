import { createFileRoute, Link } from "@tanstack/react-router";
import { CreatePlaylistDialog } from "~/components/CreatePlaylistDialog";
import { EditPlaylistDialog } from "~/components/EditPlaylistDialog";
import { usePlaylist, toPlaylistSong } from "~/components/playlist-provider";
import {
  usePlaylists,
  usePlaylistById,
  useDeletePlaylist,
  useLoadPlaylistWithUrls,
  useReorderPlaylistSongs,
} from "~/hooks/usePlaylists";
import { useMutation } from "@tanstack/react-query";
import {
  Music,
  Plus,
  Play,
  Volume2,
  Pencil,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Clock,
  Calendar,
  Heart,
  GripVertical,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { getCoverImageUrlFn } from "~/fn/audio-storage";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/playlists")({
  component: PlaylistsPage,
});

type SortOption = "name" | "created" | "songs" | "recent";
type FilterOption = "all" | "favorites" | "recent";

function PlaylistsPage() {
  const {
    loadSavedPlaylist,
    showPlayer,
    currentPlaylistId,
    isPlaying,
    currentSong,
  } = usePlaylist();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [playlistCovers, setPlaylistCovers] = useState<Record<string, string>>({});
  const [optimisticSongs, setOptimisticSongs] = useState<any[] | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Use playlist hooks
  const { data: allPlaylists = [], isLoading, error } = usePlaylists();

  // Filter and sort playlists
  const playlists = useMemo(() => {
    let filtered = allPlaylists;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((playlist) =>
        playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (playlist.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter (placeholder - can be extended)
    if (filterBy === "recent") {
      // Sort by last played/modified date if available
      filtered = filtered.slice().sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Apply sorting
    filtered = filtered.slice().sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "songs":
          return (b.songCount || 0) - (a.songCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allPlaylists, searchQuery, sortBy, filterBy]);

  // Get selected playlist with songs
  const { data: selectedPlaylist, isLoading: isLoadingPlaylist } =
    usePlaylistById(selectedPlaylistId || "", !!selectedPlaylistId);

  // Use delete playlist hook
  const deletePlaylistMutation = useDeletePlaylist();

  // Use load playlist hook
  const loadPlaylistMutation = useLoadPlaylistWithUrls();

  // Use reorder playlist songs hook
  const reorderSongsMutation = useReorderPlaylistSongs();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePlayClick = (playlistId: string) => {
    loadPlaylistMutation.mutate({ data: { id: playlistId } }, {
      onSuccess: ({ playlist, songsWithUrls }) => {
        if (songsWithUrls.length === 0) {
          toast.info("This playlist is empty");
          return;
        }

        // Convert songs to PlaylistSong format
        const playlistSongs = songsWithUrls.map(song => toPlaylistSong(song));

        loadSavedPlaylist(playlist.id, playlist.name, playlistSongs);
        showPlayer(); // Show the music player
        toast.success(`Now playing "${playlist.name}"`);
      }
    });
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
  };

  const handleDeletePlaylist = () => {
    if (selectedPlaylistId) {
      deletePlaylistMutation.mutate(selectedPlaylistId, {
        onSuccess: () => {
          // Clear selected playlist if it was the one deleted
          setSelectedPlaylistId(null);
          setDeleteDialogOpen(false);
        },
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalDuration = (songs: any[]) => {
    return songs.reduce((total, song) => total + (song.duration || 0), 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Load cover images for playlists
  useEffect(() => {
    const loadPlaylistCovers = async () => {
      const covers: Record<string, string> = {};
      for (const playlist of allPlaylists) {
        if (playlist.firstSongCoverKey) {
          try {
            const result = await getCoverImageUrlFn({ data: { coverKey: playlist.firstSongCoverKey } });
            if (result?.coverUrl) {
              covers[playlist.id] = result.coverUrl;
            }
          } catch (error) {
            console.warn(`Failed to load cover for playlist ${playlist.id}:`, error);
          }
        }
      }
      setPlaylistCovers(covers);
    };

    if (allPlaylists.length > 0) {
      loadPlaylistCovers();
    }
  }, [allPlaylists]);

  // Reset optimistic songs when playlist changes
  useEffect(() => {
    setOptimisticSongs(null);
  }, [selectedPlaylistId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !selectedPlaylist) return;

    const activeIndex = selectedPlaylist.songs.findIndex(song => song.id === active.id);
    const overIndex = selectedPlaylist.songs.findIndex(song => song.id === over.id);

    if (activeIndex !== overIndex) {
      const currentSongs = optimisticSongs || selectedPlaylist.songs;
      const newSongs = arrayMove(currentSongs, activeIndex, overIndex);
      
      // Optimistic update
      setOptimisticSongs(newSongs);

      // Create song orders with 1-based positions
      const songOrders = newSongs.map((song, index) => ({
        songId: song.id,
        position: index + 1,
      }));

      // Persist to database
      reorderSongsMutation.mutate(
        { playlistId: selectedPlaylist.id, songOrders },
        {
          onError: () => {
            // Revert optimistic update on error
            setOptimisticSongs(null);
          },
        }
      );
    }
  };

  const handlePlaySong = (songIndex: number) => {
    if (!selectedPlaylist || selectedPlaylist.songs.length === 0) return;

    loadPlaylistMutation.mutate({ data: { id: selectedPlaylist.id } }, {
      onSuccess: ({ playlist, songsWithUrls }) => {
        if (songsWithUrls.length === 0) {
          toast.info("This playlist is empty");
          return;
        }

        // Convert songs to PlaylistSong format
        const playlistSongs = songsWithUrls.map(song => toPlaylistSong(song));

        loadSavedPlaylist(
          playlist.id,
          playlist.name,
          playlistSongs,
          songIndex
        );
        showPlayer();
        toast.success(`Now playing "${songsWithUrls[songIndex].title}"`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Playlists</h1>
            <p className="text-muted-foreground mt-2">
              Organize your favorite songs into custom playlists
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive">
              Error loading playlists: {(error as Error).message}
            </p>
          </div>
        )}

        {allPlaylists.length > 0 ? (
          <div className="grid grid-cols-12 gap-6" style={{ height: 'calc(100vh - 12rem)' }}>
            {/* Left Column - Playlists */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-card rounded-lg border flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
                <div className="p-4 border-b space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-lg">Your Playlists</h2>
                      <p className="text-sm text-muted-foreground">
                        {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <CreatePlaylistDialog
                      trigger={
                        <Button size="sm" className="p-2">
                          <Plus className="w-4 h-4" />
                        </Button>
                      }
                    />
                  </div>
                  
                  {/* Search and Filter Controls */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search playlists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-8"
                      />
                      {searchQuery && (
                        <button
                          onClick={clearSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-4 h-4" />
                            Sort
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setSortBy("name")}>
                            {sortBy === "name" && "✓ "} Name
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("created")}>
                            {sortBy === "created" && "✓ "} Date Created
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("songs")}>
                            {sortBy === "songs" && "✓ "} Song Count
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="border rounded-lg p-3 animate-pulse"
                        >
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {playlists.map((playlist) => {
                        const songCount = playlist.songCount || 0;
                        const totalDuration = 0; // We don't have duration data in the main playlist list
                        const isCurrentlyPlaying = currentPlaylistId === playlist.id;
                        
                        return (
                          <div
                            key={playlist.id}
                            className={`group rounded-lg border mb-2 transition-all hover:border-primary/50 overflow-hidden cursor-pointer ${
                              selectedPlaylistId === playlist.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <button
                              onClick={() => handleSelectPlaylist(playlist.id)}
                              className="w-full text-left p-4 focus:outline-none"
                            >
                              <div className="flex items-start gap-3">
                                {/* Playlist Thumbnail */}
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {playlistCovers[playlist.id] ? (
                                    <img 
                                      src={playlistCovers[playlist.id]} 
                                      alt={`${playlist.name} cover`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center">
                                      <Music className="w-6 h-6 text-primary" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Playlist Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium truncate">
                                      {playlist.name}
                                    </h3>
                                    {isCurrentlyPlaying && isPlaying && (
                                      <Badge variant="default" className="text-xs bg-green-500 px-1.5 py-0.5">
                                        <Volume2 className="w-3 h-3" />
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Music className="w-3 h-3" />
                                      {songCount} song{songCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  
                                  {playlist.description && (
                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                      {playlist.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                            
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Songs */}
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-card rounded-lg border flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
                {selectedPlaylistId ? (
                  <>
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-semibold text-lg">
                            {selectedPlaylist?.name || "Loading..."}
                          </h2>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{selectedPlaylist?.songs?.length || 0} songs</span>
                            {selectedPlaylist && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Created {new Date(selectedPlaylist.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedPlaylist &&
                            selectedPlaylist.songs.length > 0 && (
                              <Button
                                onClick={() =>
                                  handlePlayClick(selectedPlaylistId)
                                }
                                className="gap-2"
                              >
                                <Play className="w-4 h-4" />
                                Play All
                              </Button>
                            )}
                          
                          {selectedPlaylist && (
                            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                  More
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditDialogOpen(true);
                                    setDropdownOpen(false);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit Playlist
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDeleteDialogOpen(true);
                                    setDropdownOpen(false);
                                  }}
                                  disabled={deletePlaylistMutation.isPending}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Playlist
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 p-4">
                      {isLoadingPlaylist ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div
                              key={i}
                              className="border rounded-lg p-4 animate-pulse"
                            >
                              <div className="aspect-square bg-muted rounded mb-3"></div>
                              <div className="h-4 bg-muted rounded mb-2"></div>
                              <div className="h-3 bg-muted rounded w-2/3"></div>
                            </div>
                          ))}
                        </div>
                      ) : selectedPlaylist?.songs.length ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={(optimisticSongs || selectedPlaylist.songs).map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-1">
                              {(optimisticSongs || selectedPlaylist.songs).map((song, index) => {
                                return (
                                  <SortableSongItem
                                    key={song.id}
                                    song={song}
                                    index={index}
                                    isCurrentlyPlaying={currentSong?.id === song.id}
                                    isPlaying={isPlaying}
                                    onPlaySong={handlePlaySong}
                                  />
                                );
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
// Songs are now handled by SortableSongItem component above
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                            <Music className="w-10 h-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            No songs in this playlist
                          </h3>
                          <p className="text-muted-foreground mb-6 max-w-sm">
                            Add some songs to get started. You can browse songs and add them to your playlist.
                          </p>
                          <div className="flex gap-3">
                            <Link to="/browse">
                              <Button variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Browse Songs
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Music className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Select a Playlist
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-sm">
                        Choose a playlist from the left to view and manage its songs
                      </p>
                      {playlists.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          💡 Tip: Use search to quickly find playlists
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded mb-3"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center mx-auto mb-8">
              <Music className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Create Your First Playlist</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Organize your favorite songs into custom playlists and enjoy your music your way.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto text-left">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Music className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Organize Music</h4>
                <p className="text-sm text-muted-foreground">Group your favorite songs by mood, genre, or any theme you like.</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Play className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Easy Playback</h4>
                <p className="text-sm text-muted-foreground">Play entire playlists or jump to specific songs instantly.</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Heart className="w-8 h-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Personal Touch</h4>
                <p className="text-sm text-muted-foreground">Add descriptions and customize your playlists to reflect your taste.</p>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-6 mb-8 max-w-md mx-auto">
              <h4 className="font-semibold mb-3">📋 Plan Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Plan:</span>
                  <span className="font-medium">Up to 5 playlists</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro Plan:</span>
                  <span className="font-medium text-primary">Unlimited playlists</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <CreatePlaylistDialog trigger={
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Playlist
                </Button>
              } />
              <Link to="/browse">
                <Button variant="outline" size="lg" className="gap-2">
                  <Search className="w-5 h-5" />
                  Browse Songs First
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Edit Playlist Dialog - Outside dropdown to prevent unmounting */}
        {selectedPlaylist && (
          <EditPlaylistDialog
            playlist={selectedPlaylist}
            trigger={
              <button
                ref={(ref) => {
                  if (editDialogOpen && ref) {
                    ref.click();
                    setEditDialogOpen(false);
                  }
                }}
                style={{ display: 'none' }}
              />
            }
          />
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Playlist</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedPlaylist?.name}"? This
                action cannot be undone and will permanently remove the playlist
                and all its songs.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deletePlaylistMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePlaylist}
                disabled={deletePlaylistMutation.isPending}
              >
                {deletePlaylistMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Sortable Song Item Component
interface SortableSongItemProps {
  song: any;
  index: number;
  isCurrentlyPlaying: boolean;
  isPlaying: boolean;
  onPlaySong: (index: number) => void;
}

function SortableSongItem({ song, index, isCurrentlyPlaying, isPlaying, onPlaySong }: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors group cursor-pointer ${
        isCurrentlyPlaying
          ? "bg-primary/10 hover:bg-primary/15"
          : "hover:bg-muted/50"
      }`}
      onClick={() => onPlaySong(index)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      {/* Track Number / Play Button */}
      <div className="w-8 flex items-center justify-center">
        <div className="w-8 text-sm text-muted-foreground group-hover:hidden">
          {isCurrentlyPlaying ? (
            <Volume2 className="w-4 h-4 text-primary" />
          ) : (
            index + 1
          )}
        </div>
        <Button
          size="sm"
          className="w-8 h-8 p-0 hidden group-hover:flex"
          onClick={(e) => {
            e.stopPropagation();
            onPlaySong(index);
          }}
        >
          <Play className="w-3 h-3" fill="currentColor" />
        </Button>
      </div>

      {/* Album Art */}
      <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
        {song.coverImageUrl ? (
          <img 
            src={song.coverImageUrl} 
            alt={`${song.title} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded flex items-center justify-center">
            <Music className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${
            isCurrentlyPlaying ? "text-primary" : ""
          }`}>
          {song.title}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {song.artist}
        </div>
      </div>

      {/* Album */}
      {song.album && (
        <div className="hidden md:block text-sm text-muted-foreground truncate max-w-32">
          {song.album}
        </div>
      )}

      {/* Actions and Duration */}
      <div className="flex items-center gap-3">
        {isCurrentlyPlaying && (
          <Badge variant="default" className="text-xs bg-primary px-2">
            <Volume2 className="w-3 h-3 mr-1" />
            {isPlaying ? "Playing" : "Paused"}
          </Badge>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Heart className="w-4 h-4 mr-2" />
              Add to Favorites
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => e.stopPropagation()}
              className="text-red-600 focus:text-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Remove from Playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {song.duration && (
          <div className="text-sm text-muted-foreground min-w-[3rem] text-right">
            {Math.floor(song.duration / 60)}:
            {(song.duration % 60).toString().padStart(2, "0")}
          </div>
        )}
      </div>
    </div>
  );
}