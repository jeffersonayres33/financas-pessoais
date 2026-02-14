import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Incomes() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-new");
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [formData, setFormData] = useState({
    description: "",
    categoryId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
  });

  const startDate = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth]
  );
  const endDate = useMemo(
    () => new Date(selectedYear, selectedMonth, 0, 23, 59, 59),
    [selectedYear, selectedMonth]
  );

  const { data: incomes, isLoading } = trpc.incomes.list.useQuery(
    {
      startDate,
      endDate,
      ...(filterCategory !== "all" && { categoryId: Number(filterCategory) }),
    },
    { enabled: !!user?.id }
  );

  const { data: categories } = trpc.categories.list.useQuery({ type: "income" }, { enabled: !!user?.id });
  const utils = trpc.useUtils();

  const createMutation = trpc.incomes.create.useMutation({
    onSuccess: () => {
      utils.incomes.list.invalidate();
      utils.analytics.monthlySummary.invalidate();
      toast.success("Receita criada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar receita: " + error.message);
    },
  });

  const updateMutation = trpc.incomes.update.useMutation({
    onSuccess: () => {
      utils.incomes.list.invalidate();
      utils.analytics.monthlySummary.invalidate();
      toast.success("Receita atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar receita: " + error.message);
    },
  });

  const deleteMutation = trpc.incomes.delete.useMutation({
    onSuccess: () => {
      utils.incomes.list.invalidate();
      utils.analytics.monthlySummary.invalidate();
      toast.success("Receita excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir receita: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      description: "",
      categoryId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      amount: "",
    });
    setEditingIncome(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountInCents = Math.round(parseFloat(formData.amount) * 100);

    const data = {
      description: formData.description,
      categoryId: Number(formData.categoryId),
      date: new Date(formData.date),
      amount: amountInCents,
    };

    if (editingIncome) {
      updateMutation.mutate({ id: editingIncome.income.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (income: any) => {
    setEditingIncome(income);
    setFormData({
      description: income.income.description,
      categoryId: income.income.categoryId.toString(),
      date: format(new Date(income.income.date), "yyyy-MM-dd"),
      amount: (income.income.amount / 100).toFixed(2),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta receita?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const totalIncomes = useMemo(() => {
    return incomes?.reduce((sum, inc) => sum + inc.income.amount, 0) || 0;
  }, [incomes]);

  const sortedIncomes = useMemo(() => {
    if (!incomes) return [];
    const sorted = [...incomes];
    if (sortBy === "date-new") return sorted.sort((a, b) => new Date(b.income.date).getTime() - new Date(a.income.date).getTime());
    if (sortBy === "date-old") return sorted.sort((a, b) => new Date(a.income.date).getTime() - new Date(b.income.date).getTime());
    if (sortBy === "alpha-az") return sorted.sort((a, b) => a.income.description.localeCompare(b.income.description));
    if (sortBy === "alpha-za") return sorted.sort((a, b) => b.income.description.localeCompare(a.income.description));
    if (sortBy === "value-asc") return sorted.sort((a, b) => a.income.amount - b.income.amount);
    if (sortBy === "value-desc") return sorted.sort((a, b) => b.income.amount - a.income.amount);
    return sorted;
  }, [incomes, sortBy]);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receitas</h1>
            <p className="text-gray-600 mt-1">Gerencie suas receitas mensais</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nova Receita
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

        {/* Lista de Receitas */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando receitas...</div>
            ) : sortedIncomes && sortedIncomes.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b gap-2">
                  <p className="text-sm font-medium">Total do período</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(totalIncomes)}</p>
                </div>
                <div className="space-y-3">
                  {sortedIncomes?.map((income) => (
                    <div
                      key={income.income.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{income.income.description}</p>
                        <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                          <span className="truncate">{income.category?.name}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{format(new Date(income.income.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        <p className="text-base sm:text-lg font-semibold text-green-600 flex-shrink-0">
                          {formatCurrency(income.income.amount)}
                        </p>
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(income)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(income.income.id)}
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
              <div className="text-center py-8 text-muted-foreground">Nenhuma receita encontrada neste período</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? "Editar Receita" : "Nova Receita"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Salário, Freelance..."
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingIncome ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
