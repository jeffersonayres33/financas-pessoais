CREATE TABLE `budget_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`percentage` int NOT NULL,
	`notified_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budget_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('expense','income') NOT NULL,
	`monthly_budget` int NOT NULL DEFAULT 0,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`establishment` varchar(200) NOT NULL,
	`category_id` int NOT NULL,
	`purchase_date` timestamp NOT NULL,
	`amount` int NOT NULL,
	`paid` enum('yes','no') NOT NULL DEFAULT 'no',
	`payment_date` timestamp,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` varchar(200) NOT NULL,
	`category_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`amount` int NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `budget_notifications` ADD CONSTRAINT `budget_notifications_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;