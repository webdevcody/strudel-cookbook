import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Music as MusicIcon,
  Home,
  Music,
  X,
  Search,
  Filter,
} from "lucide-react";
import { z } from "zod";
import { SoundCard } from "~/components/SoundCard";
import { SongGridSkeleton } from "~/components/SongGridSkeleton";
import { EmptyState } from "~/components/EmptyState";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { SoundsSearch } from "~/components/SoundsSearch";
import {
  getRecentSoundsQuery,
  getSoundsByTagQuery,
  searchSoundsByTitleQuery,
} from "~/queries/sounds";

const browseSearchSchema = z.object({
  tag: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: browseSearchSchema,
  loader: async ({ context }) => {
    const { queryClient } = context;
    await queryClient.ensureQueryData(getRecentSoundsQuery());
  },
  component: Browse,
});

function Browse() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const { data: recentSounds, isLoading: isLoadingRecent } = useQuery(
    getRecentSoundsQuery()
  );

  const { data: taggedSounds, isLoading: isLoadingTagged } = useQuery({
    ...getSoundsByTagQuery(search.tag || ""),
    enabled: !!search.tag && !search.title,
  });

  const { data: titleSearchSounds, isLoading: isLoadingTitleSearch } = useQuery(
    {
      ...searchSoundsByTitleQuery(search.title),
      enabled: !!search.title,
    }
  );

  const sounds = search.title
    ? titleSearchSounds
    : search.tag
      ? taggedSounds
      : recentSounds;

  const isLoading = search.title
    ? isLoadingTitleSearch
    : search.tag
      ? isLoadingTagged
      : isLoadingRecent;

  const handleTitleSearch = (query: string) => {
    navigate({
      to: "/browse",
      search: query ? { title: query } : {},
    });
  };

  const handleTagsChange = (tags: string[]) => {
    if (tags.length === 0) {
      navigate({ to: "/browse", search: {} });
    } else if (tags.length === 1) {
      navigate({ to: "/browse", search: { tag: tags[0] } });
    }
  };

  const handleClearAll = () => {
    navigate({ to: "/browse", search: {} });
  };

  const getPageTitle = () => {
    if (search.title) {
      return `Search results for "${search.title}"`;
    }
    if (search.tag) {
      return `Sounds tagged with "${search.tag}"`;
    }
    return "Browse Sounds";
  };

  const getPageDescription = () => {
    if (search.title) {
      return `Sounds matching "${search.title}"`;
    }
    if (search.tag) {
      return `Discover sounds tagged with "${search.tag}"`;
    }
    return "Discover amazing sounds from our community";
  };

  return (
    <Page>
      <div className="space-y-4">
        <AppBreadcrumb
          items={[
            { label: "Home", href: "/", icon: Home },
            { label: "Browse", icon: Music },
          ]}
        />

        <PageTitle
          title="Browse Sounds"
          description="Discover amazing sounds from our community"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        {/* Left Sidebar - Search Panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-4">
            <SoundsSearch
              onTitleSearch={handleTitleSearch}
              onTagsChange={handleTagsChange}
              titleQuery={search.title || ""}
              selectedTags={search.tag ? [search.tag] : []}
              onClearAll={handleClearAll}
            />
          </div>
        </div>

        {/* Right Content - Results */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6">
            {/* Active Filters Display */}
            {(search.tag || search.title) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b">
                <span className="text-sm text-muted-foreground font-medium">
                  Active filters:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {search.title && (
                    <Badge variant="outline" className="text-sm">
                      Title: "{search.title}"
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2 hover:bg-transparent"
                        onClick={() => handleTitleSearch("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {search.tag && (
                    <Badge variant="secondary" className="text-sm">
                      Tag: {search.tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2 hover:bg-transparent"
                        onClick={() => handleTagsChange([])}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Results Section */}
            <section aria-labelledby="sounds-heading">
              {isLoading ? (
                <SongGridSkeleton count={8} />
              ) : sounds && sounds.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                  {sounds.map((sound) => (
                    <SoundCard key={sound.id} sound={sound} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={
                    search.title ? (
                      <Search className="h-16 w-16 text-primary/40" />
                    ) : search.tag ? (
                      <Filter className="h-16 w-16 text-primary/40" />
                    ) : (
                      <MusicIcon className="h-16 w-16 text-primary/40" />
                    )
                  }
                  title={
                    search.title
                      ? `No sounds found for "${search.title}"`
                      : search.tag
                        ? `No sounds tagged with "${search.tag}"`
                        : "Ready to discover sounds?"
                  }
                  description={
                    search.title
                      ? "We couldn't find any sounds matching your search. Try different keywords, check for typos, or browse by tags."
                      : search.tag
                        ? `No sounds have been tagged with "${search.tag}" yet. Try browsing other tags or be the first to create a sound with this tag.`
                        : "Use the search panel on the left to find sounds by title or explore different tags. Start your musical journey here!"
                  }
                  actionLabel={
                    search.title || search.tag
                      ? "Clear Search"
                      : "Upload Your Sound"
                  }
                  onAction={() => {
                    if (search.title || search.tag) {
                      handleClearAll();
                    } else {
                      navigate({ to: "/upload" });
                    }
                  }}
                />
              )}
            </section>
          </div>
        </div>
      </div>
    </Page>
  );
}
