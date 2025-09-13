import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdatePlaylist } from "~/hooks/usePlaylists";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { toast } from "sonner";
import type { Playlist } from "~/db/schema";

interface EditPlaylistFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

interface EditPlaylistDialogProps {
  playlist: Playlist;
  trigger: React.ReactNode;
  onPlaylistUpdated?: (playlist: Playlist) => void;
}

export function EditPlaylistDialog({
  playlist,
  trigger,
  onPlaylistUpdated,
}: EditPlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const updatePlaylistMutation = useUpdatePlaylist();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditPlaylistFormData>({
    defaultValues: {
      name: playlist.name,
      description: playlist.description || "",
      isPublic: playlist.isPublic,
    },
  });

  // Reset form when playlist changes or dialog opens
  useEffect(() => {
    if (open) {
      reset({
        name: playlist.name,
        description: playlist.description || "",
        isPublic: playlist.isPublic,
      });
    }
  }, [playlist, open, reset]);

  const onSubmit = (data: EditPlaylistFormData) => {
    updatePlaylistMutation.mutate({ 
      id: playlist.id, 
      ...data 
    }, {
      onSuccess: (updatedPlaylist) => {
        // Additional success handling beyond the hook's default behavior
        onPlaylistUpdated?.(updatedPlaylist);
        setOpen(false);
      },
    });
  };

  const isPublicChecked = watch("isPublic");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
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
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
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
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isPublic"
              checked={isPublicChecked}
              onCheckedChange={(checked) => setValue("isPublic", !!checked)}
            />
            <Label htmlFor="edit-isPublic" className="text-sm">
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
              disabled={isSubmitting || updatePlaylistMutation.isPending}
              className="flex-1"
            >
              {isSubmitting || updatePlaylistMutation.isPending
                ? "Updating..."
                : "Update Playlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}