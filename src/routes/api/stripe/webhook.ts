import { stripe } from "~/lib/stripe";
import { updateUserSubscription, updateUserPlan } from "~/utils/subscription";
import { database } from "~/db";
import { user } from "~/db/schema";
import { eq } from "drizzle-orm";
import { privateEnv } from "~/config/privateEnv";
import type { SubscriptionPlan, SubscriptionStatus } from "~/db/schema";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { getPlanByPriceId } from "~/lib/plans";

export const ServerRoute = createServerFileRoute("/api/stripe/webhook").methods(
  {
    POST: async ({ request }) => {
      const body = await request.text();
      const sig = request.headers.get("stripe-signature");

      if (!sig) {
        return Response.json(
          { error: "Missing stripe signature" },
          { status: 400 }
        );
      }

      let event: any;

      try {
        event = stripe.webhooks.constructEvent(
          body,
          sig,
          privateEnv.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return Response.json({ error: "Invalid signature" }, { status: 400 });
      }

      console.log("Received Stripe webhook:", event.type);

      try {
        switch (event.type) {
          case "checkout.session.completed":
            await handleCheckoutCompleted(event.data.object);
            break;

          case "customer.subscription.created":
          case "customer.subscription.updated":
            await handleSubscriptionChange(event.data.object);
            break;

          case "customer.subscription.deleted":
            await handleSubscriptionDeleted(event.data.object);
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        return Response.json({ received: true });
      } catch (error) {
        console.error("Error processing webhook:", error);
        return Response.json(
          { error: "Webhook processing failed" },
          { status: 500 }
        );
      }
    },
  }
);

async function handleCheckoutCompleted(session: any) {
  console.log("Handling checkout completed:", session.id);

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription
  );

  console.log("Subscription:", subscription);

  // Use item-level billing period (new Stripe API)
  const subscriptionItem = subscription.items.data[0];
  const periodEnd = subscriptionItem?.current_period_end;

  if (!periodEnd || isNaN(periodEnd)) {
    console.error("Invalid item current_period_end:", periodEnd);
    throw new Error("Invalid subscription period end date");
  }

  await updateUserSubscription(session.metadata.userId, {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
    plan: getPlanByPriceId(subscriptionItem?.price.id)
      ?.plan as SubscriptionPlan,
    status: subscription.status as SubscriptionStatus,
    expiresAt: new Date(periodEnd * 1000),
  });

  console.log(`Checkout completed for user ${session.metadata.userId}`);
}

async function handleSubscriptionChange(subscription: any) {
  console.log("Handling subscription change:", subscription.id);

  const priceId = subscription.items.data[0]?.price.id;
  const planDetails = getPlanByPriceId(priceId);

  if (!planDetails) {
    console.error("No plan found for price ID:", priceId);
    return;
  }

  // Find user by customer ID - let Stripe handle retries if this fails
  const [userData] = await database
    .select()
    .from(user)
    .where(eq(user.stripeCustomerId, subscription.customer));

  if (!userData) {
    console.error("No user found for customer:", subscription.customer);
    return;
  }

  // Use item-level billing period (new Stripe API)
  const subscriptionItem = subscription.items.data[0];
  const periodEnd = subscriptionItem?.current_period_end;
  const expiresAt = periodEnd ? new Date(periodEnd * 1000) : undefined;

  await updateUserSubscription(userData.id, {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
    plan: planDetails.plan,
    status: subscription.status as SubscriptionStatus,
    expiresAt,
  });

  console.log(
    `Updated subscription ${subscription.id} for user ${userData.id}`
  );
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log("Handling subscription deleted:", subscription.id);

  const customerId = subscription.customer;

  // Find user by customer ID
  const [userData] = await database
    .select()
    .from(user)
    .where(eq(user.stripeCustomerId, customerId));

  if (!userData) {
    console.error("No user found for customer:", customerId);
    return;
  }

  // Reset user to free plan
  await updateUserPlan(userData.id, "free");

  // Update subscription status
  await database
    .update(user)
    .set({
      subscriptionStatus: "canceled",
      subscriptionExpiresAt: new Date(subscription.canceled_at * 1000),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userData.id));

  console.log(
    `Reset user ${userData.id} to free plan after subscription deletion`
  );
}
