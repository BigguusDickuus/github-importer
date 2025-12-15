import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function ResetPassword() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setChecking(true);
        setError(null);

        // Se o fluxo veio via PKCE (param "code"), troca por sessão
        const url = window.location.href;
        const hasCode = new URL(url).searchParams.get("code");
        if (hasCode) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(url);
          if (exErr) {
            if (!mounted) return;
            setError("Link inválido ou expirado. Solicite a recuperação novamente.");
            setChecking(false);
            return;
          }
        }

        const { data, error: sessErr } = await supabase.auth.getSession();
        if (!mounted) return;

        if (sessErr || !data.session) {
          setError("Link inválido ou expirado. Solicite a recuperação novamente.");
          setChecking(false);
          return;
        }

        setChecking(false);
      } catch (e) {
        if (!mounted) return;
        setError("Não foi possível validar o link. Tente novamente.");
        setChecking(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!password || password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError("Não foi possível atualizar sua senha. Tente novamente.");
        return;
      }

      setSuccess("Senha atualizada com sucesso! Redirecionando…");
      setTimeout(() => navigate("/dashboard", { replace: true }), 600);
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-sky text-starlight-text">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-sky text-starlight-text flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-obsidian-border bg-obsidian-card/60 p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-4">Redefinir senha</h1>

        {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div>}

        {success && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">{success}</div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
            />
          </div>

          <Button className="w-full" onClick={onSubmit} disabled={saving}>
            {saving ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </div>
      </div>
    </div>
  );
}
