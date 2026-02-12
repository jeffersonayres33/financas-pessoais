import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: summary, isLoading: summaryLoading } = trpc.analytics.monthlySummary.useQuery(
    { month: selectedMonth, year: selectedYear },
    { enabled: !!user }
  );

  const { data: categoryData, isLoading: categoryLoading } = trpc.analytics.expensesByCategory.useQuery(
    { month: selectedMonth, year: selectedYear },
    { enabled: !!user }
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  const categoryStats = useMemo(() => {
    if (!categoryData) return [];
    return categoryData.map((cat) => {
      const spent = Number(cat.totalSpent || 0);
      const budget = cat.monthlyBudget || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const status = percentage > 100 ? "over" : percentage > 80 ? "warning" : "good";
      return { ...cat, spent, percentage, status };
    });
  }, [categoryData]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">Visão geral das suas finanças</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[100px]">
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
          </div>
        </div>

        {summaryLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <ArrowUpIcon className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.totalIncome || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <ArrowDownIcon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary?.totalExpense || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    (summary?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(summary?.balance || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Economia</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.totalIncome
                    ? `${(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)}%`
                    : "0%"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Orçamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : categoryStats.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma categoria com despesas neste período
              </p>
            ) : (
              <div className="space-y-4">
                {categoryStats.map((cat) => (
                  <div key={cat.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.categoryName}</span>
                        {cat.status === "over" && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Acima do orçamento
                          </span>
                        )}
                        {cat.status === "warning" && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            Atenção
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(cat.spent)} / {formatCurrency(cat.monthlyBudget || 0)}
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          cat.status === "over"
                            ? "bg-red-600"
                            : cat.status === "warning"
                            ? "bg-orange-500"
                            : "bg-green-600"
                        }`}
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
