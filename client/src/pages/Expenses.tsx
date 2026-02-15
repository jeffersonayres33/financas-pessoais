import { useAuth } from "@/_core/hooks/useAuth";
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
import { Check, Filter, Pencil, Plus, Trash2, X, Image } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Expenses() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-new");
  const [filterInstallments, setFilterInstallments] = useState<string>("all");
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [showReceiptUploadModal, setShowReceiptUploadModal] = useState(false);
  const [ocrResult, setOcrResult] = useState<ExtractedReceiptData | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  
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
    installments: 1,
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
    { enabled: !!user?.id }
  );

  const { data: categories } = trpc.categories.list.useQuery({ type: "expense" }, { enabled: !!user?.id });
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

  const uploadMutation = trpc.receipt.uploadImage.useMutation({
    onSuccess: (data) => {
      extractMutation.mutate({ imageUrl: data.url });
    },
    onError: (error) => {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da imagem");
      setIsExtracting(false);
    },
  });

  const extractMutation = trpc.receipt.extractData.useMutation({
    onSuccess: (data) => {
      setOcrResult(data);
      setShowOCRModal(true);
      setIsExtracting(false);
    },
    onError: (error) => {
      console.error("Erro ao extrair dados:", error);
      toast.error("Erro ao extrair dados do recibo");
      setIsExtracting(false);
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
      installments: 1,
    });
    setEditingExpense(null);
    setIsDialogOpen(false);
    setShowOCRModal(false);
    setOcrResult(null);
    setOcrImagePreview("");
  };

  const handleReceiptImageSelected = async (file: File, preview: string) => {
    setOcrImagePreview(preview);
  };

  const handleExtractOCR = async (file: File) => {
    setIsExtracting(true);
    setIsDialogOpen(false);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64 = base64String.includes(",") ? base64String.split(",")[1] : base64String;
        uploadMutation.mutate({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar arquivo");
      setIsExtracting(false);
      setIsDialogOpen(true);
    }
  };

  const handleOCRConclude = (data: ExtractedReceiptData) => {
    if (data.establishment) {
      setFormData((prev) => ({ ...prev, establishment: data.establishment || "" }));
    }
    if (data.value) {
      setFormData((prev) => ({ ...prev, amount: data.value!.toFixed(2) }));
    }
    if (data.date) {
      setFormData((prev) => ({ ...prev, purchaseDate: data.date || prev.purchaseDate }));
    }
    setShowOCRModal(false);
    setOcrResult(null);
    setIsDialogOpen(true);
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
      updateMutation.mutate({ id: editingExpense.expense.id, ...data, purchaseDate: new Date(formData.purchaseDate), totalInstallments: formData.installments || 1, currentInstallment: 1 });
    } else {
      const startDate = new Date(formData.purchaseDate);
      const installments = formData.installments || 1;
      for (let i = 0; i < installments; i++) {
        const expenseDate = new Date(startDate);
        expenseDate.setMonth(expenseDate.getMonth() + i);
        createMutation.mutate({
          ...data,
          purchaseDate: expenseDate,
          totalInstallments: installments,
          currentInstallment: i + 1,
        });
      }
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
      installments: 1,
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

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    let sorted = [...expenses];
    
    if (filterInstallments === "installments") {
      sorted = sorted.filter((e) => e.expense.totalInstallments > 1);
    } else if (filterInstallments === "no-installments") {
      sorted = sorted.filter((e) => e.expense.totalInstallments === 1);
    }
    if (sortBy === "date-new") return sorted.sort((a, b) => new Date(b.expense.purchaseDate).getTime() - new Date(a.expense.purchaseDate).getTime());
    if (sortBy === "date-old") return sorted.sort((a, b) => new Date(a.expense.purchaseDate).getTime() - new Date(b.expense.purchaseDate).getTime());
    if (sortBy === "alpha-az") return sorted.sort((a, b) => a.expense.establishment.localeCompare(b.expense.establishment));
    if (sortBy === "alpha-za") return sorted.sort((a, b) => b.expense.establishment.localeCompare(a.expense.establishment));
    if (sortBy === "value-asc") return sorted.sort((a, b) => a.expense.amount - b.expense.amount);
    if (sortBy === "value-desc") return sorted.sort((a, b) => b.expense.amount - a.expense.amount);
    return sorted;
  }, [expenses, sortBy, filterInstallments]);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Despesas</h1>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Despesa
          </Button>
        </div>

        {/* Filtros e Ordenação */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label className="text-sm">Mês</Label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm">Ano</Label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm">Categoria</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">Todas</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm">Status</Label>
                <select
                  value={filterPaid}
                  onChange={(e) => setFilterPaid(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">Todos</option>
                  <option value="yes">Pagos</option>
                  <option value="no">Não Pagos</option>
                </select>
              </div>
              <div>
                <Label className="text-sm">Ordenar por</Label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="date-new">Data (Recente)</option>
                  <option value="date-old">Data (Antigo)</option>
                  <option value="alpha-az">A-Z</option>
                  <option value="alpha-za">Z-A</option>
                  <option value="value-asc">Valor (Menor)</option>
                  <option value="value-desc">Valor (Maior)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total do período</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Despesas */}
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center text-gray-500">Carregando...</p>
          ) : sortedExpenses.length === 0 ? (
            <p className="text-center text-gray-500">Nenhuma despesa encontrada</p>
          ) : (
            sortedExpenses.map((item) => (
              <Card key={item.expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{item.expense.establishment}</h3>
                        {item.expense.totalInstallments > 1 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {item.expense.currentInstallment}/{item.expense.totalInstallments}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.category?.name} • {format(new Date(item.expense.purchaseDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(item.expense.amount)}</p>
                      <p className={`text-sm ${item.expense.paid === "yes" ? "text-green-600" : "text-orange-600"}`}>
                        {item.expense.paid === "yes" ? "Pago" : "Não pago"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePaid(item)}
                        title={item.expense.paid === "yes" ? "Marcar como não pago" : "Marcar como pago"}
                      >
                        <Check className={`w-4 h-4 ${item.expense.paid === "yes" ? "text-green-600" : "text-gray-400"}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.expense.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog para Nova/Editar Despesa */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "Atualize os dados da despesa" : "Preencha os dados da nova despesa"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="establishment">Estabelecimento</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReceiptUploadModal(true)}
                    className="text-xs"
                  >
                    📷 Extrair do Recibo
                  </Button>
                </div>
                <Input
                  id="establishment"
                  value={formData.establishment}
                  onChange={(e) => setFormData({ ...formData, establishment: e.target.value })}
                  placeholder="Ex: Supermercado, Restaurante..."
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
              {!editingExpense && (
                <div className="space-y-2">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                  {formData.installments > 1 && (
                    <p className="text-sm text-muted-foreground">
                      Será criada {formData.installments} despesa(s)
                    </p>
                  )}
                </div>
              )}
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

        {showOCRModal && ocrResult && (
          <OCRResultModal
            data={ocrResult}
            imagePreview={ocrImagePreview}
            onConclude={handleOCRConclude}
            onCancel={() => {
              setShowOCRModal(false);
              setOcrResult(null);
            }}
            isLoading={isExtracting}
          />
        )}

        {/* Modal para Upload de Recibo */}
        <Dialog open={showReceiptUploadModal} onOpenChange={setShowReceiptUploadModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Extrair Dados do Recibo</DialogTitle>
              <DialogDescription>
                Envie uma foto do recibo ou nota fiscal para extrair os dados automaticamente
              </DialogDescription>
            </DialogHeader>
            <ReceiptUploader
              onImageSelected={handleReceiptImageSelected}
              onExtract={handleExtractOCR}
              isExtracting={isExtracting}
            />
          </DialogContent>
        </Dialog>

        <LoadingOverlay isVisible={isExtracting} message="Processando imagem..." />
      </div>
    </DashboardLayout>
  );
}
