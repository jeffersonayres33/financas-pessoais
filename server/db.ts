import { and, between, desc, eq, sql, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { budgetNotifications, categories, expenses, incomes, InsertCategory, InsertExpense, InsertIncome, InsertBudgetNotification, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= CATEGORIES =============

export async function getCategories(userId: number, type?: "expense" | "income") {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(categories.userId, userId)];
  if (type) {
    conditions.push(eq(categories.type, type));
  }

  return db.select().from(categories).where(and(...conditions)).orderBy(categories.name);
}

export async function getCategoryById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);

  return result[0];
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}

export async function updateCategory(id: number, userId: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

export async function deleteCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

// ============= EXPENSES =============

export async function getExpenses(
  userId: number,
  filters?: {
    categoryId?: number;
    startDate?: Date;
    endDate?: Date;
    paid?: "yes" | "no";
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(expenses.userId, userId)];

  if (filters?.categoryId) {
    conditions.push(eq(expenses.categoryId, filters.categoryId));
  }
  if (filters?.startDate && filters?.endDate) {
    conditions.push(between(expenses.purchaseDate, filters.startDate, filters.endDate));
  }
  if (filters?.paid) {
    conditions.push(eq(expenses.paid, filters.paid));
  }

  return db
    .select({
      expense: expenses,
      category: categories,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.purchaseDate));
}

export async function getExpenseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .limit(1);

  return result[0];
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(expenses).values(data);
  return result[0].insertId;
}

export async function updateExpense(id: number, userId: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(expenses)
    .set(data)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// ============= INCOMES =============

export async function getIncomes(
  userId: number,
  filters?: {
    categoryId?: number;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(incomes.userId, userId)];

  if (filters?.categoryId) {
    conditions.push(eq(incomes.categoryId, filters.categoryId));
  }
  if (filters?.startDate && filters?.endDate) {
    conditions.push(between(incomes.date, filters.startDate, filters.endDate));
  }

  return db
    .select({
      income: incomes,
      category: categories,
    })
    .from(incomes)
    .leftJoin(categories, eq(incomes.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(incomes.date));
}

export async function getIncomeById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(incomes)
    .where(and(eq(incomes.id, id), eq(incomes.userId, userId)))
    .limit(1);

  return result[0];
}

export async function createIncome(data: InsertIncome) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(incomes).values(data);
  return result[0].insertId;
}

export async function updateIncome(id: number, userId: number, data: Partial<InsertIncome>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(incomes)
    .set(data)
    .where(and(eq(incomes.id, id), eq(incomes.userId, userId)));
}

export async function deleteIncome(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(incomes).where(and(eq(incomes.id, id), eq(incomes.userId, userId)));
}

// ============= ANALYTICS =============

export async function getMonthlySummary(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return { totalIncome: 0, totalExpense: 0, balance: 0 };

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Total de receitas
  const incomeResult = await db
    .select({ total: sum(incomes.amount) })
    .from(incomes)
    .where(and(eq(incomes.userId, userId), between(incomes.date, startDate, endDate)));

  // Total de despesas
  const expenseResult = await db
    .select({ total: sum(expenses.amount) })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), between(expenses.purchaseDate, startDate, endDate)));

  const totalIncome = Number(incomeResult[0]?.total || 0);
  const totalExpense = Number(expenseResult[0]?.total || 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export async function getExpensesByCategory(userId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      monthlyBudget: categories.monthlyBudget,
      totalSpent: sum(expenses.amount),
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(
      and(
        eq(expenses.userId, userId),
        between(expenses.purchaseDate, startDate, endDate),
        eq(categories.type, "expense")
      )
    )
    .groupBy(categories.id, categories.name, categories.monthlyBudget);
}

export async function getAnnualReport(userId: number, year: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  return db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      month: sql<number>`MONTH(${expenses.purchaseDate})`,
      totalSpent: sum(expenses.amount),
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(
      and(
        eq(expenses.userId, userId),
        between(expenses.purchaseDate, startDate, endDate),
        eq(categories.type, "expense")
      )
    )
    .groupBy(categories.id, categories.name, sql`MONTH(${expenses.purchaseDate})`);
}

// ============= BUDGET NOTIFICATIONS =============

export async function createBudgetNotification(data: InsertBudgetNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(budgetNotifications).values(data);
  return result[0].insertId;
}

export async function hasNotificationBeenSent(
  categoryId: number,
  month: number,
  year: number,
  percentage: number
) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(budgetNotifications)
    .where(
      and(
        eq(budgetNotifications.categoryId, categoryId),
        eq(budgetNotifications.month, month),
        eq(budgetNotifications.year, year),
        eq(budgetNotifications.percentage, percentage)
      )
    )
    .limit(1);

  return result.length > 0;
}
