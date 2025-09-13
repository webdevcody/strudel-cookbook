CREATE TABLE "sound_heart" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sound_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sound_heart" ADD CONSTRAINT "sound_heart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sound_heart" ADD CONSTRAINT "sound_heart_sound_id_sound_id_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sound"("id") ON DELETE cascade ON UPDATE no action;