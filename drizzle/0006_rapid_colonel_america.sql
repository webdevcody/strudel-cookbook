CREATE TABLE "heart" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"song_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "heart" ADD CONSTRAINT "heart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heart" ADD CONSTRAINT "heart_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE cascade ON UPDATE no action;