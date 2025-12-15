import { useEffect, useMemo, useRef, useState } from "react";
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

  // ===== MFA/TOTP =====
  const [needs2FA, setNeeds2FA] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const mfaCheckedRef = useRef(false);

  const origin = useMemo(() => window.location.origin, []);

  // Mesma regra do cadastro: 8+, maiúscula, minúscula, especial
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

  const Background = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
    </div>
  );

  // ===== 1) Validação do link / sessão recovery =====
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

        // Se o link já veio com erro no hash, token inválido/expirado
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

        // PKCE: ?code=...
        const url = window.location.href;
        const code = new URL(url).searchParams.get("code");
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(url);
          if (exErr) {
            if (mounted) {
              setError("Link inválido ou expirado. Solicite a recuperação novamente.");
              setChecking(false);
            }
            return;
          }
        }

        // Espera evento de recovery / signin
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;
          if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
            setReady(true);
            setChecking(false);
          }
        });

        // Fallback: sessão direta
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

        // Pequeno delay pra hidratação
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

  // ===== 2) Checa se precisa AAL2 (TOTP) e prepara challenge =====
  useEffect(() => {
    if (!ready) return;
    if (mfaCheckedRef.current) return;

    const checkMfa = async () => {
      setMfaLoading(true);
      setOtpError(null);

      try {
        // currentLevel/nextLevel
        const { data: aal, error: aalErr } = await (supabase.auth as any).mfa.getAuthenticatorAssuranceLevel();
        if (aalErr) {
          // Se isso falhar, não bloqueia a UI — mas updateUser pode falhar depois.
          setMfaVerified(false);
          setNeeds2FA(false);
          return;
        }

        // Já está em AAL2 → ok
        if (aal?.currentLevel === "aal2") {
          setMfaVerified(true);
          setNeeds2FA(false);
          return;
        }

        // Precisa subir p/ AAL2 → exige TOTP
        if (aal?.nextLevel === "aal2") {
          const { data: factors, error: fErr } = await (supabase.auth as any).mfa.listFactors();
          if (fErr) {
            setNeeds2FA(true);
            setMfaVerified(false);
            setError("Sua conta exige 2FA, mas não foi possível carregar o fator. Tente novamente.");
            return;
          }

          const totp =
            factors?.totp?.find((f: any) => f?.status === "verified") ||
            factors?.all?.find((f: any) => f?.factor_type === "totp" && f?.status === "verified");

          if (!totp?.id) {
            setNeeds2FA(true);
            setMfaVerified(false);
            setError("Sua conta exige 2FA, mas nenhum TOTP verificado foi encontrado.");
            return;
          }

          setNeeds2FA(true);
          setFactorId(totp.id);
          setMfaVerified(false);

          // Cria challenge já no load (melhor UX)
          const { data: ch, error: chErr } = await (supabase.auth as any).mfa.challenge({ factorId: totp.id });
          if (chErr || !ch?.id) {
            setError("Não foi possível iniciar a validação do 2FA. Tente novamente.");
            return;
          }

          setChallengeId(ch.id);
        } else {
          // nextLevel não pede aal2
          setNeeds2FA(false);
          setMfaVerified(true);
        }
      } finally {
        mfaCheckedRef.current = true;
        setMfaLoading(false);
      }
    };

    checkMfa();
  }, [ready]);

  const verifyOtpIfNeeded = async () => {
    setOtpError(null);

    if (!needs2FA) return true;
    if (mfaVerified) return true;

    const clean = otp.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) {
      setOtpError("Digite os 6 dígitos do seu autenticador.");
      return false;
    }

    if (!factorId) {
      setOtpError("Fator 2FA não encontrado. Tente novamente.");
      return false;
    }

    setMfaLoading(true);
    try {
      let chId = challengeId;

      // Se não tiver challengeId, cria agora
      if (!chId) {
        const { data: ch, error: chErr } = await (supabase.auth as any).mfa.challenge({ factorId });
        if (chErr || !ch?.id) {
          setOtpError("Não foi possível iniciar a validação do 2FA. Tente novamente.");
          return false;
        }
        chId = ch.id;
        setChallengeId(chId);
      }

      const { data: ver, error: vErr } = await (supabase.auth as any).mfa.verify({
        factorId,
        challengeId: chId,
        code: clean,
      });

      if (vErr) {
        // challenge expirou? recria e pede tentar novamente
        const msg = (vErr?.message || "").toLowerCase();
        if (msg.includes("expired") || msg.includes("challenge")) {
          const { data: ch2 } = await (supabase.auth as any).mfa.challenge({ factorId });
          setChallengeId(ch2?.id ?? null);
          setOtpError("Código expirou. Gere um novo código no app e tente novamente.");
          return false;
        }

        setOtpError("Código inválido. Tente novamente.");
        return false;
      }

      // Se verify ok, agora sessão deve estar AAL2
      setMfaVerified(true);
      setNeeds2FA(false);
      toast({ title: "2FA verificado!", description: "Agora você pode atualizar sua senha." });
      return true;
    } finally {
      setMfaLoading(false);
    }
  };

  const canSubmit =
    ready &&
    passwordValidation.isValid &&
    password === confirm &&
    !saving &&
    !error &&
    (!needs2FA || /^\d{6}$/.test(otp.replace(/\s/g, "")));

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

    // Se o usuário tem 2FA habilitado, precisa subir AAL2 antes de updateUser
    const ok2fa = await verifyOtpIfNeeded();
    if (!ok2fa) return;

    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // Erro clássico quando AAL2 ainda não foi satisfeito
        if ((error.message || "").toLowerCase().includes("aal2")) {
          setNeeds2FA(true);
          setMfaVerified(false);
          setError("Sua conta exige 2FA para atualizar a senha. Informe o código do autenticador.");
          return;
        }

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

            {/* Checklist de requisitos (igual cadastro) */}
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

          {/* Campo 2FA (só aparece quando necessário) */}
          {needs2FA && (
            <div className="space-y-2">
              <Label>Código 2FA (6 dígitos)</Label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
                  setOtp(v);
                  setOtpError(null);
                }}
                className="bg-night-sky border-obsidian-border text-starlight-text"
              />

              {otpError ? (
                <p className="text-sm text-oracle-ember">{otpError}</p>
              ) : mfaLoading ? (
                <p className="text-sm text-moonlight-text/70">Validando 2FA…</p>
              ) : (
                <p className="text-sm text-moonlight-text/70">
                  Sua conta tem 2FA ativado. Abra seu autenticador e informe o código atual.
                </p>
              )}
            </div>
          )}

          <Button className="w-full" onClick={onSubmit} disabled={!canSubmit || saving || mfaLoading}>
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
