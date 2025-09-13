import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  getPresignedAudioUploadUrlFn,
  getPresignedCoverImageUploadUrlFn
} from "~/fn/audio-storage";
import { getAudioUrlQuery, getCoverImageUrlQuery } from "~/queries/audio-storage";
import { getErrorMessage } from "~/utils/error";

// Query hooks
export function useAudioUrl(audioKey: string, enabled = true) {
  return useQuery({
    ...getAudioUrlQuery(audioKey),
    enabled: enabled && !!audioKey,
  });
}

export function useCoverImageUrl(coverKey: string, enabled = true) {
  return useQuery({
    ...getCoverImageUrlQuery(coverKey),
    enabled: enabled && !!coverKey,
  });
}

// Mutation hooks
export function useGetPresignedAudioUploadUrl() {
  return useMutation({
    mutationFn: (data: { fileName: string; contentType: string }) => 
      getPresignedAudioUploadUrlFn({ data }),
    onSuccess: (result) => {
      toast.success("Ready for audio upload", {
        description: "Upload URL generated successfully.",
      });
    },
    onError: (error) => {
      toast.error("Failed to get audio upload URL", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useGetPresignedCoverImageUploadUrl() {
  return useMutation({
    mutationFn: (data: { songId: string; fileName: string; contentType: string }) => 
      getPresignedCoverImageUploadUrlFn({ data }),
    onSuccess: () => {
      toast.success("Ready for cover image upload", {
        description: "Upload URL generated successfully.",
      });
    },
    onError: (error) => {
      toast.error("Failed to get cover image upload URL", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Combined hook for audio upload workflow
export function useAudioUpload() {
  const queryClient = useQueryClient();
  const getAudioUploadUrl = useGetPresignedAudioUploadUrl();
  const getCoverImageUploadUrl = useGetPresignedCoverImageUploadUrl();
  
  const uploadFile = async (file: File, uploadUrl: string) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    toast.success("File uploaded successfully!", {
      description: `${file.name} has been uploaded.`,
    });
    
    return response;
  };
  
  const invalidateAudioData = (audioKey?: string, coverKey?: string) => {
    if (audioKey) {
      queryClient.invalidateQueries({ queryKey: ["audio-url", audioKey] });
    }
    if (coverKey) {
      queryClient.invalidateQueries({ queryKey: ["cover-image-url", coverKey] });
    }
  };
  
  return {
    getAudioUploadUrl,
    getCoverImageUploadUrl,
    uploadFile,
    invalidateAudioData,
    isLoading: getAudioUploadUrl.isPending || getCoverImageUploadUrl.isPending,
  };
}

// Hook for managing song assets
export function useSongAssets(songId: string, audioKey?: string, coverKey?: string) {
  const audioUrl = useAudioUrl(audioKey || "", !!audioKey);
  const coverImageUrl = useCoverImageUrl(coverKey || "", !!coverKey);
  const audioUpload = useAudioUpload();
  
  const invalidateAssets = () => {
    audioUpload.invalidateAudioData(audioKey, coverKey);
  };
  
  return {
    audioUrl,
    coverImageUrl,
    audioUpload,
    invalidateAssets,
    isLoading: audioUrl.isLoading || coverImageUrl.isLoading || audioUpload.isLoading,
  };
}