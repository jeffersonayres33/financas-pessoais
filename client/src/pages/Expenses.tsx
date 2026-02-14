import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ExpenseAttachmentUploadWithOCR } from "@/components/ExpenseAttachmentUploadWithOCR";
import ReceiptUploader from "@/components/ReceiptUploader";
import OCRResultModal from "@/components/OCRResultModal";
import LoadingOverlay from "@/components/LoadingOverlay";
import { ExtractedReceiptData } from "@/types/receipt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Filter, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function Expenses() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  const [filterInstallments, setFilterInstallments] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-new");
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ocrData, setOcrData] = useState<ExtractedReceiptData | null>(null);
  const [showOCRModal, setShowOCRModal] = useState(false);

  const startDate = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, 1);
  }, [selectedMonth, selectedYear]);

  const endDate = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0);
  }, [selectedMonth, selectedYear]);

  const { data: expenses, isLoading } = trpc.expenses.list.useQuery({
    startDate,
    endDate,
    ...(filterCategory !== "all" && { categoryId: Number(filterCategory) }),
    ...(filterPaid !== "all" && { paid: filterPaid as "yes" | "no" }),
  });

  const { data: categories } = trpc.categories.list.useQuery();
  const deleteMutation = trpc.expenses.delete.useMutation();
  const updateMutation = trpc.expenses.update.useMutation();
  const createMutation = trpc.expenses.create.useMutation();

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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const totalExpenses = useMemo(() => {
    return expenses?.reduce((sum, exp) => sum + exp.expense.amount, 0) || 0;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    let filtered = [...expenses];
    if (filterInstallments === "installments") {
      filtered = filtered.filter((e) => e.expense.totalInstallments > 1);
    } else if (filterInstallments === "no-installments") {
      filtered = filtered.filter((e) => e.expense.totalInstallments === 1);
    }
    return filtered;
  }, [expenses, filterInstallments]);

  const sortedExpenses = useMemo(() => {
    if (!filteredExpenses) return [];
    let sorted = [...filteredExpenses];
    if (sortBy === "date-new") return sorted.sort((a, b) => new Date(b.expense.purchaseDate).getTime() - new Date(a.expense.purchaseDate).getTime());
    if (sortBy === "date-old") return sorted.sort((a, b) => new Date(a.expense.purchaseDate).getTime() - new Date(b.expense.purchaseDate).getTime());
    if (sortBy === "alpha-az") return sorted.sort((a, b) => a.expense.establishment.localeCompare(b.expense.establishment));
    if (sortBy === "alpha-za") return sorted.sort((a, b) => b.expense.establishment.localeCompare(a.expense.establishment));
    if (sortBy === "value-asc") return sorted.sort((a, b) => a.expense.amount - b.expense.amount);
    if (sortBy === "value-desc") return sorted.sort((a, b) => b.expense.amount - a.expense.amount);
    return sorted;
  }, [filteredExpenses, sortBy]);

  const togglePaid = async (expense: any) => {
    const newPaidStatus = expense.expense.paid === "yes" ? "no" : "yes";
    await updateMutation.mutateAsync({
      id: expense.expense.id,
      paid: newPaidStatus,
      paymentDate: newPaidStatus === "yes" ? new Date() : undefined,
    });
    toast.success("Status atualizado com sucesso");
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta despesa?")) {
      await deleteMutation.mutateAsync({ id });
      toast.success("Despesa deletada com sucesso");
    }
  };

  const handleSaveEdit = async () => {
    if (editingExpense) {
      await updateMutation.mutateAsync({
        id: editingExpense.expense.id,
        establishment: editingExpense.expense.establishment,
        amount: editingExpense.expense.amount,
        categoryId: editingExpense.category?.id || 0,
        purchaseDate: new Date(editingExpense.expense.purchaseDate),
      });
      setIsDialogOpen(false);
      setEditingExpense(null);
      toast.success("Despesa atualizada com sucesso");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
            <p className="text-gray-600 mt-1">Gerencie suas despesas e acompanhe gastos</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nova Despesa
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mês</Label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Ano</Label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Categorias</Label>
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

                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <select
                    value={filterPaid}
                    onChange={(e) => setFilterPaid(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="yes">Pagos</option>
                    <option value="no">Não pagos</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Parcelados</Label>
                  <select
                    value={filterInstallments}
                    onChange={(e) => setFilterInstallments(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="installments">Parcelados</option>
                    <option value="no-installments">Não Parcelados</option>
                  </select>
                </div>

                <div>
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
              </div>

              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Despesas */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando despesas...</div>
            ) : sortedExpenses && sortedExpenses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b gap-2">
                  <p className="text-sm font-medium">Total do período</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="space-y-3">
                  {sortedExpenses.map((expense) => (
                    <div
                      key={expense.expense.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePaid(expense)}
                        className={`flex-shrink-0 ${
                          expense.expense.paid === "yes" ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        <Check className="h-5 w-5" />
                      </Button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-medium truncate">{expense.expense.establishment}</p>
                          {expense.expense.totalInstallments > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex-shrink-0">
                              parcelado {expense.expense.currentInstallment}/{expense.expense.totalInstallments}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <span className="truncate">{expense.category?.name}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {format(new Date(expense.expense.purchaseDate), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          {expense.expense.paid === "yes" && expense.expense.paymentDate && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-green-600">
                                Pago em {format(new Date(expense.expense.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        <p className="text-base sm:text-lg font-semibold flex-shrink-0">
                          {formatCurrency(expense.expense.amount)}
                        </p>
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.expense.id)}
                            disabled={deleteMutation.isPending}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div>
                <Label>Estabelecimento</Label>
                <Input
                  value={editingExpense.expense.establishment}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      expense: { ...editingExpense.expense, establishment: e.target.value },
                    })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={editingExpense.expense.amount / 100}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      expense: { ...editingExpense.expense, amount: Number(e.target.value) * 100 },
                    })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select
                  value={editingExpense.category?.id || ""}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      category: categories?.find((c) => c.id === Number(e.target.value)),
                    })
                  }
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
