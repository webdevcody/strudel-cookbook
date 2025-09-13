import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Music as MusicIcon, Home, Music } from "lucide-react";
import { SongCard } from "~/components/SongCard";
import { SongGridSkeleton } from "~/components/SongGridSkeleton";
import { EmptyState } from "~/components/EmptyState";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { getRecentSongsQuery, getPopularSongsQuery } from "~/queries/songs";

export const Route = createFileRoute("/browse")({
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.ensureQueryData(getRecentSongsQuery());
    queryClient.ensureQueryData(getPopularSongsQuery());
  },
  component: Browse,
});

function Browse() {
  const navigate = useNavigate();

  const { data: recentSongs, isLoading: isLoadingRecent } = useQuery(
    getRecentSongsQuery()
  );
  const { data: popularSongs, isLoading: isLoadingPopular } = useQuery(
    getPopularSongsQuery()
  );

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb
          items={[
            { label: "Home", href: "/", icon: Home },
            { label: "Browse", icon: Music },
          ]}
        />
        <PageTitle
          title="Browse Songs"
          description="Discover amazing music from our community"
        />

        <section className="space-y-6" aria-labelledby="popular-heading">
          {isLoadingPopular ? (
            <SongGridSkeleton count={5} />
          ) : popularSongs && popularSongs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {popularSongs.map((song) => (
                <SongCard key={song.id} song={song} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MusicIcon className="h-10 w-10 text-primary/60" />}
              title="No popular songs yet"
              description="Be the first to share amazing music with our community. Popular songs will appear here as they gain traction."
              actionLabel="Upload Your Song"
              onAction={() => {
                navigate({ to: "/upload" });
              }}
            />
          )}
        </section>
      </div>
    </Page>
  );
}
