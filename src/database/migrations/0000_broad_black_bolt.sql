CREATE TABLE `authors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `authors_name_idx` ON `authors` (`name`);--> statement-breakpoint
CREATE TABLE `book_copies` (
	`id` text PRIMARY KEY NOT NULL,
	`library_book_id` text NOT NULL,
	`edition_id` text NOT NULL,
	`format` text NOT NULL,
	`label` text,
	`notes` text,
	`acquired_at` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`library_book_id`) REFERENCES `library_books`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `book_copies_library_book_id_idx` ON `book_copies` (`library_book_id`);--> statement-breakpoint
CREATE INDEX `book_copies_edition_id_idx` ON `book_copies` (`edition_id`);--> statement-breakpoint
CREATE INDEX `book_copies_format_idx` ON `book_copies` (`format`);--> statement-breakpoint
CREATE UNIQUE INDEX `book_copies_library_edition_format_unique` ON `book_copies` (`library_book_id`,`edition_id`,`format`);--> statement-breakpoint
CREATE TABLE `book_list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`book_list_id` text NOT NULL,
	`work_id` text NOT NULL,
	`edition_id` text,
	`position` integer,
	`notes` text,
	`wishlist_priority` text,
	`desired_format` text,
	`target_price` real,
	`target_currency` text,
	`added_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_list_id`) REFERENCES `book_lists`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `book_list_items_list_id_idx` ON `book_list_items` (`book_list_id`);--> statement-breakpoint
CREATE INDEX `book_list_items_work_id_idx` ON `book_list_items` (`work_id`);--> statement-breakpoint
CREATE INDEX `book_list_items_edition_id_idx` ON `book_list_items` (`edition_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `book_list_items_list_work_edition_unique` ON `book_list_items` (`book_list_id`,`work_id`,`edition_id`);--> statement-breakpoint
CREATE INDEX `book_list_items_list_position_idx` ON `book_list_items` (`book_list_id`,`position`);--> statement-breakpoint
CREATE TABLE `book_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'custom' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `book_lists_name_idx` ON `book_lists` (`name`);--> statement-breakpoint
CREATE INDEX `book_lists_type_idx` ON `book_lists` (`type`);--> statement-breakpoint
CREATE TABLE `editions` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`google_books_id` text NOT NULL,
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
CREATE UNIQUE INDEX `editions_google_books_id_unique` ON `editions` (`google_books_id`);--> statement-breakpoint
CREATE INDEX `editions_work_id_idx` ON `editions` (`work_id`);--> statement-breakpoint
CREATE INDEX `editions_title_idx` ON `editions` (`title`);--> statement-breakpoint
CREATE INDEX `editions_isbn_10_idx` ON `editions` (`isbn_10`);--> statement-breakpoint
CREATE INDEX `editions_isbn_13_idx` ON `editions` (`isbn_13`);--> statement-breakpoint
CREATE TABLE `library_books` (
	`id` text PRIMARY KEY NOT NULL,
	`work_id` text NOT NULL,
	`status` text DEFAULT 'to_read' NOT NULL,
	`rating` integer,
	`notes` text,
	`added_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_books_work_id_unique` ON `library_books` (`work_id`);--> statement-breakpoint
CREATE INDEX `library_books_status_idx` ON `library_books` (`status`);--> statement-breakpoint
CREATE TABLE `purchase_links` (
	`id` text PRIMARY KEY NOT NULL,
	`book_list_item_id` text NOT NULL,
	`store_name` text,
	`url` text NOT NULL,
	`price` real,
	`currency` text,
	`notes` text,
	`last_checked_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`book_list_item_id`) REFERENCES `book_list_items`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `purchase_links_book_list_item_id_idx` ON `purchase_links` (`book_list_item_id`);--> statement-breakpoint
CREATE INDEX `purchase_links_store_name_idx` ON `purchase_links` (`store_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_links_item_url_unique` ON `purchase_links` (`book_list_item_id`,`url`);--> statement-breakpoint
CREATE TABLE `reading_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`library_book_id` text NOT NULL,
	`edition_id` text NOT NULL,
	`book_copy_id` text,
	`cycle_number` integer NOT NULL,
	`status` text DEFAULT 'reading' NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`dropped_at` text,
	`last_read_at` text,
	`rating` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`library_book_id`) REFERENCES `library_books`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`book_copy_id`) REFERENCES `book_copies`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_cycles_library_book_number_unique` ON `reading_cycles` (`library_book_id`,`cycle_number`);--> statement-breakpoint
CREATE INDEX `reading_cycles_library_book_id_idx` ON `reading_cycles` (`library_book_id`);--> statement-breakpoint
CREATE INDEX `reading_cycles_edition_id_idx` ON `reading_cycles` (`edition_id`);--> statement-breakpoint
CREATE INDEX `reading_cycles_book_copy_id_idx` ON `reading_cycles` (`book_copy_id`);--> statement-breakpoint
CREATE INDEX `reading_cycles_status_idx` ON `reading_cycles` (`status`);--> statement-breakpoint
CREATE INDEX `reading_cycles_started_at_idx` ON `reading_cycles` (`started_at`);--> statement-breakpoint
CREATE TABLE `reading_goal_items` (
	`id` text PRIMARY KEY NOT NULL,
	`reading_goal_id` text NOT NULL,
	`library_book_id` text NOT NULL,
	`position` integer,
	`completed_at` text,
	`added_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`reading_goal_id`) REFERENCES `reading_goals`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`library_book_id`) REFERENCES `library_books`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_goal_items_goal_book_unique` ON `reading_goal_items` (`reading_goal_id`,`library_book_id`);--> statement-breakpoint
CREATE INDEX `reading_goal_items_goal_id_idx` ON `reading_goal_items` (`reading_goal_id`);--> statement-breakpoint
CREATE INDEX `reading_goal_items_library_book_id_idx` ON `reading_goal_items` (`library_book_id`);--> statement-breakpoint
CREATE INDEX `reading_goal_items_goal_position_idx` ON `reading_goal_items` (`reading_goal_id`,`position`);--> statement-breakpoint
CREATE TABLE `reading_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`start_date` text NOT NULL,
	`target_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`completed_at` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reading_goals_status_idx` ON `reading_goals` (`status`);--> statement-breakpoint
CREATE INDEX `reading_goals_target_date_idx` ON `reading_goals` (`target_date`);--> statement-breakpoint
CREATE INDEX `reading_goals_status_target_date_idx` ON `reading_goals` (`status`,`target_date`);--> statement-breakpoint
CREATE TABLE `reading_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`reading_cycle_id` text NOT NULL,
	`reading_date` text NOT NULL,
	`start_page` integer NOT NULL,
	`end_page` integer NOT NULL,
	`duration_seconds` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`reading_cycle_id`) REFERENCES `reading_cycles`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reading_logs_reading_cycle_id_idx` ON `reading_logs` (`reading_cycle_id`);--> statement-breakpoint
CREATE INDEX `reading_logs_reading_date_idx` ON `reading_logs` (`reading_date`);--> statement-breakpoint
CREATE INDEX `reading_logs_cycle_date_idx` ON `reading_logs` (`reading_cycle_id`,`reading_date`);--> statement-breakpoint
CREATE TABLE `work_authors` (
	`work_id` text NOT NULL,
	`author_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`work_id`, `author_id`),
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `work_authors_work_id_idx` ON `work_authors` (`work_id`);--> statement-breakpoint
CREATE INDEX `work_authors_author_id_idx` ON `work_authors` (`author_id`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`original_title` text,
	`description` text,
	`original_language` text,
	`first_published_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `works_title_idx` ON `works` (`title`);