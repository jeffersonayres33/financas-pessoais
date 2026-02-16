import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import * as db from "./db";
import type { InsertUser } from "../drizzle/schema";

describe("upsertUser - Default Account Creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create a default account when a new user is created without activeAccountId", async () => {
    // Mock data
    const newUser: InsertUser = {
      openId: "test-user-" + Date.now(),
      name: "Test User",
      email: "test@example.com",
      loginMethod: "google",
    };

    // Verificar que o usuário não existe antes
    let existingUser = await db.getUserByOpenId(newUser.openId);
    expect(existingUser).toBeUndefined();

    // Criar o usuário
    await db.upsertUser(newUser);

    // Verificar que o usuário foi criado
    existingUser = await db.getUserByOpenId(newUser.openId);
    expect(existingUser).toBeDefined();
    expect(existingUser?.openId).toBe(newUser.openId);

    // Verificar que activeAccountId foi definido
    expect(existingUser?.activeAccountId).toBeDefined();
    expect(existingUser?.activeAccountId).toBeGreaterThan(0);

    console.log(`✅ Teste passou! Usuário criado com activeAccountId: ${existingUser?.activeAccountId}`);
  });

  it("should not create a duplicate account when upserting an existing user", async () => {
    // Mock data
    const existingUser: InsertUser = {
      openId: "test-user-existing-" + Date.now(),
      name: "Existing User",
      email: "existing@example.com",
      loginMethod: "google",
    };

    // Criar o usuário pela primeira vez
    await db.upsertUser(existingUser);
    const userAfterFirstUpsert = await db.getUserByOpenId(existingUser.openId);
    const firstActiveAccountId = userAfterFirstUpsert?.activeAccountId;

    // Fazer upsert novamente (simular login posterior)
    await db.upsertUser({
      ...existingUser,
      name: "Updated Name",
    });

    const userAfterSecondUpsert = await db.getUserByOpenId(existingUser.openId);
    const secondActiveAccountId = userAfterSecondUpsert?.activeAccountId;

    // Verificar que o activeAccountId não mudou
    expect(firstActiveAccountId).toBe(secondActiveAccountId);
    expect(userAfterSecondUpsert?.name).toBe("Updated Name");

    console.log(`✅ Teste passou! activeAccountId mantido após upsert: ${secondActiveAccountId}`);
  });
});
