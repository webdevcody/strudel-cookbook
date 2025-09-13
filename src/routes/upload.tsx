import { createFileRoute } from "@tanstack/react-router";
import { Music, Upload as UploadIcon, Image, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useCreateSong } from "~/hooks/useSongs";
import { Page } from "~/components/Page";
import { PageTitle } from "~/components/PageTitle";
import { Button } from "~/components/ui/button";
import { AppBreadcrumb } from "~/components/AppBreadcrumb";
import { Input } from "~/components/ui/input";
import { FileUpload } from "~/components/ui/file-upload";
// Temporary imports for upload functionality - complex logic to be refactored later
import {
  uploadAudioWithPresignedUrl,
  uploadCoverImageWithPresignedUrl,
  UploadProgress,
} from "~/utils/storage/audio-helpers";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

export const Route = createFileRoute("/upload")({
  component: Upload,
});

// Updated Schema for File Upload
const uploadSchema = z.object({
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

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadState {
  audioFile: File | null;
  coverImageFile: File | null;
  audioProgress: number;
  coverProgress: number;
  isUploading: boolean;
  audioKey: string | null;
  coverKey: string | null;
  songId: string | null;
  duration: number | null;
}

function Upload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    audioFile: null,
    coverImageFile: null,
    audioProgress: 0,
    coverProgress: 0,
    isUploading: false,
    audioKey: null,
    coverKey: null,
    songId: null,
    duration: null,
  });

  // Form Setup with Zod Resolver
  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      artist: "",
      album: "",
      genre: "",
      description: "",
      status: "published" as const,
    },
  });

  const createSongMutation = useCreateSong();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleAudioFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      setUploadState((prev) => ({
        ...prev,
        audioFile: files[0],
      }));
    }
  }, []);

  const handleCoverImageSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      setUploadState((prev) => ({
        ...prev,
        coverImageFile: files[0],
      }));
    }
  }, []);

  const uploadFiles = async () => {
    if (!uploadState.audioFile) {
      toast.error("Please select an audio file");
      return null;
    }

    setUploadState((prev) => ({ ...prev, isUploading: true }));

    try {
      // Upload audio file
      const audioResult = await uploadAudioWithPresignedUrl(
        uploadState.audioFile,
        (progress: UploadProgress) => {
          setUploadState((prev) => ({
            ...prev,
            audioProgress: progress.percentage,
          }));
        }
      );

      setUploadState((prev) => ({
        ...prev,
        audioKey: audioResult.audioKey,
        songId: audioResult.songId,
        duration: audioResult.durationSeconds,
      }));

      let coverKey: string | null = null;

      // Upload cover image if provided
      if (uploadState.coverImageFile) {
        const coverResult = await uploadCoverImageWithPresignedUrl(
          audioResult.songId,
          uploadState.coverImageFile,
          (progress: UploadProgress) => {
            setUploadState((prev) => ({
              ...prev,
              coverProgress: progress.percentage,
            }));
          }
        );
        coverKey = coverResult.coverKey;
        setUploadState((prev) => ({ ...prev, coverKey }));
      }

      return {
        audioKey: audioResult.audioKey,
        coverImageKey: coverKey,
        duration: audioResult.durationSeconds,
        songId: audioResult.songId,
      };
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload files");
      return null;
    } finally {
      setUploadState((prev) => ({ ...prev, isUploading: false }));
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    const uploadResult = await uploadFiles();
    if (!uploadResult) return;

    createSongMutation.mutate(
      {
        ...data,
        audioKey: uploadResult.audioKey,
        coverImageKey: uploadResult.coverImageKey,
        duration: uploadResult.duration,
      },
      {
        onSuccess: () => {
          form.reset();
          setUploadState({
            audioFile: null,
            coverImageFile: null,
            audioProgress: 0,
            coverProgress: 0,
            isUploading: false,
            audioKey: null,
            coverKey: null,
            songId: null,
            duration: null,
          });
        },
      }
    );
  };

  const isFormDisabled =
    createSongMutation.isPending || uploadState.isUploading;

  return (
    <Page>
      <div className="space-y-8">
        <AppBreadcrumb
          items={[
            { label: "My Songs", href: "/my-songs", icon: Music },
            { label: "Upload" },
          ]}
        />
        <PageTitle
          title="Upload Song"
          description="Share your music with the community"
        />

        <div className="max-w-7xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-8 space-y-8"
            >
              {/* File Upload Sections */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Audio Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Audio File *
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your music file (MP3, WAV, FLAC, etc.)
                      </p>
                    </div>
                    {uploadState.audioFile && !uploadState.isUploading && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    )}
                  </div>

                  <FileUpload
                    onFilesSelected={handleAudioFileSelect}
                    accept={{
                      "audio/*": [
                        ".mp3",
                        ".wav",
                        ".flac",
                        ".aac",
                        ".ogg",
                        ".m4a",
                      ],
                    }}
                    maxSize={100 * 1024 * 1024} // 100MB
                    disabled={isFormDisabled}
                  />

                  {uploadState.isUploading && uploadState.audioProgress > 0 && (
                    <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Uploading audio...
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          {uploadState.audioProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                          style={{ width: `${uploadState.audioProgress}%` }}
                        >
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        Cover Image
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload album artwork or cover image (optional)
                      </p>
                    </div>
                    {uploadState.coverImageFile && !uploadState.isUploading && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Ready</span>
                      </div>
                    )}
                  </div>

                  <FileUpload
                    onFilesSelected={handleCoverImageSelect}
                    accept={{
                      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
                    }}
                    maxSize={10 * 1024 * 1024} // 10MB
                    disabled={isFormDisabled}
                  />

                  {uploadState.isUploading && uploadState.coverProgress > 0 && (
                    <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Uploading cover...
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                          {uploadState.coverProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-100 dark:bg-purple-900/50 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                          style={{ width: `${uploadState.coverProgress}%` }}
                        >
                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Form */}
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

                {uploadState.duration && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Music className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Audio processed successfully
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Duration: {formatDuration(uploadState.duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-4 pt-6 border-t border-border">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={isFormDisabled || !uploadState.audioFile}
                >
                  {uploadState.isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading Files...
                    </>
                  ) : createSongMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Song...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload Song
                    </>
                  )}
                </Button>

                {!uploadState.audioFile ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Music className="h-4 w-4" />
                    <p className="text-sm">
                      Please select an audio file to continue
                    </p>
                  </div>
                ) : (
                  uploadState.audioFile &&
                  !uploadState.isUploading &&
                  !createSongMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium">
                        Ready to upload your song!
                      </p>
                    </div>
                  )
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Page>
  );
}
