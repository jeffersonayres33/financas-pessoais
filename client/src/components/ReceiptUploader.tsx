import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ReceiptUploaderProps {
  onImageSelected: (file: File, preview: string) => void;
  onExtract: (file: File) => void;
  isExtracting?: boolean;
}

export default function ReceiptUploader({
  onImageSelected,
  onExtract,
  isExtracting = false,
}: ReceiptUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      setSelectedFile(file);
      onImageSelected(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExtract = () => {
    if (selectedFile) {
      onExtract(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Foto do Recibo/Nota Fiscal
        </CardTitle>
        <CardDescription>
          Selecione uma imagem para extrair dados automaticamente
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!preview ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Clique para selecionar uma imagem
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ou arraste e solte (PNG, JPG, WebP - máx 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview da Imagem */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview do recibo"
                className="w-full h-auto max-h-96 object-contain"
              />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                onClick={handleExtract}
                disabled={isExtracting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isExtracting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Extraindo Dados...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Extrair Dados (OCR)
                  </>
                )}
              </Button>

              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
