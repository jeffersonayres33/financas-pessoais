import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categorias de despesas e receitas
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["expense", "income"]).notNull(),
  monthlyBudget: int("monthly_budget").notNull().default(0),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Despesas
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  establishment: varchar("establishment", { length: 200 }).notNull(),
  categoryId: int("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  purchaseDate: timestamp("purchase_date").notNull(),
  amount: int("amount").notNull(), // valor em centavos
  paid: mysqlEnum("paid", ["yes", "no"]).notNull().default("no"),
  paymentDate: timestamp("payment_date"),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Receitas
 */
export const incomes = mysqlTable("incomes", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 200 }).notNull(),
  categoryId: int("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  amount: int("amount").notNull(), // valor em centavos
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = typeof incomes.$inferInsert;

/**
 * Notificações de orçamento
 */
export const budgetNotifications = mysqlTable("budget_notifications", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  percentage: int("percentage").notNull(), // 80 ou 100
  notifiedAt: timestamp("notified_at").defaultNow().notNull(),
});

export type BudgetNotification = typeof budgetNotifications.$inferSelect;
export type InsertBudgetNotification = typeof budgetNotifications.$inferInsert;
/**
 * Anexos (fotos de recibos e notas fiscais)
 */
export const expenseAttachments = mysqlTable("expense_attachments", {
  id: int("id").autoincrement().primaryKey(),
  expenseId: int("expense_id").notNull().references(() => expenses.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 50 }).notNull(),
  fileSize: int("file_size").notNull(),
  uploadedBy: int("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExpenseAttachment = typeof expenseAttachments.$inferSelect;
export type InsertExpenseAttachment = typeof expenseAttachments.$inferInsert;

/**
 * Preferências de widgets do usuário na Dashboard
 */
export const dashboardWidgetPreferences = mysqlTable("dashboard_widget_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  widgetId: varchar("widget_id", { length: 50 }).notNull(), // "income", "expense", "balance", "economy", "pie", "bar", "line", "budget"
  isVisible: int("is_visible").notNull().default(1), // 0 ou 1
  position: int("position").notNull().default(0), // ordem de exibição
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type DashboardWidgetPreference = typeof dashboardWidgetPreferences.$inferSelect;
export type InsertDashboardWidgetPreference = typeof dashboardWidgetPreferences.$inferInsert;


/**
 * Logs de erros para análise e rastreamento
 */
export const errorLogs = mysqlTable("error_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id, { onDelete: "cascade" }),
  errorType: varchar("error_type", { length: 50 }).notNull(), // "DOM", "Network", "Application"
  errorMessage: text("error_message").notNull(),
  errorStack: text("error_stack"),
  componentStack: text("component_stack"),
  browser: varchar("browser", { length: 100 }).notNull(), // "Chrome", "Firefox", "Safari", "Edge"
  browserVersion: varchar("browser_version", { length: 50 }),
  page: varchar("page", { length: 255 }).notNull(), // URL da página onde ocorreu o erro
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  resolved: int("resolved").notNull().default(0), // 0 ou 1
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
