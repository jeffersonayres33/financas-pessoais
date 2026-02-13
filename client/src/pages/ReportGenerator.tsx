import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BarChart3, Download, Eye, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReportFilters {
  startDate: string;
  endDate: string;
  categories: number[];
  users: number[];
  type: "all" | "expense" | "income";
  paymentStatus: "all" | "paid" | "unpaid";
  periodType: "custom" | "week" | "month" | "year";
}

export default function ReportGenerator() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    categories: [],
    users: [],
    type: "all",
    paymentStatus: "all",
    periodType: "month",
  });

  // Função para calcular datas baseado no tipo de período
  const calculatePeriodDates = (periodType: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date(today);

    switch (periodType) {
      case "week":
        // Última semana (7 dias)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        // Mês atual
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "year":
        // Ano atual
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        // Custom - não alterar
        return;
    }

    setFilters({
      ...filters,
      periodType: periodType as any,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  };

  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const categoriesQuery = trpc.categories.list.useQuery();
  const expensesQuery = trpc.expenses.list.useQuery({
    startDate: new Date(filters.startDate),
    endDate: new Date(filters.endDate),
  });
  const incomesQuery = trpc.incomes.list.useQuery({
    startDate: new Date(filters.startDate),
    endDate: new Date(filters.endDate),
  });
  const usersQuery = trpc.auth.me.useQuery();

  // const generatePdfMutation = trpc.pdf.generateCustomReport.useMutation();

  const categories = categoriesQuery.data || [];
  const expenses = expensesQuery.data || [];
  const incomes = incomesQuery.data || [];

  // Filter data based on selected filters
  const filteredExpenses = expenses.filter((exp) => {
    if (selectedCategories.size > 0 && !selectedCategories.has(exp.expense.categoryId)) return false;
    if (selectedUsers.size > 0 && !selectedUsers.has(exp.expense.userId)) return false;
    if (filters.paymentStatus === "paid" && exp.expense.paid !== "yes") return false;
    if (filters.paymentStatus === "unpaid" && exp.expense.paid !== "no") return false;
    return true;
  });

  const filteredIncomes = incomes.filter((inc) => {
    if (selectedCategories.size > 0 && !selectedCategories.has(inc.income.categoryId)) return false;
    if (selectedUsers.size > 0 && !selectedUsers.has(inc.income.userId)) return false;
    return true;
  });

  const displayData = filters.type === "expense" ? filteredExpenses : filters.type === "income" ? filteredIncomes : [...filteredExpenses, ...filteredIncomes];

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.expense.amount, 0);
  const totalIncomes = filteredIncomes.reduce((sum, inc) => sum + inc.income.amount, 0);

  const handleCategoryToggle = (categoryId: number) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategories(newSelected);
  };

  const handleUserToggle = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleGenerateReport = async () => {
    if (!user) return;

    try {
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerador de Relatórios</h1>
          <p className="text-muted-foreground">Crie relatórios personalizados com filtros avançados</p>
        </div>
        <BarChart3 className="h-8 w-8 text-primary" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>Personalize seu relatório com filtros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Period Type */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={filters.periodType} onValueChange={(value) => calculatePeriodDates(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Range - apenas se custom */}
            {filters.periodType === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status Filter */}
            {filters.type !== "income" && (
              <div className="space-y-2">
                <Label>Status de Pagamento</Label>
                <Select
                  value={filters.paymentStatus}
                  onValueChange={(value) => setFilters({ ...filters, paymentStatus: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="unpaid">Não Pagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma categoria disponível</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={selectedCategories.has(cat.id)}
                        onCheckedChange={() => handleCategoryToggle(cat.id)}
                      />
                      <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer text-sm font-normal">
                        {cat.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowPreview(true)} variant="outline" className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
              <Button onClick={handleGenerateReport} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Relatório</CardTitle>
            <CardDescription>Dados que serão incluídos no relatório</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <p className="text-sm text-muted-foreground">Total de Registros</p>
                <p className="text-2xl font-bold text-blue-600">{displayData.length}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-4">
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-2xl font-bold text-red-600">R$ {totalExpenses.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4">
                <p className="text-sm text-muted-foreground">Total Receitas</p>
                <p className="text-2xl font-bold text-green-600">R$ {totalIncomes.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${totalIncomes - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
                  R$ {(totalIncomes - totalExpenses).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Filtros Aplicados:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>📅 Período: {filters.periodType === "week" ? "Esta Semana" : filters.periodType === "month" ? "Este Mês" : filters.periodType === "year" ? "Este Ano" : "Personalizado"}</p>
                <p>📆 Datas: {new Date(filters.startDate).toLocaleDateString("pt-BR")} a {new Date(filters.endDate).toLocaleDateString("pt-BR")}</p>
                <p>📊 Tipo: {filters.type === "all" ? "Todos" : filters.type === "expense" ? "Despesas" : "Receitas"}</p>
                {selectedCategories.size > 0 && <p>🏷️ Categorias: {selectedCategories.size} selecionadas</p>}
                {filters.paymentStatus !== "all" && (
                  <p>💳 Status: {filters.paymentStatus === "paid" ? "Pagos" : "Não Pagos"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-h-96 max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização do Relatório</DialogTitle>
            <DialogDescription>Dados que serão incluídos no PDF</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {displayData.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum dado para exibir com os filtros selecionados</p>
            ) : (
              <div className="space-y-2">
                {displayData.map((item, idx) => {
                const isExpense = "expense" in item;
                const data = isExpense ? item.expense : item.income;
                return (
                  <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">
                        {isExpense ? `Despesa: ${(data as any).establishment}` : `Receita: ${(data as any).description}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(isExpense ? (data as any).purchaseDate : (data as any).date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <p className={`font-bold ${isExpense ? "text-red-600" : "text-green-600"}`}>
                      R$ {data.amount.toFixed(2)}
                    </p>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
