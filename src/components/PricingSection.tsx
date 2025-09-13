import { SUBSCRIPTION_PLANS } from "~/lib/plans";
import { authClient } from "~/lib/auth-client";
import {
  useUserPlan,
  useCreateCheckoutSession,
} from "~/hooks/useSubscription";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { PricingCard } from "./PricingCard";
import type { SubscriptionPlan } from "~/db/schema";

interface PricingSectionProps {
  showTitle?: boolean;
}

export function PricingSection({ showTitle = true }: PricingSectionProps) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Fetch user's current subscription plan
  const { data: userPlan, isLoading: planLoading } = useUserPlan();

  // Create checkout session mutation
  const checkoutMutation = useCreateCheckoutSession();

  const handlePlanSelect = (priceId: string) => {
    if (sessionLoading) return;

    // If not logged in, redirect to sign up with pricing anchor
    if (!session) {
      router.navigate({ to: "/sign-up", search: { redirect: "/#pricing" } });
      return;
    }

    // Start checkout process
    const plan = Object.values(SUBSCRIPTION_PLANS).find(
      (p) => p.priceId === priceId
    );
    if (plan) {
      setLoadingPlan(plan.plan);
    }
    checkoutMutation.mutate({ data: { priceId } }, {
      onSettled: () => setLoadingPlan(null),
    });
  };

  // Get current plan, defaulting to 'free' for logged out users or loading state
  const currentPlan = (userPlan?.data?.plan || "free") as SubscriptionPlan;
  const isLoadingState = sessionLoading || planLoading;

  const handleManagePlans = () => {
    router.navigate({ to: "/settings" });
  };

  return (
    <section id="pricing" className="container mx-auto px-4 py-16 sm:py-24">
      {showTitle && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
            Choose Your <span className="text-primary">Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground sm:text-xl max-w-3xl mx-auto">
            Start for free and upgrade as you grow. All plans include our core
            features with increasing limits and premium support.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingCard
          plan={SUBSCRIPTION_PLANS.FREE}
          currentPlan={currentPlan}
          isLoading={isLoadingState}
          onUpgrade={() => {
            if (!session) {
              authClient.signIn.social({
                provider: "google",
              });
            }
          }}
          onManagePlans={handleManagePlans}
        />

        <PricingCard
          plan={SUBSCRIPTION_PLANS.BASIC}
          currentPlan={currentPlan}
          isLoading={isLoadingState}
          onUpgrade={handlePlanSelect}
          onManagePlans={handleManagePlans}
          isPopular={true}
        />

        <PricingCard
          plan={SUBSCRIPTION_PLANS.PRO}
          currentPlan={currentPlan}
          isLoading={isLoadingState}
          onUpgrade={handlePlanSelect}
          onManagePlans={handleManagePlans}
        />
      </div>

      {/* Additional Info */}
      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground mb-4">
          All plans include a 14-day free trial. No setup fees. Cancel anytime.
        </p>
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <span>✓ Secure payments</span>
          <span>✓ Cancel anytime</span>
          <span>✓ 24/7 support</span>
        </div>
      </div>
    </section>
  );
}
