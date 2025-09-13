import { useQuery } from "@tanstack/react-query";
import { getUserAvatarQuery } from "~/queries/user";

// Hook to get avatar URL for any user by their image key
export function useAvatarUrl(imageKey: string | null | undefined) {
  const avatarQuery = useQuery(getUserAvatarQuery(imageKey || null));

  return {
    avatarUrl: avatarQuery.data?.imageUrl || null,
    isLoading: avatarQuery.isLoading,
    error: avatarQuery.error,
    refetch: avatarQuery.refetch,
  };
}