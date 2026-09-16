CREATE TYPE "public"."test_version_status" AS ENUM('Draft', 'Published', 'Archived');--> statement-breakpoint
CREATE TYPE "public"."attempt_status" AS ENUM('NotStarted', 'InProgress', 'Completed');--> statement-breakpoint
CREATE TABLE "characters" (
	"code" varchar(32) PRIMARY KEY NOT NULL,
	"display_name" varchar(191) NOT NULL,
	"years" varchar(64) NOT NULL,
	"front_image" varchar(255) NOT NULL,
	"back_image" varchar(255) NOT NULL,
	"tie_order" smallint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_number" integer NOT NULL,
	"status" "test_version_status" DEFAULT 'Draft' NOT NULL,
	"title" varchar(191),
	"notes" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_version_id" integer NOT NULL,
	"code" varchar(32) NOT NULL,
	"text" text NOT NULL,
	"display_order" smallint NOT NULL,
	"is_tie_breaker" boolean DEFAULT false NOT NULL,
	"image_asset_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"code" varchar(32) NOT NULL,
	"text" text NOT NULL,
	"display_order" smallint NOT NULL,
	"internal_value" varchar(32) NOT NULL,
	"score" numeric(6, 2) DEFAULT '1' NOT NULL,
	"scoring_metadata" jsonb,
	"image_asset_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"mobile_original" varchar(40) NOT NULL,
	"normalized_first_name" varchar(120) NOT NULL,
	"normalized_last_name" varchar(120) NOT NULL,
	"normalized_mobile" varchar(20) NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(32) NOT NULL,
	"participant_id" integer NOT NULL,
	"test_version_id" integer NOT NULL,
	"org_code" varchar(64),
	"status" "attempt_status" DEFAULT 'NotStarted' NOT NULL,
	"tracking_code" varchar(16),
	"started_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"reopen_count" integer DEFAULT 0 NOT NULL,
	"completion_cycle" integer DEFAULT 1 NOT NULL,
	"result_character_code" varchar(32),
	"result_scores" jsonb,
	"result_computed_at" timestamp with time zone,
	"tie_break_required" boolean DEFAULT false NOT NULL,
	"tied_characters" jsonb,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"selected_option_id" integer NOT NULL,
	"last_client_mutation_id" varchar(64),
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" varchar(32) NOT NULL,
	"idempotency_key" varchar(128) NOT NULL,
	"attempt_id" integer NOT NULL,
	"completion_cycle" integer NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"response_status" smallint NOT NULL,
	"response_body" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"csrf_token" varchar(64) NOT NULL,
	"user_agent" varchar(255),
	"ip_address" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"stored_name" varchar(191) NOT NULL,
	"public_url" varchar(512),
	"mime_type" varchar(64) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"uploaded_by_admin_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"setting_key" varchar(64) PRIMARY KEY NOT NULL,
	"setting_value" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_version_id_test_versions_id_fk" FOREIGN KEY ("test_version_id") REFERENCES "public"."test_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_image_asset_id_media_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_version_id_test_versions_id_fk" FOREIGN KEY ("test_version_id") REFERENCES "public"."test_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_selected_option_id_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_test_versions_version_number" ON "test_versions" USING btree ("version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_questions_version_code" ON "questions" USING btree ("test_version_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_questions_version_order" ON "questions" USING btree ("test_version_id","display_order");--> statement-breakpoint
CREATE INDEX "ix_questions_version_active" ON "questions" USING btree ("test_version_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_options_question_code" ON "options" USING btree ("question_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_options_question_order" ON "options" USING btree ("question_id","display_order");--> statement-breakpoint
CREATE INDEX "ix_options_question_active" ON "options" USING btree ("question_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_participants_identity" ON "participants" USING btree ("normalized_mobile","normalized_first_name","normalized_last_name");--> statement-breakpoint
CREATE INDEX "ix_participants_normalized_mobile" ON "participants" USING btree ("normalized_mobile");--> statement-breakpoint
CREATE INDEX "ix_participants_normalized_name" ON "participants" USING btree ("normalized_last_name","normalized_first_name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_test_attempts_public_id" ON "test_attempts" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_test_attempts_participant" ON "test_attempts" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_test_attempts_tracking_code" ON "test_attempts" USING btree ("tracking_code");--> statement-breakpoint
CREATE INDEX "ix_test_attempts_status" ON "test_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_test_attempts_version" ON "test_attempts" USING btree ("test_version_id");--> statement-breakpoint
CREATE INDEX "ix_test_attempts_org_code" ON "test_attempts" USING btree ("org_code");--> statement-breakpoint
CREATE INDEX "ix_test_attempts_result" ON "test_attempts" USING btree ("result_character_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_answers_attempt_question" ON "answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "ix_answers_attempt" ON "answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_idempotency_scope_key" ON "idempotency_records" USING btree ("scope","idempotency_key");--> statement-breakpoint
CREATE INDEX "ix_idempotency_attempt" ON "idempotency_records" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "ix_idempotency_expires" ON "idempotency_records" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_admin_sessions_token_hash" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "ix_admin_sessions_admin" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "ix_admin_sessions_expires" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_admins_username" ON "admins" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_media_assets_stored_name" ON "media_assets" USING btree ("stored_name");