import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquare,
  Edit,
  Trash2,
  Save,
  X,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { useAvatarUrl } from "~/hooks/useAvatarUrl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { getSoundCommentsQuery } from "~/queries/sound-comments";
import {
  useCreateSoundComment,
  useUpdateSoundComment,
  useDeleteSoundComment,
} from "~/hooks/useSoundComments";
import { authClient } from "~/lib/auth-client";

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface SoundCommentsProps {
  soundId: string;
}

interface CommentAvatarProps {
  imageKey: string | null | undefined;
  userName: string;
  getUserInitials: (name: string) => string;
}

function CommentAvatar({ imageKey, userName, getUserInitials }: CommentAvatarProps) {
  const { avatarUrl } = useAvatarUrl(imageKey);

  return (
    <Avatar>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={userName} />
      ) : (
        <AvatarFallback>
          {userName ? getUserInitials(userName) : <User className="h-4 w-4" />}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export function SoundComments({ soundId }: SoundCommentsProps) {
  const { data: session } = authClient.useSession();
  const { data: comments = [], isLoading } = useQuery(
    getSoundCommentsQuery(soundId)
  );
  const createCommentMutation = useCreateSoundComment(soundId);

  // Create comment form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmitComment = async (data: CommentFormData) => {
    await createCommentMutation.mutateAsync({
      content: data.content,
      soundId,
    });
    reset();
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form - only show for authenticated users */}
      {session?.user && (
        <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-4">
          <div className="flex gap-3">
            <div className="mt-1">
              <CommentAvatar 
                imageKey={session.user.image} 
                userName={session.user.name} 
                getUserInitials={getUserInitials}
              />
            </div>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Write a comment..."
                {...register("content")}
                className="min-h-[80px]"
              />
              {errors.content && (
                <p className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={createCommentMutation.isPending}
                >
                  {createCommentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Comment"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              soundId={soundId}
              currentUserId={session?.user?.id}
              formatDate={formatDate}
              getUserInitials={getUserInitials}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: any; // TODO: Type this properly based on your comment query return type
  soundId: string;
  currentUserId?: string;
  formatDate: (date: Date | string) => string;
  getUserInitials: (name: string) => string;
}

function CommentItem({
  comment,
  soundId,
  currentUserId,
  formatDate,
  getUserInitials,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateCommentMutation = useUpdateSoundComment(soundId);
  const deleteCommentMutation = useDeleteSoundComment(soundId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: comment.content,
    },
  });

  const canEdit = currentUserId === comment.userId;

  const onSubmitEdit = async (data: CommentFormData) => {
    await updateCommentMutation.mutateAsync({
      id: comment.id,
      content: data.content,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    reset({ content: comment.content });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteCommentMutation.mutateAsync(comment.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex gap-3 p-4 rounded-lg border bg-card">
        <CommentAvatar 
          imageKey={comment.user?.image} 
          userName={comment.user?.name || "User"} 
          getUserInitials={getUserInitials}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {comment.user?.name || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
                {comment.updatedAt !== comment.createdAt && " (edited)"}
              </span>
            </div>
            {canEdit && !isEditing && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-3">
              <Textarea
                {...register("content")}
                className="min-h-[60px]"
              />
              {errors.content && (
                <p className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateCommentMutation.isPending}
                >
                  {updateCommentMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteCommentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Comment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}