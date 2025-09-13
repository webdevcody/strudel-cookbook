import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateUserProfileFn, deleteUserAccountFn } from "~/fn/storage";
import { authClient } from "~/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

// Hook for updating user profile
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { data: session, refetch: refetchSession } = authClient.useSession();
  
  return useMutation({
    mutationFn: updateUserProfileFn,
    onSuccess: () => {
      toast.success("Profile updated successfully");
      
      // Refetch the session to get updated user data
      refetchSession();
      
      if (session?.user?.id) {
        // Invalidate user profile query
        queryClient.invalidateQueries({
          queryKey: ["user-profile", session.user.id],
        });
        
        // Invalidate all avatar URL queries (both old and new image keys)
        queryClient.invalidateQueries({
          queryKey: ["avatar-url"],
        });
      }
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });
}

// Hook for deleting user account
export function useDeleteUserAccount() {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: deleteUserAccountFn,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      // Navigate to home page after successful deletion
      navigate({ to: "/" });
      // Force page reload to clear all authentication state
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });
}