CREATE TABLE `expense_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expense_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` text NOT NULL,
	`file_key` varchar(255) NOT NULL,
	`mime_type` varchar(50) NOT NULL,
	`file_size` int NOT NULL,
	`uploaded_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expense_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `expense_attachments` ADD CONSTRAINT `expense_attachments_expense_id_expenses_id_fk` FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expense_attachments` ADD CONSTRAINT `expense_attachments_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;