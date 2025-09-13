import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { TagInput } from "~/components/ui/tag-input";
import { getTagSuggestionsFn } from "~/fn/sounds";

interface SoundsSearchProps {
  onTitleSearch: (query: string) => void;
  onTagsChange: (tags: string[]) => void;
  titleQuery: string;
  selectedTags: string[];
  onClearAll: () => void;
}

export function SoundsSearch({
  onTitleSearch,
  onTagsChange,
  titleQuery,
  selectedTags,
  onClearAll,
}: SoundsSearchProps) {
  const [titleInput, setTitleInput] = useState(titleQuery);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onTitleSearch(titleInput.trim());
    }
  };

  const handleTitleClear = () => {
    setTitleInput("");
    onTitleSearch("");
  };

  const loadTagSuggestions = async (searchTerm: string): Promise<string[]> => {
    try {
      const tags = await getTagSuggestionsFn({ data: { query: searchTerm } });
      return tags?.map((tag: any) => tag.name) || [];
    } catch (error) {
      console.error("Failed to load tag suggestions:", error);
      return [];
    }
  };

  const hasActiveFilters = titleQuery.trim() || selectedTags.length > 0;

  return (
    <div className="space-y-6 bg-background border rounded-lg p-6 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Search & Filter</h3>
        <p className="text-sm text-muted-foreground">
          Find sounds by title or browse by tags
        </p>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="w-full mt-3"
          >
            <X className="h-4 w-4 mr-2" />
            Clear all filters
          </Button>
        )}
      </div>

      {/* Title Search */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search by title</label>
          <p className="text-xs text-muted-foreground">
            Find sounds by searching titles
          </p>
        </div>
        <form onSubmit={handleTitleSubmit} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter sound title..."
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="pl-9"
            />
            {titleInput && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={handleTitleClear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Button type="submit" disabled={!titleInput.trim()} className="w-full">
            Search Sounds
          </Button>
        </form>
        {titleQuery && (
          <div className="p-3 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium">Current search:</p>
                <p className="text-sm">"{titleQuery}"</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tag Filter */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by tags</label>
          <p className="text-xs text-muted-foreground">
            Browse sounds by their associated tags
          </p>
        </div>
        <TagInput
          value={selectedTags}
          onChange={onTagsChange}
          placeholder="Select tags to filter..."
          onLoadSuggestions={loadTagSuggestions}
        />
      </div>
    </div>
  );
}