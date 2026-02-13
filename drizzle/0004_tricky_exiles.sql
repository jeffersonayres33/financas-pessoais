CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`error_type` varchar(50) NOT NULL,
	`error_message` text NOT NULL,
	`error_stack` text,
	`component_stack` text,
	`browser` varchar(100) NOT NULL,
	`browser_version` varchar(50),
	`page` varchar(255) NOT NULL,
	`user_agent` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`resolved` int NOT NULL DEFAULT 0,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `error_logs` ADD CONSTRAINT `error_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;