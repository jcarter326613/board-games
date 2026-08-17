ALTER TABLE "refresh_tokens" ADD COLUMN "session_id" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens" USING btree ("session_id");