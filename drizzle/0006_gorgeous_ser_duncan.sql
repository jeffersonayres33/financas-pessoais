CREATE TABLE `user_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`account_name` varchar(100) NOT NULL,
	`account_type` enum('personal','business','family','other') NOT NULL DEFAULT 'personal',
	`description` text,
	`is_default` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `active_account_id` int;--> statement-breakpoint
ALTER TABLE `user_accounts` ADD CONSTRAINT `user_accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;