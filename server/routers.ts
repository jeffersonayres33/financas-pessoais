import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Categories
  categories: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["expense", "income"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const { getCategories } = await import("./db");
        return getCategories(ctx.user.id, input?.type);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          type: z.enum(["expense", "income"]),
          monthlyBudget: z.number().int().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createCategory } = await import("./db");
        const id = await createCategory({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          name: z.string().min(1).max(100).optional(),
          monthlyBudget: z.number().int().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateCategory } = await import("./db");
        const { id, ...data } = input;
        await updateCategory(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteCategory } = await import("./db");
        await deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Expenses
  expenses: router({
    list: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().int().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          paid: z.enum(["yes", "no"]).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const { getExpenses } = await import("./db");
        return getExpenses(ctx.user.id, input);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          establishment: z.string().min(1).max(200),
          categoryId: z.number().int(),
          purchaseDate: z.date(),
          amount: z.number().int().min(0),
          paid: z.enum(["yes", "no"]),
          paymentDate: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createExpense } = await import("./db");
        const id = await createExpense({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          establishment: z.string().min(1).max(200).optional(),
          categoryId: z.number().int().optional(),
          purchaseDate: z.date().optional(),
          amount: z.number().int().min(0).optional(),
          paid: z.enum(["yes", "no"]).optional(),
          paymentDate: z.date().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateExpense } = await import("./db");
        const { id, ...data } = input;
        await updateExpense(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteExpense } = await import("./db");
        await deleteExpense(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Incomes
  incomes: router({
    list: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().int().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const { getIncomes } = await import("./db");
        return getIncomes(ctx.user.id, input);
      }),
    
    create: protectedProcedure
      .input(
        z.object({
          description: z.string().min(1).max(200),
          categoryId: z.number().int(),
          date: z.date(),
          amount: z.number().int().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createIncome } = await import("./db");
        const id = await createIncome({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),
    
    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int(),
          description: z.string().min(1).max(200).optional(),
          categoryId: z.number().int().optional(),
          date: z.date().optional(),
          amount: z.number().int().min(0).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateIncome } = await import("./db");
        const { id, ...data } = input;
        await updateIncome(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteIncome } = await import("./db");
        await deleteIncome(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Analytics
  analytics: router({
    monthlySummary: protectedProcedure
      .input(
        z.object({
          month: z.number().int().min(1).max(12),
          year: z.number().int(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getMonthlySummary } = await import("./db");
        return getMonthlySummary(ctx.user.id, input.month, input.year);
      }),
    
    expensesByCategory: protectedProcedure
      .input(
        z.object({
          month: z.number().int().min(1).max(12),
          year: z.number().int(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { getExpensesByCategory } = await import("./db");
        return getExpensesByCategory(ctx.user.id, input.month, input.year);
      }),
    
    annualReport: protectedProcedure
      .input(z.object({ year: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const { getAnnualReport } = await import("./db");
        return getAnnualReport(ctx.user.id, input.year);
      }),
    
    checkBudgetAlerts: protectedProcedure
      .input(
        z.object({
          month: z.number().int().min(1).max(12),
          year: z.number().int(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getExpensesByCategory, createBudgetNotification, hasNotificationBeenSent } = await import("./db");
        const { notifyOwner } = await import("./_core/notification");
        
        const categoryData = await getExpensesByCategory(ctx.user.id, input.month, input.year);
        const alerts = [];
        
        for (const cat of categoryData) {
          const spent = Number(cat.totalSpent || 0);
          const budget = cat.monthlyBudget || 0;
          
          if (budget > 0) {
            const percentage = (spent / budget) * 100;
            
            if (percentage >= 100) {
              const alreadySent = await hasNotificationBeenSent(cat.categoryId!, input.month, input.year, 100);
              if (!alreadySent) {
                await createBudgetNotification({
                  categoryId: cat.categoryId!,
                  month: input.month,
                  year: input.year,
                  percentage: 100,
                });
                
                await notifyOwner({
                  title: "Orçamento Excedido",
                  content: `A categoria "${cat.categoryName}" excedeu 100% do orçamento mensal (R$ ${(spent / 100).toFixed(2)} de R$ ${(budget / 100).toFixed(2)})`,
                });
                
                alerts.push({ category: cat.categoryName, percentage: 100, spent, budget });
              }
            } else if (percentage >= 80) {
              const alreadySent = await hasNotificationBeenSent(cat.categoryId!, input.month, input.year, 80);
              if (!alreadySent) {
                await createBudgetNotification({
                  categoryId: cat.categoryId!,
                  month: input.month,
                  year: input.year,
                  percentage: 80,
                });
                
                await notifyOwner({
                  title: "Alerta de Orçamento",
                  content: `A categoria "${cat.categoryName}" atingiu ${percentage.toFixed(0)}% do orçamento mensal (R$ ${(spent / 100).toFixed(2)} de R$ ${(budget / 100).toFixed(2)})`,
                });
                
                alerts.push({ category: cat.categoryName, percentage: 80, spent, budget });
              }
            }
          }
        }
        
        return { alerts };
      }),
  }),

  // Insights
  insights: router({
    generate: protectedProcedure
      .input(
        z.object({
          month: z.number().int().min(1).max(12),
          year: z.number().int(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getExpensesByCategory, getMonthlySummary, getExpenses } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const categoryData = await getExpensesByCategory(ctx.user.id, input.month, input.year);
        const summary = await getMonthlySummary(ctx.user.id, input.month, input.year);
        const expenses = await getExpenses(ctx.user.id, {
          startDate: new Date(input.year, input.month - 1, 1),
          endDate: new Date(input.year, input.month, 0, 23, 59, 59),
        });
        
        const categoryAnalysis = categoryData.map(cat => ({
          name: cat.categoryName,
          budget: (cat.monthlyBudget || 0) / 100,
          spent: Number(cat.totalSpent || 0) / 100,
          percentage: cat.monthlyBudget ? (Number(cat.totalSpent || 0) / cat.monthlyBudget) * 100 : 0,
        }));
        
        const expenseList = expenses.map(exp => ({
          establishment: exp.expense.establishment,
          category: exp.category?.name,
          amount: exp.expense.amount / 100,
          date: exp.expense.purchaseDate,
        }));
        
        const prompt = `Você é um consultor financeiro especializado. Analise os dados financeiros abaixo e forneça insights personalizados, sugestões de otimização de orçamento e identifique despesas anômalas.

Resumo Mensal:
- Total de Receitas: R$ ${(summary.totalIncome / 100).toFixed(2)}
- Total de Despesas: R$ ${(summary.totalExpense / 100).toFixed(2)}
- Saldo: R$ ${(summary.balance / 100).toFixed(2)}

Análise por Categoria:
${categoryAnalysis.map(cat => `- ${cat.name}: Gasto R$ ${cat.spent.toFixed(2)} de R$ ${cat.budget.toFixed(2)} (${cat.percentage.toFixed(0)}%)`).join('\n')}

Últimas Despesas:
${expenseList.slice(0, 10).map(exp => `- ${exp.establishment} (${exp.category}): R$ ${exp.amount.toFixed(2)}`).join('\n')}

Por favor, forneça:
1. **Padrões de Gastos**: Identifique tendências e padrões nos gastos
2. **Sugestões de Otimização**: Recomendações específicas para reduzir gastos
3. **Despesas Anômalas**: Identifique gastos incomuns ou fora do padrão
4. **Dicas Personalizadas**: Conselhos práticos baseados no perfil financeiro

Formate a resposta em markdown com seções claras.`;
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um consultor financeiro experiente que fornece insights práticos e acionáveis." },
            { role: "user", content: prompt },
          ],
        });
        
        return {
          insights: response.choices[0]?.message?.content || "Não foi possível gerar insights no momento.",
          summary: {
            totalIncome: summary.totalIncome,
            totalExpense: summary.totalExpense,
            balance: summary.balance,
          },
          categories: categoryAnalysis,
        };
      }),
  }),

  attachments: router({
    list: protectedProcedure
      .input(z.object({ expenseId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const { getExpenseById, getExpenseAttachments } = await import("./db");
        const expense = await getExpenseById(input.expenseId, ctx.user.id);
        if (!expense) throw new Error("Expense not found");
        return getExpenseAttachments(input.expenseId);
      }),
    
    upload: protectedProcedure
      .input(
        z.object({
          expenseId: z.number().int(),
          fileName: z.string().min(1).max(255),
          fileUrl: z.string().url(),
          fileKey: z.string().min(1),
          mimeType: z.string().min(1).max(50),
          fileSize: z.number().int().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getExpenseById, createExpenseAttachment } = await import("./db");
        const expense = await getExpenseById(input.expenseId, ctx.user.id);
        if (!expense) throw new Error("Expense not found");
        
        const id = await createExpenseAttachment({
          expenseId: input.expenseId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          uploadedBy: ctx.user.id,
        });
        
        return { id, url: input.fileUrl };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number().int(), expenseId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteExpenseAttachment } = await import("./db");
        await deleteExpenseAttachment(input.id, input.expenseId, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
