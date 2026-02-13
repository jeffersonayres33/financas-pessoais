import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, BarChart3, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ErrorStats {
  totalCount: number;
  byType: Array<{ errorType: string; count: number }>;
  byBrowser: Array<{ browser: string; count: number }>;
  byPage: Array<{ page: string; count: number }>;
}

export default function ErrorAnalytics() {
  const { data: user } = trpc.auth.me.useQuery();
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const getStats = trpc.errorLogs.getStats.useQuery(
    {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
    {
      enabled: !!user && user.role === "admin",
    }
  );

  useEffect(() => {
    if (getStats.data) {
      setStats(getStats.data);
      setLoading(false);
    }
  }, [getStats.data]);

  if (!user || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Apenas administradores podem acessar este painel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">Análise de Erros</h1>
          </div>
          <p className="text-gray-600">Rastreamento de erros por tipo, navegador e página</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button
              onClick={() => getStats.refetch()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={getStats.isLoading}
            >
              {getStats.isLoading ? "Carregando..." : "Atualizar"}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Errors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Erros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.totalCount}</div>
                <p className="text-xs text-gray-500 mt-2">Período selecionado</p>
              </CardContent>
            </Card>

            {/* Error Types */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Tipos de Erro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.byType.map((item) => (
                    <div key={item.errorType} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{item.errorType}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Browsers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Navegadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.byBrowser.map((item) => (
                    <div key={item.browser} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{item.browser}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Páginas com Erro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.byPage.slice(0, 5).map((item) => (
                    <div key={item.page} className="flex justify-between items-center">
                      <span className="text-xs text-gray-700 truncate">{item.page}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {getStats.error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Erro ao Carregar Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{getStats.error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Detailed Charts Section */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Erros por Tipo</CardTitle>
                <CardDescription>Proporção de cada tipo de erro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byType.map((item) => {
                    const percentage = stats.totalCount > 0 ? (item.count / stats.totalCount) * 100 : 0;
                    return (
                      <div key={item.errorType}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-700">{item.errorType}</span>
                          <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Browser Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Erros por Navegador</CardTitle>
                <CardDescription>Proporção de cada navegador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byBrowser.map((item) => {
                    const percentage = stats.totalCount > 0 ? (item.count / stats.totalCount) * 100 : 0;
                    return (
                      <div key={item.browser}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-700">{item.browser}</span>
                          <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Pages with Errors */}
        {stats && stats.byPage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Páginas com Mais Erros</CardTitle>
              <CardDescription>Ranking das 10 páginas com mais ocorrências</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Página</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Erros</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byPage.map((item, index) => {
                      const percentage = stats.totalCount > 0 ? (item.count / stats.totalCount) * 100 : 0;
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-700 truncate">{item.page}</td>
                          <td className="text-right py-3 px-4">
                            <Badge variant="secondary">{item.count}</Badge>
                          </td>
                          <td className="text-right py-3 px-4 text-sm text-gray-600">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
