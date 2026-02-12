import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardEditMode, type Widget } from "@/components/DashboardEditMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, DollarSign, Target, Settings } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

const WIDGET_DEFINITIONS: Record<string, { id: string; label: string }> = {
  income: { id: "income", label: "Receitas" },
  expense: { id: "expense", label: "Despesas" },
  balance: { id: "balance", label: "Saldo do Mês" },
  economy: { id: "economy", label: "Taxa de Economia" },
  pie: { id: "pie", label: "Distribuição de Despesas" },
  bar: { id: "bar", label: "Orçamento vs Gasto" },
  line: { id: "line", label: "Evolução de Gastos" },
  budget: { id: "budget", label: "Resumo de Orçamento" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isEditMode, setIsEditMode] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({});
  const [widgetOrder, setWidgetOrder] = useState<string[]>([]);

  const { data: preferencesData } = trpc.widgets.getPreferences.useQuery(undefined, {
    enabled: !!user,
  });

  // Inicializar preferências
  useEffect(() => {
    if (preferencesData) {
      const visible: Record<string, boolean> = {};
      const order: string[] = [];
      
      preferencesData.forEach(pref => {
        visible[pref.widgetId] = pref.isVisible;
        order[pref.position] = pref.widgetId;
      });
      
      setVisibleWidgets(visible);
      setWidgetOrder(order.filter(Boolean));
    }
  }, [preferencesData]);

  const { data: summaryData } = trpc.analytics.monthlySummary.useQuery(
    { month: selectedMonth, year: selectedYear },
    { enabled: !!user }
  );

  const { data: categoryData } = trpc.analytics.expensesByCategory.useQuery(
    { month: selectedMonth, year: selectedYear },
    { enabled: !!user }
  );

  const { data: annualData } = trpc.analytics.annualReport.useQuery(
    { year: selectedYear },
    { enabled: !!user }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const pieChartData = useMemo(() => {
    if (!categoryData) return [];
    return categoryData
      .map((cat) => ({
        name: cat.categoryName || "Sem categoria",
        value: Number(cat.totalSpent || 0),
      }))
      .filter((item) => item.value > 0);
  }, [categoryData]);

  const barChartData = useMemo(() => {
    if (!categoryData) return [];
    return categoryData.map((cat) => ({
      name: cat.categoryName || "Sem categoria",
      orcamento: cat.monthlyBudget || 0,
      gasto: Number(cat.totalSpent || 0),
    }));
  }, [categoryData]);

  const annualChartData = useMemo(() => {
    if (!annualData) return [];
    
    const monthlyTotals = new Map<number, number>();
    annualData.forEach((item) => {
      const month = item.month;
      const current = monthlyTotals.get(month) || 0;
      monthlyTotals.set(month, current + Number(item.totalSpent || 0));
    });

    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Array.from({ length: 12 }, (_, i) => ({
      month: months[i],
      total: monthlyTotals.get(i + 1) || 0,
    }));
  }, [annualData]);

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const economyRate = summaryData
    ? ((summaryData.totalIncome - summaryData.totalExpense) / summaryData.totalIncome * 100).toFixed(1)
    : "0";

  const totalBudget = categoryData?.reduce((sum, cat) => sum + (cat.monthlyBudget || 0), 0) || 0;
  const budgetUsagePercent = totalBudget > 0 ? ((summaryData?.totalExpense || 0) / totalBudget * 100).toFixed(1) : "0";

  const handleSavePreferences = (widgets: Widget[]) => {
    const visible: Record<string, boolean> = {};
    const order: string[] = [];
    
    widgets.forEach(w => {
      visible[w.widgetId] = w.isVisible;
      if (w.position >= 0) {
        order[w.position] = w.widgetId;
      }
    });
    
    setVisibleWidgets(visible);
    setWidgetOrder(order.filter(Boolean));
    setIsEditMode(false);
  };

  const getEditModeWidgets = (): Widget[] => {
    return Object.values(WIDGET_DEFINITIONS).map(def => ({
      widgetId: def.id,
      label: def.label,
      isVisible: visibleWidgets[def.id] !== false,
      position: widgetOrder.indexOf(def.id),
    })).sort((a, b) => a.position - b.position);
  };

  const isWidgetVisible = (widgetId: string) => visibleWidgets[widgetId] !== false;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header com título, filtros e botão de edição */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Painel Financeiro</h1>
            <p className="text-muted-foreground mt-2">Visão geral das suas finanças</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[160px] bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[120px] bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outline"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Personalizar
            </Button>
          </div>
        </div>

        {/* Renderizar widgets na ordem salva */}
        <div className="space-y-6">
          {/* Primeira linha: Cards de resumo (4 colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isWidgetVisible("income") && (
              <Card className="card-modern overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Receitas</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(summaryData?.totalIncome || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Entradas do mês</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                      <ArrowUpRight className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isWidgetVisible("expense") && (
              <Card className="card-modern overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Despesas</p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(summaryData?.totalExpense || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Saídas do mês</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                      <ArrowDownRight className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isWidgetVisible("balance") && (
              <Card className="card-modern overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Saldo do Mês</p>
                      <p className={`text-3xl font-bold ${(summaryData?.balance || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {formatCurrency(summaryData?.balance || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Receitas - Despesas</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                      <Wallet className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isWidgetVisible("economy") && (
              <Card className="card-modern overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Taxa de Economia</p>
                      <p className="text-3xl font-bold text-purple-600">{economyRate}%</p>
                      <p className="text-xs text-muted-foreground mt-2">Do total de receitas</p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Segunda linha: Gráficos (2 colunas) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isWidgetVisible("pie") && (
              <Card className="card-modern">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Distribuição de Despesas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhuma despesa registrada
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isWidgetVisible("bar") && (
              <Card className="card-modern">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Orçamento vs Gasto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {barChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
                        <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="orcamento" fill="#3b82f6" name="Orçamento" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="gasto" fill="#ef4444" name="Gasto" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Nenhuma categoria configurada
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Terceira linha: Gráfico de linha */}
          {isWidgetVisible("line") && (
            <Card className="card-modern">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Evolução de Gastos - {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {annualChartData.some(d => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={annualChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total de Gastos"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível para este ano
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quarta linha: Resumo de Orçamento */}
          {isWidgetVisible("budget") && (
            <Card className="card-modern bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Resumo de Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Orçamento Total</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudget)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gasto Total</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summaryData?.totalExpense || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Utilização do Orçamento</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-purple-600">{budgetUsagePercent}%</p>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            Number(budgetUsagePercent) > 100
                              ? "bg-red-600"
                              : Number(budgetUsagePercent) > 80
                              ? "bg-yellow-600"
                              : "bg-green-600"
                          }`}
                          style={{ width: `${Math.min(Number(budgetUsagePercent), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {isEditMode && (
        <DashboardEditMode
          widgets={getEditModeWidgets()}
          onClose={() => setIsEditMode(false)}
          onSave={handleSavePreferences}
        />
      )}
    </DashboardLayout>
  );
}
