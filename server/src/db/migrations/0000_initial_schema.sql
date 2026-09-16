CREATE TABLE `characters` (
	`code` varchar(32) NOT NULL,
	`display_name` varchar(191) NOT NULL,
	`years` varchar(64) NOT NULL,
	`front_image` varchar(255) NOT NULL,
	`back_image` varchar(255) NOT NULL,
	`tie_order` smallint NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `characters_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `test_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version_number` int NOT NULL,
	`status` enum('Draft','Published','Archived') NOT NULL DEFAULT 'Draft',
	`title` varchar(191),
	`notes` text,
	`published_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `test_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_test_versions_version_number` UNIQUE(`version_number`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`test_version_id` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`text` text NOT NULL,
	`display_order` smallint NOT NULL,
	`is_tie_breaker` boolean NOT NULL DEFAULT false,
	`image_asset_id` int,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_questions_version_code` UNIQUE(`test_version_id`,`code`),
	CONSTRAINT `uq_questions_version_order` UNIQUE(`test_version_id`,`display_order`)
);
--> statement-breakpoint
CREATE TABLE `options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question_id` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`text` text NOT NULL,
	`display_order` smallint NOT NULL,
	`internal_value` varchar(32) NOT NULL,
	`score` decimal(6,2) NOT NULL DEFAULT '1',
	`scoring_metadata` json,
	`image_asset_id` int,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `options_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_options_question_code` UNIQUE(`question_id`,`code`),
	CONSTRAINT `uq_options_question_order` UNIQUE(`question_id`,`display_order`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(120) NOT NULL,
	`last_name` varchar(120) NOT NULL,
	`mobile_original` varchar(40) NOT NULL,
	`normalized_first_name` varchar(120) NOT NULL,
	`normalized_last_name` varchar(120) NOT NULL,
	`normalized_mobile` varchar(20) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_participants_identity` UNIQUE(`normalized_mobile`,`normalized_first_name`,`normalized_last_name`)
);
--> statement-breakpoint
CREATE TABLE `test_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`public_id` varchar(32) NOT NULL,
	`participant_id` int NOT NULL,
	`test_version_id` int NOT NULL,
	`org_code` varchar(64),
	`status` enum('NotStarted','InProgress','Completed') NOT NULL DEFAULT 'NotStarted',
	`tracking_code` varchar(16),
	`started_at` datetime,
	`last_activity_at` datetime NOT NULL,
	`completed_at` datetime,
	`reopen_count` int NOT NULL DEFAULT 0,
	`completion_cycle` int NOT NULL DEFAULT 1,
	`result_character_code` varchar(32),
	`result_scores` json,
	`result_computed_at` datetime,
	`tie_break_required` boolean NOT NULL DEFAULT false,
	`tied_characters` json,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `test_attempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_test_attempts_public_id` UNIQUE(`public_id`),
	CONSTRAINT `uq_test_attempts_participant` UNIQUE(`participant_id`),
	CONSTRAINT `uq_test_attempts_tracking_code` UNIQUE(`tracking_code`)
);
--> statement-breakpoint
CREATE TABLE `answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attempt_id` int NOT NULL,
	`question_id` int NOT NULL,
	`selected_option_id` int NOT NULL,
	`last_client_mutation_id` varchar(64),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `answers_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_answers_attempt_question` UNIQUE(`attempt_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `idempotency_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scope` varchar(32) NOT NULL,
	`idempotency_key` varchar(128) NOT NULL,
	`attempt_id` int NOT NULL,
	`completion_cycle` int NOT NULL,
	`request_hash` varchar(64) NOT NULL,
	`response_status` smallint NOT NULL,
	`response_body` text NOT NULL,
	`created_at` datetime NOT NULL,
	`expires_at` datetime,
	CONSTRAINT `idempotency_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_idempotency_scope_key` UNIQUE(`scope`,`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`admin_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`csrf_token` varchar(64) NOT NULL,
	`user_agent` varchar(255),
	`ip_address` varchar(64),
	`expires_at` datetime NOT NULL,
	`revoked_at` datetime,
	`created_at` datetime NOT NULL,
	`last_seen_at` datetime NOT NULL,
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_admin_sessions_token_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`display_name` varchar(120) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`last_login_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_admins_username` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`stored_name` varchar(191) NOT NULL,
	`mime_type` varchar(64) NOT NULL,
	`size_bytes` int NOT NULL,
	`width` int,
	`height` int,
	`uploaded_by_admin_id` int,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL,
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_media_assets_stored_name` UNIQUE(`stored_name`)
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`setting_key` varchar(64) NOT NULL,
	`setting_value` text,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `app_settings_setting_key` PRIMARY KEY(`setting_key`)
);
--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_test_version_id_test_versions_id_fk` FOREIGN KEY (`test_version_id`) REFERENCES `test_versions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `questions` ADD CONSTRAINT `questions_image_asset_id_media_assets_id_fk` FOREIGN KEY (`image_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `options` ADD CONSTRAINT `options_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `options` ADD CONSTRAINT `options_image_asset_id_media_assets_id_fk` FOREIGN KEY (`image_asset_id`) REFERENCES `media_assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_attempts` ADD CONSTRAINT `test_attempts_participant_id_participants_id_fk` FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `test_attempts` ADD CONSTRAINT `test_attempts_test_version_id_test_versions_id_fk` FOREIGN KEY (`test_version_id`) REFERENCES `test_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_attempt_id_test_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `test_attempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answers` ADD CONSTRAINT `answers_selected_option_id_options_id_fk` FOREIGN KEY (`selected_option_id`) REFERENCES `options`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_admin_id_admins_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ix_questions_version_active` ON `questions` (`test_version_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `ix_options_question_active` ON `options` (`question_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `ix_participants_normalized_mobile` ON `participants` (`normalized_mobile`);--> statement-breakpoint
CREATE INDEX `ix_participants_normalized_name` ON `participants` (`normalized_last_name`,`normalized_first_name`);--> statement-breakpoint
CREATE INDEX `ix_test_attempts_status` ON `test_attempts` (`status`);--> statement-breakpoint
CREATE INDEX `ix_test_attempts_version` ON `test_attempts` (`test_version_id`);--> statement-breakpoint
CREATE INDEX `ix_test_attempts_org_code` ON `test_attempts` (`org_code`);--> statement-breakpoint
CREATE INDEX `ix_test_attempts_result` ON `test_attempts` (`result_character_code`);--> statement-breakpoint
CREATE INDEX `ix_answers_attempt` ON `answers` (`attempt_id`);--> statement-breakpoint
CREATE INDEX `ix_idempotency_attempt` ON `idempotency_records` (`attempt_id`);--> statement-breakpoint
CREATE INDEX `ix_idempotency_expires` ON `idempotency_records` (`expires_at`);--> statement-breakpoint
CREATE INDEX `ix_admin_sessions_admin` ON `admin_sessions` (`admin_id`);--> statement-breakpoint
CREATE INDEX `ix_admin_sessions_expires` ON `admin_sessions` (`expires_at`);