import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  // ===== MFA (2FA) após login =====
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  const isEmailValid = useMemo(() => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const resetMfaState = () => {
    setShowMfa(false);
    setMfaCode("");
    setMfaFactorId(null);
    setMfaLoading(false);
    setMfaError(null);
  };

  const handleCancelMfa = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    resetMfaState();
  };

  const handleVerifyMfa = async () => {
    setMfaError(null);

    const code = mfaCode.trim();
    if (!code || code.length < 6) {
      setMfaError("Informe o código de 6 dígitos do seu autenticador.");
      return;
    }

    if (!mfaFactorId) {
      setMfaError("Não foi possível validar o 2FA. Tente fazer login novamente.");
      return;
    }

    setMfaLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code,
      } as any);

      if (verifyError) {
        console.error("Erro ao validar 2FA no login:", verifyError);
        setMfaError("Código inválido. Verifique no autenticador e tente novamente.");
        return;
      }

      toast({ title: "Login concluído", description: "2FA confirmado com sucesso.", variant: "default" });
      resetMfaState();
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro inesperado ao validar 2FA no login:", err);
      setMfaError("Erro inesperado ao validar 2FA. Tente novamente.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!isEmailValid) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
          return;
        }

        // Checar se precisa de 2FA (TOTP) e só então navegar
        try {
          const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalError) {
            console.warn("Erro ao checar AAL:", aalError);
            navigate("/dashboard");
            return;
          }

          // Se o próximo nível é AAL2 e ainda estamos em AAL1, pedir código
          if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
            const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) {
              console.error("Erro ao listar fatores MFA:", factorsError);
              navigate("/dashboard");
              return;
            }

            const totpFactors = (factorsData as any)?.totp ?? [];
            const verifiedTotp = totpFactors.find((f: any) => f.status === "verified") ?? totpFactors[0];

            if (verifiedTotp?.id) {
              setMfaFactorId(verifiedTotp.id);
              setShowMfa(true);
              return; // não navega ainda
            }

            // Sem fator identificado: deixa passar (evita travar login)
            navigate("/dashboard");
            return;
          }

          // Já está em AAL2 ou não exige AAL2
          navigate("/dashboard");
          return;
        } catch (err) {
          console.warn("Falha ao checar MFA no login. Prosseguindo.", err);
          navigate("/dashboard");
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              birthday,
              cpf,
              phone,
            },
          },
        });

        if (error) {
          toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
          return;
        }

        toast({
          title: "Conta criada!",
          description: "Verifique seu e-mail para confirmar o cadastro.",
          variant: "default",
        });

        setIsLogin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-midnight-surface via-night-sky to-midnight-surface">
      <div className="absolute inset-0 opacity-20 pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-aurora-accent/20 flex items-center justify-center border border-aurora-accent/30">
                <Sparkles className="w-5 h-5 text-aurora-accent" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-starlight-text">Tarot Online</h1>
                <p className="text-sm text-moonlight-text">{isLogin ? "Entrar" : "Criar conta"}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName" className="text-moonlight-text">
                    Nome completo
                  </Label>
                  <Input
                    id="fullName"
                    className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <Label htmlFor="birthday" className="text-moonlight-text">
                    Data de nascimento
                  </Label>
                  <Input
                    id="birthday"
                    className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    placeholder="DD/MM/AAAA"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf" className="text-moonlight-text">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-moonlight-text">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-moonlight-text">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
              {!isEmailValid && <p className="text-xs text-blood-moon-error mt-1">Informe um e-mail válido.</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-moonlight-text">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-aurora-accent hover:bg-aurora-accent/90 text-midnight-surface font-semibold"
              disabled={loading || !email || !password || !isEmailValid}
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-moonlight-text hover:text-starlight-text transition-colors"
            >
              {isLogin ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-moonlight-text hover:text-starlight-text transition-colors text-sm">
              ← Voltar para o início
            </Link>
          </div>
        </div>
      </div>

      {/* Modal MFA */}
      {showMfa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={handleCancelMfa} />
          <div className="relative w-full max-w-md bg-midnight-surface border border-obsidian-border rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-starlight-text">Confirme o 2FA</h2>
            <p className="text-sm text-moonlight-text mt-1">
              Digite o código de 6 dígitos do seu aplicativo autenticador para concluir o login.
            </p>

            <div className="mt-5">
              <Label htmlFor="login-mfa-code" className="text-moonlight-text">
                Código
              </Label>
              <Input
                id="login-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 dígitos"
              />
              {mfaError && <p className="text-xs text-blood-moon-error mt-2">{mfaError}</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-obsidian-border text-moonlight-text hover:text-starlight-text"
                onClick={handleCancelMfa}
                disabled={mfaLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 bg-aurora-accent hover:bg-aurora-accent/90 text-midnight-surface font-semibold"
                onClick={handleVerifyMfa}
                disabled={mfaLoading}
              >
                {mfaLoading ? "Validando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
