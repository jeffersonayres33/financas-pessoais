import { getDb } from "./db";
import { errorLogs, type InsertErrorLog } from "../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

/**
 * Registrar um erro no banco de dados
 */
export async function logError(data: InsertErrorLog) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(errorLogs).values(data);
    return result;
  } catch (error) {
    console.error("[ErrorLogs] Erro ao registrar log:", error);
    throw error;
  }
}

/**
 * Obter todos os erros com filtros opcionais
 */
export async function getErrorLogs(filters?: {
  userId?: number;
  errorType?: string;
  browser?: string;
  page?: string;
  startDate?: Date;
  endDate?: Date;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.userId) {
    conditions.push(eq(errorLogs.userId, filters.userId));
  }

  if (filters?.errorType) {
    conditions.push(eq(errorLogs.errorType, filters.errorType));
  }

  if (filters?.browser) {
    conditions.push(eq(errorLogs.browser, filters.browser));
  }

  if (filters?.page) {
    conditions.push(eq(errorLogs.page, filters.page));
  }

  if (filters?.startDate) {
    conditions.push(gte(errorLogs.timestamp, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(errorLogs.timestamp, filters.endDate));
  }

  if (filters?.resolved !== undefined) {
    conditions.push(eq(errorLogs.resolved, filters.resolved ? 1 : 0));
  }

  let query = db.select().from(errorLogs);

  if (conditions.length > 0) {
    // @ts-ignore - Drizzle query builder type issue
    query = query.where(and(...conditions));
  }

  // @ts-ignore - Drizzle query builder type issue
  query = query.orderBy(desc(errorLogs.timestamp));

  if (filters?.limit) {
    // @ts-ignore - Drizzle query builder type issue
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    // @ts-ignore - Drizzle query builder type issue
    query = query.offset(filters.offset);
  }

  return await (query as any);
}

/**
 * Obter total de erros
 */
export async function getTotalErrorCount(filters?: {
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters?.userId) {
    conditions.push(eq(errorLogs.userId, filters.userId));
  }

  if (filters?.startDate) {
    conditions.push(gte(errorLogs.timestamp, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(errorLogs.timestamp, filters.endDate));
  }

  let query = db.select().from(errorLogs);

  if (conditions.length > 0) {
    // @ts-ignore - Drizzle query builder type issue
    query = query.where(and(...conditions));
  }

  const result = await (query as any);
  return result.length;
}

/**
 * Obter erros agrupados por tipo
 */
export async function getErrorsByType(filters?: {
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<Array<{ errorType: string; count: number }>> {
  const allErrors = await getErrorLogs({
    userId: filters?.userId,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  });

  const errorsByType: Record<string, number> = {};

  for (const error of allErrors) {
    const type = error.errorType;
    errorsByType[type] = (errorsByType[type] || 0) + 1;
  }

  return Object.entries(errorsByType).map(([errorType, count]) => ({
    errorType,
    count,
  }));
}

/**
 * Obter erros agrupados por navegador
 */
export async function getErrorsByBrowser(filters?: {
  userId?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<Array<{ browser: string; count: number }>> {
  const allErrors = await getErrorLogs({
    userId: filters?.userId,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  });

  const errorsByBrowser: Record<string, number> = {};

  for (const error of allErrors) {
    const browser = error.browser;
    errorsByBrowser[browser] = (errorsByBrowser[browser] || 0) + 1;
  }

  return Object.entries(errorsByBrowser).map(([browser, count]) => ({
    browser,
    count,
  }));
}

/**
 * Obter erros agrupados por página
 */
export async function getErrorsByPage(filters?: {
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<Array<{ page: string; count: number }>> {
  const allErrors = await getErrorLogs({
    userId: filters?.userId,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  });

  const errorsByPage: Record<string, number> = {};

  for (const error of allErrors) {
    const page = error.page;
    errorsByPage[page] = (errorsByPage[page] || 0) + 1;
  }

  let result = Object.entries(errorsByPage)
    .map(([page, count]) => ({
      page,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  if (filters?.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

/**
 * Marcar erro como resolvido
 */
export async function markErrorAsResolved(errorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(errorLogs)
    .set({
      resolved: 1,
      resolvedAt: new Date(),
    })
    .where(eq(errorLogs.id, errorId));
}

/**
 * Deletar erro
 */
export async function deleteError(errorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(errorLogs).where(eq(errorLogs.id, errorId));
}

/**
 * Limpar erros antigos (mais de 30 dias)
 */
export async function cleanOldErrors(daysOld: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return db.delete(errorLogs).where(lte(errorLogs.timestamp, cutoffDate));
}
