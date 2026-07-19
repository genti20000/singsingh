CREATE TABLE IF NOT EXISTS `submissions` (
  `id` text PRIMARY KEY NOT NULL,
  `media_key` text NOT NULL UNIQUE,
  `media_type` text NOT NULL,
  `caption` text,
  `share_consent` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` text NOT NULL,
  `approved_at` text,
  `is_shared` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_submissions_status_created` ON `submissions` (`status`,`created_at`);
