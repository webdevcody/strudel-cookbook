import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Code,
  Plus,
} from "lucide-react";
import { EmptyState } from "~/components/EmptyState";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { getUserSoundsQuery } from "~/queries/sounds";

export const Route = createFileRoute("/my-sounds")({
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.ensureQueryData(getUserSoundsQuery());
  },
  component: MySounds,
});

function MySounds() {
  const { data: sounds, isLoading } = useQuery(getUserSoundsQuery());

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={[{ label: "My Sounds", icon: Code }]} />
        <div className="flex items-center justify-between">
          <PageTitle
            title="My Sounds"
            description="Manage your Strudel code snippets and compositions"
          />
          <Button asChild>
            <Link to="/sounds/create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Sound
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl shadow-sm border border-border overflow-hidden h-80 animate-pulse"
              >
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-md h-32"></div>
                  <div className="flex gap-1">
                    <div className="h-6 bg-muted rounded-full w-16"></div>
                    <div className="h-6 bg-muted rounded-full w-12"></div>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <div className="h-9 bg-muted rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sounds && sounds.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {sounds.length} {sounds.length === 1 ? "sound" : "sounds"} in
                your collection
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {sounds.map((sound) => (
                <Link
                  key={sound.id}
                  to="/sounds/$id"
                  params={{ id: sound.id }}
                  className="flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:border-border/60 transition-all duration-200 group h-80"
                >
                  <div className="p-4 space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <Code className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                          {sound.title}
                        </h3>
                        <time
                          className="text-xs text-muted-foreground"
                          dateTime={new Date(sound.createdAt).toISOString()}
                        >
                          {formatDate(sound.createdAt)}
                        </time>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-md p-3 relative group/code flex-1 flex flex-col min-h-0">
                      <div className="overflow-auto flex-1">
                        <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {sound.strudelCode}
                        </pre>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Code className="h-12 w-12 text-primary/60" />}
            title="No sounds yet"
            description="You haven't created any Strudel sounds yet. Start creating your musical compositions with code."
            actionLabel="Create Your First Sound"
            onAction={() => (window.location.href = "/sounds/create")}
          />
        )}
      </div>
    </Page>
  );
}
