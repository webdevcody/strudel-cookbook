import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCheckoutSessionFn,
  createPortalSessionFn,
  cancelSubscriptionFn,
} from "~/fn/subscriptions";
import { getUserPlanQuery } from "~/queries/subscription";
import { authClient } from "~/lib/auth-client";

// Hook to get user's current subscription plan
export function useUserPlan() {
  const { data: session } = authClient.useSession();
  
  return useQuery({
    ...getUserPlanQuery(),
    enabled: !!session?.user, // Only run query if user is authenticated
  });
}

// Hook for creating checkout sessions
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: createCheckoutSessionFn,
    onSuccess: (result) => {
      if (result.success && result.data?.sessionUrl) {
        window.location.href = result.data.sessionUrl;
      } else {
        toast.error(result.error || "Failed to create checkout session");
      }
    },
    onError: () => {
      toast.error("Failed to start checkout process");
    },
  });
}

// Hook for creating portal sessions
export function useCreatePortalSession() {
  return useMutation({
    mutationFn: createPortalSessionFn,
    onSuccess: (result) => {
      if (result.success && result.data?.sessionUrl) {
        window.open(result.data.sessionUrl, "_blank");
      } else {
        toast.error(result.error || "Failed to open billing portal");
      }
    },
    onError: () => {
      toast.error("Failed to open billing portal");
    },
  });
}

// Hook for canceling subscriptions
export function useCancelSubscription() {
  return useMutation({
    mutationFn: cancelSubscriptionFn,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          "Subscription will be canceled at the end of the billing period"
        );
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to cancel subscription");
      }
    },
    onError: () => {
      toast.error("Failed to cancel subscription");
    },
  });
}
