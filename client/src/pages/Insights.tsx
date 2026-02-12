import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Bell, Lightbulb, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function Insights() {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [generatedInsights, setGeneratedInsights] = useState<string | null>(null);

  const generateMutation = trpc.insights.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedInsights(typeof data.insights === 'string' ? data.insights : JSON.stringify(data.insights));
      toast.success("Insights gerados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar insights: " + error.message);
    },
  });

  const checkAlertsMutation = trpc.analytics.checkBudgetAlerts.useMutation({
    onSuccess: (data) => {
      if (data.alerts.length > 0) {
        toast.success(`${data.alerts.length} alerta(s) de orçamento enviado(s)!`);
      } else {
        toast.info("Nenhum alerta de orçamento necessário no momento.");
      }
    },
    onError: (error) => {
      toast.error("Erro ao verificar alertas: " + error.message);
    },
  });

  const handleGenerateInsights = () => {
    generateMutation.mutate({ month: selectedMonth, year: selectedYear });
  };

  const handleCheckAlerts = () => {
    checkAlertsMutation.mutate({ month: selectedMonth, year: selectedYear });
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Insights Financeiros</h1>
            <p className="text-muted-foreground">Análises inteligentes e alertas de orçamento</p>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                Gerar Insights com IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Utilize inteligência artificial para analisar seus padrões de gastos, identificar despesas anômalas e
                receber sugestões personalizadas de otimização de orçamento.
              </p>
              <Button
                onClick={handleGenerateInsights}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Insights...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Gerar Análise
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Verificar Alertas de Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Verifique se alguma categoria ultrapassou 80% ou 100% do orçamento mensal. Notificações serão enviadas
                automaticamente ao proprietário.
              </p>
              <Button
                onClick={handleCheckAlerts}
                disabled={checkAlertsMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {checkAlertsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Verificar Alertas
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {generatedInsights && (
          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira Personalizada</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <Streamdown>{generatedInsights}</Streamdown>
            </CardContent>
          </Card>
        )}

        {!generatedInsights && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma análise gerada ainda</p>
                <p className="text-sm">
                  Clique em "Gerar Análise" para obter insights personalizados sobre suas finanças
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
