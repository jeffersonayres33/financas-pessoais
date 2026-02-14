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
import { Check, Filter, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Expenses() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  const [showOCRModal, setShowOCRModal] = useState(false);
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
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Pagos</SelectItem>
              <SelectItem value="no">Não pagos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando despesas...</div>
            ) : expenses && expenses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <p className="text-sm font-medium">Total do período</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
                </div>
                {expenses.map((expense) => (
                  <div key={expense.expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePaid(expense)}
                          className={expense.expense.paid === "yes" ? "text-green-600" : "text-gray-400"}
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{expense.expense.establishment}</p>
                            {expense.expense.totalInstallments > 1 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                parcelado {expense.expense.currentInstallment}/{expense.expense.totalInstallments}
                              </span>
                            )}
                          </div>
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "Atualize as informações da despesa" : "Preencha os dados da nova despesa"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {!editingExpense && (
                  <ReceiptUploader
                    onImageSelected={handleReceiptImageSelected}
                    onExtract={handleExtractOCR}
                    isExtracting={isExtracting}
                  />
                )}
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

        <LoadingOverlay isVisible={isExtracting} message="Processando imagem..." />
      </div>
    </DashboardLayout>
  );
}
