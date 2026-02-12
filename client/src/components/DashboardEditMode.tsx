import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, GripVertical, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface Widget {
  widgetId: string;
  label: string;
  isVisible: boolean;
  position: number;
}

interface DashboardEditModeProps {
  widgets: Widget[];
  onClose: () => void;
  onSave: (widgets: Widget[]) => void;
}

export function DashboardEditMode({ widgets: initialWidgets, onClose, onSave }: DashboardEditModeProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const updatePreferencesMutation = trpc.widgets.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferências salvas com sucesso!");
      onSave(widgets);
    },
    onError: (error) => {
      toast.error("Erro ao salvar preferências: " + error.message);
    },
  });

  const toggleVisibility = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.widgetId === widgetId ? { ...w, isVisible: !w.isVisible } : w
    ));
  };

  const moveWidget = (fromIndex: number, toIndex: number) => {
    const newWidgets = [...widgets];
    const [movedWidget] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, movedWidget);
    
    // Atualizar posições
    const updated = newWidgets.map((w, i) => ({ ...w, position: i }));
    setWidgets(updated);
  };

  const handleSave = () => {
    updatePreferencesMutation.mutate(
      widgets.map(w => ({
        widgetId: w.widgetId,
        isVisible: w.isVisible,
        position: w.position,
      }))
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedWidget(index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedWidget !== null) {
      const fromIndex = parseInt(draggedWidget);
      if (fromIndex !== toIndex) {
        moveWidget(fromIndex, toIndex);
      }
      setDraggedWidget(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Personalizar Dashboard</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Arraste os widgets para reorganizar, clique no ícone de olho para mostrar/ocultar.
          </p>

          <div className="space-y-3 mb-6">
            {widgets.map((widget, index) => (
              <div
                key={widget.widgetId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-3 p-4 border rounded-lg cursor-move transition-all ${
                  draggedWidget === index.toString()
                    ? "opacity-50 bg-muted"
                    : "hover:bg-muted/50"
                }`}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1">
                  <p className="font-medium">{widget.label}</p>
                  <p className="text-xs text-muted-foreground">Posição: {index + 1}</p>
                </div>

                <button
                  onClick={() => toggleVisibility(widget.widgetId)}
                  className={`p-2 rounded-lg transition-colors ${
                    widget.isVisible
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title={widget.isVisible ? "Ocultar" : "Mostrar"}
                >
                  {widget.isVisible ? (
                    <Eye className="h-5 w-5" />
                  ) : (
                    <EyeOff className="h-5 w-5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={updatePreferencesMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePreferencesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updatePreferencesMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
