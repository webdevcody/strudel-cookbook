CREATE TABLE "sound_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"sound_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DROP TABLE "playlist" CASCADE;--> statement-breakpoint
DROP TABLE "playlist_song" CASCADE;--> statement-breakpoint
ALTER TABLE "sound_comment" ADD CONSTRAINT "sound_comment_sound_id_sound_id_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sound"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sound_comment" ADD CONSTRAINT "sound_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;