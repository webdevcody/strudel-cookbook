CREATE TABLE "sound" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"strudel_code" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sound" ADD CONSTRAINT "sound_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;