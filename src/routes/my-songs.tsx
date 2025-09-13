import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Music,
  Plus,
  Trash2,
  Edit,
  Play,
  MoreVertical,
  Upload,
  Home,
} from "lucide-react";
import { SongGridSkeleton } from "~/components/SongGridSkeleton";
import { EmptyState } from "~/components/EmptyState";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { getUserSongsQuery } from "~/queries/songs";
import { useDeleteSong } from "~/hooks/useSongs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export const Route = createFileRoute("/my-songs")({
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.ensureQueryData(getUserSongsQuery());
  },
  component: MySongs,
});

function MySongs() {
  const { data: songs, isLoading } = useQuery(getUserSongsQuery());
  const deleteSongMutation = useDeleteSong();

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${songTitle}"? This action cannot be undone.`
    );
    if (confirmed) {
      try {
        await deleteSongMutation.mutateAsync(songId);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: {
        label: "Public",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      private: {
        label: "Private",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      },
      unlisted: {
        label: "Unlisted",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      processing: {
        label: "Processing",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.private;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={[{ label: "My Songs", icon: Music }]} />
        <div className="flex items-center justify-between">
          <PageTitle
            title="My Songs"
            description="Manage your uploaded music collection"
          />
          <Button asChild>
            <Link to="/upload" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload New Song
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <SongGridSkeleton count={6} />
        ) : songs && songs.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {songs.length} {songs.length === 1 ? "song" : "songs"} in your
                library
              </p>
            </div>

            <div className="grid gap-4">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="group relative bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Cover Image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {song.coverImageUrl ? (
                        <img
                          src={song.coverImageUrl}
                          alt={`${song.title} cover`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {song.title}
                        </h3>
                        {getStatusBadge(song.status)}
                      </div>
                      <p className="text-muted-foreground truncate mb-1">
                        by {song.artist}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDuration(song.duration)}</span>
                        <span>•</span>
                        <span>{song.playCount} plays</span>
                        {song.album && (
                          <>
                            <span>•</span>
                            <span>{song.album}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link 
                          to={`/song/${song.id}`}
                          state={{ from: '/my-songs' }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link 
                              to={`/song/${song.id}/edit`}
                              state={{ from: '/my-songs' }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteSong(song.id, song.title)
                            }
                            className="text-destructive focus:text-destructive"
                            disabled={deleteSongMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleteSongMutation.isPending
                              ? "Deleting..."
                              : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Music className="h-12 w-12 text-primary/60" />}
            title="No songs yet"
            description="You haven't uploaded any songs to your library. Start building your music collection by uploading your first track."
            actionLabel="Upload Your First Song"
            onAction={() => {}}
            customAction={
              <Button asChild>
                <Link to="/upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Your First Song
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </Page>
  );
}
