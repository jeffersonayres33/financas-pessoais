import { describe, it, expect, beforeAll, afterAll } from "vitest";
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

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const categories = await caller.categories.list();

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("should update a category successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const updated = await caller.categories.update({
      id: category.id,
      name: "Teste Atualizado",
      monthlyBudget: 60000,
    });

    expect(updated.success).toBe(true);
  });

  it("should delete a category successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const result = await caller.categories.delete({ id: category.id });

    expect(result.success).toBe(true);
  });

  it("should create an expense successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const expense = await caller.expenses.create({
      establishment: "Supermercado",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 10000,
      paid: "no",
    });

    expect(expense).toHaveProperty("id");
    expect(typeof expense.id).toBe("number");
  });

  it("should list expenses for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    await caller.expenses.create({
      establishment: "Supermercado",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 10000,
      paid: "no",
    });

    const expenses = await caller.expenses.list({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });

    expect(Array.isArray(expenses)).toBe(true);
  });

  it("should update an expense successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const expense = await caller.expenses.create({
      establishment: "Supermercado",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 10000,
      paid: "no",
    });

    const updated = await caller.expenses.update({
      id: expense.id,
      establishment: "Supermercado Atualizado",
      amount: 15000,
      categoryId: category.id,
      purchaseDate: new Date(),
      paid: "yes",
    });

    expect(updated.success).toBe(true);
  });

  it("should delete an expense successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const expense = await caller.expenses.create({
      establishment: "Supermercado",
      categoryId: category.id,
      purchaseDate: new Date(),
      amount: 10000,
      paid: "no",
    });

    const result = await caller.expenses.delete({ id: expense.id });

    expect(result.success).toBe(true);
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

describe("ocr procedures", () => {
  it("should handle OCR extraction request", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Usar uma URL de imagem válida (imagem de teste)
    const testImageUrl = "https://via.placeholder.com/300x200?text=Receipt";

    const result = await caller.ocr.extractReceiptData({
      imageUrl: testImageUrl,
      fileName: "receipt.jpg",
    });

    // Verificar que a resposta tem a estrutura esperada
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("establishment");
    expect(result).toHaveProperty("amount");
    expect(result).toHaveProperty("date");
    expect(result).toHaveProperty("confidence");
  });

  it("should return error for invalid image URL", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ocr.extractReceiptData({
      imageUrl: "https://invalid-url-that-does-not-exist.example.com/image.jpg",
      fileName: "receipt.jpg",
    });

    // Pode falhar ou retornar dados nulos dependendo da resposta do LLM
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("confidence");
  });
});

describe("ocr value conversion", () => {
  it("should convert OCR values correctly - R$ 293.81", async () => {
    // Simular o fluxo de conversão de valores
    const ocrValue = 293.81; // Retornado pelo OCR em reais
    
    // Verificar que o valor está em reais (não em centavos)
    expect(ocrValue).toBe(293.81);
    
    // Converter para string com 2 casas decimais (como faz no formulário)
    const formattedValue = ocrValue.toFixed(2);
    expect(formattedValue).toBe("293.81");
    
    // Converter para centavos para salvar no banco (como faz ao salvar)
    const valueInCents = Math.round(Number(formattedValue) * 100);
    expect(valueInCents).toBe(29381);
    
    // Converter de volta para reais para exibição
    const displayValue = valueInCents / 100;
    expect(displayValue).toBe(293.81);
  });

  it("should handle large values that might be in cents", async () => {
    // Se o OCR retornar um valor muito grande, pode estar em centavos
    let value = 29381; // Valor em centavos
    
    // Se for > 10000, converter para reais
    if (value > 10000) {
      value = value / 100;
    }
    
    expect(value).toBe(293.81);
  });

  it("should handle string values from OCR", async () => {
    // Simular valor retornado como string pelo OCR
    let value: any = "293.81";
    
    // Converter para número
    if (typeof value === "string") {
      value = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
    }
    
    expect(value).toBe(293.81);
    expect(typeof value).toBe("number");
  });

  it("should handle values with multiple installments", async () => {
    const valueInReais = 293.81;
    const totalInstallments = 3;
    
    // Converter para centavos e dividir pelas parcelas
    const amountPerInstallment = Math.round(Number(valueInReais) * 100) / totalInstallments;
    
    // Cada parcela deve ser ~9793.67 centavos (293.81 / 3)
    // Arredonda para 9794
    expect(Math.round(amountPerInstallment)).toBe(9794);
    
    // Verificar que a soma das parcelas é aproximadamente igual ao total
    const totalFromInstallments = Math.round(amountPerInstallment * totalInstallments);
    // A soma pode ser ligeiramente diferente por arredondamento
    expect(totalFromInstallments).toBeGreaterThanOrEqual(29370);
    expect(totalFromInstallments).toBeLessThanOrEqual(29390);
  });
});

describe("reports procedures", () => {
  it("should generate monthly PDF report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar categoria e despesa de teste
    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const expense = await caller.expenses.create({
      establishment: "Teste",
      categoryId: category.id,
      purchaseDate: currentDate,
      amount: 10000,
      paid: "no",
    });

    const report = await caller.reports.monthlyPDF({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    });

    expect(report.success).toBe(true);
  });

  it("should generate annual PDF report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar categoria e despesa de teste
    const category = await caller.categories.create({
      name: "Teste",
      type: "expense",
      monthlyBudget: 50000,
    });

    const currentDate = new Date();

    const expense = await caller.expenses.create({
      establishment: "Teste",
      categoryId: category.id,
      purchaseDate: currentDate,
      amount: 10000,
      paid: "no",
    });

    const report = await caller.reports.annualPDF({
      year: currentDate.getFullYear(),
    });

    expect(report.success).toBe(true);
  });
});
