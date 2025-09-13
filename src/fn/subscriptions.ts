import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "./middleware";
import { stripe } from "~/lib/stripe";
import { getUserSubscription } from "~/utils/subscription";
import { getPlanByPriceId } from "~/lib/plans";
import { publicEnv } from "~/config/publicEnv";

// Get user's current subscription and plan info
export const getUserPlanFn = createServerFn({ method: "GET" })
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    try {
      const subscription = await getUserSubscription(userId);

      if (!subscription) {
        throw new Error("User not found");
      }

      return {
        success: true,
        data: {
          plan: subscription.plan || "free",
          subscriptionStatus: subscription.subscriptionStatus,
          subscriptionExpiresAt: subscription.subscriptionExpiresAt,
          stripeCustomerId: subscription.stripeCustomerId,
          subscriptionId: subscription.subscriptionId,
        },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to get user plan",
      };
    }
  });

// Create checkout session for subscription upgrade
const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1, "Price ID is required"),
});

export const createCheckoutSessionFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(createCheckoutSessionSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { priceId } = data;

    try {
      const subscription = await getUserSubscription(userId);

      if (!subscription) {
        throw new Error("User not found");
      }

      // Check if the plan is valid
      const planDetails = getPlanByPriceId(priceId);
      if (!planDetails) {
        throw new Error("Invalid price ID");
      }

      let customerId = subscription.stripeCustomerId;

      // Create Stripe customer if one doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: subscription.email,
          name: subscription.name,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${publicEnv.BETTER_AUTH_URL}/settings?success=true`,
        cancel_url: `${publicEnv.BETTER_AUTH_URL}/settings?canceled=true`,
        metadata: {
          userId: userId,
          plan: planDetails.plan,
        },
      });

      return {
        success: true,
        data: { sessionUrl: session.url },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      };
    }
  });

// Create customer portal session for subscription management
export const createPortalSessionFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    try {
      const subscription = await getUserSubscription(userId);

      if (!subscription || !subscription.stripeCustomerId) {
        throw new Error("No subscription found");
      }

      // Create customer portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${publicEnv.BETTER_AUTH_URL}/settings`,
      });

      return {
        success: true,
        data: { sessionUrl: session.url },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create portal session",
      };
    }
  });

// Cancel subscription (sets to cancel at period end)
export const cancelSubscriptionFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .handler(async ({ context }) => {
    const { userId } = context;

    try {
      const subscription = await getUserSubscription(userId);

      if (!subscription || !subscription.subscriptionId) {
        throw new Error("No active subscription found");
      }

      // Cancel subscription at period end
      const canceledSubscription = await stripe.subscriptions.update(
        subscription.subscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

      return {
        success: true,
        data: {
          canceledAt: canceledSubscription.cancel_at,
          willCancelAt: canceledSubscription.cancel_at,
        },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription",
      };
    }
  });