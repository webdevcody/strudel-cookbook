import type { Sound } from "~/db/schema";
import { Music as MusicIcon, ExternalLink, Eye, Copy } from "lucide-react";
import { formatRelativeTime } from "~/utils/song";
import { Link } from "@tanstack/react-router";
import { openInStrudel } from "~/utils/strudel";
import { toast } from "sonner";

interface SoundCardProps {
  sound: Sound & { tags: Array<{id: string, name: string}> };
}

export function SoundCard({ sound }: SoundCardProps) {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openInStrudel(sound.strudelCode);
  };

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(sound.strudelCode);
      toast.success("Code copied to clipboard");
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast.error("Failed to copy code");
    }
  };


  return (
    <Link
      to="/sounds/$id"
      params={{ id: sound.id }}
      className="flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:border-border/60 transition-all duration-200 group h-80"
    >
      <div className="p-4 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center gap-3 flex-shrink-0">
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

        <div className="bg-muted/50 rounded-md p-3 relative group/code flex-1 flex flex-col min-h-0">
          <div className="overflow-auto flex-1 pr-8">
            <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {sound.strudelCode}
            </pre>
          </div>
          <button
            onClick={handleCopyCode}
            className="absolute top-2 right-2 p-1 rounded-md bg-background/80 hover:bg-background border border-border/50 hover:border-border transition-all opacity-0 group-hover/code:opacity-100"
            aria-label="Copy code to clipboard"
          >
            <Copy className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>

        {sound.tags && sound.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 flex-shrink-0">
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
      </div>

      <div className="p-4 pt-0 flex-shrink-0">
        <button
          onClick={handlePlayClick}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Play in Strudel
        </button>
      </div>
    </Link>
  );
}