import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export function ResetPassword() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const origin = useMemo(() => window.location.origin, []);

  useEffect(() => {
    let mounted = true;

    const parseHashParams = () => {
      const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : window.location.hash || "";
      return new URLSearchParams(hash);
    };

    const run = async () => {
      try {
        setChecking(true);
        setError(null);
        setReady(false);

        // 1) Se o link já veio com erro no hash, é token inválido/expirado de verdade
        const hashParams = parseHashParams();
        const hashError = hashParams.get("error");
        const hashDesc = hashParams.get("error_description");
        if (hashError) {
          const msg = hashDesc ? decodeURIComponent(hashDesc.replace(/\+/g, " ")) : "Link inválido ou expirado.";
          if (mounted) {
            setError(msg);
            setChecking(false);
          }
          return;
        }

        // 2) PKCE flow: ?code=...
        const url = window.location.href;
        const code = new URL(url).searchParams.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(url);
          // Se falhar, pode ser porque o link já foi consumido (scanner/tracking) ou expirou
          if (exErr) {
            if (mounted) {
              setError("Link inválido ou expirado. Solicite a recuperação novamente.");
              setChecking(false);
            }
            return;
          }
        }

        // 3) Espera evento de recuperação / login para garantir que a sessão existe
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;

          if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
            setReady(true);
            setChecking(false);
          }
        });

        // 4) Fallback: tenta sessão direto (caso já esteja hidratada)
        const { data, error: sessErr } = await supabase.auth.getSession();
        if (!mounted) return;

        if (sessErr) {
          setError("Não foi possível validar o link. Tente novamente.");
          setChecking(false);
          sub?.subscription?.unsubscribe();
          return;
        }

        if (data.session) {
          setReady(true);
          setChecking(false);
          sub?.subscription?.unsubscribe();
          return;
        }

        // Se ainda não tem sessão, dá um pequeno tempo pra URL ser processada pelo client
        setTimeout(async () => {
          if (!mounted) return;
          const { data: data2 } = await supabase.auth.getSession();
          if (data2.session) {
            setReady(true);
            setChecking(false);
          } else {
            setError("Link inválido ou expirado. Solicite a recuperação novamente.");
            setChecking(false);
          }
          sub?.subscription?.unsubscribe();
        }, 350);
      } catch {
        if (mounted) {
          setError("Não foi possível validar o link. Tente novamente.");
          setChecking(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [origin]);

  const onSubmit = async () => {
    setError(null);

    if (!ready) {
      setError("Link inválido ou expirado. Solicite a recuperação novamente.");
      return;
    }

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

      toast({ title: "Senha atualizada!", description: "Você já pode entrar normalmente." });
      navigate("/login", { replace: true });
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

        {!error && (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
            Link validado. Defina sua nova senha.
          </div>
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

          <Button className="w-full" onClick={onSubmit} disabled={saving || !!error}>
            {saving ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </div>
      </div>
    </div>
  );
}
