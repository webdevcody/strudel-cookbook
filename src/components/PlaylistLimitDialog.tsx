import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Crown, Zap } from "lucide-react";
import { useUserPlan, useCreateCheckoutSession, useCreatePortalSession } from "~/hooks/useSubscription";
import { SUBSCRIPTION_PLANS } from "~/lib/plans";
import { useNavigate } from "@tanstack/react-router";

interface PlaylistLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorType: "PLAYLIST_LIMIT_FREE" | "PLAYLIST_LIMIT_BASIC" | "SUBSCRIPTION_EXPIRED";
}

export function PlaylistLimitDialog({
  open,
  onOpenChange,
  errorType,
}: PlaylistLimitDialogProps) {
  const navigate = useNavigate();
  const { data: userPlan } = useUserPlan();
  const createCheckoutSession = useCreateCheckoutSession();
  const createPortalSession = useCreatePortalSession();

  const handleUpgrade = (planType: "basic" | "pro") => {
    // If user has an active subscription, take them to manage billing
    if (userPlan?.data?.subscriptionStatus === "active") {
      createPortalSession.mutate({ data: undefined });
      onOpenChange(false);
    } else {
      // If no active subscription, create a checkout session
      const plan = planType === "basic" ? SUBSCRIPTION_PLANS.BASIC : SUBSCRIPTION_PLANS.PRO;
      if (plan.priceId) {
        createCheckoutSession.mutate({ data: { priceId: plan.priceId } });
      }
    }
  };

  const handleManageSubscription = () => {
    if (userPlan?.data?.subscriptionStatus === "active") {
      createPortalSession.mutate({ data: undefined });
      onOpenChange(false);
    } else {
      navigate({ to: "/settings" });
      onOpenChange(false);
    }
  };

  const handleViewPricing = () => {
    navigate({ to: "/#pricing" });
    onOpenChange(false);
  };

  const getDialogContent = () => {
    switch (errorType) {
      case "PLAYLIST_LIMIT_FREE":
        return {
          title: "Playlist Limit Reached",
          description: "Free users can only create 1 playlist. Upgrade to Basic to create up to 5 playlists, or Pro for unlimited playlists.",
          showUpgrade: true,
        };
      case "PLAYLIST_LIMIT_BASIC":
        return {
          title: "Playlist Limit Reached",
          description: "Basic users can create up to 5 playlists. Upgrade to Pro for unlimited playlists.",
          showUpgrade: true,
        };
      case "SUBSCRIPTION_EXPIRED":
        return {
          title: "Subscription Expired",
          description: "Your subscription has expired. Please renew your subscription to continue creating playlists.",
          showUpgrade: false,
        };
      default:
        return {
          title: "Upgrade Required",
          description: "Please upgrade your plan to create more playlists.",
          showUpgrade: true,
        };
    }
  };

  const { title, description, showUpgrade } = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          {errorType === "SUBSCRIPTION_EXPIRED" ? (
            <>
              <Button onClick={handleManageSubscription} className="w-full">
                Manage Subscription
              </Button>
              <Button variant="outline" onClick={handleViewPricing} className="w-full">
                View Pricing
              </Button>
            </>
          ) : showUpgrade ? (
            <>
              {(errorType === "PLAYLIST_LIMIT_FREE" || errorType === "PLAYLIST_LIMIT_BASIC") && (
                <>
                  {errorType === "PLAYLIST_LIMIT_FREE" && (
                    <Button
                      onClick={() => handleUpgrade("basic")}
                      disabled={createCheckoutSession.isPending || createPortalSession.isPending}
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {(createCheckoutSession.isPending || createPortalSession.isPending) ? "Loading..." : 
                        userPlan?.data?.subscriptionStatus === "active" ? "Manage Subscription" : "Upgrade to Basic - $9.99/mo"}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleUpgrade("pro")}
                    disabled={createCheckoutSession.isPending || createPortalSession.isPending}
                    variant={errorType === "PLAYLIST_LIMIT_FREE" ? "outline" : "default"}
                    className="w-full"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {(createCheckoutSession.isPending || createPortalSession.isPending) ? "Loading..." : 
                      userPlan?.data?.subscriptionStatus === "active" ? "Manage Subscription" : "Upgrade to Pro - $29.99/mo"}
                  </Button>
                </>
              )}
              {userPlan?.data?.subscriptionStatus !== "active" && (
                <Button variant="outline" onClick={handleManageSubscription} className="w-full">
                  Go to Settings
                </Button>
              )}
              <Button variant="ghost" onClick={handleViewPricing} className="w-full">
                View All Plans
              </Button>
            </>
          ) : null}
          
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}