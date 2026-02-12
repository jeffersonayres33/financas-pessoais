CREATE TABLE `dashboard_widget_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`widget_id` varchar(50) NOT NULL,
	`is_visible` int NOT NULL DEFAULT 1,
	`position` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_widget_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dashboard_widget_preferences` ADD CONSTRAINT `dashboard_widget_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;