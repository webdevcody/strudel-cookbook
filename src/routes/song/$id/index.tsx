import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Download,
  Loader2,
  Edit3,
  Plus,
  Check,
  Home,
  Music,
  Heart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Page } from "~/components/Page";
import { Button } from "~/components/ui/button";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { getSongByIdQuery } from "~/queries/songs";
import { formatDuration, formatRelativeTime } from "~/utils/song";
import { useAudioUrl, useCoverImageUrl } from "~/hooks/useAudioStorage";
import { authClient } from "~/lib/auth-client";
import { usePlaylist } from "~/components/playlist-provider";
import { useSongBreadcrumbs } from "~/hooks/useSongBreadcrumbs";
import { useHeartStatus, useToggleHeart } from "~/hooks/useHearts";
import { SongPreviewPlayer } from "~/components/SongPreviewPlayer";

export const Route = createFileRoute("/song/$id/")({
  loader: ({ context: { queryClient }, params: { id } }) => {
    queryClient.ensureQueryData(getSongByIdQuery(id));
  },
  component: SongDetail,
});

function SongDetail() {
  const { id } = Route.useParams();
  const { data: song, isLoading, error } = useQuery(getSongByIdQuery(id));
  const [isDownloading, setIsDownloading] = useState(false);
  const { addToPlaylist, playlist } = usePlaylist();
  const breadcrumbItems = useSongBreadcrumbs(song?.title || "Song Details");

  // Get current user session to check if user can edit
  const { data: session } = authClient.useSession();

  // Use heart hooks
  const { data: heartStatus } = useHeartStatus(id, !!session?.user && !!song);
  const heartMutation = useToggleHeart();

  // Use audio storage hooks
  const { data: audioUrlData } = useAudioUrl(song?.audioKey || "", !!song?.audioKey);
  const { data: coverUrlData } = useCoverImageUrl(song?.coverImageKey || "", !!song?.coverImageKey);

  const displayAudioUrl = audioUrlData?.audioUrl;
  const displayCoverUrl = coverUrlData?.coverUrl;

  const handleDownload = async () => {
    if (!displayAudioUrl || !song) {
      toast.error("Audio file not available for download");
      return;
    }

    setIsDownloading(true);
    try {
      // Create a temporary anchor element to trigger download
      const response = await fetch(displayAudioUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Generate filename from song info
      const fileExtension =
        displayAudioUrl.split(".").pop()?.split("?")[0] || "mp3";
      const filename = `${song.artist} - ${song.title}.${fileExtension}`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }

      toast.success("Download started successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download the file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Page>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="aspect-square bg-muted rounded-lg mb-4 max-w-md mx-auto"></div>
            <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  if (error || !song) {
    return (
      <Page>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Song Not Found
          </h1>
          <p className="text-muted-foreground">
            The song you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </Page>
    );
  }

  // Check if current user can edit this song
  const canEdit = session?.user?.id === song.userId;

  // Check if song is already in playlist
  const isInPlaylist = song ? playlist.some((p) => p.id === song.id) : false;

  const handleAddToPlaylist = () => {
    if (!song || !displayAudioUrl) return;

    if (isInPlaylist) {
      toast.info("Song already in playlist");
      return;
    }

    addToPlaylist({
      ...song,
      audioUrl: displayAudioUrl,
      coverImageUrl: displayCoverUrl,
    });

    toast.success("Added to playlist");
  };

  const handleHeartToggle = () => {
    if (!session?.user) {
      toast.error("Please log in to favorite songs");
      return;
    }
    heartMutation.mutate(id);
  };

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={breadcrumbItems} />
        {/* New Layout: Image on left, Info on right taking full width */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Album Art - Smaller and on the left */}
          <div className="lg:w-80 space-y-6">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {displayCoverUrl ? (
                <img
                  src={displayCoverUrl}
                  alt={`${song.title} cover art`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <Play className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Add to Playlist Button */}
            <div className="space-y-4">
              <Button
                size="lg"
                onClick={handleAddToPlaylist}
                disabled={!song || !displayAudioUrl}
                className="w-full"
                variant={isInPlaylist ? "outline" : "default"}
              >
                {isInPlaylist ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    In Playlist
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Add to Playlist
                  </>
                )}
              </Button>
              
              {/* Heart Button - only show for authenticated users */}
              {session?.user && (
                <Button
                  size="lg"
                  onClick={handleHeartToggle}
                  disabled={heartMutation.isPending}
                  className="w-full"
                  variant={heartStatus?.isHearted ? "default" : "outline"}
                >
                  {heartMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {heartStatus?.isHearted ? "Removing..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <Heart 
                        className={`h-5 w-5 mr-2 ${
                          heartStatus?.isHearted ? "fill-current" : ""
                        }`} 
                      />
                      {heartStatus?.isHearted ? "Hearted" : "Heart"}
                      {heartStatus?.heartCount > 0 && (
                        <span className="ml-2 text-sm">
                          ({heartStatus.heartCount})
                        </span>
                      )}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Song Info - Full width on the right */}
          <div className="flex-1 space-y-6">
            <div>
              {/* Title with Edit and Download Buttons inline */}
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-bold">{song.title}</h1>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading || !displayAudioUrl}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                  {canEdit && (
                    <Button asChild variant="outline" size="sm">
                      <Link 
                        to={`/song/${id}/edit`}
                        state={{ from: breadcrumbItems.length > 0 && breadcrumbItems[0].href === '/my-songs' ? '/my-songs' : undefined }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xl text-muted-foreground mb-4">
                by {song.artist}
              </p>

              {song.album && (
                <p className="text-lg text-muted-foreground mb-4">
                  Album: {song.album}
                </p>
              )}

              {song.genre && (
                <p className="text-md text-muted-foreground mb-4">
                  Genre: {song.genre}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{song.playCount.toLocaleString()} plays</span>
                <span>•</span>
                <span>
                  {formatRelativeTime(new Date(song.createdAt).toISOString())}
                </span>
                <span>•</span>
                <span className="capitalize">{song.status}</span>
                {song.duration && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(song.duration)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Song Preview Player */}
            {displayAudioUrl && (
              <div className="max-w-md">
                <SongPreviewPlayer
                  audioUrl={displayAudioUrl}
                  title={song.title}
                  artist={song.artist}
                  coverUrl={displayCoverUrl}
                />
              </div>
            )}

            {song.description && (
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold mb-2">About this song</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {song.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
