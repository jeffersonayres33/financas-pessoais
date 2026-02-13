import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, RefreshCw } from "lucide-react";
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);

    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));

    this.logErrorToService(error, errorInfo);
  }

  getBrowserInfo = (): { browser: string; version: string } => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let version = "Unknown";

    if (ua.indexOf("Chrome") > -1) {
      browser = "Chrome";
      version = ua.split("Chrome/")[1]?.split(" ")[0] || "Unknown";
    } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
      browser = "Safari";
      version = ua.split("Version/")[1]?.split(" ")[0] || "Unknown";
    } else if (ua.indexOf("Firefox") > -1) {
      browser = "Firefox";
      version = ua.split("Firefox/")[1] || "Unknown";
    } else if (ua.indexOf("Edge") > -1) {
      browser = "Edge";
      version = ua.split("Edge/")[1] || "Unknown";
    }

    return { browser, version };
  };

  logErrorToService = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorType = this.isDOMError() ? "DOM" : this.isNetworkError() ? "Network" : "Application";
      const browserInfo = this.getBrowserInfo();

      const payload = {
        errorType,
        errorMessage: error.message,
        errorStack: error.stack || "",
        componentStack: errorInfo.componentStack || "",
        browser: browserInfo.browser,
        browserVersion: browserInfo.version,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
      };

      // Log to server via tRPC
      await fetch("/api/trpc/errorLogs.log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: payload,
        }),
      }).catch((err) => {
        console.warn("[ErrorBoundary] Failed to log error to server:", err);
      });
    } catch (err) {
      console.error("[ErrorBoundary] Error logging to service:", err);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  isDOMError = (): boolean => {
    if (!this.state.error) return false;
    const message = this.state.error.message.toLowerCase();
    return (
      message.includes("removechild") ||
      message.includes("dom") ||
      message.includes("node") ||
      message.includes("parent")
    );
  };

  isNetworkError = (): boolean => {
    if (!this.state.error) return false;
    const message = this.state.error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("connection")
    );
  };

  getErrorType = (): string => {
    if (this.isDOMError()) return "DOM";
    if (this.isNetworkError()) return "Network";
    return "Application";
  };

  getErrorMessage = (): string => {
    const errorType = this.getErrorType();

    if (errorType === "DOM") {
      return "Ocorreu um erro ao renderizar a página. Tente recarregar ou voltar para a página inicial.";
    }

    if (errorType === "Network") {
      return "Problema de conexão detectado. Verifique sua internet e tente novamente.";
    }

    return "Algo deu errado. Tente recarregar a página ou voltar para a página inicial.";
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      const errorType = this.getErrorType();
      const errorMessage = this.getErrorMessage();

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-red-200 shadow-lg">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <CardTitle className="text-red-700">Erro {errorType}</CardTitle>
              </div>
              <CardDescription className="text-sm text-gray-600">
                Desculpe, algo inesperado aconteceu
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>

              {process.env.NODE_ENV === "development" && (
                <details className="text-xs bg-gray-100 rounded p-2 cursor-pointer">
                  <summary className="font-semibold text-gray-700 mb-2">
                    Detalhes do Erro (Dev)
                  </summary>
                  <div className="space-y-1 text-gray-600 font-mono overflow-auto max-h-32">
                    <p className="break-words">
                      <span className="font-bold">Mensagem:</span> {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <p className="break-words">
                        <span className="font-bold">Stack:</span>
                        <pre className="mt-1 overflow-auto">{this.state.error.stack}</pre>
                      </p>
                    )}
                  </div>
                </details>
              )}

              {this.state.errorCount > 2 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Múltiplos erros detectados ({this.state.errorCount}). Considere recarregar a página.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button
                  onClick={this.handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar para Início
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                <p>Se o problema persistir, entre em contato com o suporte.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
