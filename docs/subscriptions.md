# Subscription System

This document explains how the subscription and payment system works in this application, including checkout flow, webhooks, and utilities for managing subscription plans.

## Overview

The application uses Stripe for subscription management with three tiers: Free, Basic ($9.99/month), and Pro ($29.99/month). The system is built around a user-centric model where subscription data is stored directly on the user record for efficient access.

## Architecture

### Database Schema

User subscription data is stored in the `user` table in `src/db/schema.ts`:

```typescript
export const user = pgTable("user", {
  // ... other fields
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"), 
  plan: text("plan").$default(() => "free").notNull(),
  subscriptionStatus: text("subscription_status"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
});
```

**Key Fields:**
- `plan`: `"free" | "basic" | "pro"` - The user's current subscription tier
- `subscriptionStatus`: `"active" | "canceled" | "past_due" | "unpaid" | "incomplete"` - Stripe subscription status
- `subscriptionExpiresAt`: When the current subscription period ends
- `stripeCustomerId`: Links to Stripe customer record
- `subscriptionId`: Links to Stripe subscription record

## Subscription Plans

Plans are defined in `src/lib/plans.ts`:

```typescript
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    plan: "free",
    price: 0,
    priceId: null,
    features: ["Upload up to 5 songs", "Create 1 playlist", ...]
  },
  BASIC: {
    name: "Basic", 
    plan: "basic",
    price: 999, // $9.99 in cents
    priceId: publicEnv.STRIPE_BASIC_PRICE_ID,
    features: ["Upload up to 50 songs", "Create up to 5 playlists", ...]
  },
  PRO: {
    name: "Pro",
    plan: "pro", 
    price: 2999, // $29.99 in cents
    priceId: publicEnv.STRIPE_PRO_PRICE_ID,
    features: ["Unlimited song uploads", "Unlimited playlists", ...]
  }
};
```

**Utility Functions:**
- `getPlanByPriceId(priceId)` - Find plan config by Stripe price ID
- `getPlanDetails(plan)` - Get plan configuration by plan name

## Checkout Process

### 1. Initiating Checkout

The checkout process starts in `src/fn/subscriptions.ts` with `createCheckoutSessionFn`:

```typescript
export const createCheckoutSessionFn = createServerFn({ method: "POST" })
  .middleware([authenticatedMiddleware])
  .validator(createCheckoutSessionSchema)
  .handler(async ({ data, context }) => {
    // 1. Validate user and price ID
    // 2. Create Stripe customer if needed 
    // 3. Create Stripe checkout session
    // 4. Return session URL for redirect
  });
```

**Process:**
1. User clicks upgrade button on pricing page
2. `useCreateCheckoutSession` hook calls `createCheckoutSessionFn`
3. Server creates Stripe checkout session with:
   - Customer ID (creates new customer if needed)
   - Price ID for the selected plan
   - Success/cancel redirect URLs
   - Metadata with user ID and plan
4. User is redirected to Stripe-hosted checkout page

### 2. Checkout Success

When checkout completes successfully:
1. User is redirected to `/settings?success=true`
2. Stripe sends `checkout.session.completed` webhook
3. Webhook handler updates user record with subscription details

## Webhook Implementation

Webhooks are handled in `src/routes/api/stripe/webhook.ts`:

### Key Webhook Events

**`checkout.session.completed`**
```typescript
async function handleCheckoutCompleted(session: any) {
  // 1. Retrieve subscription from Stripe
  // 2. Extract billing period from subscription items
  // 3. Update user record with subscription details
  await updateUserSubscription(session.metadata.userId, {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    plan: getPlanByPriceId(subscriptionItem?.price.id)?.plan,
    status: subscription.status,
    expiresAt: new Date(periodEnd * 1000),
  });
}
```

**`customer.subscription.created/updated`**
```typescript
async function handleSubscriptionChange(subscription: any) {
  // 1. Find user by Stripe customer ID
  // 2. Extract plan details from subscription
  // 3. Update user subscription data
}
```

**`customer.subscription.deleted`** 
```typescript
async function handleSubscriptionDeleted(subscription: any) {
  // 1. Find user by customer ID
  // 2. Reset user to free plan
  // 3. Update status to 'canceled'
}
```

### Webhook Security

- Webhook signature verification using `STRIPE_WEBHOOK_SECRET`
- Idempotent processing to handle duplicate webhooks
- Error handling and logging for debugging

## Subscription Utilities

### Core Utilities (`src/utils/subscription.ts`)

**`getUserSubscription(userId: string)`**
- Fetches user's current subscription data from database
- Returns plan, status, expiry, and Stripe IDs

**`updateUserSubscription(userId: string, subscriptionData: SubscriptionData)`**
- Updates user record with new subscription details
- Called by webhook handlers

