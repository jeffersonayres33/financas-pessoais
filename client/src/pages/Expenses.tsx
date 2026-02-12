import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { ExpenseAttachmentUploadWithOCR } from "@/components/ExpenseAttachmentUploadWithOCR";
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
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Expenses() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [formData, setFormData] = useState({
    establishment: "",
    categoryId: "",
    purchaseDate: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    paid: "no" as "yes" | "no",
    paymentDate: "",
  });

  const startDate = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth]
  );
  const endDate = useMemo(
    () => new Date(selectedYear, selectedMonth, 0, 23, 59, 59),
    [selectedYear, selectedMonth]
  );

  const { data: expenses, isLoading } = trpc.expenses.list.useQuery(
    {
      startDate,
      endDate,
      ...(filterCategory !== "all" && { categoryId: Number(filterCategory) }),
      ...(filterPaid !== "all" && { paid: filterPaid as "yes" | "no" }),
    },
    { enabled: !!user }
  );

  const { data: categories } = trpc.categories.list.useQuery({ type: "expense" }, { enabled: !!user });
  const utils = trpc.useUtils();

  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.analytics.monthlySummary.invalidate();
      utils.analytics.expensesByCategory.invalidate();
      toast.success("Despesa criada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar despesa: " + error.message);
    },
  });

  const updateMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      utils.analytics.monthlySummary.invalidate();
      utils.analytics.expensesByCategory.invalidate();
      toast.success("Despesa atualizada com sucesso!");
      resetForm();
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

  const resetForm = () => {
    setFormData({
      establishment: "",
      categoryId: "",
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      paid: "no",
      paymentDate: "",
    });
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInCents = Math.round(parseFloat(formData.amount) * 100);

    const data = {
      establishment: formData.establishment,
      categoryId: Number(formData.categoryId),
      purchaseDate: new Date(formData.purchaseDate),
      amount: amountInCents,
      paid: formData.paid,
      ...(formData.paymentDate && { paymentDate: new Date(formData.paymentDate) }),
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.expense.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      establishment: expense.expense.establishment,
      categoryId: expense.expense.categoryId.toString(),
      purchaseDate: format(new Date(expense.expense.purchaseDate), "yyyy-MM-dd"),
      amount: (expense.expense.amount / 100).toFixed(2),
      paid: expense.expense.paid,
      paymentDate: expense.expense.paymentDate
        ? format(new Date(expense.expense.paymentDate), "yyyy-MM-dd")
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      deleteMutation.mutate({ id });
    }
  };

  const togglePaid = (expense: any) => {
    const newPaid = expense.expense.paid === "yes" ? "no" : "yes";
    updateMutation.mutate({
      id: expense.expense.id,
      paid: newPaid,
      ...(newPaid === "yes" && { paymentDate: new Date() }),
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const totalExpenses = useMemo(() => {
    return expenses?.reduce((sum, exp) => sum + exp.expense.amount, 0) || 0;
  }, [expenses]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
            <p className="text-muted-foreground">Gerencie suas despesas mensais</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPaid} onValueChange={setFilterPaid}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Todos status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="yes">Pagas</SelectItem>
              <SelectItem value="no">Não pagas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total de Despesas</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : expenses && expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma despesa encontrada neste período</p>
            ) : (
              <div className="space-y-3">
                {expenses?.map((expense) => (
                  <div
                    key={expense.expense.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 rounded-full ${
                            expense.expense.paid === "yes"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                          onClick={() => togglePaid(expense)}
                        >
                          {expense.expense.paid === "yes" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </Button>
                        <div>
                          <p className="font-medium">{expense.expense.establishment}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{expense.category?.name}</span>
                            <span>•</span>
                            <span>
                              {format(new Date(expense.expense.purchaseDate), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {expense.expense.paid === "yes" && expense.expense.paymentDate && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">
                                  Pago em {format(new Date(expense.expense.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold">{formatCurrency(expense.expense.amount)}</p>
                      <div className="flex gap-2">
                        <ExpenseAttachmentUploadWithOCR 
                          expenseId={expense.expense.id}
                          onExtractedData={(data) => {
                            if (data.establishment) setFormData(prev => ({ ...prev, establishment: data.establishment }));
                            if (data.amount) setFormData(prev => ({ ...prev, amount: (data.amount / 100).toString() }));
                            if (data.date) setFormData(prev => ({ ...prev, purchaseDate: data.date }));
                          }}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.expense.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "Atualize as informações da despesa" : "Preencha os dados da nova despesa"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="establishment">Estabelecimento</Label>
                  <Input
                    id="establishment"
                    value={formData.establishment}
                    onChange={(e) => setFormData({ ...formData, establishment: e.target.value })}
                    placeholder="Ex: Supermercado, Posto de gasolina..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Data da Compra</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid">Status de Pagamento</Label>
                  <Select
                    value={formData.paid}
                    onValueChange={(value: "yes" | "no") => setFormData({ ...formData, paid: value })}
                  >
                    <SelectTrigger id="paid">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Não pago</SelectItem>
                      <SelectItem value="yes">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.paid === "yes" && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Data do Pagamento</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingExpense ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
