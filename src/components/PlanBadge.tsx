import { Badge } from "~/components/ui/badge";
import type { SubscriptionPlan } from "~/db/schema";

interface PlanBadgeProps {
  plan: SubscriptionPlan;
  className?: string;
}

const PLAN_CONFIG = {
  free: {
    label: "Free",
    variant: "secondary" as const,
  },
  basic: {
    label: "Basic",
    variant: "default" as const,
  },
  pro: {
    label: "Pro",
    variant: "default" as const,
  },
} as const;

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}