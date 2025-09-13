import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Image, Loader2, Save, ArrowLeft, Home, Search, Music, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FileUpload } from "~/components/ui/file-upload";
import { getSongByIdQuery } from "~/queries/songs";
import { useCoverImageUrl } from "~/hooks/useAudioStorage";
import { useUpdateSong } from "~/hooks/useSongs";
import {
  uploadCoverImageWithPresignedUrl,
  uploadAudioWithPresignedUrl,
  UploadProgress,
} from "~/utils/storage/audio-helpers";
import { authClient } from "~/lib/auth-client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { Link } from "@tanstack/react-router";
import { useSongBreadcrumbs } from "~/hooks/useSongBreadcrumbs";
import { useDeleteSong } from "~/hooks/useSongs";

// Component to display current cover image with presigned URL
function CoverImageDisplay({ 
  coverImageKey, 
  onImageSelect, 
  disabled 
}: { 
  coverImageKey: string;
  onImageSelect: (files: File[]) => void;
  disabled: boolean;
}) {
  const { data: coverUrlData } = useCoverImageUrl(coverImageKey, !!coverImageKey);

  return (
    <div className="relative">
      <div className="w-48 h-48 rounded-lg overflow-hidden bg-muted relative group cursor-pointer">
        {coverUrlData?.coverUrl ? (
          <img
            src={coverUrlData.coverUrl}
            alt="Current cover"
            className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Image className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        {/* Dropzone Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-white text-center">
            <Image className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">
              Click to change
            </p>
            <p className="text-xs opacity-80">or drag & drop</p>
          </div>
        </div>
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              onImageSelect(files);
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Current image
      </p>
    </div>
  );
}

export const Route = createFileRoute("/song/$id/edit")({
  loader: async ({ context: { queryClient }, params: { id } }) => {
    await queryClient.ensureQueryData(getSongByIdQuery(id));
  },
  component: EditSong,
});

const editSchema = z.object({
  title: z
    .string()
    .min(2, "Song title must be at least 2 characters")
    .max(100, "Song title must be less than 100 characters"),
  artist: z
    .string()
    .min(1, "Artist name is required")
    .max(50, "Artist name must be less than 50 characters"),
  album: z
    .string()
    .max(100, "Album name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  genre: z
    .string()
    .max(50, "Genre must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["processing", "published", "private", "unlisted"]),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditState {
  coverImageFile: File | null;
  coverProgress: number;
  audioFile: File | null;
  audioProgress: number;
  isUploading: boolean;
  coverKey: string | null;
  audioKey: string | null;
  duration: number | null;
}

function EditSong() {
  const { id } = Route.useParams();
  const { data: song, isLoading, error } = useQuery(getSongByIdQuery(id));
  const { data: session } = authClient.useSession();
  const updateSongMutation = useUpdateSong();
  const navigate = useNavigate();
  const breadcrumbItems = useSongBreadcrumbs(song?.title || "Song", "edit");
  const deleteSongMutation = useDeleteSong();

  const [editState, setEditState] = useState<EditState>({
    coverImageFile: null,
    coverProgress: 0,
    audioFile: null,
    audioProgress: 0,
    isUploading: false,
    coverKey: null,
    audioKey: null,
    duration: null,
  });

  // Check if user can edit this song
  const canEdit = session?.user?.id === song?.userId;

  // Form Setup with Zod Resolver
  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      artist: "",
      album: "",
      genre: "",
      description: "",
      status: "published" as const,
    },
  });

  // Update form with song data when loaded
  useEffect(() => {
    if (song) {
      form.reset({
        title: song.title || "",
        artist: song.artist || "",
        album: song.album || "",
        genre: song.genre || "",
        description: song.description || "",
        status: (song.status as any) || "published",
      });
    }
  }, [song, form]);

  // Redirect if user can't edit
  useEffect(() => {
    if (song && !canEdit) {
      navigate({ to: `/song/${id}` });
    }
  }, [song, canEdit, id, navigate]);

  // Custom navigation handler after successful update
  const handleUpdateSuccess = () => {
    // Navigate back to song page
    window.history.back();
  };

  const handleCoverImageSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      setEditState((prev) => ({
        ...prev,
        coverImageFile: files[0],
      }));
    }
  }, []);

  const handleAudioFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      setEditState((prev) => ({
        ...prev,
        audioFile: files[0],
      }));
    }
  }, []);

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!editState.coverImageFile || !id) {
      return null;
    }

    setEditState((prev) => ({ ...prev, isUploading: true }));

    try {
      const coverResult = await uploadCoverImageWithPresignedUrl(
        id,
        editState.coverImageFile,
        (progress: UploadProgress) => {
          setEditState((prev) => ({
            ...prev,
            coverProgress: progress.percentage,
          }));
        }
      );

      const coverKey = coverResult.coverKey;
      setEditState((prev) => ({ ...prev, coverKey }));

      return coverKey;
    } catch (error) {
      console.error("Cover upload failed:", error);
      toast.error("Failed to upload cover image");
      return null;
    } finally {
      setEditState((prev) => ({ ...prev, isUploading: false }));
    }
  };

  const uploadAudioFile = async (): Promise<{audioKey: string, duration: number} | null> => {
    if (!editState.audioFile) {
      return null;
    }

    setEditState((prev) => ({ ...prev, isUploading: true }));

    try {
      const audioResult = await uploadAudioWithPresignedUrl(
        editState.audioFile,
        (progress: UploadProgress) => {
          setEditState((prev) => ({
            ...prev,
            audioProgress: progress.percentage,
          }));
        }
      );

      setEditState((prev) => ({ 
        ...prev, 
        audioKey: audioResult.audioKey,
        duration: audioResult.durationSeconds 
      }));

      return {
        audioKey: audioResult.audioKey,
        duration: audioResult.durationSeconds
      };
    } catch (error) {
      console.error("Audio upload failed:", error);
      toast.error("Failed to upload audio file");
      return null;
    } finally {
      setEditState((prev) => ({ ...prev, isUploading: false }));
    }
  };

  const onSubmit = async (data: EditFormData) => {
    if (!canEdit || !id) {
      toast.error("You are not authorized to edit this song");
      return;
    }

    let coverImageKey: string | undefined;
    let audioKey: string | undefined;
    let duration: number | undefined;

    // Upload new cover image if selected
    if (editState.coverImageFile) {
      const uploadedKey = await uploadCoverImage();
      if (uploadedKey) {
        coverImageKey = uploadedKey;
      }
    }

    // Upload new audio file if selected
    if (editState.audioFile) {
      const uploadResult = await uploadAudioFile();
      if (uploadResult) {
        audioKey = uploadResult.audioKey;
        duration = uploadResult.duration;
      }
    }

    const updateData = {
      id,
      ...data,
      ...(coverImageKey && { coverImageKey }),
      ...(audioKey && { audioKey }),
      ...(duration && { duration }),
    };

    updateSongMutation.mutate(updateData, {
      onSuccess: handleUpdateSuccess,
    });
  };

  const handleDeleteSong = async () => {
    if (!song || !canEdit) {
      toast.error("You are not authorized to delete this song");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${song.title}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await deleteSongMutation.mutateAsync(id);
        navigate({ to: "/my-songs" });
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const isFormDisabled = updateSongMutation.isPending || editState.isUploading;

  if (isLoading) {
    return (
      <Page>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  if (error || !song) {
    return (
      <Page>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Song Not Found
          </h1>
          <p className="text-muted-foreground">
            The song you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </Page>
    );
  }

  if (!canEdit) {
    return (
      <Page>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
          <p className="text-muted-foreground">
            You can only edit your own songs.
          </p>
          <Button asChild variant="outline">
            <Link to={`/song/${id}`}>Back to Song</Link>
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb items={breadcrumbItems} />
        <PageTitle
          title="Edit Song"
          description="Update your song information"
        />

        <div className="max-w-7xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-8 space-y-8"
            >
              {/* File Upload Sections */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Audio File Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Replace Audio File
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload a new audio file to replace the current one (optional)
                      </p>
                    </div>
                    {editState.audioFile && !editState.isUploading && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    )}
                  </div>
                  
                  <FileUpload
                    onFilesSelected={handleAudioFileSelect}
                    accept={{
                      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a']
                    }}
                    maxSize={100 * 1024 * 1024} // 100MB
                    disabled={isFormDisabled}
                    hideSelectedFiles={!!editState.audioFile}
                  />

                  {editState.audioFile && (
                    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <Music className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            New audio file selected: {editState.audioFile.name}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            This will replace the current audio file when you save
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditState(prev => ({ ...prev, audioFile: null }))}
                          className="text-blue-600 hover:text-blue-700"
                          disabled={isFormDisabled}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="pt-2">
                        <audio
                          controls
                          className="w-full h-8"
                          src={URL.createObjectURL(editState.audioFile)}
                          preload="metadata"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  )}

                  {editState.isUploading && editState.audioProgress > 0 && (
                    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Uploading audio...</span>
                        </div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{editState.audioProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2" 
                          style={{ width: `${editState.audioProgress}%` }}
                        >
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover Image Upload with Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        {song.coverImageKey
                          ? "Update Cover Image"
                          : "Add Cover Image"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {song.coverImageKey
                          ? "Click on the image or drop a new file to update"
                          : "Upload a cover image (optional)"}
                      </p>
                    </div>
                    {editState.coverImageFile && !editState.isUploading && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-6">
                    {/* Current Cover Image with Dropzone Overlay */}
                    {song.coverImageKey && !editState.coverImageFile && (
                      <CoverImageDisplay 
                        coverImageKey={song.coverImageKey}
                        onImageSelect={handleCoverImageSelect}
                        disabled={isFormDisabled}
                      />
                    )}

                    {/* New Cover Image Preview */}
                    {editState.coverImageFile && (
                      <div className="relative">
                        <div className="w-48 h-48 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={URL.createObjectURL(editState.coverImageFile)}
                            alt="New cover preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          New image
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditState((prev) => ({
                              ...prev,
                              coverImageFile: null,
                            }))
                          }
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          disabled={isFormDisabled}
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    {/* File Upload Area (when no current image or alongside current image) */}
                    <div className="flex-1 min-w-64">
                      <FileUpload
                        onFilesSelected={handleCoverImageSelect}
                        accept={{
                          "image/*": [".jpg", ".jpeg", ".png", ".webp"],
                        }}
                        maxSize={10 * 1024 * 1024} // 10MB
                        disabled={isFormDisabled}
                      />
                    </div>
                  </div>

                  {editState.isUploading && editState.coverProgress > 0 && (
                    <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Uploading cover...
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                          {editState.coverProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-100 dark:bg-purple-900/50 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                          style={{ width: `${editState.coverProgress}%` }}
                        >
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Song Information Form */}
              <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Song Title *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter song title"
                            className="h-11 text-base"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="artist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Artist Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter artist name"
                            className="h-11 text-base"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="album"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Album
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter album name (optional)"
                            className="h-11 text-base"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Genre
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter genre (optional)"
                            className="h-11 text-base"
                            disabled={isFormDisabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Description
                      </FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          placeholder="Tell listeners about your song..."
                          disabled={isFormDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Visibility *
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isFormDisabled}
                          {...field}
                        >
                          <option value="published">Public</option>
                          <option value="unlisted">Unlisted</option>
                          <option value="private">Private</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Control who can listen to your song
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit and Delete Buttons */}
              <div className="flex flex-col gap-4 pt-6 border-t border-border">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={isFormDisabled}
                >
                  {editState.isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : updateSongMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating Song...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Song
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full h-12 text-base font-medium"
                  onClick={handleDeleteSong}
                  disabled={isFormDisabled || deleteSongMutation.isPending}
                >
                  {deleteSongMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Song
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Page>
  );
}