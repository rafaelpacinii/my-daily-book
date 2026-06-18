PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_editions` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`metadata_source` text DEFAULT 'google_books' NOT NULL,
	`external_metadata_id` text NOT NULL,
	`google_books_id` text,
	`google_books_etag` text,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text,
	`publisher` text,
	`published_date` text,
	`page_count` integer,
	`language` text,
	`print_type` text,
	`isbn_10` text,
	`isbn_13` text,
	`thumbnail_url` text,
	`small_thumbnail_url` text,
	`cover_url` text,
	`preview_link` text,
	`info_link` text,
	`canonical_volume_link` text,
	`metadata_fetched_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_editions`("id", "work_id", "metadata_source", "external_metadata_id", "google_books_id", "google_books_etag", "title", "subtitle", "description", "publisher", "published_date", "page_count", "language", "print_type", "isbn_10", "isbn_13", "thumbnail_url", "small_thumbnail_url", "cover_url", "preview_link", "info_link", "canonical_volume_link", "metadata_fetched_at", "created_at", "updated_at") SELECT "id", "work_id", 'google_books', "google_books_id", "google_books_id", "google_books_etag", "title", "subtitle", "description", "publisher", "published_date", "page_count", "language", "print_type", "isbn_10", "isbn_13", "thumbnail_url", "small_thumbnail_url", "cover_url", "preview_link", "info_link", "canonical_volume_link", "metadata_fetched_at", "created_at", "updated_at" FROM `editions`;--> statement-breakpoint
DROP TABLE `editions`;--> statement-breakpoint
ALTER TABLE `__new_editions` RENAME TO `editions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `editions_google_books_id_unique` ON `editions` (`google_books_id`);--> statement-breakpoint
CREATE INDEX `editions_work_id_idx` ON `editions` (`work_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `editions_metadata_source_external_id_unique` ON `editions` (`metadata_source`,`external_metadata_id`);--> statement-breakpoint
CREATE INDEX `editions_title_idx` ON `editions` (`title`);--> statement-breakpoint
CREATE INDEX `editions_isbn_10_idx` ON `editions` (`isbn_10`);--> statement-breakpoint
CREATE INDEX `editions_isbn_13_idx` ON `editions` (`isbn_13`);
