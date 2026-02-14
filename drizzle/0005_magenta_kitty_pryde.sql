ALTER TABLE `expenses` ADD `total_installments` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `current_installment` int DEFAULT 1 NOT NULL;