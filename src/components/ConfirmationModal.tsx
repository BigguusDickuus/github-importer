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
      <div className="mt-4">
        <p className="text-moonlight-text mb-6">
          {message}
        </p>

        {/* Campo de senha (se necessário) */}
        {requirePassword && (
          <div className="mb-6">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => onPasswordChange?.(e.target.value)}
                placeholder="Insira sua senha para confirmar"
                className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors py-3 pr-[44px] pl-4"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-moonlight-text hover:text-starlight-text transition-colors p-2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-blood-moon-error text-sm mt-[6px]">
                Senha inválida
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-touch"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 h-touch ${
              variant === "danger"
                ? "bg-blood-moon-error hover:bg-blood-moon-error/80 border-blood-moon-error"
                : ""
            }`}
            disabled={requirePassword && !password}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}