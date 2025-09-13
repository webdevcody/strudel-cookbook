ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_expires_at" timestamp;