import type { Sound } from "~/db/schema";
import { Music as MusicIcon, ExternalLink, Eye } from "lucide-react";
import { formatRelativeTime } from "~/utils/song";
import { Link } from "@tanstack/react-router";
import { openInStrudel } from "~/utils/strudel";

interface SoundCardProps {
  sound: Sound & { tags: Array<{id: string, name: string}> };
}

export function SoundCard({ sound }: SoundCardProps) {
  const handlePlayClick = () => {
    openInStrudel(sound.strudelCode);
  };

  const soundSnippet = sound.strudelCode.length > 100
    ? sound.strudelCode.substring(0, 100) + "..."
    : sound.strudelCode;

  return (
    <article className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:border-border/60 transition-all duration-200 group">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
            <MusicIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {sound.title}
            </h3>
            <time
              className="text-xs text-muted-foreground"
              dateTime={new Date(sound.createdAt).toISOString()}
            >
              {formatRelativeTime(new Date(sound.createdAt).toISOString())}
            </time>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-xs font-mono text-muted-foreground leading-relaxed">
              {soundSnippet}
            </p>
          </div>

          {sound.tags && sound.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sound.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {tag.name}
                </span>
              ))}
              {sound.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                  +{sound.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Link
              to="/sounds/$id"
              params={{ id: sound.id }}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Link>
            <button
              onClick={handlePlayClick}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Play in Strudel
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}