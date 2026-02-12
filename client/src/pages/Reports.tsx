import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { ReportDownloader } from "@/components/ReportDownloader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

export default function Reports() {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: categoryData, isLoading: categoryLoading } = trpc.analytics.expensesByCategory.useQuery(
    { month: selectedMonth, year: selectedYear },
    { enabled: !!user }
  );

  const { data: annualData, isLoading: annualLoading } = trpc.analytics.annualReport.useQuery(
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

  const categoryBreakdown = useMemo(() => {
    if (!annualData) return [];
    
    const categoryMap = new Map<string, number[]>();
    
    annualData.forEach((item) => {
      const catName = item.categoryName || "Sem categoria";
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, Array(12).fill(0));
      }
      const monthIndex = item.month - 1;
      const current = categoryMap.get(catName)!;
      current[monthIndex] = Number(item.totalSpent || 0);
    });

    return Array.from(categoryMap.entries()).map(([name, values]) => ({
      category: name,
      data: values,
      total: values.reduce((sum, val) => sum + val, 0),
    })).sort((a, b) => b.total - a.total);
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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === "orcamento" ? "Orçamento" : "Gasto"}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios e Análises</h1>
            <p className="text-muted-foreground">Visualize seus dados financeiros</p>
          </div>
          <div className="flex gap-2">
            <ReportDownloader />
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : pieChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orçamento vs Gasto Real</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : barChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhum dado disponível</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend />
                    <Bar dataKey="orcamento" fill="#10b981" name="Orçamento" />
                    <Bar dataKey="gasto" fill="#ef4444" name="Gasto" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Evolução Anual de Despesas - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            {annualLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : annualChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={annualChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total de Despesas" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo por Categoria - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            {annualLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum dado disponível</p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((cat, index) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{cat.category}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      {cat.data.map((value, monthIndex) => (
                        <div
                          key={monthIndex}
                          className="h-8 rounded flex items-center justify-center text-xs"
                          style={{
                            backgroundColor: value > 0 ? COLORS[index % COLORS.length] : "#e5e7eb",
                            opacity: value > 0 ? 0.7 : 0.3,
                          }}
                          title={`${months[monthIndex].label}: ${formatCurrency(value)}`}
                        />
                      ))}
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
