import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCheckoutSessionFn,
  createPortalSessionFn,
  cancelSubscriptionFn,
} from "~/fn/subscriptions";
import { getUserPlanQuery } from "~/queries/subscription";
import { getErrorMessage } from "~/utils/error";

// Query hooks
export function useUserPlan(enabled = true) {
  return useQuery({
    ...getUserPlanQuery(),
    enabled,
  });
}

// Mutation hooks
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (priceId: string) =>
      createCheckoutSessionFn({ data: { priceId } }),
    onSuccess: (result) => {
      if (result.success && result.data?.sessionUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.data.sessionUrl;
      } else {
        toast.error("Failed to create checkout session", {
          description: result.error || "Unknown error occurred",
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to create checkout session", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: createPortalSessionFn,
    onSuccess: (result) => {
      if (result.success && result.data?.sessionUrl) {
        // Redirect to Stripe customer portal
        window.location.href = result.data.sessionUrl;
      } else {
        toast.error("Failed to create portal session", {
          description: result.error || "Unknown error occurred",
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to create portal session", {
        description: getErrorMessage(error),
      });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscriptionFn,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Subscription cancelled", {
          description:
            "Your subscription will be cancelled at the end of the current period.",
        });

        // Invalidate user plan to refresh subscription status
        queryClient.invalidateQueries({ queryKey: ["user-plan"] });
      } else {
        toast.error("Failed to cancel subscription", {
          description: result.error || "Unknown error occurred",
        });
      }
    },
    onError: (error) => {
      toast.error("Failed to cancel subscription", {
        description: getErrorMessage(error),
      });
    },
  });
}

// Combined hook for subscription management
export function useSubscriptionManagement() {
  const queryClient = useQueryClient();
  const userPlan = useUserPlan();
  const createCheckoutSession = useCreateCheckoutSession();
  const createPortalSession = useCreatePortalSession();
  const cancelSubscription = useCancelSubscription();

  const refreshUserPlan = () => {
    queryClient.invalidateQueries({ queryKey: ["user-plan"] });
  };

  const handleUpgrade = (priceId: string) => {
    createCheckoutSession.mutate(priceId);
  };

  const handleManageSubscription = () => {
    createPortalSession.mutate({ data: undefined });
  };

  const handleCancelSubscription = () => {
    cancelSubscription.mutate({ data: undefined });
  };

  return {
    userPlan,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    refreshUserPlan,
    handleUpgrade,
    handleManageSubscription,
    handleCancelSubscription,
    isLoading:
      userPlan.isLoading ||
      createCheckoutSession.isPending ||
      createPortalSession.isPending ||
      cancelSubscription.isPending,
  };
}
