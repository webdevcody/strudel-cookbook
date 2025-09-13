CREATE TABLE "sound_tag" (
	"id" text PRIMARY KEY NOT NULL,
	"sound_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "sound_tag" ADD CONSTRAINT "sound_tag_sound_id_sound_id_fk" FOREIGN KEY ("sound_id") REFERENCES "public"."sound"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sound_tag" ADD CONSTRAINT "sound_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;