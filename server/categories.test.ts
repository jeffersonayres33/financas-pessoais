import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("categories procedures", () => {
  it("should create a category successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.create({
      name: "Alimentação",
      type: "expense",
      monthlyBudget: 150000, // R$ 1500.00 em centavos
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list categories for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar categoria primeiro
    await caller.categories.create({
      name: "Transporte",
      type: "expense",
      monthlyBudget: 50000,
    });

    const categories = await caller.categories.list({ type: "expense" });

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should update category budget", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.categories.create({
      name: "Lazer",
      type: "expense",
      monthlyBudget: 30000,
    });

    const result = await caller.categories.update({
      id: created.id,
      monthlyBudget: 40000,
    });

    expect(result.success).toBe(true);
  });
});

describe("expenses procedures", () => {
  it("should create an expense successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar categoria primeiro
    const category = await caller.categories.create({
      name: "Mercado",
      type: "expense",
      monthlyBudget: 100000,
    });

    const result = await caller.expenses.create({
      establishment: "Supermercado ABC",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 15000,
      paid: "no",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list expenses with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Combustível",
      type: "expense",
      monthlyBudget: 50000,
    });

    await caller.expenses.create({
      establishment: "Posto Shell",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 20000,
      paid: "yes",
      paymentDate: new Date(),
    });

    const expenses = await caller.expenses.list({
      categoryId: category.id,
      paid: "yes",
    });

    expect(Array.isArray(expenses)).toBe(true);
  });
});

describe("analytics procedures", () => {
  it("should return monthly summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const currentDate = new Date();
    const summary = await caller.analytics.monthlySummary({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    });

    expect(summary).toHaveProperty("totalIncome");
    expect(summary).toHaveProperty("totalExpense");
    expect(summary).toHaveProperty("balance");
    expect(typeof summary.totalIncome).toBe("number");
    expect(typeof summary.totalExpense).toBe("number");
    expect(typeof summary.balance).toBe("number");
  });

  it("should return expenses by category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const currentDate = new Date();
    const categoryData = await caller.analytics.expensesByCategory({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    });

    expect(Array.isArray(categoryData)).toBe(true);
  });
});


describe("attachments procedures", () => {
  it("should upload an attachment successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const expense = await caller.expenses.create({
      establishment: "Teste",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 10000,
      paid: "no",
    });

    const result = await caller.attachments.upload({
      expenseId: expense.id,
      fileName: "recibo.jpg",
      fileUrl: "https://example.com/recibo.jpg",
      fileKey: "test-key-123",
      mimeType: "image/jpeg",
      fileSize: 102400,
    });

    expect(result).toHaveProperty("id");
    expect(result.url).toBe("https://example.com/recibo.jpg");
  });

  it("should list attachments for an expense", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const expense = await caller.expenses.create({
      establishment: "Teste",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 10000,
      paid: "no",
    });

    await caller.attachments.upload({
      expenseId: expense.id,
      fileName: "recibo.jpg",
      fileUrl: "https://example.com/recibo.jpg",
      fileKey: "test-key-123",
      mimeType: "image/jpeg",
      fileSize: 102400,
    });

    const attachments = await caller.attachments.list({ expenseId: expense.id });

    expect(Array.isArray(attachments)).toBe(true);
    expect(attachments.length).toBe(1);
    expect(attachments[0]?.fileName).toBe("recibo.jpg");
  });

  it("should delete an attachment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const expense = await caller.expenses.create({
      establishment: "Teste",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 10000,
      paid: "no",
    });

    const uploaded = await caller.attachments.upload({
      expenseId: expense.id,
      fileName: "recibo.jpg",
      fileUrl: "https://example.com/recibo.jpg",
      fileKey: "test-key-123",
      mimeType: "image/jpeg",
      fileSize: 102400,
    });

    const result = await caller.attachments.delete({
      id: uploaded.id,
      expenseId: expense.id,
    });

    expect(result.success).toBe(true);
  });
});
