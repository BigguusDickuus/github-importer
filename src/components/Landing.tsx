import { useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Sparkles, User, DollarSign, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { CardsIcon } from "./icons/CardsIcon";
import { Modal } from "./Modal";
import { HelloBar } from "./HelloBar";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // caminho da sua pasta supabase
import { toast } from "@/hooks/use-toast"; // caminho do hook de toast (pode ser diferente, veja abaixo)
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export function HomeDeslogada() {
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState("");
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showPasswordRecoveryModal, setShowPasswordRecoveryModal] = useState(false);
  const [showEmailConfirmationMessage, setShowEmailConfirmationMessage] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [shakeModal, setShakeModal] = useState(false);

  // --- Estados para MFA (2FA) no login (NO MESMO MODAL) ---
  const [loginStep, setLoginStep] = useState<"credentials" | "mfa">("credentials");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [loginMfaFactorId, setLoginMfaFactorId] = useState<string | null>(null);

  // Sinaliza "janela crítica" de MFA para evitar checks agressivos em outras partes
  const MFA_BUSY_UNTIL_KEY = "to_mfa_busy_until";
  const markMfaBusy = (ms: number = 8000) => {
    try {
      sessionStorage.setItem(MFA_BUSY_UNTIL_KEY, String(Date.now() + ms));
    } catch {}
  };

  const howItWorksRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [activePlanIndex, setActivePlanIndex] = useState(1);

  // Hello Bar states
  const [showSuccessBar, setShowSuccessBar] = useState(false);
  const [showEmailValidationBar, setShowEmailValidationBar] = useState(false);
  const [showPasswordRecoveryBar, setShowPasswordRecoveryBar] = useState(false);
  const [showErrorBar, setShowErrorBar] = useState(false);
  const [errorBarMessage, setErrorBarMessage] = useState("");

  // ===== Tracking (GTM/GA4) =====
  const dlPush = (payload: Record<string, any>) => {
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(payload);
    } catch {}
  };

  const MFA_LOGIN_PENDING_KEY = "to_mfa_login_pending_v1";

  const setMfaLoginPending = (pending: boolean) => {
    try {
      if (pending) sessionStorage.setItem(MFA_LOGIN_PENDING_KEY, "1");
      else sessionStorage.removeItem(MFA_LOGIN_PENDING_KEY);
    } catch {}
  };

  const isMfaLoginPending = () => {
    try {
      return sessionStorage.getItem(MFA_LOGIN_PENDING_KEY) === "1";
    } catch {
      return false;
    }
  };

  // Login form states (modal da landing)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Signup form states
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupBirthDate, setSignupBirthDate] = useState("");
  const [signupCPF, setSignupCPF] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // Password recovery states
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("howItWorks") === "1") {
      setShowHowItWorksModal(true);

      // limpa o parâmetro da URL para não reabrir ao dar refresh
      params.delete("howItWorks");
      const newSearch = params.toString();
      navigate({ pathname: "/", search: newSearch ? `?${newSearch}` : "" }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Se cair na Landing com sessão existente, só vai pra /dashboard se MFA estiver OK (AAL2 quando exigido)
  useEffect(() => {
    let cancelled = false;

    type MfaGate = {
      hasVerifiedTotp: boolean;
      factorId: string | null;
      needsMfa: boolean;
      currentLevel: string | null;
      nextLevel: string | null;
    };

    const resolveMfaGate = async (): Promise<MfaGate> => {
      try {
        // 1) Só exigimos MFA se existir TOTP verified
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          return { hasVerifiedTotp: false, factorId: null, needsMfa: false, currentLevel: null, nextLevel: null };
        }

        const totp = (((factorsData as any)?.totp ?? []) as any[]).filter(Boolean);
        const verified = totp.find((f: any) => f?.status === "verified") ?? null;

        const factorId = (verified?.id as string) || null;
        const hasVerifiedTotp = !!factorId;

        if (!hasVerifiedTotp) {
          return { hasVerifiedTotp: false, factorId: null, needsMfa: false, currentLevel: null, nextLevel: null };
        }

        // 2) Se tem TOTP verified, exigimos AAL2 (senão, bloqueia)
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        const currentLevel = ((aalData as any)?.currentLevel as string) ?? null;
        const nextLevel = ((aalData as any)?.nextLevel as string) ?? null;

        // Se não conseguimos ler AAL, por segurança assumimos que ainda precisa validar
        const needsMfa = aalError ? true : nextLevel === "aal2" && currentLevel !== "aal2";

        return { hasVerifiedTotp: true, factorId, needsMfa, currentLevel, nextLevel };
      } catch {
        return { hasVerifiedTotp: false, factorId: null, needsMfa: false, currentLevel: null, nextLevel: null };
      }
    };

    const gateSession = async (session: any | null) => {
      if (!session || cancelled) return;

      const gate = await resolveMfaGate();
      if (cancelled) return;

      if (gate.needsMfa) {
        setLoginMfaFactorId(gate.factorId);
        setShowLoginModal(true);
        setLoginStep("mfa");
        setMfaCode("");
        setMfaError(null);
        return;
      }

      navigate("/dashboard", { replace: true });
    };

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!error && data?.session) {
        await gateSession(data.session);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      // Sem sessão: não faz nada aqui
      if (!session) return;

      // MFA verificado => pode ir
      if (event === "MFA_CHALLENGE_VERIFIED") {
        navigate("/dashboard", { replace: true });
        return;
      }

      await gateSession(session);
    });

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  // Scroll to initial positions in carousels
  useEffect(() => {
    // Como Funciona: scroll to first card (index 0)
    if (howItWorksRef.current && window.innerWidth <= 922) {
      const cards = howItWorksRef.current.children;
      if (cards[0]) {
        (cards[0] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }

    // Planos: scroll to second card (index 1 - Explorador) com delay maior
    if (plansRef.current && window.innerWidth <= 922) {
      // Primeiro timeout para garantir que o DOM está pronto
      setTimeout(() => {
        if (plansRef.current) {
          const carousel = plansRef.current;
          const cards = carousel.children;
          if (cards[1]) {
            // Calcular posição de scroll sem usar scrollIntoView para evitar scroll da página
            const cardWidth = (cards[1] as HTMLElement).offsetWidth;
            const gap = 20;
            const scrollPosition = (cardWidth + gap) * 1 - (carousel.offsetWidth - cardWidth) / 2;
            carousel.scrollLeft = scrollPosition;
          }
        }
      }, 500);

      // Segundo timeout para forçar novamente caso o primeiro falhe
      setTimeout(() => {
        if (plansRef.current) {
          const carousel = plansRef.current;
          const cards = carousel.children;
          if (cards[1]) {
            const cardWidth = (cards[1] as HTMLElement).offsetWidth;
            const gap = 20;
            const scrollPosition = (cardWidth + gap) * 1 - (carousel.offsetWidth - cardWidth) / 2;
            carousel.scrollLeft = scrollPosition;
          }
        }
      }, 1000);
    }
  }, []);

  // Detect scroll position for features carousel
  useEffect(() => {
    const carousel = howItWorksRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      if (window.innerWidth > 922) return;

      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.children[0]?.clientWidth || 0;
      const gap = 20;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveFeatureIndex(index);
    };

    carousel.addEventListener("scroll", handleScroll);
    return () => carousel.removeEventListener("scroll", handleScroll);
  }, []);

  // Detect scroll position for plans carousel
  useEffect(() => {
    const carousel = plansRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      if (window.innerWidth > 922) return;

      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.children[0]?.clientWidth || 0;
      const gap = 20;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActivePlanIndex(index);
    };

    carousel.addEventListener("scroll", handleScroll);
    return () => carousel.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToFeature = (index: number) => {
    if (howItWorksRef.current) {
      const cards = howItWorksRef.current.children;
      if (cards[index]) {
        (cards[index] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }
  };

  const scrollToPlan = (index: number) => {
    if (plansRef.current) {
      const cards = plansRef.current.children;
      if (cards[index]) {
        (cards[index] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }
  };

  const handleCloseLoginModal = async () => {
    // Se já existe sessão (senha ok) e estamos pedindo MFA, fechar modal NÃO pode deixar passar.
    if (loginStep === "mfa") {
      try {
        await supabase.auth.signOut();
      } catch {}
    }

    setShowLoginModal(false);
    setLoginError(false);
    setShakeModal(false);

    setLoginStep("credentials");
    setMfaCode("");
    setMfaError(null);
    setLoginMfaFactorId(null);
  };

  const handleLogin = async () => {
    setLoginError(false);
    setMfaError(null);

    if (!loginEmail || !loginPassword) {
      setLoginError(true);
      setShakeModal(true);
      setTimeout(() => setShakeModal(false), 600);

      toast({
        title: "Não foi possível entrar",
        description: "Verifique seus dados e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setLoginLoading(true);
    setShakeModal(false);

    // 🔒 Importante: trava rotas protegidas ANTES do signIn para evitar corrida com redirects.
    setMfaLoginPending(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setMfaLoginPending(false);

        console.error("Erro ao fazer login:", error);

        // ✅ Caso específico: usuário existe, mas NÃO confirmou o e-mail
        const errorMessage = String((error as any)?.message ?? "");
        const errorName = String((error as any)?.name ?? "");
        const errorStatus = (error as any)?.status;

        const isEmailNotConfirmed =
          errorStatus === 400 && errorName === "AuthApiError" && /email not confirmed/i.test(errorMessage);

        if (isEmailNotConfirmed) {
          // Mostra HelloBar persistente (ela já tem autoCloseDelay=0 no JSX)
          setShowEmailValidationBar(true);

          // Não treme o modal como "login inválido", porque aqui não é senha errada
          setLoginError(false);
          setShakeModal(false);

          // (opcional) toast mais amigável (sem destructive)
          toast({
            title: "Confirme seu e-mail",
            description:
              "Você precisa clicar no link de verificação que enviamos para seu e-mail antes de fazer login.",
            variant: "default",
          });

          setResendDone(false);
          setResendError(null);
          setResendPending(false);

          return;
        }

        // ❌ Qualquer outro erro: mantém o comportamento atual (shake + erro genérico)
        setLoginError(true);
        setShakeModal(true);
        setTimeout(() => setShakeModal(false), 600);

        toast({
          title: "Não foi possível entrar",
          description: "Verifique seus dados e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // ✅ Decide se MFA é necessário via AAL (não via “status do factor”)
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      // Se não conseguimos checar AAL, não vamos travar o usuário (fallback: deixa seguir)
      if (aalError) {
        console.warn("AAL check falhou no login (landing). Prosseguindo sem MFA:", aalError);
        setMfaLoginPending(false);
        setShowLoginModal(false);
        navigate("/dashboard");
        return;
      }

      const needsMfa = (aalData as any)?.nextLevel === "aal2" && (aalData as any)?.currentLevel !== "aal2";

      if (!needsMfa) {
        // Sem MFA obrigatório => libera
        setMfaLoginPending(false);
        toast({ title: "Login realizado", description: "Bem-vindo de volta." });
        setShowLoginModal(false);
        dlPush({
          event: "login",
          method: "email",
          mfa: false,
        });
        navigate("/dashboard");
        return;
      }

      // MFA obrigatório => resolve factorId e pede código
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        // fallback: não trava hard se falhar factors
        console.error("Erro ao listar fatores MFA (landing):", factorsError);
        setMfaLoginPending(false);
        setShowLoginModal(false);
        navigate("/dashboard");
        return;
      }

      const totpFactors = (((factorsData as any)?.totp ?? []) as any[]).filter(Boolean);
      const verifiedFactor = totpFactors.find((f: any) => f?.status === "verified") ?? totpFactors[0] ?? null;

      if (!verifiedFactor?.id) {
        // fallback: não trava hard
        console.warn("MFA requerido, mas nenhum TOTP factor encontrado (landing). Prosseguindo.");
        setMfaLoginPending(false);
        setShowLoginModal(false);
        navigate("/dashboard");
        return;
      }

      setLoginMfaFactorId(String(verifiedFactor.id));
      setLoginStep("mfa");
      setMfaCode("");
      setMfaError(null);

      toast({
        title: "2FA obrigatório",
        description: "Digite o código do seu app autenticador para concluir o login.",
      });
      // mantém pending=true até verificar o código
      return;
    } catch (err: any) {
      setMfaLoginPending(false);

      console.error("Erro inesperado no login:", err);
      setLoginError(true);
      setShakeModal(true);
      setTimeout(() => setShakeModal(false), 600);

      toast({
        title: "Não foi possível entrar",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResendConfirmationEmail = async () => {
    try {
      setResendPending(true);
      setResendDone(false);
      setResendError(null);

      const email = (loginEmail || "").trim();
      if (!email) {
        setResendError("Digite seu e-mail acima para reenviar a confirmação.");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        // opcional: para onde o link leva depois de confirmar
        // options: { emailRedirectTo: "https://mesadosoraculos.com.br" },
      });

      if (error) throw error;

      setResendDone(true);
    } catch (e: any) {
      setResendError(e?.message || "Não foi possível reenviar agora. Tente novamente em instantes.");
    } finally {
      setResendPending(false);
    }
  };

  const handleVerifyMfaLogin = async () => {
    setMfaError(null);

    const trimmed = mfaCode.trim();
    if (!trimmed || trimmed.length < 6) {
      setMfaError("Digite o código de 6 dígitos.");
      return;
    }

    setMfaLoading(true);
    markMfaBusy(9000);

    try {
      let factorId = loginMfaFactorId;

      if (!factorId) {
        const factors = await supabase.auth.mfa.listFactors();
        if (factors.error) throw factors.error;

        const totpFactors = (((factors.data as any)?.totp ?? []) as any[]).filter(Boolean);
        const verifiedFactor = totpFactors.find((f: any) => f?.status === "verified") ?? totpFactors[0] ?? null;
        factorId = verifiedFactor?.id ? String(verifiedFactor.id) : null;

        if (!factorId) throw new Error("Nenhum fator TOTP encontrado para este usuário.");
        setLoginMfaFactorId(factorId);
      }

      const cav = await supabase.auth.mfa.challengeAndVerify({ factorId, code: trimmed });
      if (cav.error) throw cav.error;

      // Confirma AAL2
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let ok = false;
      for (let i = 0; i < 3; i++) {
        await wait(250);
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!aalError && (aalData as any)?.currentLevel === "aal2") {
          ok = true;
          break;
        }
      }
      if (!ok) throw new Error("Código aceito, mas AAL2 não confirmou. Tente novamente.");

      // ✅ MFA validado => libera rotas protegidas e fecha modal
      setMfaLoginPending(false);

      setMfaCode("");
      setMfaError(null);
      setLoginStep("credentials");
      setLoginMfaFactorId(null);
      setShowLoginModal(false);
      dlPush({
        event: "login",
        method: "email",
        mfa: true,
      });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Erro ao verificar 2FA no login:", err);
      setMfaError(err?.message || "Não foi possível verificar o código. Tente novamente.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCancelMfaLogin = async () => {
    // Se cancelar, não pode ficar sessão parcial + pending
    setMfaLoginPending(false);

    try {
      await supabase.auth.signOut();
    } catch {}

    setLoginStep("credentials");
    setMfaCode("");
    setMfaError(null);
    setLoginMfaFactorId(null);
  };

  // Máscara de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  // Máscara de Telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
      }
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  // Validação de CPF com dígitos verificadores
  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "");

    if (numbers.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(numbers[9])) {
      return false;
    }

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(numbers[10])) {
      return false;
    }

    return true;
  };

  // Validação de telefone
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "");

    // Verifica se tem 10 ou 11 dígitos
    if (numbers.length !== 10 && numbers.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (números falsos)
    if (/^(\d)\1+$/.test(numbers)) {
      return false;
    }

    // Verifica se contém letras
    if (/[a-zA-Z]/.test(phone)) {
      return false;
    }

    return true;
  };

  // Validação de email
  const validateEmail = (email: string) => {
    return email.includes("@") && email.includes(".") && email.length > 5;
  };

  // Validação de nome completo
  const validateFullName = (name: string) => {
    const trimmedName = name.trim();
    // Verifica se tem pelo menos nome e sobrenome (2 palavras)
    const nameParts = trimmedName.split(" ").filter((part) => part.length > 0);
    return nameParts.length >= 2 && trimmedName.length >= 3;
  };

  // Validação de senha com requisitos
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password); // <-- NOVO
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar, // <-- ATUALIZADO
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber, // <-- NOVO
      hasSpecialChar,
    };
  };

  // Handler de mudança de CPF com máscara
  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setSignupCPF(formatted);

    const digits = value.replace(/\D/g, "");

    // Não mostra erro enquanto o usuário ainda está digitando (até completar 11 dígitos)
    if (!digits) {
      setCpfError("");
      return;
    }
    if (digits.length < 11) {
      setCpfError("");
      return;
    }

    setCpfError(validateCPF(formatted) ? "" : "CPF inválido");
  };

  // Handler de mudança de Telefone com máscara
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setSignupPhone(formatted);

    const digits = value.replace(/\D/g, "");

    // Não mostra erro enquanto o usuário ainda está digitando (até completar DDD + número)
    if (!digits) {
      setPhoneError("");
      return;
    }
    if (digits.length < 10) {
      setPhoneError("");
      return;
    }

    setPhoneError(validatePhone(formatted) ? "" : "Telefone inválido");
  };

  // Validar todos os campos antes de permitir cadastro
  const validateSignupForm = () => {
    let isValid = true;

    // Validar email
    if (!signupEmail) {
      setEmailError("Email é obrigatório");
      isValid = false;
    } else if (!validateEmail(signupEmail)) {
      setEmailError("Email inválido");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Validar senha
    if (!signupPassword) {
      setPasswordError("Senha é obrigatória");
      isValid = false;
    } else {
      const validation = validatePassword(signupPassword);
      if (!validation.isValid) {
        setPasswordError("Senha não atende aos requisitos");
        isValid = false;
      } else {
        setPasswordError("");
      }
    }

    // Validar confirmação de senha
    if (!signupPasswordConfirm) {
      setPasswordConfirmError("Confirmação de senha é obrigatória");
      isValid = false;
    } else if (signupPassword !== signupPasswordConfirm) {
      setPasswordConfirmError("As senhas não coincidem");
      isValid = false;
    } else {
      setPasswordConfirmError("");
    }

    // Validar nome completo
    if (!signupFullName) {
      setFullNameError("Nome completo é obrigatório");
      isValid = false;
    } else if (!validateFullName(signupFullName)) {
      setFullNameError("Insira nome e sobrenome");
      isValid = false;
    } else {
      setFullNameError("");
    }

    // Validar data de nascimento
    if (!signupBirthDate) {
      setBirthDateError("Data de nascimento é obrigatória");
      isValid = false;
    } else {
      const birthDate = new Date(signupBirthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        setBirthDateError("Você deve ter pelo menos 18 anos");
        isValid = false;
      } else {
        setBirthDateError("");
      }
    }

    // Validar CPF
    if (!signupCPF) {
      setCpfError("CPF é obrigatório");
      isValid = false;
    } else if (!validateCPF(signupCPF)) {
      setCpfError("CPF inválido");
      isValid = false;
    } else {
      setCpfError("");
    }

    // Validar telefone
    if (!signupPhone) {
      setPhoneError("Telefone é obrigatório");
      isValid = false;
    } else if (!validatePhone(signupPhone)) {
      setPhoneError("Telefone inválido");
      isValid = false;
    } else {
      setPhoneError("");
    }

    return isValid;
  };

  // Handler de cadastro
  const handleSignup = async () => {
    // Se o form for inválido, chacoalha modal e sai
    if (!validateSignupForm()) {
      setShakeModal(true);
      setTimeout(() => {
        setShakeModal(false);
      }, 600);
      return;
    }

    try {
      const cleanCpf = signupCPF.replace(/\D/g, "");
      const cleanPhone = signupPhone.replace(/\D/g, "");

      // 🚨 Nada de SELECT em "profiles" aqui por enquanto.
      // Vamos só tentar criar o usuário no Auth.

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: signupFullName,
            birthday: signupBirthDate, // input type="date" já vem em YYYY-MM-DD
            cpf: cleanCpf,
            phone: cleanPhone,
            emailRedirectTo: "https://www.mesadosoraculos.com.br/",
          },
        },
      });

      if (error) {
        console.error("Erro no signUp:", error);

        const rawMessage = (error.message || "").toLowerCase();
        let barMessage = "Erro ao criar conta, tente novamente mais tarde.";

        // Supabase costuma mandar algo como "User already registered"
        if (rawMessage.includes("already registered") || rawMessage.includes("already exists")) {
          barMessage = "Usuário já cadastrado. Tente fazer login.";
        }

        setErrorBarMessage(barMessage);
        setShowErrorBar(true);

        // (opcional) mantém o toast também
        toast({
          title: "Erro ao criar conta",
          description: error.message || barMessage,
          variant: "destructive",
        });

        return;
      }

      if (!data.user) {
        console.error("SignUp retornou sem user:", data);
        toast({
          title: "Erro ao criar conta",
          description: "O servidor não retornou o usuário. Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      // --- NOVO BLOCO: detectar se é usuário antigo pelo created_at ---
      const user: any = data.user;
      const createdAtMs = user?.created_at ? new Date(user.created_at).getTime() : null;
      let isExistingUser = false;

      if (createdAtMs !== null && Number.isFinite(createdAtMs)) {
        const nowMs = Date.now();
        const diffMinutes = Math.abs(nowMs - createdAtMs) / 60000;

        // Se o usuário foi criado há mais de 5 minutos, consideramos "já existente"
        if (diffMinutes > 5) {
          isExistingUser = true;
        }
      }

      if (isExistingUser) {
        console.log(
          "Signup chamado com email já existente (created_at antigo):",
          user.email,
          "created_at:",
          user.created_at,
        );

        setErrorBarMessage("Este e-mail já está cadastrado. Faça login ou recupere sua senha.");
        setShowErrorBar(true);

        // opcional: já trocar pro modal de login
        setShowSignupModal(false);
        setShowLoginModal(true);

        return;
      }

      // Sucesso: usuário criado no Auth
      console.log("Usuário criado no Supabase:", data);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "sign_up" });

      // Fecha modal e mostra Hello Bar verde
      setShowSignupModal(false);
      setShowSuccessBar(true);

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu e-mail para confirmar o cadastro e acessar a plataforma.",
      });

      // GA4: signup concluído
      dlPush({
        event: "sign_up",
        method: "email",
      });

      setShowSignupModal(false);
      setShowEmailConfirmationMessage(true);
    } catch (err: any) {
      console.error("Erro inesperado no signup:", err);

      setErrorBarMessage("Erro inesperado ao criar conta, tente novamente mais tarde.");
      setShowErrorBar(true);

      toast({
        title: "Erro inesperado ao criar conta",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  // Password Recovery
  const handlePasswordRecovery = async () => {
    // validação básica (já tem o isRecoveryEmailValid, mas deixo aqui
    if (!isRecoveryEmailValid()) {
      toast({
        title: "Email inválido",
        description: "Informe um email válido para recuperar sua senha.",
        variant: "destructive",
      });
      return;
    }

    setRecoveryLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Erro ao enviar email de recuperação:", error);

        const msg = (error.message || "").toLowerCase();
        let barMessage = "Erro ao enviar email de recuperação. Tente novamente mais tarde.";

        // Se o Supabase resolver ser explícito
        if (msg.includes("user not found") || msg.includes("no user")) {
          barMessage = "Não encontramos uma conta com este email.";
        }

        setErrorBarMessage(barMessage);
        setShowErrorBar(true); // 🔴 Hello Bar vermelha

        toast({
          title: "Erro ao enviar email",
          description: error.message || barMessage,
          variant: "destructive",
        });

        return;
      }

      // Sucesso: Supabase aceitou o pedido de reset
      setShowPasswordRecoveryModal(false);
      setRecoveryEmail("");

      // 🟡 Hello Bar amarela
      setShowPasswordRecoveryBar(true);

      toast({
        title: "Email enviado",
        description: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.",
      });
    } catch (err: any) {
      console.error("Erro inesperado na recuperação de senha:", err);

      setErrorBarMessage("Erro inesperado ao enviar email de recuperação. Tente novamente mais tarde.");
      setShowErrorBar(true); // 🔴 Hello Bar vermelha

      toast({
        title: "Erro inesperado ao enviar email",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const isRecoveryEmailValid = () => {
    return recoveryEmail && recoveryEmail.includes("@");
  };

  // Verificar se todos os campos estão preenchidos e válidos
  const isSignupFormValid = () => {
    return (
      signupEmail &&
      validateEmail(signupEmail) &&
      signupPassword &&
      validatePassword(signupPassword).isValid &&
      signupPasswordConfirm &&
      signupPassword === signupPasswordConfirm &&
      signupFullName &&
      validateFullName(signupFullName) &&
      signupBirthDate &&
      signupCPF &&
      validateCPF(signupCPF) &&
      signupPhone &&
      validatePhone(signupPhone)
    );
  };

  const features = [
    {
      icon: User,
      title: "1. Crie sua conta",
      description: (
        <>
          Registre-se rapidamente e <span className="text-oracle-ember">ganhe 3 créditos</span> iniciais para começar
          suas consultas.
        </>
      ),
    },
    {
      icon: DollarSign,
      title: "2. Adquira créditos",
      description: "Compre créditos que nunca expiram. Cada consulta consome 1 crédito por oráculo selecionado.",
    },
    {
      icon: CardsIcon,
      title: "3. Consulte o oráculo",
      description: "Faça sua pergunta, escolha o tipo de oráculo e receba interpretações profundas e personalizadas.",
    },
  ];

  const plans = [
    {
      name: "Iniciante",
      credits: 10,
      price: "R$ 29,90",
      pricePerCredit: "R$ 2,99 por consulta",
      description: "Perfeito para experimentar",
    },
    {
      name: "Explorador",
      credits: 25,
      price: "R$ 64,90",
      pricePerCredit: "R$ 2,60 por consulta",
      description: "Melhor custo-benefício",
      highlight: true,
      badge: "Mais Popular",
      savings: "Economize até 20%",
    },
    {
      name: "Místico",
      credits: 60,
      price: "R$ 129,90",
      pricePerCredit: "R$ 2,16 por consulta",
      description: "Para uso frequente",
      savings: "Economize até 33%",
    },
  ];

  return (
    <div className="min-h-screen bg-night-sky text-moonlight-text relative">
      {/* Hello Bars */}
      <HelloBar
        message="Usuário criado com sucesso! Confirme seu email com o link que enviamos."
        type="success"
        show={showSuccessBar}
        onClose={() => setShowSuccessBar(false)}
      />
      <HelloBar
        message="Valide o email enviado antes de logar!"
        type="warning"
        show={showEmailValidationBar}
        onClose={() => setShowEmailValidationBar(false)}
        autoCloseDelay={0}
      />
      <HelloBar
        message={errorBarMessage || "Erro ao criar conta, tente novamente mais tarde."}
        type="error"
        show={showErrorBar}
        onClose={() => setShowErrorBar(false)}
        autoCloseDelay={0}
      />
      <HelloBar
        message="Email de recuperação enviado, cheque seu inbox e sua pasta de spam"
        type="warning"
        show={showPasswordRecoveryBar}
        onClose={() => setShowPasswordRecoveryBar(false)}
        autoCloseDelay={0}
      />

      {/* Background Gradients - Fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
      </div>

      <Header
        isLoggedIn={false}
        onLoginClick={() => setShowLoginModal(true)}
        onHowItWorksClick={() => setShowHowItWorksModal(true)}
      />

      {/* Hero Section */}
      <section
        className="hero-section relative z-10 flex flex-col items-center justify-center"
        style={{ marginTop: "calc(64px + 24px + 40px)" }}
      >
        <style>{`
          @media (min-width: 768px) {
            .hero-section {
              margin-top: calc(80px + 24px + 40px) !important;
            }
          }
          @media (max-width: 767px) {
            .hero-section-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .hero-section-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .hero-section-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>
        <div className="hero-section-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1200px] flex flex-col items-center">
            <div style={{ marginBottom: "40px" }}>
              <h1
                className="text-starlight-text tracking-tight text-center w-full"
                style={{
                  fontSize: "2.5rem",
                  lineHeight: "1.1",
                }}
              >
                <style>{`
                  @media (min-width: 768px) {
                    .hero-title {
                      font-size: 3.0rem !important;
                    }
                  }
                `}</style>
                <span className="hero-title" style={{ fontSize: "2.5rem" }}>
                  Mesa dos Oráculos
                </span>
              </h1>

              <p className="text-moonlight-text text-center w-full max-w-[800px]">
                Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7
              </p>

              <p
                className="text-oracle-ember text-center w-full max-w-[700px]"
                style={{ marginLeft: "auto", marginRight: "auto" }}
              >
                Interpretações profundas e personalizadas para suas perguntas
              </p>
            </div>

            {/* Prompt Card - ATUALIZADO COM ESPAÇAMENTOS */}
            <div className="w-full max-w-[900px]" style={{ marginBottom: "24px" }}>
              <div
                className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-3xl shadow-2xl w-full flex flex-col"
                style={{ padding: "24px", gap: "24px" }}
              >
                <textarea
                  placeholder="Faça sua pergunta..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled
                  rows={6}
                  className="w-full bg-night-sky/50 border border-obsidian-border rounded-2xl text-lg md:text-xl text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ padding: "24px" }}
                />

                <div className="w-full flex justify-center">
                  <Button
                    size="lg"
                    disabled
                    className="w-full sm:w-auto sm:min-w-[50%] bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 md:h-16 text-lg md:text-xl disabled:opacity-60 whitespace-nowrap"
                  >
                    ✨ Consultar o Oráculo
                  </Button>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="w-full max-w-[900px]" style={{ marginBottom: "24px" }}>
              <div
                className="flex items-center justify-center gap-4 bg-solar-warning/10 border border-solar-warning/30 rounded-2xl w-full"
                style={{ padding: "12px 32px" }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-solar-warning animate-pulse flex-shrink-0" />
                <p className="text-base md:text-lg text-solar-warning text-center">
                  Você precisa estar <span className="underline">logado</span> e ter{" "}
                  <span className="underline">créditos</span> para fazer uma consulta
                </p>
              </div>
            </div>

            <p
              className="text-base md:text-lg text-moonlight-text/80 text-center w-full"
              style={{ marginBottom: "24px" }}
            >
              1 crédito por oráculo selecionado • Sem limites de temas
            </p>

            <div
              className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full max-w-[600px]"
              style={{ marginBottom: "40px" }}
            >
              <Button
                size="lg"
                className="w-full sm:flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 md:h-16 text-base md:text-lg"
                onClick={() => {
                  dlPush({ event: "cta_open_auth" });
                  setShowLoginModal(true);
                }}
              >
                Entrar | Criar conta
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowHowItWorksModal(true)}
                className="w-full sm:flex-1 border-obsidian-border text-moonlight-text hover:bg-midnight-surface hover:text-starlight-text h-14 md:h-16 text-base md:text-lg"
              >
                Como funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="relative z-10 flex flex-col items-center justify-center">
        <style>{`
          @media (max-width: 767px) {
            .como-funciona-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .como-funciona-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .como-funciona-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>
        <div className="como-funciona-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            <div className="w-full flex flex-col items-center" style={{ marginBottom: "40px" }}>
              <h2 className="text-starlight-text text-center w-full">Como funciona</h2>
              <p className="text-moonlight-text text-center w-full max-w-[800px]">
                Três passos simples para acessar a <span className="text-mystic-indigo">sabedoria ancestral</span>
              </p>
            </div>

            {/* Desktop: Grid | Mobile/Intermediate: Carousel */}
            <style>{`
              @media (max-width: 922px) {
                .features-carousel {
                  display: flex !important;
                  overflow-x: auto !important;
                  scroll-snap-type: x mandatory !important;
                  gap: 20px !important;
                  padding: 0 20px !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .features-carousel::-webkit-scrollbar {
                  display: none !important;
                }
                .features-carousel > div {
                  flex: 0 0 85% !important;
                  scroll-snap-align: center !important;
                  scroll-snap-stop: always !important;
                }
                .carousel-container-spacing {
                  margin-bottom: 16px !important;
                }
              }
              @media (min-width: 923px) {
                .features-carousel {
                  display: grid !important;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 48px !important;
                }
                .carousel-container-spacing {
                  margin-bottom: 40px !important;
                }
              }
              @media (min-width: 923px) {
                .carousel-arrows {
                  display: none !important;
                }
              }
            `}</style>

            {/* Container com position relative para as setas absolutas */}
            <div
              className="carousel-container-spacing"
              style={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
              <div style={{ width: "100%", maxWidth: "1200px", position: "relative" }}>
                <div className="features-carousel w-full" ref={howItWorksRef}>
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-3xl hover:border-mystic-indigo/50 transition-all duration-300 hover:shadow-lg hover:shadow-mystic-indigo/10 flex flex-col items-center"
                      style={{ padding: "32px" }}
                    >
                      <div
                        className="rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30 flex items-center justify-center"
                        style={{ width: "72px", height: "72px", marginBottom: "24px" }}
                      >
                        <feature.icon className="w-8 h-8 text-mystic-indigo" />
                      </div>
                      <h3 className="text-starlight-text text-center w-full" style={{ marginBottom: "16px" }}>
                        {feature.title}
                      </h3>
                      <p className="text-moonlight-text text-center w-full">{feature.description}</p>
                    </div>
                  ))}
                </div>

                {/* Left Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToFeature(activeFeatureIndex - 1)}
                  disabled={activeFeatureIndex === 0}
                  className="carousel-arrows"
                  aria-label="Anterior"
                  style={{
                    position: "absolute",
                    left: "calc((100vw - 100%) / -2 + 2vw)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48px",
                    height: "96px",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    background: "transparent",
                    zIndex: 50,
                    cursor: activeFeatureIndex === 0 ? "not-allowed" : "pointer",
                    opacity: activeFeatureIndex === 0 ? 0 : 1,
                    color: "#E2E8F0",
                    transition: "all 0.3s",
                    pointerEvents: activeFeatureIndex === 0 ? "none" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    if (activeFeatureIndex !== 0) {
                      e.currentTarget.style.color = "#6366F1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#E2E8F0";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="96"
                    viewBox="0 0 24 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: "48px",
                      height: "96px",
                      filter: "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))",
                      pointerEvents: "none",
                    }}
                  >
                    <polyline points="15 6 9 24 15 42" />
                  </svg>
                </button>

                {/* Right Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToFeature(activeFeatureIndex + 1)}
                  disabled={activeFeatureIndex === features.length - 1}
                  className="carousel-arrows"
                  aria-label="Próximo"
                  style={{
                    position: "absolute",
                    right: "calc((100vw - 100%) / -2 + 2vw)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48px",
                    height: "96px",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    background: "transparent",
                    zIndex: 50,
                    cursor: activeFeatureIndex === features.length - 1 ? "not-allowed" : "pointer",
                    opacity: activeFeatureIndex === features.length - 1 ? 0 : 1,
                    color: "#E2E8F0",
                    transition: "all 0.3s",
                    pointerEvents: activeFeatureIndex === features.length - 1 ? "none" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    if (activeFeatureIndex !== features.length - 1) {
                      e.currentTarget.style.color = "#6366F1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#E2E8F0";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="96"
                    viewBox="0 0 24 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: "48px",
                      height: "96px",
                      filter: "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))",
                      pointerEvents: "none",
                    }}
                  >
                    <polyline points="9 6 15 24 9 42" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Arrows & Indicators - Only visible on mobile/intermediate */}
            <style>{`
              @media (min-width: 923px) {
                .carousel-nav {
                  display: none !important;
                }
              }
            `}</style>
            <div
              className="carousel-nav flex flex-col items-center gap-6 w-full"
              style={{ marginTop: "16px", marginBottom: "40px" }}
            >
              {/* Indicators (dots) */}
              <div className="flex justify-center gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToFeature(index)}
                    className={`rounded-full transition-all duration-300 ${
                      activeFeatureIndex === index
                        ? "bg-mystic-indigo w-8 h-2"
                        : "bg-moonlight-text/30 w-2 h-2 hover:bg-moonlight-text/50"
                    }`}
                    aria-label={`Ir para slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="relative z-10 flex flex-col items-center justify-center">
        <style>{`
          @media (max-width: 767px) {
            .planos-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .planos-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .planos-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>
        <div className="planos-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            <div className="w-full flex flex-col items-center" style={{ marginBottom: "40px" }}>
              <h2 className="text-starlight-text text-center w-full">Planos de créditos</h2>
              <p className="text-moonlight-text text-center w-full max-w-[800px]">
                Escolha o plano ideal para suas consultas
              </p>
            </div>

            {/* Desktop: Grid | Mobile/Intermediate: Carousel */}
            <style>{`
              @media (max-width: 922px) {
                .plans-carousel {
                  display: flex !important;
                  overflow-x: auto !important;
                  overflow-y: visible !important;
                  scroll-snap-type: x mandatory !important;
                  gap: 20px !important;
                  padding: 20px !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .plans-carousel::-webkit-scrollbar {
                  display: none !important;
                }
                .plans-carousel > div {
                  flex: 0 0 85% !important;
                  scroll-snap-align: center !important;
                  scroll-snap-stop: always !important;
                }
                .plans-container-spacing {
                  margin-bottom: 16px !important;
                }
              }
              @media (min-width: 923px) {
                .plans-carousel {
                  display: grid !important;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 40px !important;
                }
                .plans-container-spacing {
                  margin-bottom: 40px !important;
                }
              }
              @media (min-width: 923px) {
                .carousel-arrows-plans {
                  display: none !important;
                }
              }
            `}</style>

            {/* Container centralizado com position relative */}
            <div
              className="plans-container-spacing"
              style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative" }}
            >
              <div style={{ width: "100%", maxWidth: "1100px", position: "relative" }}>
                <div className="plans-carousel w-full" ref={plansRef}>
                  {plans.map((plan, index) => (
                    <div
                      key={index}
                      className={`bg-midnight-surface/80 backdrop-blur-sm border rounded-3xl transition-all duration-300 relative flex flex-col ${
                        plan.highlight
                          ? "border-mystic-indigo shadow-xl shadow-mystic-indigo/20 md:scale-105"
                          : "border-obsidian-border hover:border-mystic-indigo/30 hover:shadow-lg"
                      }`}
                      style={{ padding: "48px" }}
                    >
                      {plan.badge && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <div
                            className="bg-oracle-ember rounded-full text-starlight-text shadow-lg whitespace-nowrap"
                            style={{ padding: "8px 20px" }}
                          >
                            {plan.badge}
                          </div>
                        </div>
                      )}

                      <div className="text-center w-full" style={{ marginBottom: "32px", marginTop: "8px" }}>
                        <h3 className="text-starlight-text" style={{ marginBottom: "16px" }}>
                          {plan.name}
                        </h3>
                        <p className="text-moonlight-text">{plan.description}</p>
                      </div>

                      <div className="text-center w-full" style={{ marginBottom: "32px" }}>
                        <div className="flex justify-center" style={{ marginBottom: "16px" }}>
                          <span
                            className="text-mystic-indigo"
                            style={{ fontSize: "3rem", fontWeight: plan.highlight ? 700 : 400 }}
                          >
                            {plan.price}
                          </span>
                        </div>
                        <p className="text-moonlight-text" style={{ marginBottom: "16px" }}>
                          <span className="text-starlight-text" style={{ fontSize: "2rem" }}>
                            {plan.credits}
                          </span>{" "}
                          consultas
                        </p>
                        <p className="text-base text-moonlight-text/70">{plan.pricePerCredit}</p>
                      </div>

                      <div
                        className="text-center w-full flex justify-center"
                        style={{ marginBottom: "32px", minHeight: "56px", alignItems: "center" }}
                      >
                        {plan.savings && (
                          <span
                            className="inline-block rounded-full bg-verdant-success/10 border border-verdant-success/30 text-base text-verdant-success"
                            style={{ padding: "8px 16px" }}
                          >
                            {plan.savings}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: "auto" }}>
                        <Button
                          className={`w-full h-16 text-lg ${
                            plan.highlight
                              ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                              : "bg-midnight-surface border border-obsidian-border text-moonlight-text hover:bg-mystic-indigo/10 hover:border-mystic-indigo/50"
                          }`}
                          onClick={() => {
                            setShowLoginModal(false);
                            setShowPasswordRecoveryModal(false);
                            setShowSignupModal(true);
                          }}
                        >
                          Cadastre-se já!
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Left Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToPlan(activePlanIndex - 1)}
                  disabled={activePlanIndex === 0}
                  className="carousel-arrows-plans"
                  aria-label="Anterior"
                  style={{
                    position: "absolute",
                    left: "calc((100vw - 100%) / -2 + 2vw)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48px",
                    height: "96px",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    background: "transparent",
                    zIndex: 50,
                    cursor: activePlanIndex === 0 ? "not-allowed" : "pointer",
                    opacity: activePlanIndex === 0 ? 0 : 1,
                    color: "#E2E8F0",
                    transition: "all 0.3s",
                    pointerEvents: activePlanIndex === 0 ? "none" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    if (activePlanIndex !== 0) {
                      e.currentTarget.style.color = "#6366F1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#E2E8F0";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="96"
                    viewBox="0 0 24 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: "48px",
                      height: "96px",
                      filter: "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))",
                      pointerEvents: "none",
                    }}
                  >
                    <polyline points="15 6 9 24 15 42" />
                  </svg>
                </button>

                {/* Right Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToPlan(activePlanIndex + 1)}
                  disabled={activePlanIndex === plans.length - 1}
                  className="carousel-arrows-plans"
                  aria-label="Próximo"
                  style={{
                    position: "absolute",
                    right: "calc((100vw - 100%) / -2 + 2vw)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48px",
                    height: "96px",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    background: "transparent",
                    zIndex: 50,
                    cursor: activePlanIndex === plans.length - 1 ? "not-allowed" : "pointer",
                    opacity: activePlanIndex === plans.length - 1 ? 0 : 1,
                    color: "#E2E8F0",
                    transition: "all 0.3s",
                    pointerEvents: activePlanIndex === plans.length - 1 ? "none" : "auto",
                  }}
                  onMouseEnter={(e) => {
                    if (activePlanIndex !== plans.length - 1) {
                      e.currentTarget.style.color = "#6366F1";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#E2E8F0";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="96"
                    viewBox="0 0 24 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: "48px",
                      height: "96px",
                      filter: "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))",
                      pointerEvents: "none",
                    }}
                  >
                    <polyline points="9 6 15 24 9 42" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Indicators - Only visible on mobile/intermediate */}
            <style>{`
              @media (min-width: 923px) {
                .carousel-nav-plans {
                  display: none !important;
                }
              }
            `}</style>
            <div
              className="carousel-nav-plans flex flex-col items-center gap-6 w-full"
              style={{ marginTop: "16px", marginBottom: "40px" }}
            >
              {/* Indicators (dots) */}
              <div className="flex justify-center gap-2">
                {plans.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToPlan(index)}
                    className={`rounded-full transition-all duration-300 ${
                      activePlanIndex === index
                        ? "bg-mystic-indigo w-8 h-2"
                        : "bg-moonlight-text/30 w-2 h-2 hover:bg-moonlight-text/50"
                    }`}
                    aria-label={`Ir para plano ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Modal */}
      <Modal isOpen={showHowItWorksModal} onClose={() => setShowHowItWorksModal(false)} title="Como funciona">
        <div className="flex flex-col gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-6">
              <div className="flex-shrink-0">
                <div
                  className="rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30 flex items-center justify-center"
                  style={{ width: "56px", height: "56px" }}
                >
                  <feature.icon className="w-6 h-6 text-mystic-indigo" />
                </div>
              </div>
              <div>
                <h3 className="text-xl text-starlight-text mb-3">{feature.title}</h3>
                <p className="text-base text-moonlight-text leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Login Modal - Backdrop com Blur */}
      {showLoginModal && (
        <>
          {/* Backdrop com blur */}
          <div className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md" onClick={handleCloseLoginModal} />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: "5%" }}
          >
            <style>{`
              @media (min-width: 768px) {
                .login-modal-container {
                  padding: 16px !important;
                }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                20%, 40%, 60%, 80% { transform: translateX(8px); }
              }
              .shake-animation {
                animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
              }
            `}</style>
            <div className={`relative pointer-events-auto ${loginError && shakeModal ? "shake-animation" : ""}`}>
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={handleCloseLoginModal}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-10"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Conteúdo do Modal */}
              <div
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                style={{ padding: "32px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h2 className="text-2xl md:text-3xl text-starlight-text">Entrar / Criar conta</h2>
                </div>

                {/* Espaçador explícito */}
                <div style={{ height: "30px" }} />

                {/* Formulário */}
                <div className="flex flex-col gap-6">
                  {loginStep === "credentials" ? (
                    <>
                      {/* Campo Email */}
                      <div className="flex flex-col gap-2">
                        <input
                          type="email"
                          placeholder="Insira seu email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          disabled={loginLoading}
                          className="w-full bg-night-sky/50 border border-obsidian-border/60 rounded-2xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ padding: "16px 20px" }}
                        />
                      </div>

                      {/* Campo Senha */}
                      <div className="flex flex-col gap-2">
                        <input
                          type="password"
                          placeholder="Insira sua senha"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          disabled={loginLoading}
                          className="w-full bg-night-sky/50 border border-obsidian-border/60 rounded-2xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ padding: "16px 20px" }}
                        />

                        <button
                          onClick={() => {
                            setShowLoginModal(false);
                            setShowPasswordRecoveryModal(true);
                          }}
                          className="text-sm text-moonlight-text hover:text-mystic-indigo transition-colors self-start"
                        >
                          Esqueci minha senha
                        </button>
                      </div>

                      <div className="flex flex-col items-center gap-4 mt-4">
                        {loginError && (
                          <div className="w-full flex justify-center">
                            <p className="text-sm text-oracle-ember text-center">Login inválido</p>
                          </div>
                        )}
                        {showEmailValidationBar && (
                          <div className="rounded-lg border border-mystic-indigo/30 bg-mystic-indigo/10 p-3 space-y-2">
                            <p className="text-sm text-moonlight-text/90">
                              Seu e-mail ainda não foi confirmado. Clique no link que enviamos para você.
                            </p>

                            <div className="flex flex-col items-center gap-2">
                              <Button
                                type="button"
                                onClick={handleResendConfirmationEmail}
                                disabled={resendPending}
                                className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text px-6 py-3 text-center whitespace-normal h-auto"
                              >
                                {resendPending ? "Reenviando..." : "Reenviar e-mail de verificação"}
                              </Button>

                              {resendDone && (
                                <span className="text-sm text-verdant-success text-center">
                                  Reenviado! Verifique sua caixa de entrada.
                                </span>
                              )}
                            </div>

                            {resendError && <p className="text-sm text-blood-moon-error">{resendError}</p>}
                          </div>
                        )}

                        <Button
                          size="lg"
                          className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={handleLogin}
                          disabled={loginLoading}
                        >
                          {loginLoading ? "Entrando..." : "Entrar"}
                        </Button>

                        <button
                          onClick={() => {
                            setShowLoginModal(false);
                            setLoginError(false);
                            setShowPasswordRecoveryModal(false);
                            setShowSignupModal(true);
                          }}
                          className="text-sm text-moonlight-text hover:text-starlight-text transition-colors"
                        >
                          Não possui conta?{" "}
                          <span className="text-mystic-indigo underline">Cadastre-se e ganhe 3 créditos!</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-moonlight-text">
                          Seu login exige <span className="text-starlight-text font-semibold">2FA</span>. Digite o
                          código de 6 dígitos do seu app autenticador.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                          disabled={mfaLoading}
                          className="w-full bg-night-sky/50 border border-obsidian-border/60 rounded-2xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-center tracking-[0.35em]"
                          style={{ padding: "16px 20px" }}
                        />
                        {mfaError && <p className="text-sm text-blood-moon-error">{mfaError}</p>}
                      </div>

                      <div className="flex gap-3 mt-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 rounded-2xl border-obsidian-border text-moonlight-text"
                          onClick={handleCancelMfaLogin}
                          disabled={mfaLoading}
                        >
                          Cancelar
                        </Button>

                        <Button
                          className="flex-1 h-12 rounded-2xl bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                          onClick={handleVerifyMfaLogin}
                          disabled={mfaLoading}
                        >
                          {mfaLoading ? "Verificando..." : "Confirmar 2FA"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Signup Modal - Backdrop com Blur */}
      {showSignupModal && (
        <>
          {/* Backdrop com blur */}
          <div
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => {
              setShowSignupModal(false);
              setLoginError(false);
            }}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: "5%" }}
          >
            <style>{`
              @media (min-width: 768px) {
                .signup-modal-container {
                  padding: 16px !important;
                }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                20%, 40%, 60%, 80% { transform: translateX(8px); }
              }
              .shake-animation {
                animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
              }
            `}</style>
            <div className={`relative pointer-events-auto ${shakeModal ? "shake-animation" : ""}`}>
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => {
                  setShowSignupModal(false);
                  setLoginError(false);
                  // Limpar todos os campos
                  setSignupEmail("");
                  setSignupPassword("");
                  setSignupPasswordConfirm("");
                  setSignupFullName("");
                  setSignupBirthDate("");
                  setSignupCPF("");
                  setSignupPhone("");
                  // Limpar todos os erros
                  setEmailError("");
                  setPasswordError("");
                  setPasswordConfirmError("");
                  setFullNameError("");
                  setBirthDateError("");
                  setCpfError("");
                  setPhoneError("");
                }}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-10"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Conteúdo do Modal */}
              <div
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                style={{ padding: "32px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h2 className="text-2xl md:text-3xl text-starlight-text">Criar conta</h2>
                </div>

                {/* Espaçador explícito */}
                <div style={{ height: "30px" }} />

                {/* Formulário */}
                <div className="flex flex-col gap-6">
                  {/* Campo Email */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="email"
                      placeholder="Insira seu email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      onBlur={() => {
                        if (signupEmail && !validateEmail(signupEmail)) {
                          setEmailError("Email inválido");
                        } else if (signupEmail) {
                          setEmailError("");
                        }
                      }}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                    {emailError && <p className="text-sm text-oracle-ember">{emailError}</p>}
                  </div>

                  {/* Campo Senha */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      placeholder="Insira sua senha"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                    {/* Lista de requisitos sempre visível */}
                    {signupPassword && (
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const validation = validatePassword(signupPassword);
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                {validation.hasMinLength ? (
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
                                {validation.hasUpperCase ? (
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
                                {validation.hasLowerCase ? (
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
                                {validation.hasNumber ? (
                                  <>
                                    <Check className="w-4 h-4 text-verdant-success" />
                                    <span className="text-sm text-verdant-success">Um número</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                                    <span className="text-sm text-oracle-ember">Um número</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {validation.hasSpecialChar ? (
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
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {passwordError && <p className="text-sm text-oracle-ember">{passwordError}</p>}
                  </div>

                  {/* Campo Confirmar Senha */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      placeholder="Confirme sua senha"
                      value={signupPasswordConfirm}
                      onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                      onBlur={() => {
                        if (signupPasswordConfirm && signupPassword !== signupPasswordConfirm) {
                          setPasswordConfirmError("As senhas não coincidem");
                        } else if (signupPasswordConfirm) {
                          setPasswordConfirmError("");
                        }
                      }}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                    {passwordConfirmError && <p className="text-sm text-oracle-ember">{passwordConfirmError}</p>}
                  </div>

                  {/* Campo Nome Completo */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Insira seu nome completo"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      onBlur={() => {
                        if (signupFullName && !validateFullName(signupFullName)) {
                          setFullNameError("Insira nome e sobrenome");
                        } else if (signupFullName) {
                          setFullNameError("");
                        }
                      }}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                    {fullNameError && <p className="text-sm text-oracle-ember">{fullNameError}</p>}
                  </div>

                  {/* Campo Data de Nascimento */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-starlight-text">Data de nascimento</Label>
                    <input
                      type="date"
                      placeholder="Insira sua data de nascimento"
                      value={signupBirthDate}
                      onChange={(e) => setSignupBirthDate(e.target.value)}
                      onBlur={() => {
                        if (signupBirthDate) {
                          const birthDate = new Date(signupBirthDate);
                          const today = new Date();
                          const age = today.getFullYear() - birthDate.getFullYear();
                          if (age < 18) {
                            setBirthDateError("Você deve ter pelo menos 18 anos");
                          } else {
                            setBirthDateError("");
                          }
                        }
                      }}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                    <p className="text-xs text-moonlight-text/70">
                      Utilizamos sua data de nascimento para personalizar suas leituras
                    </p>
                    {birthDateError && <p className="text-sm text-oracle-ember">{birthDateError}</p>}
                  </div>

                  {/* Campo CPF */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-starlight-text">CPF</Label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={signupCPF}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      maxLength={14}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                    <p className="text-xs text-moonlight-text/70">Para segurança da sua conta e das transações</p>
                    {cpfError && <p className="text-sm text-oracle-ember">{cpfError}</p>}
                  </div>

                  {/* Campo Telefone */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-starlight-text">Telefone</Label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={signupPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={15}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                    {phoneError && <p className="text-sm text-oracle-ember">{phoneError}</p>}
                  </div>

                  {/* Botão Cadastrar */}
                  <div className="flex flex-col items-center gap-4 mt-4">
                    <Button
                      size="lg"
                      className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSignup}
                      disabled={!isSignupFormValid()}
                    >
                      Criar conta e ganhar 3 créditos
                    </Button>

                    {/* Link Entrar */}
                    <button
                      onClick={() => {
                        setShowSignupModal(false);
                        setShowLoginModal(true);
                      }}
                      className="text-sm text-moonlight-text hover:text-starlight-text transition-colors"
                    >
                      Já possui conta? <span className="text-mystic-indigo underline">Entrar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Password Recovery Modal - Backdrop com Blur */}
      {showPasswordRecoveryModal && (
        <>
          {/* Backdrop com blur */}
          <div
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => {
              setShowPasswordRecoveryModal(false);
              setRecoveryEmail("");
            }}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative pointer-events-auto">
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => {
                  setShowPasswordRecoveryModal(false);
                  setRecoveryEmail("");
                }}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-10"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Conteúdo do Modal */}
              <div
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-2xl"
                style={{ padding: "32px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h2 className="text-2xl md:text-3xl text-starlight-text">Recuperar senha</h2>
                  <p className="text-moonlight-text mt-4">
                    Digite seu email para receber instruções de recuperação de senha.
                  </p>
                </div>

                {/* Espaçador explícito */}
                <div style={{ height: "30px" }} />

                {/* Formulário */}
                <div className="flex flex-col gap-6">
                  {/* Campo Email */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Insira seu email"
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "16px 20px" }}
                    />
                  </div>

                  {/* Botão Enviar */}
                  <div className="flex flex-col items-center gap-4 mt-4">
                    <Button
                      size="lg"
                      className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handlePasswordRecovery}
                      disabled={!isRecoveryEmailValid() || recoveryLoading}
                    >
                      {recoveryLoading ? "Enviando..." : "Enviar"}
                    </Button>

                    {/* Link Voltar ao login */}
                    <button
                      onClick={() => {
                        setShowPasswordRecoveryModal(false);
                        setRecoveryEmail("");
                        setShowLoginModal(true);
                      }}
                      className="text-sm text-moonlight-text hover:text-starlight-text transition-colors"
                    >
                      Voltar ao login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <TarotOnlineFooter />
    </div>
  );
}

function TarotOnlineFooter() {
  type FooterModalId = "tarot" | "lenormand" | "cartomancia" | "about" | "terms" | "privacy" | "contact";

  const [activeModal, setActiveModal] = useState<FooterModalId | null>(null);

  // Contato (mailto sem destinatário por enquanto)
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const closeModal = () => setActiveModal(null);

  const modalTitle = (() => {
    switch (activeModal) {
      case "tarot":
        return "Tarot";
      case "lenormand":
        return "Lenormand (Baralho Cigano)";
      case "cartomancia":
        return "Cartomancia Clássica";
      case "about":
        return "Sobre nós";
      case "terms":
        return "Termos de uso";
      case "privacy":
        return "Política de Privacidade";
      case "contact":
        return "Contato";
      default:
        return "";
    }
  })();

  const openMailto = () => {
    const subject = (contactSubject || "Contato pelo Mesa dos Oráculos").trim();
    const body = [
      "Mensagem enviada pelo site Mesa dos Oráculos",
      "",
      `Nome: ${contactName || "-"}`,
      `Email: ${contactEmail || "-"}`,
      "",
      "Mensagem:",
      contactMessage || "-",
      "",
    ].join("\n");

    // mailto sem destinatário (em branco) por enquanto
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderModalBody = () => {
    if (!activeModal) return null;

    if (activeModal === "tarot") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            O Tarot é um oráculo simbólico tradicional, composto por Arcanos Maiores e Menores. Ele é usado para mapear
            contextos, tendências, forças internas e externas, e orientar decisões com base em padrões e arquétipos.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Como usamos aqui no Mesa dos Oráculos</h4>
            <p>
              Você escolhe um método (tiragem), embaralha e seleciona as cartas. A leitura entrega uma interpretação
              detalhada, conectando os símbolos ao seu tema e ao momento da pergunta.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Métodos disponíveis</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Carta do Dia — check-in rápido, energia do dia</li>
              <li>3 Cartas: Passado/Presente/Futuro — evolução de situação</li>
              <li>3 Cartas: Situação/Conselho/Tendência — ação prática</li>
              <li>Cruz Celta — leitura profunda de situações complexas</li>
              <li>Jogo de Decisão: Dois Caminhos — escolha entre opções</li>
              <li>Jogo de Relacionamento — dinâmica entre pessoas</li>
              <li>Linha do Tempo: 6 Meses — visão de médio prazo</li>
              <li>Mandala Geral — panorama completo da vida</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Dica: para perguntas amplas, prefira Cruz Celta ou Mandala. Para decisões, Dois Caminhos. Para recados
            rápidos, Carta do Dia ou 3 Cartas.
          </p>
        </div>
      );
    }

    if (activeModal === "lenormand") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            O Lenormand (conhecido popularmente como Baralho Cigano) é um oráculo de 36 cartas com símbolos diretos e
            objetivos. Ele é ótimo para clareza, desdobramentos e leitura prática de cenários.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Como usamos aqui no Mesa dos Oráculos</h4>
            <p>
              Você escolhe o método, embaralha e seleciona as cartas. A leitura interpreta combinações e conexões entre
              os símbolos, trazendo um mapa claro do tema consultado.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Métodos disponíveis</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Carta do Dia — recado rápido e direto</li>
              <li>Linha de 3 Cartas — perguntas objetivas, eventos próximos</li>
              <li>Linha de 5 Cartas — contexto + desenvolvimento + resultado</li>
              <li>Retrato 3x3 — visão panorâmica com nuances</li>
              <li>Tiragem de Relacionamento — dinâmica de casal/parceria</li>
              <li>Mesa Real / Grand Tableau — mapa completo da vida</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Dica: se você quer objetividade e desdobramento, Linha 5 e Retrato 3x3 tendem a funcionar muito bem.
          </p>
        </div>
      );
    }

    if (activeModal === "cartomancia") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            A Cartomancia Clássica usa o baralho tradicional de 52 cartas. É uma leitura muito prática para tendências,
            comportamentos, movimento de situações e leitura cotidiana.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Como usamos aqui no Mesa dos Oráculos</h4>
            <p>
              Você escolhe o método, embaralha e seleciona as cartas. A leitura interpreta naipes, números e
              combinações, trazendo direção e clareza para o tema consultado.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Métodos disponíveis</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Carta do Dia — insight rápido, clima do dia</li>
              <li>3 Cartas: Situação/Obstáculo/Conselho — perguntas objetivas</li>
              <li>Cruz Simples — mapa rápido da situação</li>
              <li>Ferradura — situações em movimento, caminhos</li>
              <li>Relacionamento — energia entre pessoas</li>
              <li>Leitura Geral: 9 Cartas — panorama completo</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Dica: para movimento e próximos passos, Ferradura. Para visão geral, 9 Cartas.
          </p>
        </div>
      );
    }

    if (activeModal === "about") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            Somos uma equipe de tarólogos e cartomantes que se uniu para criar uma plataforma digital de consultas — com
            a mesma profundidade e cuidado de uma leitura presencial.
          </p>
          <p>
            Aqui, a consulta começa pela sua intenção: a pergunta, o momento e o foco definem o caminho do jogo. O
            método escolhido e as cartas reveladas constroem um mapa simbólico que orienta com clareza, sensibilidade e
            respeito.
          </p>
          <p>
            Nosso objetivo é tirar o ruído, reduzir ansiedade e trazer direção — com leituras consistentes, práticas e
            cheias de significado.
          </p>
        </div>
      );
    }

    if (activeModal === "terms") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p className="text-moonlight-text/70">
            Última atualização: 2025. Ao usar o Mesa dos Oráculos, você concorda com estes Termos.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">1. Conta e acesso</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você é responsável pelas informações fornecidas e pela segurança do seu acesso.</li>
              <li>Podemos suspender ou encerrar contas em caso de violação destes Termos.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">2. Créditos e uso do serviço</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>O acesso às leituras é feito por meio de créditos.</li>
              <li>Cada oráculo utilizado em uma consulta consome 1 crédito (regra atual do produto).</li>
              <li>Créditos são vinculados à sua conta e não são transferíveis.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">3. Conduta e abuso do sistema</h4>
            <p>
              Para manter a plataforma justa e sustentável, é proibido tentar explorar promoções, bônus, descontos ou
              falhas do sistema.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Criação de contas duplicadas para um mesmo usuário para obter bônus, vantagens ou condições indevidas;
              </li>
              <li>
                Uso de automações, scripts, scraping, engenharia reversa ou tentativa de burlar limites e proteções;
              </li>
              <li>Qualquer ação destinada a fraudar compras, estornos, créditos ou resultados.</li>
            </ul>
            <p className="text-moonlight-text/70">
              Em caso de abuso, nos reservamos o direito de <b>cancelar ou suspender a conta</b>, remover benefícios e{" "}
              <b>bloquear o acesso</b>, podendo haver <b>perda de créditos</b> e/ou <b>pagamentos</b>, sem reembolso,
              ressalvados direitos previstos em lei.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">4. Limitações e responsabilidade</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>As leituras têm natureza interpretativa e simbólica, voltadas a autoconhecimento e orientação.</li>
              <li>Não substituem aconselhamento médico, psicológico, jurídico ou financeiro.</li>
              <li>Você é responsável por suas decisões e ações.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">5. Pagamentos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Compras de créditos podem ser processadas por provedores de pagamento.</li>
              <li>Em casos de falha técnica comprovada, podemos oferecer ajuste de créditos equivalente.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">6. Alterações</h4>
            <p>
              Podemos atualizar estes Termos para refletir melhorias do serviço ou requisitos legais. Quando houver
              mudanças relevantes, apresentaremos a versão atualizada aqui.
            </p>
          </div>
        </div>
      );
    }

    if (activeModal === "privacy") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p className="text-moonlight-text/70">
            Última atualização: 2025. Esta Política descreve como tratamos seus dados em conformidade com a LGPD.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">1. Dados que coletamos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cadastro e conta: nome, email, data de nascimento, CPF e telefone (quando informados).</li>
              <li>Preferências: configurações do perfil (ex.: manter contexto, limites de uso).</li>
              <li>Uso do serviço: perguntas enviadas, oráculos selecionados, logs e resultados das leituras.</li>
              <li>Créditos: saldo e histórico de transações (compras, bônus, consumo e ajustes).</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">2. Como usamos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Entregar suas leituras e manter seu histórico.</li>
              <li>Gerenciar créditos, compras e segurança contra fraude/abuso.</li>
              <li>Melhorar a experiência do produto e a estabilidade do sistema.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">3. Proteção e segurança</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dados trafegam por conexão segura (TLS/HTTPS).</li>
              <li>Armazenamento e acesso seguem controles de segurança e permissões.</li>
              <li>Não vendemos seus dados e não os cedemos para marketing de terceiros.</li>
            </ul>
            <p className="text-moonlight-text/70">
              Podemos utilizar provedores essenciais (ex.: processamento de pagamento e infraestrutura) estritamente
              para operar o serviço, sempre com medidas de segurança e mínimo necessário.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">4. Retenção</h4>
            <p>
              Mantemos dados e registros pelo tempo necessário para fornecer o serviço, cumprir obrigações legais e
              garantir segurança/antiabuso. Você pode solicitar exclusão quando aplicável, respeitando retenções
              obrigatórias.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">5. Seus direitos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmar tratamento e acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar anonimização, bloqueio ou eliminação quando aplicável.</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Para solicitações relacionadas à privacidade, use o canal de Contato (em breve com email oficial dentro da
            plataforma).
          </p>
        </div>
      );
    }

    // contact
    return (
      <div className="space-y-4">
        <p className="text-sm text-moonlight-text/80 leading-relaxed">
          Preencha abaixo para montar uma mensagem. Por enquanto, ao enviar, abriremos o seu app de email com a mensagem
          pronta (sem destinatário preenchido).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-moonlight-text mb-2 block">Seu nome</Label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex.: Maria Silva"
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />
          </div>
          <div>
            <Label className="text-moonlight-text mb-2 block">Seu email</Label>
            <Input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Ex.: maria@email.com"
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />
          </div>
        </div>

        <div>
          <Label className="text-moonlight-text mb-2 block">Assunto</Label>
          <Input
            value={contactSubject}
            onChange={(e) => setContactSubject(e.target.value)}
            placeholder="Ex.: Dúvida sobre créditos / leitura / conta"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label className="text-moonlight-text mb-2 block">Mensagem</Label>
          <textarea
            rows={5}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Escreva sua mensagem..."
            className="w-full bg-night-sky border border-obsidian-border rounded-xl px-4 py-3 text-starlight-text placeholder:text-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={closeModal} type="button">
            Cancelar
          </Button>
          <Button
            onClick={() => openMailto()}
            type="button"
            className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
          >
            Abrir no email
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Modais do Footer */}
      <Modal isOpen={activeModal !== null} onClose={closeModal} title={modalTitle}>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{renderModalBody()}</div>
      </Modal>

      {/* Footer */}
      <footer className="relative z-10 border-t border-obsidian-border bg-midnight-surface/50 backdrop-blur-sm mt-auto">
        <style>{`
          @media (max-width: 767px) {
            .footer-container { padding-left: 5% !important; padding-right: 5% !important; }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .footer-container { padding-left: 5% !important; padding-right: 5% !important; }
          }
          @media (min-width: 923px) {
            .footer-container { padding-left: 64px !important; padding-right: 64px !important; }
          }
        `}</style>

        <div className="footer-container w-full" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12" style={{ marginBottom: "80px" }}>
              {/* Logo e descrição */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                    <img
                      src="https://jhlosmgvlvjaemtgrhka.supabase.co/storage/v1/object/public/images/mdo_logo.png"
                      alt="Mesa dos Oráculos"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <span className="text-xl text-starlight-text">Mesa dos Oráculos</span>
                </div>
                <small className="block text-moonlight-text/70 leading-relaxed">
                  Consultas de Tarot, Lenormand (Baralho Cigano) e Cartomancia Clássica disponíveis 24/7 com
                  interpretações profundas e personalizadas.
                </small>
              </div>

              {/* Links - Serviços */}
              <div>
                <h3 className="text-base text-starlight-text mb-4">Serviços</h3>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => setActiveModal("tarot")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Tarot
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("lenormand")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Lenormand (Baralho Cigano)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("cartomancia")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Cartomancia Clássica
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/history"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Histórico de leituras
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Links - Informações */}
              <div>
                <h3 className="text-base text-starlight-text mb-4">Informações</h3>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => setActiveModal("about")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Sobre nós
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("terms")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Termos de uso
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("privacy")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Política de Privacidade
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("contact")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Contato
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-obsidian-border flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-moonlight-text/60">© 2025 Mesa dos Oráculos. Todos os direitos reservados.</p>
              <div className="flex items-center gap-6 text-sm text-moonlight-text/60">
                <span>Feito com 🔮 para você</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
