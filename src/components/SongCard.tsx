import type { Song } from "~/db/schema";
import { Music as MusicIcon, Play } from "lucide-react";
import { formatDuration, formatRelativeTime } from "~/utils/song";
// Temporary imports for complex loading logic - to be refactored later
import { getAudioUrlFn, getCoverImageUrlFn } from "~/fn/audio-storage";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

interface SongCardProps {
  song: Song;
}

export function SongCard({ song }: SongCardProps) {
  
  // Get the actual URLs from S3 keys
  const { data: audioUrlData } = useQuery({
    queryKey: ['audio-url', song.audioKey || 'no-key'],
    queryFn: () => {
      if (!song.audioKey) return Promise.resolve(null);
      return getAudioUrlFn({ data: { audioKey: song.audioKey } });
    },
  });
  
  const { data: coverUrlData } = useQuery({
    queryKey: ['cover-url', song.coverImageKey || 'no-key'],
    queryFn: () => {
      if (!song.coverImageKey) return Promise.resolve(null);
      return getCoverImageUrlFn({ data: { coverKey: song.coverImageKey } });
    },
  });

  const displayAudioUrl = audioUrlData?.audioUrl;
  const displayCoverUrl = coverUrlData?.coverUrl;

  return (
    <article className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:border-border/60 transition-all duration-200 group">
      <Link 
        to="/song/$id"
        params={{ id: song.id }}
        className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
        aria-label={`Listen to ${song.title} by ${song.artist} - ${song.playCount.toLocaleString()} plays, uploaded ${formatRelativeTime(new Date(song.createdAt).toISOString())}`}
      >
        <div className="aspect-square bg-muted relative overflow-hidden">
          {displayCoverUrl ? (
            <img
              src={displayCoverUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <MusicIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          {song.duration && (
            <span className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-md font-medium border border-border/20">
              {formatDuration(song.duration)}
            </span>
          )}
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {song.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            by {song.artist}
          </p>
          {song.album && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              Album: {song.album}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {song.playCount.toLocaleString()} plays
            </span>
            <time dateTime={new Date(song.createdAt).toISOString()}>
              {formatRelativeTime(new Date(song.createdAt).toISOString())}
            </time>
          </div>
        </div>
      </Link>
    </article>
  );
}