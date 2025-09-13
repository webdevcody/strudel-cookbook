import type { Playlist } from "~/db/schema";
import { Music as MusicIcon, Users, Lock, Play, Volume2 } from "lucide-react";
import { formatRelativeTime } from "~/utils/song";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { usePlaylist } from "~/components/playlist-provider";

interface PlaylistCardProps {
  playlist: Playlist & { songCount?: number };
  onPlayClick?: (playlistId: string) => void;
}

export function PlaylistCard({ playlist, onPlayClick }: PlaylistCardProps) {
  const { currentPlaylistId, isPlaying } = usePlaylist();
  const isCurrentPlaylist = currentPlaylistId === playlist.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPlayClick?.(playlist.id);
  };

  return (
    <div className="relative group">
      <Link
        to="/playlists/$id"
        params={{ id: playlist.id }}
        className="block"
      >
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 overflow-hidden ${
          isCurrentPlaylist
            ? "border-primary shadow-lg ring-2 ring-primary/20"
            : "border-gray-200 dark:border-gray-700 hover:shadow-lg"
        }`}>
          <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {playlist.name}
              </h3>
              {playlist.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {playlist.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              {isCurrentPlaylist && isPlaying && (
                <Badge variant="default" className="text-xs bg-green-500">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Playing
                </Badge>
              )}
              {playlist.isPublic ? (
                <Badge variant="secondary" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MusicIcon className="w-4 h-4" />
                {playlist.songCount || 0} songs
              </span>
            </div>
            <span>
              {formatRelativeTime(playlist.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
    
    {/* Play Button Overlay */}
    {onPlayClick && (
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 rounded-lg">
        <Button
          onClick={handlePlayClick}
          size="lg"
          className="bg-white/90 hover:bg-white text-black shadow-lg"
        >
          <Play className="w-5 h-5 mr-2" fill="currentColor" />
          Play
        </Button>
      </div>
    )}
  </div>
  );
}