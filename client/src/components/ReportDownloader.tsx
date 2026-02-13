import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReportDownloader() {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<"monthly" | "annual">("monthly");
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const monthlyPDFMutation = trpc.reports.monthlyPDF.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Decodificar base64 e criar blob
        const binaryString = atob(data.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });

        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        // Remover link de forma segura
        if (link.parentNode === document.body) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);

        toast.success("Relatório baixado com sucesso!");
        setIsOpen(false);
      }
    },
    onError: (error) => {
      toast.error("Erro ao gerar relatório: " + error.message);
    },
  });

  const annualPDFMutation = trpc.reports.annualPDF.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        // Decodificar base64 e criar blob
        const binaryString = atob(data.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });

        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        // Remover link de forma segura
        if (link.parentNode === document.body) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);

        toast.success("Relatório baixado com sucesso!");
        setIsOpen(false);
      }
    },
    onError: (error) => {
      toast.error("Erro ao gerar relatório: " + error.message);
    },
  });

  const handleDownload = () => {
    if (reportType === "monthly") {
      monthlyPDFMutation.mutate({
        month: parseInt(month),
        year: parseInt(year),
      });
    } else {
      annualPDFMutation.mutate({
        year: parseInt(year),
      });
    }
  };

  const isLoading = monthlyPDFMutation.isPending || annualPDFMutation.isPending;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Baixar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Baixar Relatório</DialogTitle>
          <DialogDescription>
            Selecione o tipo de relatório e o período desejado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de Relatório */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Relatório Mensal</SelectItem>
                <SelectItem value="annual">Relatório Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mês (apenas para relatório mensal) */}
          {reportType === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2024, m - 1).toLocaleDateString("pt-BR", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ano */}
          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão de Download */}
          <Button onClick={handleDownload} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
