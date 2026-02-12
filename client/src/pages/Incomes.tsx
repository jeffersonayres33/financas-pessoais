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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Incomes() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
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
            <h1 className="text-3xl font-bold tracking-tight">Receitas</h1>
            <p className="text-muted-foreground">Gerencie suas receitas mensais</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
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
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Total de Receitas</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncomes)}</p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : incomes && incomes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma receita encontrada neste período</p>
            ) : (
              <div className="space-y-3">
                {incomes?.map((income) => (
                  <div
                    key={income.income.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{income.income.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{income.category?.name}</span>
                        <span>•</span>
                        <span>{format(new Date(income.income.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(income.income.amount)}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(income)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(income.income.id)}
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
              <DialogTitle>{editingIncome ? "Editar Receita" : "Nova Receita"}</DialogTitle>
              <DialogDescription>
                {editingIncome ? "Atualize as informações da receita" : "Preencha os dados da nova receita"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Salário, Freelance, Investimentos..."
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
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
      </div>
    </DashboardLayout>
  );
}
