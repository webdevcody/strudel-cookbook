import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Code, User, Calendar, AudioWaveform, Settings } from "lucide-react";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { StrudelIframe } from "~/components/StrudelIframe";
import { EmptyState } from "~/components/EmptyState";
import { UserAvatar } from "~/components/UserAvatar";
import { getUserProfileQuery, getUserSoundsByIdQuery } from "~/queries/user";
import { useAvatarUrl } from "~/hooks/useAvatarUrl";
import { Link } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/profiles/$userId")({
  loader: ({ context, params }) => {
    const { queryClient } = context;
    queryClient.ensureQueryData(getUserProfileQuery(params.userId));
    queryClient.ensureQueryData(getUserSoundsByIdQuery(params.userId));
  },
  component: UserProfile,
});

function UserProfile() {
  const { userId } = Route.useParams();
  const { data: session } = authClient.useSession();
  const { data: user, isLoading: userLoading } = useQuery(getUserProfileQuery(userId));
  const { data: sounds, isLoading: soundsLoading } = useQuery(getUserSoundsByIdQuery(userId));
  const { avatarUrl } = useAvatarUrl(user?.image);
  
  const isOwnProfile = session?.user?.id === userId;

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const memberSince = user?.createdAt 
    ? formatDate(user.createdAt)
    : "Unknown";

  if (userLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse space-y-4 w-full max-w-4xl">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl p-6 space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-24 w-24 bg-muted rounded-full"></div>
                    <div className="h-6 bg-muted rounded w-32"></div>
                    <div className="h-4 bg-muted rounded w-48"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  if (!user) {
    return (
      <Page>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            User Not Found
          </h1>
          <p className="text-muted-foreground">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={[
          { label: "Profiles", href: "/", icon: User },
          { label: user.name || "User Profile" }
        ]} />
        
        <PageTitle
          title={`${user.name || "User"}'s Profile`}
          description="User profile and sound collection"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6 sticky top-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <UserAvatar
                  imageUrl={avatarUrl}
                  userName={user.name}
                  className="h-24 w-24"
                  fallbackClassName="text-2xl"
                />
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">
                    {user.name || "Anonymous User"}
                  </h2>
                </div>

                {isOwnProfile && (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Edit Settings
                    </Link>
                  </Button>
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
              <h3 className="text-lg font-semibold">{user.name || "User"}'s Sounds</h3>
              {sounds && sounds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {sounds.length} {sounds.length === 1 ? "sound" : "sounds"}
                </p>
              )}
            </div>

            {soundsLoading ? (
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
                description={`${user.name || "This user"} hasn't created any Strudel sounds yet.`}
              />
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}