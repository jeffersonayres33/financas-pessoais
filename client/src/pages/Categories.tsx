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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Categories() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>("date-new");
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "expense" | "income",
    monthlyBudget: "",
  });

  const { data: categories, isLoading } = trpc.categories.list.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    const sorted = [...categories];
    if (sortBy === "date-new") return sorted.reverse();
    if (sortBy === "date-old") return sorted;
    if (sortBy === "alpha-az") return sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "alpha-za") return sorted.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === "value-asc") return sorted.sort((a, b) => a.monthlyBudget - b.monthlyBudget);
    if (sortBy === "value-desc") return sorted.sort((a, b) => b.monthlyBudget - a.monthlyBudget);
    return sorted;
  }, [categories, sortBy]);

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("Categoria criada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("Categoria atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir categoria: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", type: "expense", monthlyBudget: "" });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetInCents = Math.round(parseFloat(formData.monthlyBudget) * 100);

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        name: formData.name,
        monthlyBudget: budgetInCents,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        type: formData.type,
        monthlyBudget: budgetInCents,
      });
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      monthlyBudget: (category.monthlyBudget / 100).toFixed(2),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const expenseCategories = sortedCategories?.filter((c) => c.type === "expense") || [];
  const incomeCategories = sortedCategories?.filter((c) => c.type === "income") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
            <p className="text-gray-600 mt-1">Gerencie suas categorias de despesas e receitas</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-4">
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
                    <option value="value-asc">Orçamento: Menor para Maior</option>
                    <option value="value-desc">Orçamento: Maior para Menor</option>
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

        {/* Categorias */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Categorias de Despesas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Categorias de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma categoria de despesa cadastrada</p>
                ) : (
                  <div className="space-y-3">
                    {expenseCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{category.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Orçamento: {formatCurrency(category.monthlyBudget)}
                          </p>
                        </div>
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteMutation.isPending}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categorias de Receitas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Categorias de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhuma categoria de receita cadastrada</p>
                ) : (
                  <div className="space-y-3">
                    {incomeCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{category.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Orçamento: {formatCurrency(category.monthlyBudget)}
                          </p>
                        </div>
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteMutation.isPending}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Atualize as informações da categoria"
                  : "Preencha os dados para criar uma nova categoria"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Alimentação, Transporte..."
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as "expense" | "income" })
                  }
                  disabled={!!editingCategory}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <div>
                <Label htmlFor="budget">Orçamento Mensal (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                  placeholder="0,00"
                  required
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCategory ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
