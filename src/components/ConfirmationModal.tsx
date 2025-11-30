import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  requirePassword?: boolean;
  password?: string;
  onPasswordChange?: (value: string) => void;
  passwordError?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  requirePassword = false,
  password = "",
  onPasswordChange,
  passwordError = false,
}: ConfirmationModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ marginTop: "16px" }}>
        <p className="text-moonlight-text" style={{ marginBottom: "24px" }}>
          {message}
        </p>

        {/* Campo de senha (se necessário) */}
        {requirePassword && (
          <div style={{ marginBottom: "24px" }}>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => onPasswordChange?.(e.target.value)}
                placeholder="Insira sua senha para confirmar"
                className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                style={{ padding: "12px 44px 12px 16px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-moonlight-text hover:text-starlight-text transition-colors"
                style={{ padding: "8px" }}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-blood-moon-error text-sm" style={{ marginTop: "6px" }}>
                Senha inválida
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            style={{ height: "44px" }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 ${
              variant === "danger"
                ? "bg-blood-moon-error hover:bg-blood-moon-error/80 border-blood-moon-error"
                : ""
            }`}
            style={{ height: "44px" }}
            disabled={requirePassword && !password}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}