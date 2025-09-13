import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Code,
  Edit3,
  Home,
  Calendar,
  Copy,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Trash2,
  Heart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Page } from "~/components/Page";
import { Button } from "~/components/ui/button";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { SoundComments } from "~/components/SoundComments";
import { SoundTags } from "~/components/SoundTags";
import { getSoundByIdQuery } from "~/queries/sounds";
import { getSoundHeartStatusQuery } from "~/queries/sound-hearts";
import { authClient } from "~/lib/auth-client";
import { openInStrudel } from "~/utils/strudel";
import { StrudelIframe } from "~/components/StrudelIframe";
import { useDeleteSound } from "~/hooks/useSounds";
import { useSoundHeartManagement } from "~/hooks/useSoundHearts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export const Route = createFileRoute("/sounds/$id/")({
  loader: ({ context: { queryClient }, params: { id } }) => {
    queryClient.ensureQueryData(getSoundByIdQuery(id));
    // Optionally preload heart status - this will only work if user is authenticated
    // but won't break if they're not since the query will be disabled
    queryClient.prefetchQuery(getSoundHeartStatusQuery(id));
  },
  component: SoundDetail,
});

function SoundDetail() {
  const { id } = Route.useParams();
  const { data: sound, isLoading, error } = useQuery(getSoundByIdQuery(id));
  const [isCopying, setIsCopying] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteSoundMutation = useDeleteSound(true); // Enable redirect after delete

  // Get current user session to check if user can edit
  const { data: session } = authClient.useSession();

  // Heart management
  const {
    heartStatus,
    heartCount,
    toggleHeart,
    isLoading: heartLoading,
  } = useSoundHeartManagement(id);

  const handleCopyCode = async () => {
    if (!sound?.strudelCode) return;

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(sound.strudelCode);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code to clipboard");
    } finally {
      setIsCopying(false);
    }
  };

  const handlePlayInStrudel = () => {
    if (!sound?.strudelCode) return;
    openInStrudel(sound.strudelCode);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sound) return;

    try {
      await deleteSoundMutation.mutateAsync(sound.id);
      setDeleteDialogOpen(false);
      // Navigation to my-sounds will happen automatically via the hook
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleHeartToggle = () => {
    if (!session) {
      toast.error("You must be signed in to like sounds");
      return;
    }
    toggleHeart.mutate(id);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Page>
    );
  }

  if (error || !sound) {
    return (
      <Page>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Sound Not Found
          </h1>
          <p className="text-muted-foreground">
            The sound you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/my-sounds">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Sounds
            </Link>
          </Button>
        </div>
      </Page>
    );
  }

  // Check if current user can edit this sound
  const canEdit = session?.user?.id === sound.userId;

  const breadcrumbItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "My Sounds", href: "/my-sounds", icon: Code },
    { label: sound.title },
  ];

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={breadcrumbItems} />

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{sound.title}</h1>
              <div className="flex items-center gap-2">
                {/* Heart button - always visible if user is logged in */}
                {session && (
                  <Button
                    variant={
                      heartStatus?.data?.isHearted ? "default" : "outline"
                    }
                    onClick={handleHeartToggle}
                    disabled={heartLoading || toggleHeart.isPending}
                    className="flex items-center gap-2"
                  >
                    {toggleHeart.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart
                        className={`h-4 w-4 ${
                          heartStatus?.data?.isHearted ? "fill-current" : ""
                        }`}
                      />
                    )}
                    {heartCount?.data?.heartCount || 0}
                  </Button>
                )}

                {/* Edit/Delete buttons - only for owner */}
                {canEdit && (
                  <>
                    <Button asChild>
                      <Link
                        to="/sounds/$id/edit"
                        params={{ id: sound.id }}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteClick}
                      disabled={deleteSoundMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {deleteSoundMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {deleteSoundMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {formatDate(sound.createdAt)}
              </span>
              <span>•</span>
              <span>{sound.strudelCode.length} characters</span>
            </div>

            {/* Tags near title */}
            {sound.tags && sound.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Tags
                </h3>
                <SoundTags tags={sound.tags} />
              </div>
            )}
          </div>

          {/* Strudel Player */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Strudel Player</h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePlayInStrudel}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Studel.cc
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  disabled={isCopying}
                  className="flex items-center gap-2"
                >
                  {isCopying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {isCopying ? "Copying..." : "Copy Code"}
                </Button>
              </div>
            </div>

            <StrudelIframe 
              strudelCode={sound.strudelCode}
              title={sound.title}
              height="500px"
            />
          </div>

          {/* Comments Section */}
          <SoundComments soundId={id} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sound</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{sound.title}"? This action
              cannot be undone and will permanently remove your Strudel
              composition.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSoundMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSoundMutation.isPending}
            >
              {deleteSoundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Sound
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
