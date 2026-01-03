import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "verifying" | "success" | "error";

function safeNext(nextRaw: string | null): string {
  // segurança: só permite caminho interno tipo "/alguma-coisa"
  if (!nextRaw) return "/";
  if (nextRaw.startsWith("/")) return nextRaw;
  return "/";
}

export default function AuthConfirm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token_hash = params.get("token_hash") || "";
  const type = params.get("type") || ""; // ex: "email" ou "signup"
  const next = useMemo(() => safeNext(params.get("next")), [params]);

  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Confirmando…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token_hash || !type) {
        setStatus("error");
        setMessage("Link inválido ou incompleto. Use o link mais recente enviado para seu email.");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setMessage(`Não foi possível confirmar. ${error.message}`);
        return;
      }

      setStatus("success");
      setMessage("Email confirmado! Redirecionando…");

      setTimeout(() => {
        if (!cancelled) navigate(next, { replace: true });
      }, 800);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token_hash, type, next, navigate]);

  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold mb-3">Mesa dos Oráculos</h1>
        <p className="text-white/80 mb-6">{message}</p>

        {status === "error" && (
          <button
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 py-3 font-semibold"
            onClick={() => navigate("/", { replace: true })}
          >
            Voltar para o site
          </button>
        )}
      </div>
    </div>
  );
}
