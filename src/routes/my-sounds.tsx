import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Code,
  Plus,
  Trash2,
  Edit,
  Eye,
  MoreVertical,
  Calendar,
  Loader2,
} from "lucide-react";
import { EmptyState } from "~/components/EmptyState";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { getUserSoundsQuery } from "~/queries/sounds";
import { useDeleteSound } from "~/hooks/useSounds";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export const Route = createFileRoute("/my-sounds")({
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.ensureQueryData(getUserSoundsQuery());
  },
  component: MySounds,
});

function MySounds() {
  const { data: sounds, isLoading } = useQuery(getUserSoundsQuery());
  const deleteSoundMutation = useDeleteSound();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [soundToDelete, setSoundToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleDeleteClick = (soundId: string, soundTitle: string) => {
    setSoundToDelete({ id: soundId, title: soundTitle });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!soundToDelete) return;

    try {
      await deleteSoundMutation.mutateAsync(soundToDelete.id);
      setDeleteDialogOpen(false);
      setSoundToDelete(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

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
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-card border rounded-lg p-6 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-6 bg-muted rounded w-48 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-32"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 w-16 bg-muted rounded"></div>
                    <div className="h-9 w-9 bg-muted rounded"></div>
                  </div>
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

            <div className="grid gap-4">
              {sounds.map((sound) => (
                <div
                  key={sound.id}
                  className="group relative bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Code className="h-6 w-6 text-muted-foreground" />
                      </div>

                      {/* Sound Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg truncate">
                            {sound.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(sound.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{sound.strudelCode.length} characters</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/sounds/$id" params={{ id: sound.id }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              to="/sounds/$id/edit"
                              params={{ id: sound.id }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteClick(sound.id, sound.title)
                            }
                            className="text-destructive focus:text-destructive"
                            disabled={deleteSoundMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleteSoundMutation.isPending
                              ? "Deleting..."
                              : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sound</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{soundToDelete?.title}"? This
              action cannot be undone and will permanently remove your Strudel
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
