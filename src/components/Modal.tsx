import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, footer, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '16px' }}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-night-sky/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content Wrapper with X button */}
      <div className="relative pointer-events-auto">
        {/* Botão X - Fora do modal, canto superior direito */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div
          className={`bg-midnight-surface border border-obsidian-border rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
        >
          {/* Header */}
          {title && (
            <div 
              className="text-starlight-text"
              style={{ padding: '32px 32px 0 32px' }}
            >
              <h3>{title}</h3>
            </div>
          )}

          {/* Body */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{ padding: '24px 32px 32px 32px' }}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div 
              className="border-t border-obsidian-border"
              style={{ padding: '24px 32px 32px 32px' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}