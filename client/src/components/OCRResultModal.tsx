import { ExtractedReceiptData } from "@/types/receipt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface OCRResultModalProps {
  data: ExtractedReceiptData;
  imagePreview: string;
  onConclude: (data: ExtractedReceiptData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function OCRResultModal({
  data,
  imagePreview,
  onConclude,
  onCancel,
  isLoading = false,
}: OCRResultModalProps) {
  const confidenceColor = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-red-100 text-red-800",
  };

  const confidenceIcon = {
    high: <CheckCircle className="w-4 h-4" />,
    medium: <AlertTriangle className="w-4 h-4" />,
    low: <AlertCircle className="w-4 h-4" />,
  };

  const confidenceLabel = {
    high: "Alta confiança",
    medium: "Confiança média",
    low: "Baixa confiança",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Dados Extraídos do Recibo</CardTitle>
          <CardDescription>
            Revise os dados extraídos antes de concluir. Você poderá editar qualquer campo após confirmar.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Preview da Imagem */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={imagePreview}
              alt="Recibo"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>

          {/* Badge de Confiança */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Nível de Confiança:</span>
            <Badge className={`${confidenceColor[data.confidence]} flex items-center gap-1`}>
              {confidenceIcon[data.confidence]}
              {confidenceLabel[data.confidence]}
            </Badge>
          </div>

          {/* Dados Extraídos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Valor</label>
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-lg font-semibold text-gray-900">
                  {data.value !== null ? `R$ ${data.value.toFixed(2)}` : "Não extraído"}
                </p>
              </div>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data</label>
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-lg font-semibold text-gray-900">
                  {data.date ? new Date(data.date).toLocaleDateString("pt-BR") : "Não extraída"}
                </p>
              </div>
            </div>

            {/* Estabelecimento */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Estabelecimento</label>
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-gray-900">{data.establishment || "Não extraído"}</p>
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <p className="text-gray-900 capitalize">{data.category || "Não extraída"}</p>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Descrição</label>
              <div className="bg-gray-50 rounded p-3 border border-gray-200 min-h-20">
                <p className="text-gray-900">{data.description || "Não extraída"}</p>
              </div>
            </div>
          </div>

          {/* Aviso de Baixa Confiança */}
          {data.confidence === "low" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ Baixa confiança na extração. Verifique cuidadosamente os dados antes de confirmar.
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => onConclude(data)}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Processando..." : "Concluir"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
