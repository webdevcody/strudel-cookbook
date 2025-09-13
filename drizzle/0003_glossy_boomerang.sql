CREATE TABLE "song" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"album" text,
	"genre" text,
	"description" text,
	"audio_url" text NOT NULL,
	"cover_image_url" text,
	"status" text NOT NULL,
	"duration" integer,
	"play_count" integer NOT NULL,
	"download_count" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DROP TABLE "video" CASCADE;--> statement-breakpoint
ALTER TABLE "song" ADD CONSTRAINT "song_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;