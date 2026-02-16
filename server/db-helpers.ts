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
