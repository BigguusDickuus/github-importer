import { useEffect } from "react";
import { X } from "lucide-react";

interface HelloBarProps {
  message: string;
  type: "success" | "warning";
  show: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

export function HelloBar({ message, type, show, onClose, autoCloseDelay = 5000 }: HelloBarProps) {
  useEffect(() => {
    if (show && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [show, autoCloseDelay, onClose]);

  if (!show) return null;

  const bgColor = type === "success" ? "bg-verdant-success" : "bg-solar-warning";
  const textColor = type === "success" ? "text-night-sky" : "text-night-sky";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${bgColor} ${textColor} transition-all duration-300 ${
        show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      style={{ padding: "16px 24px" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        <p className="text-base md:text-lg font-medium text-center">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Fechar notificação"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
