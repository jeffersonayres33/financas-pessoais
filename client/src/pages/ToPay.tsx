import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Check, Filter, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function ToPay() {
  const { user } = useAuth();
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-new");

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const startDate = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth]
  );
  const endDate = useMemo(
    () => new Date(selectedYear, selectedMonth, 0, 23, 59, 59),
    [selectedYear, selectedMonth]
  );

  // Buscar despesas não pagas
  const { data: unpaidExpenses, isLoading } = trpc.expenses.list.useQuery(
    {
      startDate,
      endDate,
      paid: "no",
      ...(filterCategory !== "all" && { categoryId: Number(filterCategory) }),
    },
    { enabled: !!user?.id }
  );

  const { data: categories } = trpc.categories.list.useQuery(
    { type: "expense" },
    { enabled: !!user?.id }
  );

  const utils = trpc.useUtils();

  const updateMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.analytics.monthlySummary.invalidate();
      utils.analytics.expensesByCategory.invalidate();
      setSelectedExpenses(new Set());
      setIsPaymentDialogOpen(false);
      toast.success("Despesas marcadas como pagas!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar despesa: " + error.message);
    },
  });

  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.analytics.monthlySummary.invalidate();
      utils.analytics.expensesByCategory.invalidate();
      toast.success("Despesa excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir despesa: " + error.message);
    },
  });

  const handleSelectExpense = (expenseId: number) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const handleSelectAll = () => {
    if (!unpaidExpenses) return;
    if (selectedExpenses.size === unpaidExpenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(unpaidExpenses.map((e) => e.expense.id)));
    }
  };

  const handlePaySelected = () => {
    if (selectedExpenses.size === 0) {
      toast.error("Selecione pelo menos uma despesa!");
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentDate) {
      toast.error("Selecione uma data de pagamento!");
      return;
    }

    for (const expenseId of Array.from(selectedExpenses)) {
      await updateMutation.mutateAsync({
        id: expenseId,
        paid: "yes",
        paymentDate: new Date(paymentDate),
      });
    }
  };

  const handleDeleteExpense = (expenseId: number) => {
    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      deleteMutation.mutate({ id: expenseId });
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories?.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const totalUnpaid = unpaidExpenses?.reduce((sum, e) => sum + e.expense.amount, 0) || 0;
  
  const totalSelected = useMemo(() => {
    if (!unpaidExpenses) return 0;
    return unpaidExpenses
      .filter((item) => selectedExpenses.has(item.expense.id))
      .reduce((sum, item) => sum + item.expense.amount, 0);
  }, [selectedExpenses, unpaidExpenses]);

  const sortedExpenses = useMemo(() => {
    if (!unpaidExpenses) return [];
    const sorted = [...unpaidExpenses];
    if (sortBy === "date-new") return sorted.sort((a, b) => new Date(b.expense.purchaseDate).getTime() - new Date(a.expense.purchaseDate).getTime());
    if (sortBy === "date-old") return sorted.sort((a, b) => new Date(a.expense.purchaseDate).getTime() - new Date(b.expense.purchaseDate).getTime());
    if (sortBy === "alpha-az") return sorted.sort((a, b) => a.expense.establishment.localeCompare(b.expense.establishment));
    if (sortBy === "alpha-za") return sorted.sort((a, b) => b.expense.establishment.localeCompare(a.expense.establishment));
    if (sortBy === "value-asc") return sorted.sort((a, b) => a.expense.amount - b.expense.amount);
    if (sortBy === "value-desc") return sorted.sort((a, b) => b.expense.amount - a.expense.amount);
    return sorted;
  }, [unpaidExpenses, sortBy]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">A Pagar</h1>
            <p className="text-gray-600 mt-1">Despesas pendentes de pagamento</p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm font-medium text-gray-700">Mês</Label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {format(new Date(2024, month - 1), "MMMM", { locale: ptBR })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[180px]">
                <Label className="text-sm font-medium text-gray-700">Categoria</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as categorias</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm font-medium text-gray-700">Ano</Label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm font-medium text-gray-700">Ordenar por</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date-new">Data: Mais Novo</option>
                  <option value="date-old">Data: Mais Velho</option>
                  <option value="alpha-az">Alfabético: A-Z</option>
                  <option value="alpha-za">Alfabético: Z-A</option>
                  <option value="value-asc">Valor: Menor para Maior</option>
                  <option value="value-desc">Valor: Maior para Menor</option>
                </select>
              </div>

              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Resumo de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-red-700">Despesas Pendentes</p>
                <p className="text-2xl font-bold text-red-900">{unpaidExpenses?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-red-700">Total a Pagar</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(totalUnpaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        {selectedExpenses.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-blue-900">
                {selectedExpenses.size} despesa(s) selecionada(s) • Total: {formatCurrency(totalSelected)}
              </p>
              <Button
                onClick={handlePaySelected}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                Marcar como Pago
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Despesas */}
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">Carregando despesas...</p>
              </CardContent>
            </Card>
          ) : unpaidExpenses && unpaidExpenses.length > 0 ? (
            <>
              {/* Checkbox Selecionar Todos */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.size === unpaidExpenses.length && unpaidExpenses.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700">
                      Selecionar todos ({unpaidExpenses.length})
                    </span>
                  </label>
                </CardContent>
              </Card>

              {/* Lista de Despesas */}
              {sortedExpenses.map((item) => {
                const expense = item.expense;
                return (
                <Card
                  key={expense.id}
                  className={`transition-all ${
                    selectedExpenses.has(expense.id)
                      ? "bg-blue-50 border-blue-300"
                      : "hover:shadow-md"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.has(expense.id)}
                        onChange={() => handleSelectExpense(expense.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {expense.establishment}
                              </h3>
                              {expense.totalInstallments > 1 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  parcelado {expense.currentInstallment}/{expense.totalInstallments}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {getCategoryName(expense.categoryId)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {formatCurrency(expense.amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(expense.purchaseDate), "dd 'de' MMMM", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Criado em{" "}
                            {format(new Date(expense.createdAt), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Nenhuma despesa pendente!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Todas as despesas de {format(new Date(selectedYear, selectedMonth - 1), "MMMM", {
                      locale: ptBR,
                    })} foram pagas.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Data de Pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data de Pagamento</DialogTitle>
            <DialogDescription>
              Selecione a data em que as despesas foram pagas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-date" className="text-sm font-medium text-gray-700">
                Data
              </Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMutation.isPending ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
