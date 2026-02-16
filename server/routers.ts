import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { generateMonthlyReportPDF, generateAnnualReportPDF } from "./pdf-generator";

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
          totalInstallments: z.number().int().min(1).default(1),
          currentInstallment: z.number().int().min(1).default(1),
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
          totalInstallments: z.number().int().min(1).optional(),
          currentInstallment: z.number().int().min(1).optional(),
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

  // OCR - Extração de dados de recibos
  ocr: router({
    extractReceiptData: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().url(),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um especialista em OCR e extração de dados de recibos.

INSTRUÇÕES:
1. Analise CUIDADOSAMENTE cada detalhe da imagem
2. Se estiver rotacionada, rotacione mentalmente para ler
3. Procure por TODOS os valores (total, subtotal)
4. Identifique datas em qualquer formato
5. Localize o estabelecimento mesmo se parcial
6. Use o TOTAL final se houver múltiplos valores
7. Seja preciso com centavos

RETORNE APENAS JSON:
{
  "establishment": "nome completo",
  "amount": "valor em reais (ex: 150.50)",
  "date": "YYYY-MM-DD",
  "confidence": "high|medium|low",
  "description": "o que foi comprado",
  "notes": "observações"
}

Use null se não conseguir extrair.`,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extraia TODOS os dados visíveis com máxima precisão. Se rotacionada, rotacione mentalmente. Procure: valor total, data, estabelecimento, itens.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: input.imageUrl,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
          });

          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== "string") {
            throw new Error("Nenhuma resposta do LLM");
          }

          // Tentar extrair JSON da resposta
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("Não foi possível extrair dados do recibo. Resposta: " + content);
          }

          const extractedData = JSON.parse(jsonMatch[0]);

          // Normalizar valor
          let amount = extractedData.amount;
          if (typeof amount === "string") {
            amount = parseFloat(amount.replace(/[^\d.,]/g, "").replace(",", "."));
          }
          amount = amount ? Math.round(amount * 100) : null;

          // Normalizar data
          let date = extractedData.date;
          if (date && !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const dateMatch = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (dateMatch) {
              date = `${dateMatch[3]}-${String(dateMatch[2]).padStart(2, "0")}-${String(dateMatch[1]).padStart(2, "0")}`;
            }
          }

          // Validar e normalizar dados
          return {
            establishment: extractedData.establishment || null,
            amount: amount,
            date: date || null,
            confidence: extractedData.confidence || "baixo",
            description: extractedData.description || null,
            notes: extractedData.notes || null,
            success: true,
          };
        } catch (error) {
          console.error("[OCR] Erro ao extrair dados:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Erro ao processar recibo",
            establishment: null,
            amount: null,
            date: null,
            confidence: "baixo",
            description: null,
            notes: null,
          };
        }
      }),
  }),

  // PDF Reports
  reports: router({
    monthlyPDF: protectedProcedure
      .input(
        z.object({
          month: z.number().int().min(1).max(12),
          year: z.number().int().min(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getMonthlySummary, getExpensesByCategory } = await import("./db");

        const summary = await getMonthlySummary(ctx.user.id, input.month, input.year);
        const categoryExpenses = await getExpensesByCategory(ctx.user.id, input.month, input.year);

        const pdfBuffer = generateMonthlyReportPDF({
          month: input.month,
          year: input.year,
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          balance: summary.balance,
          categoryExpenses: categoryExpenses as any,
        });

        return {
          success: true,
          fileName: `relatorio_${input.month.toString().padStart(2, "0")}_${input.year}.pdf`,
          data: pdfBuffer.toString("base64"),
        };
      }),

    annualPDF: protectedProcedure
      .input(
        z.object({
          year: z.number().int().min(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getAnnualReport } = await import("./db");

        const annualData = await getAnnualReport(ctx.user.id, input.year);

        // Agrupar dados por mês
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
        }));

        // Calcular totais por mês
        for (let month = 1; month <= 12; month++) {
          const { getMonthlySummary } = await import("./db");
          const summary = await getMonthlySummary(ctx.user.id, month, input.year);
          const monthIndex = month - 1;
          monthlyData[monthIndex].totalIncome = summary.totalIncome;
          monthlyData[monthIndex].totalExpense = summary.totalExpense;
          monthlyData[monthIndex].balance = summary.balance;
        }

        // Agrupar despesas por categoria
        const categoryMap = new Map<number | null, { name: string; total: number }>();
        for (const item of annualData) {
          const key = item.categoryId;
          if (!categoryMap.has(key)) {
            categoryMap.set(key, { name: item.categoryName || "Sem categoria", total: 0 });
          }
          const current = categoryMap.get(key)!;
          current.total += Number(item.totalSpent || 0);
        }

        const categoryExpenses = Array.from(categoryMap.entries()).map(([id, data]) => ({
          categoryId: id || 0,
          categoryName: data.name,
          totalSpent: data.total,
        }));

        const pdfBuffer = generateAnnualReportPDF({
          year: input.year,
          monthlyData,
          categoryExpenses,
        });

        return {
          success: true,
          fileName: `relatorio_anual_${input.year}.pdf`,
          data: pdfBuffer.toString("base64"),
        };
      }),
   }),

  // Dashboard Widget Preferences
  widgets: router({
    getPreferences: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDashboardWidgetPreferences, initializeDefaultWidgetPreferences } = await import("./db");
        
        // Inicializar preferências padrão se não existirem
        await initializeDefaultWidgetPreferences(ctx.user.id);
        
        const prefs = await getDashboardWidgetPreferences(ctx.user.id);
        return prefs.map(p => ({
          widgetId: p.widgetId,
          isVisible: p.isVisible === 1,
          position: p.position,
        }));
      }),
    
    updatePreferences: protectedProcedure
      .input(
        z.array(
          z.object({
            widgetId: z.string(),
            isVisible: z.boolean(),
            position: z.number().int().min(0),
          })
        )
      )
      .mutation(async ({ ctx, input }) => {
        const { updateWidgetPreferences } = await import("./db");
        await updateWidgetPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Error Logs
  errorLogs: router({
    log: publicProcedure
      .input(
        z.object({
          errorType: z.enum(["DOM", "Network", "Application"]),
          errorMessage: z.string(),
          errorStack: z.string().optional(),
          componentStack: z.string().optional(),
          browser: z.string(),
          browserVersion: z.string().optional(),
          page: z.string(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { logError } = await import("./error-logs");
        try {
          await logError({
            userId: ctx.user?.id,
            ...input,
          });
          return { success: true };
        } catch (error) {
          console.error("[ErrorLogs] Failed to log error:", error);
          return { success: false };
        }
      }),

    getStats: protectedProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Only admin can view error stats
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const { getTotalErrorCount, getErrorsByType, getErrorsByBrowser, getErrorsByPage } = await import("./error-logs");

        const [totalCount, byType, byBrowser, byPage] = await Promise.all([
          getTotalErrorCount(input),
          getErrorsByType(input),
          getErrorsByBrowser(input),
          getErrorsByPage({ ...input, limit: 10 }),
        ]);

        return {
          totalCount,
          byType,
          byBrowser,
          byPage,
        };
      }),

    getList: protectedProcedure
      .input(
        z.object({
          errorType: z.string().optional(),
          browser: z.string().optional(),
          page: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        // Only admin can view error logs
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const { getErrorLogs } = await import("./error-logs");
        return getErrorLogs(input);
      }),

    markResolved: protectedProcedure
      .input(z.object({ errorId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can mark errors as resolved
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const { markErrorAsResolved } = await import("./error-logs");
        await markErrorAsResolved(input.errorId);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ errorId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can delete errors
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const { deleteError } = await import("./error-logs");
        await deleteError(input.errorId);
        return { success: true };
      }),
  }),

  // Receipt OCR
  receipt: router({
    uploadImage: protectedProcedure
      .input(
        z.object({
          imageBase64: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.imageBase64, "base64");
        const fileName = `receipts/${ctx.user.id}/${Date.now()}.jpg`;
        const { url } = await storagePut(fileName, buffer, input.mimeType);
        return { url };
      }),
    extractData: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().url(),
        })
      )
      .mutation(async ({ input }) => {
        const { extractReceiptData } = await import("./receipt-ocr");
        return extractReceiptData(input.imageUrl);
      }),
  }),

  accounts: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const { eq } = await import("drizzle-orm");
        const { userAccounts } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        return await db.select().from(userAccounts).where(eq(userAccounts.userId, ctx.user.id));
      }),

    create: protectedProcedure
      .input(
        z.object({
          accountName: z.string().min(1).max(100),
          accountType: z.enum(["personal", "business", "family", "other"]).default("personal"),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { userAccounts, users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(userAccounts).values({
          userId: ctx.user.id,
          accountName: input.accountName,
          accountType: input.accountType,
          description: input.description,
          isDefault: 0,
        });

        const accountId = typeof result === "object" && "insertId" in result ? Number((result as any).insertId) : 0;
        const accounts = await db.select().from(userAccounts).where(eq(userAccounts.userId, ctx.user.id));
        if (accounts.length === 1) {
          await db.update(users).set({ activeAccountId: accountId }).where(eq(users.id, ctx.user.id));
        }

        return { id: accountId, success: true };
      }),

    switchAccount: protectedProcedure
      .input(z.object({ accountId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { users, userAccounts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const account = await db
          .select()
          .from(userAccounts)
          .where(and(eq(userAccounts.id, input.accountId), eq(userAccounts.userId, ctx.user.id)));

        if (account.length === 0) {
          throw new Error("Conta nao encontrada");
        }

        await db.update(users).set({ activeAccountId: input.accountId }).where(eq(users.id, ctx.user.id));

        return { success: true, accountId: input.accountId };
      }),

    delete: protectedProcedure
      .input(z.object({ accountId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const { userAccounts, users } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const account = await db
          .select()
          .from(userAccounts)
          .where(and(eq(userAccounts.id, input.accountId), eq(userAccounts.userId, ctx.user.id)));

        if (account.length === 0) {
          throw new Error("Conta nao encontrada");
        }

        const allAccounts = await db.select().from(userAccounts).where(eq(userAccounts.userId, ctx.user.id));
        if (allAccounts.length === 1) {
          throw new Error("Nao eh possivel deletar a ultima conta");
        }

        const user = await db.select().from(users).where(eq(users.id, ctx.user.id));
        if (user[0]?.activeAccountId === input.accountId) {
          const otherAccount = allAccounts.find((a: any) => a.id !== input.accountId);
          if (otherAccount) {
            await db.update(users).set({ activeAccountId: otherAccount.id }).where(eq(users.id, ctx.user.id));
          }
        }

        await db.delete(userAccounts).where(eq(userAccounts.id, input.accountId));

        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
