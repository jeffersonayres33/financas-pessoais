import { Settings } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingOverlay({ isVisible, message = "Aguarde..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <Settings className="w-16 h-16 text-white animate-spin" />
        </div>
        <p className="text-white text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
