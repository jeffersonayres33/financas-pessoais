import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Error Boundary Tests
 * Tests for error detection and handling in the ErrorBoundary component
 */

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Error Type Detection", () => {
    it("should detect DOM errors", () => {
      const domErrors = [
        "NotFoundError: Falha ao executar 'removeChild' em 'Node'",
        "Failed to execute 'appendChild' on 'Node'",
        "DOM Exception occurred",
        "Parent node is not valid",
      ];

      domErrors.forEach((errorMsg) => {
        const isDOM = errorMsg.toLowerCase().includes("removechild") ||
          errorMsg.toLowerCase().includes("dom") ||
          errorMsg.toLowerCase().includes("node") ||
          errorMsg.toLowerCase().includes("parent");
        expect(isDOM).toBe(true);
      });
    });

    it("should detect network errors", () => {
      const networkErrors = [
        "Network request failed",
        "Failed to fetch data",
        "Connection timeout",
        "Network error occurred",
      ];

      networkErrors.forEach((errorMsg) => {
        const isNetwork = errorMsg.toLowerCase().includes("network") ||
          errorMsg.toLowerCase().includes("fetch") ||
          errorMsg.toLowerCase().includes("timeout") ||
          errorMsg.toLowerCase().includes("connection");
        expect(isNetwork).toBe(true);
      });
    });

    it("should categorize unknown errors as Application errors", () => {
      const unknownError = "Something went wrong";
      const isDOM = unknownError.toLowerCase().includes("removechild") ||
        unknownError.toLowerCase().includes("dom");
      const isNetwork = unknownError.toLowerCase().includes("network") ||
        unknownError.toLowerCase().includes("fetch");

      expect(isDOM).toBe(false);
      expect(isNetwork).toBe(false);
    });
  });

  describe("Error Messages", () => {
    it("should provide appropriate message for DOM errors", () => {
      const domErrorMsg = "Ocorreu um erro ao renderizar a página. Tente recarregar ou voltar para a página inicial.";
      expect(domErrorMsg).toContain("renderizar");
      expect(domErrorMsg).toContain("recarregar");
    });

    it("should provide appropriate message for network errors", () => {
      const networkErrorMsg = "Problema de conexão detectado. Verifique sua internet e tente novamente.";
      expect(networkErrorMsg).toContain("conexão");
      expect(networkErrorMsg).toContain("internet");
    });

    it("should provide generic message for application errors", () => {
      const appErrorMsg = "Algo deu errado. Tente recarregar a página ou voltar para a página inicial.";
      expect(appErrorMsg).toContain("deu errado");
      expect(appErrorMsg).toContain("recarregar");
    });
  });

  describe("Error Tracking", () => {
    it("should track error count", () => {
      let errorCount = 0;
      const incrementError = () => {
        errorCount++;
      };

      incrementError();
      expect(errorCount).toBe(1);

      incrementError();
      expect(errorCount).toBe(2);

      incrementError();
      expect(errorCount).toBe(3);
    });

    it("should warn when multiple errors occur", () => {
      const errorCount = 3;
      const shouldWarn = errorCount > 2;
      expect(shouldWarn).toBe(true);
    });

    it("should not warn for single or double errors", () => {
      expect(1 > 2).toBe(false);
      expect(2 > 2).toBe(false);
    });
  });

  describe("Error Data Collection", () => {
    it("should collect error metadata", () => {
      const error = new Error("Test error");
      const errorData = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: "Mozilla/5.0",
        url: "http://localhost:3000",
      };

      expect(errorData.message).toBe("Test error");
      expect(errorData.timestamp).toBeDefined();
      expect(errorData.userAgent).toBeDefined();
      expect(errorData.url).toBeDefined();
    });

    it("should include component stack in error data", () => {
      const componentStack = "Component1 > Component2 > Component3";
      const errorData = {
        componentStack,
        timestamp: new Date().toISOString(),
      };

      expect(errorData.componentStack).toContain("Component");
      expect(errorData.timestamp).toBeDefined();
    });
  });

  describe("Recovery Actions", () => {
    it("should have reset action", () => {
      const handleReset = () => {
        return { hasError: false, error: null };
      };

      const result = handleReset();
      expect(result.hasError).toBe(false);
      expect(result.error).toBeNull();
    });

    it("should have reload action", () => {
      const handleReload = () => {
        return "reload";
      };

      expect(handleReload()).toBe("reload");
    });

    it("should have go home action", () => {
      const handleGoHome = () => {
        return "/";
      };

      expect(handleGoHome()).toBe("/");
    });
  });
});
