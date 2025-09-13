import { Button } from "~/components/ui/button";
import { Check } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "~/lib/plans";
import type { SubscriptionPlan } from "~/db/schema";
import { authClient } from "~/lib/auth-client";

interface PricingCardProps {
  plan: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
  currentPlan: SubscriptionPlan;
  isLoading?: boolean;
  onUpgrade?: (priceId: string) => void;
  onManagePlans?: () => void;
  isPopular?: boolean;
}

export function PricingCard({
  plan,
  currentPlan,
  isLoading = false,
  onUpgrade,
  onManagePlans,
  isPopular = false,
}: PricingCardProps) {
  const { data: session } = authClient.useSession();
  const isCurrentPlan = currentPlan === plan.plan;
  const isLoggedOut = !session;
  const hasPaidPlan = currentPlan === "basic" || currentPlan === "pro";

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const handleButtonClick = () => {
    if (isLoggedOut) {
      // For logged out users, onUpgrade should redirect to sign-in/sign-up
      if (onUpgrade) {
        onUpgrade(plan.priceId || "");
      }
    } else if (hasPaidPlan && plan.plan !== "free") {
      // For users with paid plans, manage plans for paid subscription buttons
      if (onManagePlans) {
        onManagePlans();
      }
    } else if (!hasPaidPlan && plan.plan !== "free") {
      // For free users on paid plan buttons, upgrade
      if (onUpgrade && plan.priceId) {
        onUpgrade(plan.priceId);
      }
    } else if (plan.plan === "free" && !hasPaidPlan) {
      // For free users on free plan button, get started
      if (onUpgrade) {
        onUpgrade("");
      }
    }
  };

  const getButtonText = () => {
    if (isLoggedOut) {
      return "Login Now";
    }

    if (hasPaidPlan && plan.plan !== "free") {
      return "Manage Plan";
    }

    if (!hasPaidPlan && plan.plan === "free") {
      return "Get Started";
    }

    if (!hasPaidPlan && plan.plan !== "free") {
      return "Upgrade Now";
    }

    return "Get Started";
  };

  const getButtonVariant = () => {
    if (isLoggedOut) return "outline";
    if (hasPaidPlan && plan.plan !== "free") return "outline";
    return isPopular ? "default" : "outline";
  };

  return (
    <div
      className={`
      relative bg-card rounded-lg border p-6 shadow-sm transition-all hover:shadow-lg
      ${isPopular ? "border-primary ring-1 ring-primary" : "border-border"}
      ${isCurrentPlan ? "bg-primary/5" : ""}
    `}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>

        <div className="mt-4 mb-6">
          <span className="text-4xl font-bold text-foreground">
            ${plan.price === 0 ? "0" : formatPrice(plan.price)}
          </span>
          {plan.price > 0 && (
            <span className="text-muted-foreground">/month</span>
          )}
        </div>

        {!isLoading && !isLoggedOut && isCurrentPlan && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              <Check className="h-4 w-4" />
              Current Plan
            </span>
          </div>
        )}

        <ul className="space-y-3 mb-6 text-left">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={handleButtonClick}
          variant={getButtonVariant()}
          className={`w-full ${isPopular && !isLoggedOut && !hasPaidPlan ? "bg-primary hover:bg-primary/90" : ""}`}
        >
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
}