**`isPlanActive(status, expiresAt): boolean`**
- Checks if subscription is active and not expired
- Used to determine if user has access to paid features

**`hasAccess(userPlan, requiredPlan): boolean`**
- Implements plan hierarchy: free (0) < basic (1) < pro (2)
- Determines if user's plan meets minimum requirements

**`getUploadLimit(plan): number`**
- Returns upload limits: Free (5), Basic (50), Pro (-1 for unlimited)
- Used to enforce feature limits

## React Hooks

### `useSubscription` Hook (`src/hooks/useSubscription.ts`)

**`useUserPlan()`**
- Fetches current user's plan data using TanStack Query
- Automatically enabled when user is authenticated
- Cached with query key `["user-plan"]`

**`useCreateCheckoutSession()`**
- Mutation hook for starting checkout process
- Redirects to Stripe checkout on success
- Shows error toast on failure

**`useCreatePortalSession()`**
- Opens Stripe customer portal in new tab
- For subscription management (billing, cancellation)

**`useCancelSubscription()`**
- Sets subscription to cancel at period end
- Shows success message and refreshes page

### Usage Example

```typescript
function SubscriptionButton() {
  const { data: userPlan, isLoading } = useUserPlan();
  const checkoutMutation = useCreateCheckoutSession();
  
  const handleUpgrade = () => {
    checkoutMutation.mutate({ 
      data: { priceId: SUBSCRIPTION_PLANS.BASIC.priceId } 
    });
  };
  
  if (userPlan?.data?.plan === 'basic') {
    return <span>Already subscribed</span>;
  }
  
  return (
    <button onClick={handleUpgrade} disabled={checkoutMutation.isPending}>
      Upgrade to Basic
    </button>
  );
}
```

## Subscription Management

### Customer Portal

Users can manage their subscriptions through Stripe's customer portal:

```typescript
const portalMutation = useCreatePortalSession();

const openPortal = () => {
  portalMutation.mutate();  // Opens portal in new tab
};
```

**Portal Features:**
- Update payment methods
- Download invoices
- Cancel subscription  
- View billing history

### Cancellation

Subscriptions can be canceled through:
1. **App Interface**: `useCancelSubscription()` hook
2. **Customer Portal**: Stripe-hosted cancellation flow

Both methods set `cancel_at_period_end = true`, allowing users to access paid features until the end of their billing period.

## UI Components

### `PricingSection` (`src/components/PricingSection.tsx`)
- Displays all three pricing tiers
- Handles plan selection and checkout initiation
- Redirects non-authenticated users to sign up

### `SubscriptionStatus` (`src/components/SubscriptionStatus.tsx`)
- Shows current plan and subscription status
- Displays billing date and status badges
- Provides management buttons (billing portal, cancellation)
- Warns about payment issues

### `PlanBadge` 
- Visual indicator of user's current plan
- Color-coded: Free (gray), Basic (blue), Pro (purple)

## Feature Access Control

### Plan Hierarchy

The system uses a numeric hierarchy for access control:

```typescript
const planHierarchy = {
  free: 0,
  basic: 1, 
  pro: 2
};
```

### Usage Limits

Limits are enforced throughout the application:

```typescript
// Check if user can create playlist
const playlistCount = await getUserPlaylistCount(userId);
const planLimit = getPlanPlaylistLimit(user.plan);

if (playlistCount >= planLimit) {
  throw new Error("Playlist limit reached");
}
```

### Upload Limits

```typescript
const uploadLimit = getUploadLimit(user.plan);
// Free: 5 songs
// Basic: 50 songs  
// Pro: -1 (unlimited)
```

## Environment Configuration

Required environment variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Public Environment (for frontend)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
BETTER_AUTH_URL=http://localhost:3000
```

## Error Handling

The system includes comprehensive error handling:

- **Webhook Failures**: Logged with context for debugging
- **Checkout Errors**: User-friendly toast messages
- **API Errors**: Structured error responses
- **Payment Failures**: Status badges and user notifications

## Development Testing

For testing subscriptions in development:

1. Use Stripe test mode keys
2. Use test credit card numbers (4242 4242 4242 4242)
3. Run webhook forwarding: `npm run stripe:listen`
4. Monitor webhook events in Stripe dashboard

## Security Considerations

- Webhook signature verification prevents tampering
- Server-side subscription validation 
- User authentication required for all subscription operations
- Sensitive Stripe keys stored in server environment only
- Plan enforcement on server side, not client side

## Troubleshooting

**Common Issues:**

1. **Webhook not firing**: Check endpoint URL and webhook secret
2. **User not upgraded**: Verify webhook handler updates user record
3. **Payment issues**: Check subscription status and payment method
4. **Access denied**: Verify `isPlanActive()` and `hasAccess()` logic

**Debugging Tools:**
- Stripe dashboard webhook logs
- Server console logs in webhook handler
- Database queries to check subscription status