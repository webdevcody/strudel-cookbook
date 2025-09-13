import { Link } from "@tanstack/react-router";
import { Badge } from "~/components/ui/badge";

interface SoundTagsProps {
  tags: Array<{ id: string; name: string }>;
  className?: string;
}

export function SoundTags({ tags, className }: SoundTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            to="/browse"
            search={{ tag: tag.name }}
            className="inline-block"
          >
            <Badge 
              variant="secondary" 
              className="text-xs hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              {tag.name}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}