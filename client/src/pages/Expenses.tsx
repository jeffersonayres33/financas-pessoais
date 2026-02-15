
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
import { Check, Filter, Pencil, Plus, Trash2, X, Loader } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Expenses() {
  const { user } = useAuth();
  
  // Estados para filtros
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  const [filterInstallments, setFilterInstallments] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-new");
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState<ExtractedReceiptData | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string>("");
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formData, setFormData] = useState({
    establishment: "",
    amount: "",
    categoryId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    paid: "no" as "yes" | "no",
    paymentDate: "",
    totalInstallments: 1,
    currentInstallment: 1,
  });

  const startDate = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, 1);
  }, [selectedMonth, selectedYear]);

  const endDate = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0);
  }, [selectedMonth, selectedYear]);

  const { data: expenses, isLoading } = trpc.expenses.list.useQuery(
    {
      startDate,
      endDate,
      ...(filterCategory !== "all" && { categoryId: Number(filterCategory) }),
      ...(filterPaid !== "all" && { paid: filterPaid as "yes" | "no" }),
    },
    { enabled: !!user }
  );

  const { data: categories } = trpc.categories.list.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();
  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      toast.success("Despesa deletada com sucesso");
    },
  });
  const updateMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      toast.success("Despesa atualizada com sucesso");
    },
  });
  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      utils.expenses.list.invalidate();
      toast.success("Despesa criada com sucesso");
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
    if (sortBy === "date-new") return sorted.reverse();
    if (sortBy === "date-old") return sorted;
    if (sortBy === "alpha-az")
      return sorted.sort((a, b) => a.expense.establishment.localeCompare(b.expense.establishment));
    if (sortBy === "alpha-za")
      return sorted.sort((a, b) => b.expense.establishment.localeCompare(a.expense.establishment));
    if (sortBy === "value-asc") return sorted.sort((a, b) => a.expense.amount - b.expense.amount);
    if (sortBy === "value-desc") return sorted.sort((a, b) => b.expense.amount - a.expense.amount);
    return sorted;
  }, [filteredExpenses, sortBy]);

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      establishment: expense.expense.establishment,
      amount: (expense.expense.amount / 100).toString(),
      categoryId: expense.category?.id?.toString() || "",
      purchaseDate: new Date(expense.expense.purchaseDate).toISOString().split("T")[0],
      paid: expense.expense.paid,
      paymentDate: expense.expense.paymentDate
        ? new Date(expense.expense.paymentDate).toISOString().split("T")[0]
        : "",
      totalInstallments: expense.expense.totalInstallments || 1,
      currentInstallment: expense.expense.currentInstallment || 1,
    });
    setIsDialogOpen(true);
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    setFormData({
      establishment: "",
      amount: "",
      categoryId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      paid: "no" as "yes" | "no",
      paymentDate: "",
      totalInstallments: 1,
      currentInstallment: 1,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta despesa?")) {
      await deleteMutation.mutateAsync({ id });
    }
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
    if (data.value !== null && data.value !== undefined) {
      // O OCR retorna o valor em reais (ex: 293.81)
      // Garantir que está em reais e converter para string com 2 casas decimais
      const valueInReais = typeof data.value === 'string' ? parseFloat(data.value) : data.value;
      setFormData((prev) => ({ ...prev, amount: valueInReais.toFixed(2) }));
    }
    if (data.date) {
      setFormData((prev) => ({ ...prev, purchaseDate: data.date || prev.purchaseDate }));
    }
    setShowOCRModal(false);
    setOcrResult(null);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      establishment: "",
      categoryId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      amount: "",
      paid: "no" as "yes" | "no",
      paymentDate: "",
      totalInstallments: 1,
      currentInstallment: 1,
    });
    setEditingExpense(null);
    setIsDialogOpen(false);
    setShowOCRModal(false);
    setOcrResult(null);
    setOcrImagePreview("");
  }

  const handleSaveEdit = async () => {
    if (!formData.establishment || !formData.amount || !formData.categoryId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (editingExpense) {
      await updateMutation.mutateAsync({
        id: editingExpense.expense.id,
        establishment: formData.establishment,
        amount: Math.round(Number(formData.amount) * 100),
        categoryId: Number(formData.categoryId),
        purchaseDate: new Date(formData.purchaseDate),
        paid: formData.paid,
        paymentDate: formData.paid === "yes" && formData.paymentDate ? new Date(formData.paymentDate) : undefined,
      });
      setIsDialogOpen(false);
      setEditingExpense(null);
      setFormData({
        establishment: "",
        amount: "",
        categoryId: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        paid: "no" as "yes" | "no",
        paymentDate: "",
        totalInstallments: 1,
        currentInstallment: 1,
      });
    }
  };

  const handleSaveNew = async () => {
    if (!formData.establishment || !formData.amount || !formData.categoryId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const totalInstallments = formData.totalInstallments || 1;
    const amountPerInstallment = Math.round(Number(formData.amount) * 100) / totalInstallments;
    
    for (let i = 1; i <= totalInstallments; i++) {
      const installmentDate = new Date(formData.purchaseDate);
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
      
      await createMutation.mutateAsync({
        establishment: formData.establishment,
        amount: Math.round(amountPerInstallment),
        categoryId: Number(formData.categoryId),
        purchaseDate: installmentDate,
        paid: formData.paid,
        paymentDate: formData.paid === "yes" && formData.paymentDate ? new Date(formData.paymentDate) : undefined,
        totalInstallments,
        currentInstallment: i,
      });
    }
    setIsDialogOpen(false);
    setFormData({
      establishment: "",
      amount: "",
      categoryId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      paid: "no" as "yes" | "no",
      paymentDate: "",
      totalInstallments: 1,
      currentInstallment: 1,
    });
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
          <Button onClick={handleNewExpense} className="gap-2 w-full sm:w-auto">
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
                    <option value="all">Todas</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
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
                    <option value="yes">Pago</option>
                    <option value="no">Não Pago</option>
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

        {/* Despesas */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : sortedExpenses.length > 0 ? (
              <div className="space-y-3">
                {sortedExpenses.map((expense) => (
                  <div
                    key={expense.expense.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <p className="font-medium truncate">{expense.expense.establishment}</p>
                        {expense.expense.totalInstallments > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            parcelado {expense.expense.currentInstallment}/{expense.expense.totalInstallments}
                          </span>
                        )}
                        {expense.expense.paid === "yes" && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            <Check className="w-3 h-3" />
                            Pago
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingExpense && (
              <div className="border-b pb-4">
                <Label className="text-sm font-medium">Extrair Dados do Recibo</Label>
                <ReceiptUploader
                  onImageSelected={(file, preview) => {
                    setOcrImagePreview(preview);
                  }}
                  onExtract={(file) => {
                    handleExtractOCR(file);
                  }}
                  isExtracting={isExtracting}
                />
              </div>
            )}
            <div>
              <Label>Estabelecimento *</Label>
              <Input
                value={formData.establishment}
                onChange={(e) => setFormData({ ...formData, establishment: e.target.value })}
                placeholder="Ex: Supermercado, Restaurante..."
                className="mt-2"
              />
            </div>

            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Categoria *</Label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              <Label>Data da Compra *</Label>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Status de Pagamento</Label>
              <select
                value={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.value as "yes" | "no" })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="no">Não Pago</option>
                <option value="yes">Pago</option>
              </select>
            </div>

            {formData.paid === "yes" && (
              <div>
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="mt-2"
                />
              </div>
            )}

            {!editingExpense && (
              <div>
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.totalInstallments}
                  onChange={(e) => setFormData({ ...formData, totalInstallments: Number(e.target.value) })}
                  placeholder="1"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Número de parcelas (máximo 12)</p>
              </div>
            )}

            {editingExpense && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Anexos</Label>
                <ExpenseAttachmentUploadWithOCR expenseId={editingExpense.expense.id} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={editingExpense ? handleSaveEdit : handleSaveNew}>
              {editingExpense ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showOCRModal && ocrResult && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOCRModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <OCRResultModal
              data={ocrResult}
              imagePreview={ocrImagePreview}
              onConclude={(confirmedData: ExtractedReceiptData) => {
                setFormData({
                  ...formData,
                  establishment: confirmedData.establishment || formData.establishment,
                  amount: confirmedData.value ? (confirmedData.value / 100).toString() : formData.amount,
                  purchaseDate: confirmedData.date
                    ? new Date(confirmedData.date).toISOString().split("T")[0]
                    : formData.purchaseDate,
                });
                setShowOCRModal(false);
                setOcrResult(null);
                setIsDialogOpen(true);
              }}
              onCancel={() => {
                setShowOCRModal(false);
                setOcrResult(null);
                setIsDialogOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {isExtracting && (
        <LoadingOverlay isVisible={isExtracting} message="Processando imagem..." />
      )}
    </DashboardLayout>
  );
}
