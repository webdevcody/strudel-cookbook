import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Code, User, Calendar, AudioWaveform } from "lucide-react";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { getUserSoundsQuery } from "~/queries/sounds";
import { StrudelIframe } from "~/components/StrudelIframe";
import { authClient } from "~/lib/auth-client";
import { useUserAvatar } from "~/hooks/useUserAvatar";
import { EmptyState } from "~/components/EmptyState";
import { PlanBadge } from "~/components/PlanBadge";

export const Route = createFileRoute("/profile")({
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.ensureQueryData(getUserSoundsQuery());
  },
  component: Profile,
});

function Profile() {
  const { data: session } = authClient.useSession();
  const { data: sounds, isLoading } = useQuery(getUserSoundsQuery());
  const { avatarUrl } = useUserAvatar();

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const memberSince = (session?.user as any)?.createdAt 
    ? formatDate((session?.user as any).createdAt)
    : "Unknown";

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={[{ label: "Profile", icon: User }]} />
        
        <PageTitle
          title="Profile"
          description="Your profile and sound collection"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6 sticky top-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-2xl">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || (
                      <User className="h-8 w-8" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {session?.user?.name || "Anonymous User"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>

                {(session?.user as any)?.plan && (
                  <PlanBadge plan={(session?.user as any).plan} />
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Member since {memberSince}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {sounds?.length || 0} sound{sounds?.length !== 1 ? 's' : ''} created
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <AudioWaveform className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    SoundStation Creator
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - User's Sounds */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">My Sounds</h3>
              {sounds && sounds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {sounds.length} {sounds.length === 1 ? "sound" : "sounds"}
                </p>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-xl shadow-sm border border-border overflow-hidden h-64 animate-pulse"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-md h-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sounds && sounds.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {sounds.map((sound) => (
                  <Link
                    key={sound.id}
                    to="/sounds/$id"
                    params={{ id: sound.id }}
                    className="flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg hover:border-border/60 transition-all duration-200 group h-64"
                  >
                    <div className="p-4 space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                          <Code className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {sound.title}
                          </h4>
                          <time
                            className="text-xs text-muted-foreground"
                            dateTime={new Date(sound.createdAt).toISOString()}
                          >
                            {formatDate(sound.createdAt)}
                          </time>
                        </div>
                      </div>

                      <div className="relative flex-1 flex flex-col min-h-0 rounded-md overflow-hidden">
                        <StrudelIframe 
                          strudelCode={sound.strudelCode}
                          title={sound.title}
                          className="w-full flex-1 min-h-[140px]"
                          height="100%"
                        />
                      </div>
                    </div>
                  </Link>
                ))}
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
        </div>
      </div>
    </Page>
  );
}