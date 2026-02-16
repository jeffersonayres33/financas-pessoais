ALTER TABLE `categories` DROP FOREIGN KEY `categories_account_id_user_accounts_id_fk`;
--> statement-breakpoint
ALTER TABLE `expenses` DROP FOREIGN KEY `expenses_account_id_user_accounts_id_fk`;
--> statement-breakpoint
ALTER TABLE `incomes` DROP FOREIGN KEY `incomes_account_id_user_accounts_id_fk`;
--> statement-breakpoint
ALTER TABLE `categories` DROP COLUMN `account_id`;--> statement-breakpoint
ALTER TABLE `expenses` DROP COLUMN `account_id`;--> statement-breakpoint
ALTER TABLE `incomes` DROP COLUMN `account_id`;