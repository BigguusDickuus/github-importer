import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

export function ResetPassword() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const origin = useMemo(() => window.location.origin, []);

  // Mesma regra do cadastro (Landing): 8+, maiúscula, minúscula, especial
  const passwordValidation = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar,
    };
  }, [password]);

  const confirmTouched = confirm.length > 0;
  const confirmMatches = confirmTouched && password === confirm;

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

  const canSubmit = ready && passwordValidation.isValid && password === confirm && !saving && !error;

  const onSubmit = async () => {
    setError(null);

    if (!ready) {
      setError("Link inválido ou expirado. Solicite a recuperação novamente.");
      return;
    }

    if (!passwordValidation.isValid) {
      setError("A senha não atende aos requisitos.");
      return;
    }

    if (!confirm || password !== confirm) {
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

  const Background = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
    </div>
  );

  if (checking) {
    return (
      <div className="min-h-screen bg-night-sky text-starlight-text flex items-center justify-center p-4 relative">
        <Background />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-obsidian-border bg-midnight-surface p-6 shadow-2xl">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-sky text-starlight-text flex items-center justify-center p-4 relative">
      <Background />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-obsidian-border bg-midnight-surface p-6 shadow-2xl">
        <h1 className="text-xl font-semibold mb-4">Redefinir senha</h1>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div>
        ) : (
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
              placeholder="Crie uma senha forte"
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />

            {/* Checklist de requisitos (mesmo padrão do cadastro) */}
            {password.length > 0 && (
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center gap-2">
                  {passwordValidation.hasMinLength ? (
                    <>
                      <Check className="w-4 h-4 text-verdant-success" />
                      <span className="text-sm text-verdant-success">Pelo menos 8 caracteres</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                      <span className="text-sm text-oracle-ember">Pelo menos 8 caracteres</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {passwordValidation.hasUpperCase ? (
                    <>
                      <Check className="w-4 h-4 text-verdant-success" />
                      <span className="text-sm text-verdant-success">Letras maiúsculas</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                      <span className="text-sm text-oracle-ember">Letras maiúsculas</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {passwordValidation.hasLowerCase ? (
                    <>
                      <Check className="w-4 h-4 text-verdant-success" />
                      <span className="text-sm text-verdant-success">Letras minúsculas</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                      <span className="text-sm text-oracle-ember">Letras minúsculas</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {passwordValidation.hasSpecialChar ? (
                    <>
                      <Check className="w-4 h-4 text-verdant-success" />
                      <span className="text-sm text-verdant-success">Um caractere especial</span>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                      <span className="text-sm text-oracle-ember">Um caractere especial</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />

            {confirmTouched && (
              <p className={`text-sm ${confirmMatches ? "text-verdant-success" : "text-oracle-ember"}`}>
                {confirmMatches ? "As senhas coincidem." : "As senhas não coincidem."}
              </p>
            )}
          </div>

          <Button className="w-full" onClick={onSubmit} disabled={!canSubmit}>
            {saving ? "Atualizando..." : "Atualizar senha"}
          </Button>

          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="w-full text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
          >
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}
