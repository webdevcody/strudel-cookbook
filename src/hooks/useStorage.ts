import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  getPresignedUploadUrlFn,
  getPresignedImageUploadUrlFn,
  updateUserProfileFn,
  getProfileImageUploadUrlFn
} from "~/fn/storage";
import { getImageUrlQuery } from "~/queries/storage";
import { getErrorMessage } from "~/utils/error";

// Query hooks
export function useImageUrl(imageKey: string, enabled = true) {
  return useQuery({
    ...getImageUrlQuery(imageKey),
    enabled: enabled && !!imageKey,
  });
}

// Mutation hooks
export function useGetPresignedUploadUrl() {
  return useMutation({
    mutationFn: (videoKey: string) => 
      getPresignedUploadUrlFn({ data: { videoKey } }),
    onError: (error) => {
      toast.error("Failed to get upload URL", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useGetPresignedImageUploadUrl() {
  return useMutation({
    mutationFn: (imageKey: string) => 
      getPresignedImageUploadUrlFn({ data: { imageKey } }),
    onError: (error) => {
      toast.error("Failed to get image upload URL", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name?: string; image?: string }) =>
      updateUserProfileFn({ data }),
    onSuccess: () => {
      toast.success("Profile updated successfully!", {
        description: "Your profile changes have been saved.",
      });
      
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useGetProfileImageUploadUrl() {
  return useMutation({
    mutationFn: (data: { fileName: string; contentType: string }) =>
      getProfileImageUploadUrlFn({ data }),
    onError: (error) => {
      toast.error("Failed to get profile image upload URL", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Combined hook for file upload workflow
export function useFileUpload() {
  const getVideoUploadUrl = useGetPresignedUploadUrl();
  const getImageUploadUrl = useGetPresignedImageUploadUrl();
  const getProfileImageUploadUrl = useGetProfileImageUploadUrl();
  const updateProfile = useUpdateUserProfile();
  
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
    
    return response;
  };
  
  const invalidateImageData = (imageKey: string) => {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: ["image-url", imageKey] });
  };
  
  return {
    getVideoUploadUrl,
    getImageUploadUrl,
    getProfileImageUploadUrl,
    updateProfile,
    uploadFile,
    invalidateImageData,
    isLoading: getVideoUploadUrl.isPending || 
               getImageUploadUrl.isPending || 
               getProfileImageUploadUrl.isPending || 
               updateProfile.isPending,
  };
}