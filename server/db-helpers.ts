/**
 * Helpers para validação e isolamento de dados por conta
 */

import type { User } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Valida que o usuário tem uma conta ativa definida
 * @throws TRPCError se activeAccountId for null/undefined
 */
export function validateActiveAccount(user: User | null): asserts user is User & { activeAccountId: number } {
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Usuário não autenticado",
    });
  }

  if (!user.activeAccountId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Usuário não tem conta ativa definida. Por favor, faça login novamente.",
    });
  }
}

/**
 * Retorna o activeAccountId do usuário com validação
 */
export function getActiveAccountId(user: User | null): number {
  validateActiveAccount(user);
  return user.activeAccountId;
}


/**
 * ISOLAMENTO DE DADOS POR CONTA:
 * 
 * Cada conta de usuario eh isolada logicamente atraves do activeAccountId.
 * Quando um usuario alterna de conta, o activeAccountId eh atualizado no banco.
 * 
 * Fluxo de isolamento:
 * 1. Usuario faz login -> activeAccountId eh definido automaticamente
 * 2. Usuario alterna conta -> activeAccountId eh atualizado
 * 3. Frontend invalida cache de dados (categories, expenses, incomes)
 * 4. Queries retornam dados da nova conta ativa
 * 
 * Validacao de ownership:
 * - Todas as queries filtram por userId (garante que usuario so veja seus dados)
 * - Procedures validam que dados pertencem ao usuario antes de modificar
 * - activeAccountId eh usado apenas para UI e contexto do usuario
 * 
 * Seguranca:
 * - Backend nao confia em activeAccountId do cliente
 * - Dados sao sempre filtrados por userId + validacao de ownership
 * - activeAccountId eh apenas uma preferencia do usuario, nao um filtro de seguranca
 */
