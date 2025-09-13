import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreatePlaylist } from "~/hooks/usePlaylists";
import { usePlaylist } from "~/components/playlist-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { toast } from "sonner";
import { PlaylistLimitDialog } from "~/components/PlaylistLimitDialog";

interface CreatePlaylistFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

interface CreatePlaylistDialogProps {
  onPlaylistCreated?: (playlistId: string, playlistName: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreatePlaylistDialog({
  onPlaylistCreated,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: CreatePlaylistDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [limitErrorOpen, setLimitErrorOpen] = useState(false);
  const [errorType, setErrorType] = useState<"PLAYLIST_LIMIT_FREE" | "PLAYLIST_LIMIT_BASIC" | "SUBSCRIPTION_EXPIRED">("PLAYLIST_LIMIT_FREE");
  const createPlaylistMutation = useCreatePlaylist();
  const { loadSavedPlaylist, clearPlaylist, setSelectedPlaylist } =
    usePlaylist();

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen || setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlaylistFormData>({
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  const onSubmit = (data: CreatePlaylistFormData) => {
    createPlaylistMutation.mutate(data, {
      onSuccess: (newPlaylist) => {
        // Additional success handling beyond the hook's default behavior
        // Clear current songs as per requirement
        clearPlaylist();

        // Set as selected playlist for future song additions
        setSelectedPlaylist(newPlaylist.id, newPlaylist.name);

        // Load it as the active playlist (empty initially)
        loadSavedPlaylist(newPlaylist.id, newPlaylist.name, []);

        // Call callback if provided (for PlaylistSheet to update local state)
        onPlaylistCreated?.(newPlaylist.id, newPlaylist.name);

        setOpen(false);
        reset();
      },
      onError: (error: Error) => {
        const errorMessage = error.message;
        
        if (errorMessage === "PLAYLIST_LIMIT_FREE" || 
            errorMessage === "PLAYLIST_LIMIT_BASIC" || 
            errorMessage === "SUBSCRIPTION_EXPIRED") {
          setErrorType(errorMessage);
          setLimitErrorOpen(true);
          setOpen(false);
        }
        // Hook already handles the general error toast, so we don't need to duplicate it
      },
    });
  };

  const isPublicChecked = watch("isPublic");

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        {!trigger && !controlledOpen && (
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Playlist"
                {...register("name", {
                  required: "Playlist name is required",
                  minLength: {
                    value: 1,
                    message: "Name must be at least 1 character",
                  },
                  maxLength: {
                    value: 100,
                    message: "Name must be less than 100 characters",
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="A collection of my favorite songs..."
                rows={3}
                {...register("description", {
                  maxLength: {
                    value: 500,
                    message: "Description must be less than 500 characters",
                  },
                })}
              />
              {errors.description && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={isPublicChecked}
                onCheckedChange={(checked) => setValue("isPublic", !!checked)}
              />
              <Label htmlFor="isPublic" className="text-sm">
                Make this playlist public
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createPlaylistMutation.isPending}
                className="flex-1"
              >
                {isSubmitting || createPlaylistMutation.isPending
                  ? "Creating..."
                  : "Create Playlist"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <PlaylistLimitDialog
        open={limitErrorOpen}
        onOpenChange={setLimitErrorOpen}
        errorType={errorType}
      />
    </>
  );
}
