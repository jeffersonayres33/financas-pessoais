import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Upload, X, Image as ImageIcon, Loader2, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExpenseAttachmentUploadWithOCRProps {
  expenseId: number;
  onUploadSuccess?: (extractedData?: any) => void;
  onExtractedData?: (data: any) => void;
}

export function ExpenseAttachmentUploadWithOCR({ 
  expenseId, 
  onUploadSuccess,
  onExtractedData 
}: ExpenseAttachmentUploadWithOCRProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments, isLoading: attachmentsLoading } = trpc.attachments.list.useQuery(
    { expenseId },
    { enabled: isOpen }
  );

  const uploadMutation = trpc.attachments.upload.useMutation({
    onSuccess: () => {
      toast.success("Foto enviada com sucesso!");
      setSelectedFile(null);
      setPreview(null);
      setExtractedData(null);
      utils.attachments.list.invalidate({ expenseId });
      onUploadSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao enviar foto: " + error.message);
    },
  });

  const deleteMutation = trpc.attachments.delete.useMutation({
    onSuccess: () => {
      toast.success("Foto removida com sucesso!");
      utils.attachments.list.invalidate({ expenseId });
    },
    onError: (error) => {
      toast.error("Erro ao remover foto: " + error.message);
    },
  });

  const ocrMutation = trpc.ocr.extractReceiptData.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setExtractedData(data);
        onExtractedData?.(data);
        toast.success("Dados extraídos com sucesso!");
      } else {
        toast.error("Erro ao extrair dados: " + data.error);
      }
    },
    onError: (error) => {
      toast.error("Erro ao processar imagem: " + error.message);
    },
  });

  const utils = trpc.useUtils();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem não pode exceder 5MB");
      return;
    }

    setSelectedFile(file);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractOCR = async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      ocrMutation.mutate({
        imageUrl: preview,
        fileName: selectedFile?.name,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const response = await fetch("/api/trpc/attachments.upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expenseId,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload");
      }

      const result = await response.json();

      const formData = new FormData();
      formData.append("file", selectedFile);

      const s3Response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!s3Response.ok) {
        throw new Error("Erro ao fazer upload para S3");
      }

      const s3Data = await s3Response.json();

      uploadMutation.mutate({
        expenseId,
        fileName: selectedFile.name,
        fileUrl: s3Data.url,
        fileKey: s3Data.key,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
      });
    } catch (error) {
      toast.error("Erro ao fazer upload: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Fotos
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Fotos de Recibos</DialogTitle>
            <DialogDescription>
              Faça upload de fotos de notas fiscais ou recibos. O sistema pode extrair automaticamente os dados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-accent transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <p className="font-medium">Clique para selecionar uma imagem</p>
              <p className="text-sm text-muted-foreground">ou arraste uma imagem aqui</p>
              <p className="text-xs text-muted-foreground mt-2">Máximo 5MB • PNG, JPG, GIF</p>
            </div>

            {/* Preview e OCR */}
            {preview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Preview da Imagem */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Imagem</Label>
                    <img src={preview} alt="Preview" className="w-full rounded-lg border" />
                  </div>

                  {/* Dados Extraídos */}
                  {extractedData && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Dados Extraídos</Label>
                      <div className="space-y-3 bg-muted p-4 rounded-lg">
                        {/* Confiança */}
                        <div className="flex items-center gap-2">
                          {extractedData.confidence === "alto" && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {extractedData.confidence === "médio" && (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          {extractedData.confidence === "baixo" && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-xs font-medium">
                            Confiança: {extractedData.confidence}
                          </span>
                        </div>

                        {/* Estabelecimento */}
                        {extractedData.establishment && (
                          <div>
                            <Label className="text-xs">Estabelecimento</Label>
                            <p className="text-sm font-medium">{extractedData.establishment}</p>
                          </div>
                        )}

                        {/* Valor */}
                        {extractedData.amount && (
                          <div>
                            <Label className="text-xs">Valor</Label>
                            <p className="text-sm font-medium">
                              R$ {(extractedData.amount / 100).toFixed(2)}
                            </p>
                          </div>
                        )}

                        {/* Data */}
                        {extractedData.date && (
                          <div>
                            <Label className="text-xs">Data</Label>
                            <p className="text-sm font-medium">
                              {format(new Date(extractedData.date), "dd/MM/yyyy")}
                            </p>
                          </div>
                        )}

                        {/* Notas */}
                        {extractedData.notes && (
                          <div>
                            <Label className="text-xs">Observações</Label>
                            <p className="text-xs text-muted-foreground">{extractedData.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  {!extractedData && (
                    <Button
                      onClick={handleExtractOCR}
                      disabled={ocrMutation.isPending || isProcessing}
                      variant="secondary"
                      className="flex-1"
                    >
                      {ocrMutation.isPending || isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Extrair Dados (OCR)
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar Foto
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setExtractedData(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Attachments List */}
            {attachmentsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : attachments && attachments.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-medium">Fotos Enviadas ({attachments.length})</h3>
                <div className="grid grid-cols-3 gap-4">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative group">
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteMutation.mutate({ id: attachment.id, expenseId })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{attachment.fileName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma foto enviada ainda</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
