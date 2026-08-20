CREATE TABLE "deck_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deck_type_inclusions" (
	"deck_type_id" uuid NOT NULL,
	"included_deck_type_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deck_type_inclusions_deck_type_id_included_deck_type_id_pk" PRIMARY KEY("deck_type_id","included_deck_type_id"),
	CONSTRAINT "deck_type_inclusions_distinct_check" CHECK ("deck_type_id" <> "included_deck_type_id")
);
--> statement-breakpoint
ALTER TABLE "deck_type_inclusions" ADD CONSTRAINT "deck_type_inclusions_deck_type_id_deck_types_id_fk" FOREIGN KEY ("deck_type_id") REFERENCES "public"."deck_types"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deck_type_inclusions" ADD CONSTRAINT "deck_type_inclusions_included_deck_type_id_deck_types_id_fk" FOREIGN KEY ("included_deck_type_id") REFERENCES "public"."deck_types"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "deck_types_name_unique" ON "deck_types" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "deck_type_inclusions_included_deck_type_id_idx" ON "deck_type_inclusions" USING btree ("included_deck_type_id");
