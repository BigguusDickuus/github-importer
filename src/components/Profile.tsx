import { useState, useRef, useEffect } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Shield, CreditCard, Check, Sparkles, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HelloBar } from "./HelloBar";
import { Modal } from "./Modal";
import { Link } from "react-router-dom";

type CreateCheckoutSessionResponse = {
  ok: boolean;
  checkout_url: string;
  session_id: string;
};

export function Profile() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // ===== Créditos (para forçar refresh do Header igual HomeLogada) =====
  const [credits, setCredits] = useState<number | null>(null);

  // ===== Modal de compra (mesmo padrão da HomeLogada) =====
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutLoadingSlug, setCheckoutLoadingSlug] = useState<"credits_10" | "credits_25" | "credits_60" | null>(
    null,
  );

  // ===== HelloBar (retorno do Stripe) =====
  const [helloBarShow, setHelloBarShow] = useState(false);
  const [helloBarType, setHelloBarType] = useState<"success" | "warning" | "error">("success");
  const [helloBarMessage, setHelloBarMessage] = useState("");

  const [keepContext, setKeepContext] = useState(true);
  const [limitAmount, setLimitAmount] = useState("");
  const [limitPeriod, setLimitPeriod] = useState("dia");
  const [hasActiveLimit, setHasActiveLimit] = useState(false);
  const [activeLimitAmount, setActiveLimitAmount] = useState("50");
  const [activeLimitPeriod, setActiveLimitPeriod] = useState("semana");

  // Refs para as seções
  const accountRef = useRef<HTMLDivElement>(null);
  const preferencesRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);
  const billingRef = useRef<HTMLDivElement>(null);

  const fetchCredits = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário logado:", userError);
        setCredits(0);
        return;
      }

      const { data: balanceData, error: balanceError } = await supabase
        .from("credit_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (balanceError) {
        console.error("Erro ao buscar saldo de créditos:", balanceError);
        setCredits(0);
        return;
      }

      setCredits(balanceData?.balance ?? 0);
    } catch (err) {
      console.error("Erro inesperado ao buscar saldo de créditos:", err);
      setCredits(0);
    }
  };

  // Carrega preferências (manter contexto + limite de uso) + saldo ao abrir /profile
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Erro ao buscar usuário logado:", userError);
          return;
        }

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

        if (error) {
          console.error("Erro ao carregar preferências:", error);
          return;
        }

        const prefs = (data ?? {}) as any;

        // Manter contexto
        if (typeof prefs.keep_context === "boolean") {
          setKeepContext(!!prefs.keep_context);
        }

        // Limite de uso (se existir)
        if (prefs.usage_limit_credits != null && prefs.usage_limit_period) {
          setHasActiveLimit(true);
          setActiveLimitAmount(String(prefs.usage_limit_credits));
          setActiveLimitPeriod(prefs.usage_limit_period);
        } else {
          setHasActiveLimit(false);
          setActiveLimitAmount("");
          setActiveLimitPeriod("dia");
        }

        // 2FA (toggle inicial)
        if (typeof prefs.two_factor_enabled === "boolean") {
          setTwoFactorEnabled(!!prefs.two_factor_enabled);
        }

        // Também checa no Auth (fatores) para evitar desync entre profiles e Supabase MFA
        try {
          const { data: factorsData } = await supabase.auth.mfa.listFactors();
          const totpFactors = (factorsData as any)?.totp ?? [];
          const hasVerifiedTotp = totpFactors.some((f: any) => f.status === "verified");
          const desired = hasVerifiedTotp || !!prefs.two_factor_enabled;

          setTwoFactorEnabled(desired);

          // Se estiver desincronizado, corrige o flag no profiles
          if (typeof prefs.two_factor_enabled === "boolean" && prefs.two_factor_enabled !== hasVerifiedTotp) {
            await supabase
              .from("profiles")
              .update({ two_factor_enabled: hasVerifiedTotp } as any)
              .eq("id", user.id);
          }
        } catch (e) {
          console.warn("Não foi possível checar fatores de 2FA (listFactors):", e);
        }

        // Inputs do formulário começam limpos / default
        setLimitAmount("");
        setLimitPeriod("dia");
      } catch (err) {
        console.error("Erro inesperado ao carregar preferências:", err);
      }
    };

    loadPreferences();
    fetchCredits();
  }, []);

  // Detecta retorno do Stripe (?payment_status=success|error) e mostra HelloBar + refresh créditos
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment_status");
    if (!status) return;

    if (status === "success") {
      setHelloBarType("success");
      setHelloBarMessage("Pacote adquirido com sucesso!");
      setHelloBarShow(true);
      fetchCredits();
    } else if (status === "error") {
      setHelloBarType("error");
      setHelloBarMessage("Erro no pagamento, tente novamente.");
      setHelloBarShow(true);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("payment_status");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handlePlanCheckout = async (packageSlug: "credits_10" | "credits_25" | "credits_60") => {
    try {
      setCheckoutLoadingSlug(packageSlug);

      const baseUrl = window.location.origin;
      const currentPath = window.location.pathname;

      const { data, error } = await supabase.functions.invoke<CreateCheckoutSessionResponse>(
        "create-checkout-session",
        {
          body: {
            package_slug: packageSlug,
            success_url: `${baseUrl}${currentPath}?payment_status=success`,
            cancel_url: `${baseUrl}${currentPath}?payment_status=error`,
          },
        },
      );

      if (error) {
        console.error("Erro ao chamar create-checkout-session:", error);
        alert("Não foi possível iniciar o pagamento. Tente novamente em alguns instantes.");
        setCheckoutLoadingSlug(null);
        return;
      }

      if (!data?.ok || !data.checkout_url) {
        console.error("Resposta inesperada de create-checkout-session:", data);
        alert("Ocorreu um problema ao iniciar o pagamento. Tente novamente.");
        setCheckoutLoadingSlug(null);
        return;
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      console.error("Erro inesperado ao iniciar o checkout:", err);
      alert("Ocorreu um erro inesperado ao iniciar o pagamento. Tente novamente.");
      setCheckoutLoadingSlug(null);
    }
  };

  // Atualiza o estado + Supabase quando o toggle "Manter contexto" muda
  const handleToggleKeepContext = (value: boolean) => {
    setKeepContext(value);

    (async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Erro ao buscar usuário logado:", userError);
          return;
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            keep_context: value,
          } as any)
          .eq("id", user.id);

        if (error) {
          console.error("Erro ao salvar keep_context:", error);
        }
      } catch (err) {
        console.error("Erro inesperado ao salvar keep_context:", err);
      }
    })();
  };

  // Função para scroll suave
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const yOffset = -100;
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-night-sky text-moonlight-text relative">
      {/* Background Gradients - Fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
      </div>

      <HelloBar
        message={helloBarMessage}
        type={helloBarType}
        show={helloBarShow}
        onClose={() => setHelloBarShow(false)}
      />

      <Header key={credits ?? "no-credits"} isLoggedIn={true} onBuyCredits={() => setShowPaymentModal(true)} />

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ marginTop: "calc(64px + 24px + 40px)", paddingBottom: "48px" }}
      >
        <style>{`
          @media (min-width: 768px) {
            main {
              margin-top: calc(80px + 24px + 40px) !important;
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
          }
          @media (min-width: 1024px) {
            main {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-starlight-text mb-2 text-center">Meu Perfil</h1>
          <p className="text-moonlight-text text-center">Gerencie suas informações e preferências</p>
        </div>

        {/* Mobile: Tabs as dropdown style */}
        <div className="md:hidden mb-6">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="w-full grid grid-cols-2 gap-2 bg-transparent">
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <User className="w-4 h-4 mr-2" />
                Conta
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <Settings className="w-4 h-4 mr-2" />
                Preferências
              </TabsTrigger>
            </TabsList>
            <TabsList className="w-full grid grid-cols-2 gap-2 bg-transparent">
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <Shield className="w-4 h-4 mr-2" />
                Segurança
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagamentos
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="account">
                <AccountSection twoFactorEnabled={twoFactorEnabled} />
              </TabsContent>
              <TabsContent value="preferences">
                <PreferencesSection
                  keepContext={keepContext}
                  setKeepContext={handleToggleKeepContext}
                  limitAmount={limitAmount}
                  setLimitAmount={setLimitAmount}
                  limitPeriod={limitPeriod}
                  setLimitPeriod={setLimitPeriod}
                  hasActiveLimit={hasActiveLimit}
                  setHasActiveLimit={setHasActiveLimit}
                  activeLimitAmount={activeLimitAmount}
                  setActiveLimitAmount={setActiveLimitAmount}
                  activeLimitPeriod={activeLimitPeriod}
                  setActiveLimitPeriod={setActiveLimitPeriod}
                />
              </TabsContent>
              <TabsContent value="security">
                <SecuritySection twoFactorEnabled={twoFactorEnabled} setTwoFactorEnabled={setTwoFactorEnabled} />
              </TabsContent>
              <TabsContent value="billing">
                <BillingSection onPurchaseClick={() => setShowPaymentModal(true)} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Desktop: Sidebar Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="col-span-1">
            <nav className="bg-midnight-surface border border-obsidian-border rounded-2xl p-4 sticky top-24">
              <button
                onClick={() => scrollToSection(accountRef)}
                className="w-full text-left px-4 py-3 rounded-lg bg-mystic-indigo/10 text-mystic-indigo flex items-center gap-3 mb-2"
              >
                <User className="w-5 h-5" />
                Conta
              </button>
              <button
                onClick={() => scrollToSection(preferencesRef)}
                className="w-full text-left px-4 py-3 rounded-lg text-moonlight-text hover:bg-night-sky flex items-center gap-3 mb-2"
              >
                <Settings className="w-5 h-5" />
                Preferências
              </button>
              <button
                onClick={() => scrollToSection(securityRef)}
                className="w-full text-left px-4 py-3 rounded-lg text-moonlight-text hover:bg-night-sky flex items-center gap-3 mb-2"
              >
                <Shield className="w-5 h-5" />
                Segurança
              </button>
              <button
                onClick={() => scrollToSection(billingRef)}
                className="w-full text-left px-4 py-3 rounded-lg text-moonlight-text hover:bg-night-sky flex items-center gap-3"
              >
                <CreditCard className="w-5 h-5" />
                Pagamentos
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-3 space-y-8">
            <div ref={accountRef}>
              <AccountSection twoFactorEnabled={twoFactorEnabled} />
            </div>
            <div ref={preferencesRef}>
              <PreferencesSection
                keepContext={keepContext}
                setKeepContext={handleToggleKeepContext}
                limitAmount={limitAmount}
                setLimitAmount={setLimitAmount}
                limitPeriod={limitPeriod}
                setLimitPeriod={setLimitPeriod}
                hasActiveLimit={hasActiveLimit}
                setHasActiveLimit={setHasActiveLimit}
                activeLimitAmount={activeLimitAmount}
                setActiveLimitAmount={setActiveLimitAmount}
                activeLimitPeriod={activeLimitPeriod}
                setActiveLimitPeriod={setActiveLimitPeriod}
              />
            </div>
            <div ref={securityRef}>
              <SecuritySection twoFactorEnabled={twoFactorEnabled} setTwoFactorEnabled={setTwoFactorEnabled} />
            </div>
            <div ref={billingRef}>
              <BillingSection onPurchaseClick={() => setShowPaymentModal(true)} />
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal - Backdrop com Blur */}
      {showPaymentModal && (
        <>
          {/* Backdrop com blur */}
          <div
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => setShowPaymentModal(false)}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: "16px" }}
          >
            <div className="relative pointer-events-auto">
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => setShowPaymentModal(false)}
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

              <div
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
                style={{ padding: "32px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl text-starlight-text text-center">Comprar Créditos</h2>
                </div>

                <p className="text-lg text-moonlight-text text-center" style={{ marginBottom: "32px" }}>
                  Escolha o plano ideal para você:
                </p>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Plano Iniciante */}
                  <div
                    className="plan-card-mobile bg-night-sky/50 border border-obsidian-border rounded-2xl flex flex-col items-center text-center"
                    style={{ padding: "24px" }}
                  >
                    <style>{`
                @media (max-width: 767px) {
                  .plan-card-mobile {
                    padding: 16px !important;
                  }
                  .plan-card-mobile .plan-title {
                    font-size: 1.125rem !important;
                    margin-bottom: 6px !important;
                  }
                  .plan-card-mobile .plan-credits-number {
                    font-size: 2rem !important;
                  }
                  .plan-card-mobile .plan-credits-text {
                    font-size: 0.875rem !important;
                  }
                  .plan-card-mobile .plan-credits-wrapper {
                    margin-bottom: 6px !important;
                  }
                  .plan-card-mobile .plan-price {
                    font-size: 1.5rem !important;
                  }
                  .plan-card-mobile .plan-price-per {
                    font-size: 0.75rem !important;
                    margin-top: 2px !important;
                  }
                  .plan-card-mobile .plan-price-wrapper {
                    margin-bottom: 10px !important;
                  }
                  .plan-card-mobile .plan-button {
                    height: 40px !important;
                    font-size: 0.875rem !important;
                  }
                  .plan-card-mobile .plan-badge {
                    font-size: 0.625rem !important;
                    padding: 2px 10px !important;
                  }
                }
              `}</style>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: "8px" }}>
                      Iniciante
                    </h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: "8px" }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">10</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: "12px" }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 25,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: "2px" }}>
                        R$ 2,50/cada
                      </div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={() => handlePlanCheckout("credits_10")}
                      disabled={checkoutLoadingSlug !== null}
                    >
                      {checkoutLoadingSlug === "credits_10" ? "Redirecionando..." : "Escolher"}
                    </Button>
                  </div>

                  {/* Plano Explorador */}
                  <div
                    className="plan-card-mobile bg-night-sky/50 border-2 border-mystic-indigo rounded-2xl flex flex-col items-center text-center relative"
                    style={{ padding: "24px" }}
                  >
                    <div
                      className="plan-badge absolute -top-3 left-1/2 -translate-x-1/2 bg-mystic-indigo text-starlight-text text-xs rounded-full"
                      style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "4px", paddingBottom: "4px" }}
                    >
                      POPULAR
                    </div>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: "8px" }}>
                      Explorador
                    </h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: "8px" }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">25</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: "12px" }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 50,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: "2px" }}>
                        R$ 2,00/cada
                      </div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={() => handlePlanCheckout("credits_25")}
                      disabled={checkoutLoadingSlug !== null}
                    >
                      {checkoutLoadingSlug === "credits_25" ? "Redirecionando..." : "Escolher"}
                    </Button>
                  </div>

                  {/* Plano Místico */}
                  <div
                    className="plan-card-mobile bg-night-sky/50 border border-obsidian-border rounded-2xl flex flex-col items-center text-center"
                    style={{ padding: "24px" }}
                  >
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: "8px" }}>
                      Místico
                    </h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: "8px" }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">60</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: "12px" }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 100,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: "2px" }}>
                        R$ 1,67/cada
                      </div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={() => handlePlanCheckout("credits_60")}
                      disabled={checkoutLoadingSlug !== null}
                    >
                      {checkoutLoadingSlug === "credits_60" ? "Redirecionando..." : "Escolher"}
                    </Button>
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

function AccountSection({ twoFactorEnabled }: { twoFactorEnabled: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Erro ao buscar usuário logado:", userError);
          setErrorMessage("Sessão expirada. Faça login novamente.");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Erro ao buscar dados do perfil:", profileError);
          setErrorMessage("Não foi possível carregar seus dados.");
          return;
        }

        setName(profile?.full_name ?? "");
        setEmail(profile?.email ?? user.email ?? "");
        setPhone(profile?.phone ?? "");
      } catch (err) {
        console.error("Erro inesperado ao carregar dados do usuário:", err);
        setErrorMessage("Erro inesperado ao carregar seus dados.");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (!loading) setHasChanges(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, phone]);

  const canSave = hasChanges && !!confirmPassword && (!twoFactorEnabled || totpCode.trim().length >= 6) && !loading;

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setTotpError(null);

    if (!confirmPassword) {
      setErrorMessage("Informe sua senha atual para confirmar.");
      return;
    }

    try {
      setSaving(true);

      // 1) Buscar usuário
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário logado:", userError);
        setErrorMessage("Sessão expirada. Faça login novamente.");
        return;
      }

      // 1.1) Reautenticar (senha atual)
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email ?? email,
        password: confirmPassword,
      });

      if (reauthError) {
        setErrorMessage("Senha atual incorreta. Tente novamente.");
        return;
      }

      // 1.5) Se o usuário tem 2FA ativo, elevar sessão para AAL2 via TOTP antes de salvar
      if (twoFactorEnabled) {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) {
          console.error("Erro ao listar fatores de 2FA (perfil):", factorsError);
          setTotpError("Não foi possível validar o 2FA. Tente novamente.");
          return;
        }

        const totpFactors = (factorsData as any)?.totp ?? [];
        const verifiedTotp = totpFactors.find((f: any) => f.status === "verified") ?? totpFactors[0];

        if (!verifiedTotp?.id) {
          setTotpError("2FA está ativo, mas não encontrei um fator TOTP válido para este usuário.");
          return;
        }

        const code = totpCode.trim();
        if (!code || code.length < 6) {
          setTotpError("Informe o código de 6 dígitos do seu autenticador (2FA).");
          return;
        }

        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId: verifiedTotp.id,
          code,
        } as any);

        if (verifyError) {
          console.error("Erro ao validar 2FA (perfil):", verifyError);
          setTotpError("Código 2FA inválido. Verifique e tente novamente.");
          return;
        }
      }

      // 2) Atualizar dados no profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone,
        } as any)
        .eq("id", user.id);

      if (updateError) {
        console.error("Erro ao atualizar perfil:", updateError);
        setErrorMessage("Não foi possível salvar suas alterações.");
        return;
      }

      setSuccessMessage("Alterações salvas com sucesso.");
      setHasChanges(false);
      setConfirmPassword("");
      setTotpCode("");
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
      setErrorMessage("Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
      <h3 className="text-starlight-text mb-6">Conta</h3>

      {loading ? (
        <div className="text-moonlight-text">Carregando...</div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label className="text-moonlight-text">Nome</Label>
            <Input
              className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <Label className="text-moonlight-text">Email</Label>
            <Input
              className="bg-night-sky border-obsidian-border text-starlight-text mt-1 opacity-70"
              value={email}
              disabled
            />
            <p className="text-xs text-moonlight-text mt-1">E-mail é gerenciado pelo login (Auth).</p>
          </div>

          <div>
            <Label className="text-moonlight-text">Telefone</Label>
            <Input
              className="bg-night-sky border-obsidian-border text-starlight-text mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          {hasChanges && (
            <>
              <div className="pt-2">
                <Label htmlFor="confirmPassword-profile" className="text-moonlight-text mb-2 block">
                  Confirmar senha atual
                </Label>
                <Input
                  id="confirmPassword-profile"
                  type="password"
                  className="bg-night-sky border-obsidian-border text-starlight-text"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Informe sua senha atual"
                />
                <p className="text-xs text-moonlight-text mt-1">
                  Por segurança, é necessário confirmar sua senha ao alterar dados da conta.
                </p>

                {twoFactorEnabled && (
                  <div className="mt-4">
                    <Label htmlFor="profile-2fa-code" className="text-moonlight-text mb-2 block">
                      Código 2FA (Autenticador)
                    </Label>
                    <Input
                      id="profile-2fa-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className="bg-night-sky border-obsidian-border text-starlight-text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6 dígitos"
                    />
                    <p className="text-xs text-moonlight-text mt-1">
                      Você tem 2FA ativo. Confirme o código para salvar alterações.
                    </p>
                    {totpError && <p className="text-xs text-blood-moon-error mt-2">{totpError}</p>}
                  </div>
                )}
              </div>

              {errorMessage && <p className="text-sm text-blood-moon-error">{errorMessage}</p>}
              {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}

              <div className="pt-2 flex justify-end">
                <Button
                  className="bg-aurora-accent hover:bg-aurora-accent/90 text-midnight-surface font-semibold"
                  style={{ paddingLeft: "32px", paddingRight: "32px" }}
                  onClick={handleSave}
                  disabled={!canSave || saving}
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PreferencesSection({
  keepContext,
  setKeepContext,
  limitAmount,
  setLimitAmount,
  limitPeriod,
  setLimitPeriod,
  hasActiveLimit,
  setHasActiveLimit,
  activeLimitAmount,
  setActiveLimitAmount,
  activeLimitPeriod,
  setActiveLimitPeriod,
}: {
  keepContext: boolean;
  setKeepContext: (value: boolean) => void;
  limitAmount: string;
  setLimitAmount: (value: string) => void;
  limitPeriod: string;
  setLimitPeriod: (value: string) => void;
  hasActiveLimit: boolean;
  setHasActiveLimit: (value: boolean) => void;
  activeLimitAmount: string;
  setActiveLimitAmount: (value: string) => void;
  activeLimitPeriod: string;
  setActiveLimitPeriod: (value: string) => void;
}) {
  const handleApplyLimit = async () => {
    const amount = parseInt(limitAmount, 10);
    if (!limitAmount || Number.isNaN(amount) || amount < 1 || amount > 999) {
      alert("Por favor, insira um valor entre 1 e 999");
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário logado:", userError);
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          usage_limit_credits: amount,
          usage_limit_period: limitPeriod, // "dia" | "semana" | "mês"
        } as any)
        .eq("id", user.id);

      if (error) {
        console.error("Erro ao salvar limite de uso:", error);
        alert("Erro ao salvar limite. Tente novamente.");
        return;
      }

      setHasActiveLimit(true);
      setActiveLimitAmount(limitAmount);
      setActiveLimitPeriod(limitPeriod);
      setLimitAmount("");
      setLimitPeriod("dia");

      alert(`Limite ativado: ${amount} créditos por ${limitPeriod}`);
    } catch (err) {
      console.error("Erro inesperado ao salvar limite de uso:", err);
      alert("Erro inesperado ao salvar limite. Tente novamente.");
    }
  };

  const handleRemoveLimit = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário logado:", userError);
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          usage_limit_credits: null,
          usage_limit_period: null,
        } as any)
        .eq("id", user.id);

      if (error) {
        console.error("Erro ao desativar limite de uso:", error);
        alert("Erro ao desativar limite. Tente novamente.");
        return;
      }

      setHasActiveLimit(false);
      setActiveLimitAmount("");
      setActiveLimitPeriod("dia");
      setLimitAmount("");
      setLimitPeriod("dia");

      alert("Limite desativado com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao desativar limite de uso:", err);
      alert("Erro inesperado ao desativar limite. Tente novamente.");
    }
  };

  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Preferências</h3>

      <div className="space-y-6">
        {/* Manter contexto */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-obsidian-border">
          <div className="flex-1">
            <h4 className="text-starlight-text mb-1">Manter contexto</h4>
            <p className="text-moonlight-text text-sm">
              Analisaremos suas perguntas considerando tiragens anteriores. Se desligado, sua pergunta será analisada
              individualmente
            </p>
          </div>
          <Switch
            checked={keepContext}
            onCheckedChange={setKeepContext}
            className="data-[state=checked]:bg-mystic-indigo ml-4"
          />
        </div>

        {/* Limite diário de uso */}
        <div>
          <h4 className="text-starlight-text mb-4">Limite de uso</h4>

          {hasActiveLimit ? (
            <div className="bg-night-sky/50 border border-obsidian-border rounded-xl p-4 mb-4">
              <p className="text-moonlight-text mb-3">
                Limite ativo: <span className="text-starlight-text">{activeLimitAmount}</span> créditos por{" "}
                <span className="text-starlight-text">{activeLimitPeriod}</span>
              </p>
              <Button
                onClick={handleRemoveLimit}
                variant="outline"
                className="w-full md:w-auto border-blood-moon-error text-blood-moon-error hover:bg-blood-moon-error/10"
                style={{ paddingLeft: "24px", paddingRight: "24px" }}
              >
                Desativar limite
              </Button>
            </div>
          ) : (
            <>
              <p className="text-moonlight-text mb-4">
                Usar no máximo{" "}
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="inline-block w-20 text-center bg-night-sky border-obsidian-border text-starlight-text mx-1"
                  style={{ padding: "8px 4px" }}
                />{" "}
                créditos por{" "}
                <select
                  value={limitPeriod}
                  onChange={(e) => setLimitPeriod(e.target.value)}
                  className="inline-block w-auto bg-night-sky border border-obsidian-border rounded-lg text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors ml-1"
                  style={{ padding: "8px 12px" }}
                >
                  <option value="dia">dia</option>
                  <option value="semana">semana</option>
                  <option value="mês">mês</option>
                </select>
              </p>
              <Button
                onClick={handleApplyLimit}
                className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                style={{ paddingLeft: "32px", paddingRight: "32px" }}
                disabled={!limitAmount}
              >
                Aplicar limite
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SecuritySection({
  twoFactorEnabled,
  setTwoFactorEnabled,
}: {
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (value: boolean) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado geral de 2FA
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);

  // ---- ESTADO PARA SETUP TOTP (ATIVAR 2FA) ----
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [totpQrCode, setTotpQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpVerifying, setTotpVerifying] = useState(false);

  // ---- ESTADO PARA DESATIVAR 2FA (CONFIRMAR CÓDIGO) ----
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableFactorId, setDisableFactorId] = useState<string | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disableVerifying, setDisableVerifying] = useState(false);

  // ---- ESTADO PARA 2FA NA TROCA DE SENHA ----
  const [showPassword2FAModal, setShowPassword2FAModal] = useState(false);
  const [passwordFactorId, setPasswordFactorId] = useState<string | null>(null);
  const [passwordTotpCode, setPasswordTotpCode] = useState("");
  const [passwordTotpError, setPasswordTotpError] = useState<string | null>(null);
  const [passwordTotpVerifying, setPasswordTotpVerifying] = useState(false);

  // --------- HELPERS GERAIS ---------
  const resetTotpSetupState = () => {
    setTotpQrCode(null);
    setTotpSecret(null);
    setTotpFactorId(null);
    setTotpCode("");
    setTotpError(null);
    setTotpVerifying(false);
  };

  const resetDisableState = () => {
    setDisableFactorId(null);
    setDisableCode("");
    setDisableError(null);
    setDisableVerifying(false);
  };

  const resetPassword2FAState = () => {
    setPasswordFactorId(null);
    setPasswordTotpCode("");
    setPasswordTotpError(null);
    setPasswordTotpVerifying(false);
  };

  // Limpa fatores TOTP não verificados (mfa_factors.status = 'unverified')
  const removeUnverifiedTotpFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error("Erro ao listar fatores MFA para limpeza de TOTP:", error);
        return;
      }

      const anyData: any = data;
      const totpFactors: Array<{ id: string; status: string }> =
        (anyData?.totp as Array<{ id: string; status: string }>) ??
        (anyData?.all as Array<{ id: string; status: string }>) ??
        [];

      const unverified = totpFactors.filter((f) => f.status === "unverified");

      for (const factor of unverified) {
        try {
          await supabase.auth.mfa.unenroll({ factorId: factor.id } as any);
        } catch (err) {
          console.error("Erro ao remover fator TOTP não verificado:", err);
        }
      }
    } catch (err) {
      console.error("Erro inesperado em removeUnverifiedTotpFactors:", err);
    }
  };

  // --------- ALTERAR SENHA (NUA, SEM 2FA) ---------
  const handleChangePasswordCore = async () => {
    // Fluxo sem 2FA: revalida senha + troca senha
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (!(userError as any)?.message?.includes("Auth session missing")) {
          console.error("Erro ao buscar usuário logado:", userError);
        }
        setErrorMessage("Sessão expirada. Faça login novamente.");
        return;
      }

      // Revalidar a senha atual
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (reauthError) {
        console.error("Erro ao revalidar senha atual:", reauthError);
        setErrorMessage("Senha atual incorreta. Verifique e tente novamente.");
        return;
      }

      // Atualizar senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Erro ao alterar senha:", error);
        setErrorMessage(error.message || "Erro ao alterar senha.");
        return;
      }

      setSuccessMessage("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Erro inesperado ao alterar senha:", err);
      setErrorMessage("Erro inesperado ao alterar senha.");
    } finally {
      setSaving(false);
    }
  };

  // Handler chamado pelo botão "Alterar senha"
  const handleChangePasswordClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage("Informe sua senha atual.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("A confirmação de senha não confere.");
      return;
    }

    // Se 2FA NÃO estiver habilitado, troca direto
    if (!twoFactorEnabled) {
      await handleChangePasswordCore();
      return;
    }

    // Se 2FA estiver habilitado, precisamos pedir TOTP antes de trocar
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error("Erro ao listar fatores MFA para troca de senha:", error);
        setErrorMessage("Não foi possível validar o 2FA. Tente novamente.");
        return;
      }

      const anyData: any = data;
      const totpFactors = (anyData?.totp ?? []) as Array<{ id: string; status?: string }>;

      if (!totpFactors.length) {
        setErrorMessage("2FA está ativado, mas nenhum fator TOTP foi encontrado. Desative e ative novamente o 2FA.");
        return;
      }

      setPasswordFactorId(totpFactors[0].id);
      setShowPassword2FAModal(true);
    } catch (err) {
      console.error("Erro inesperado ao preparar validação de 2FA para troca de senha:", err);
      setErrorMessage("Erro inesperado ao validar o 2FA. Tente novamente.");
    }
  };

  // --------- CONFIRMAR CÓDIGO 2FA PARA TROCA DE SENHA ---------
  const handleConfirmPassword2FA = async () => {
    setPasswordTotpError(null);

    if (!passwordFactorId) {
      setPasswordTotpError("Erro interno ao validar 2FA. Recarregue a página e tente novamente.");
      return;
    }

    if (!passwordTotpCode.trim()) {
      setPasswordTotpError("Informe o código de 6 dígitos do app autenticador.");
      return;
    }

    setPasswordTotpVerifying(true);
    setSaving(true);

    try {
      // 1) Buscar usuário logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (!(userError as any)?.message?.includes("Auth session missing")) {
          console.error("Erro ao buscar usuário logado (2FA senha):", userError);
        }
        setPasswordTotpError("Sessão expirada. Faça login novamente.");
        return;
      }

      // 2) Revalidar a senha atual (sessão AAL1 “limpa”)
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (reauthError) {
        console.error("Erro ao revalidar senha atual (2FA):", reauthError);
        setPasswordTotpError("Senha atual incorreta. Verifique e tente novamente.");
        return;
      }

      // 3) Subir sessão para AAL2 com TOTP
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: passwordFactorId,
        code: passwordTotpCode.trim(),
      } as any);

      if (verifyError) {
        console.error("Erro ao verificar TOTP para troca de senha:", verifyError);
        setPasswordTotpError("Código inválido. Confira no app autenticador e tente novamente.");
        return;
      }

      // 4) Agora sim, com AAL2, atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Erro ao alterar senha (com 2FA):", updateError);
        setPasswordTotpError(updateError.message || "Erro ao alterar senha.");
        return;
      }

      // Sucesso
      setSuccessMessage("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowPassword2FAModal(false);
      resetPassword2FAState();
    } catch (err) {
      console.error("Erro inesperado ao validar 2FA para troca de senha:", err);
      setPasswordTotpError("Erro inesperado ao validar o 2FA. Tente novamente.");
    } finally {
      setPasswordTotpVerifying(false);
      setSaving(false);
    }
  };

  const handleCancelPassword2FA = () => {
    resetPassword2FAState();
    setShowPassword2FAModal(false);
  };

  // --------- FLUXO: INICIAR ENROLAMENTO TOTP (ATIVAR 2FA) ---------
  const startTotpEnrollment = async () => {
    setTotpError(null);
    setTwoFactorSaving(true);

    try {
      // 1) Limpa fatores TOTP não verificados antigos
      await removeUnverifiedTotpFactors();

      // 2) Cria fator novo
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "TOTP TarotOnline",
      } as any);

      if (error || !data) {
        console.error("Erro ao iniciar enrolamento TOTP:", error);

        const message =
          (error as any)?.message || (error as any)?.error_description || "Não foi possível iniciar o 2FA.";

        if (message.includes("friendly name")) {
          setTotpError(
            "Já existe um 2FA configurado neste usuário. Desative o 2FA atual antes de configurar novamente.",
          );
        } else {
          setTotpError("Não foi possível iniciar a configuração do 2FA. Tente novamente.");
        }

        return;
      }

      const anyData: any = data;
      setTotpFactorId(anyData.id ?? null);
      setTotpQrCode(anyData.totp?.qr_code ?? null);
      setTotpSecret(anyData.totp?.secret ?? null);
    } catch (err) {
      console.error("Erro inesperado ao iniciar enrolamento TOTP:", err);
      setTotpError("Erro inesperado ao iniciar a configuração do 2FA.");
    } finally {
      setTwoFactorSaving(false);
    }
  };

  // Cancelar setup: se já criou fator mas não confirmou, tenta descartar
  const handleCancelTotpSetup = async () => {
    try {
      if (totpFactorId) {
        await supabase.auth.mfa.unenroll({ factorId: totpFactorId } as any);
      }
    } catch (err) {
      console.error("Erro ao descartar fator TOTP não verificado:", err);
    } finally {
      resetTotpSetupState();
      setShowTotpModal(false);
    }
  };

  const handleConfirmTotp = async () => {
    setTotpError(null);

    if (!totpFactorId) {
      setTotpError("Erro interno ao configurar 2FA. Recarregue a página e tente novamente.");
      return;
    }

    if (!totpCode.trim()) {
      setTotpError("Informe o código gerado pelo app autenticador.");
      return;
    }

    setTotpVerifying(true);

    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactorId,
        code: totpCode.trim(),
      } as any);

      if (verifyError) {
        console.error("Erro ao verificar TOTP:", verifyError);
        setTotpError("Código inválido. Confira no app autenticador e tente novamente.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (!(userError as any)?.message?.includes("Auth session missing")) {
          console.error("Erro ao buscar usuário logado para 2FA:", userError);
        }
        setTotpError("Sessão expirada. Faça login novamente.");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ two_factor_enabled: true } as any)
        .eq("id", user.id);

      if (updateError) {
        console.error("Erro ao atualizar two_factor_enabled:", updateError);
        setTotpError("2FA confirmado, mas houve erro ao salvar nas preferências.");
        return;
      }

      setTwoFactorEnabled(true);
      setSuccessMessage("Autenticação de dois fatores ativada.");
      setShowTotpModal(false);
      resetTotpSetupState();
    } catch (err) {
      console.error("Erro inesperado ao confirmar TOTP:", err);
      setTotpError("Erro inesperado ao confirmar o código. Tente novamente.");
    } finally {
      setTotpVerifying(false);
    }
  };

  // --------- FLUXO: DESATIVAR 2FA (REQUIRE CÓDIGO) ---------
  const openDisableTwoFactorModal = async () => {
    setDisableError(null);
    setDisableCode("");
    resetDisableState();
    setShowDisableModal(true);
    setTwoFactorSaving(true);

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error("Erro ao listar fatores MFA:", error);
        setDisableError("Não foi possível localizar o fator de 2FA. Tente novamente.");
        return;
      }

      const totpFactors = ((data as any)?.totp ?? []) as Array<{ id: string; status?: string }>;
      const verified = totpFactors.find((f) => f.status === "verified") ?? totpFactors[0];

      if (!verified?.id) {
        setDisableError("Nenhum fator TOTP encontrado para desativar.");
        return;
      }

      setDisableFactorId(verified.id);
    } catch (err) {
      console.error("Erro inesperado ao preparar desativação de 2FA:", err);
      setDisableError("Erro inesperado ao preparar a desativação do 2FA.");
    } finally {
      setTwoFactorSaving(false);
    }
  };

  const handleCancelDisable = () => {
    resetDisableState();
    setShowDisableModal(false);
  };

  const handleConfirmDisableTwoFactor = async () => {
    setDisableError(null);

    const code = disableCode.trim();

    if (code.length !== 6) {
      setDisableError("Informe o código de 6 dígitos do app autenticador.");
      return;
    }

    setDisableVerifying(true);

    try {
      // Sempre relista o fator verified na hora do confirm (evita id stale)
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        console.error("Erro ao listar fatores MFA (confirm disable):", listError);
        setDisableError("Não foi possível localizar o fator de 2FA. Tente novamente.");
        return;
      }

      const totpFactors = ((factorsData as any)?.totp ?? []) as Array<{ id: string; status?: string }>;
      const verified = totpFactors.find((f) => f.status === "verified") ?? totpFactors[0];

      if (!verified?.id) {
        setDisableError("Nenhum fator TOTP encontrado para desativar.");
        return;
      }

      const factorId = verified.id;

      // 1) Eleva para AAL2 (server-side)
      const { data: cavData, error: cavError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      } as any);

      if (cavError) {
        console.error("Erro ao verificar TOTP para desativar:", cavError);
        setDisableError("Código inválido. Confira no app autenticador e tente novamente.");
        return;
      }

      // 2) Força o client a “assentar” a sessão AAL2 antes do unenroll (evita travar/abort sem request)
      const sessionLike = (cavData as any)?.session;
      if (sessionLike?.access_token && sessionLike?.refresh_token) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: sessionLike.access_token,
          refresh_token: sessionLike.refresh_token,
        } as any);

        if (setSessionError) {
          console.warn("Aviso: setSession pós challengeAndVerify falhou (seguindo mesmo assim):", setSessionError);
        }
      }

      await supabase.auth.refreshSession();
      await new Promise((r) => setTimeout(r, 200));

      // 3) Unenroll (agora sim)
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId } as any);

      if (unenrollError) {
        console.error("Erro ao desativar fator TOTP:", unenrollError);
        setDisableError("Não foi possível desativar o 2FA. Tente novamente.");
        return;
      }

      // 4) Atualiza flag em profiles
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário para desativar 2FA:", userError);
        setDisableError("Sessão expirada. Faça login novamente.");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ two_factor_enabled: false } as any)
        .eq("id", user.id);

      if (updateError) {
        console.error("Erro ao atualizar two_factor_enabled (desativar):", updateError);
        // não bloqueia a UX: o 2FA já foi removido no Auth
      }

      setTwoFactorEnabled(false);
      setSuccessMessage("Autenticação de dois fatores desativada.");
      setShowDisableModal(false);
      resetDisableState();

      // 5) Cleanup opcional (não bloqueia UI)
      void (async () => {
        try {
          const { data, error } = await supabase.auth.mfa.listFactors();
          if (error) return;

          const totp = ((data as any)?.totp ?? []) as Array<{ id: string }>;
          await Promise.allSettled(
            totp.filter((f) => f.id !== factorId).map((f) => supabase.auth.mfa.unenroll({ factorId: f.id } as any)),
          );
        } catch (e) {
          console.warn("Cleanup de fatores TOTP falhou (ok ignorar):", e);
        }
      })();
    } catch (err) {
      console.error("Erro inesperado ao desativar 2FA:", err);
      setDisableError("Erro inesperado ao desativar o 2FA. Tente novamente.");
    } finally {
      setDisableVerifying(false);
    }
  };

  // --------- HANDLER DO SWITCH 2FA ---------
  const handleToggleTwoFactor = (value: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (value) {
      resetTotpSetupState();
      setShowTotpModal(true);
      void startTotpEnrollment();
    } else {
      void openDisableTwoFactorModal();
    }
  };

  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Segurança</h3>

      <div className="space-y-6">
        {/* Troca de senha */}
        <div>
          <Label htmlFor="current-password" className="text-moonlight-text mb-2 block">
            Senha atual
          </Label>
          <Input
            id="current-password"
            type="password"
            placeholder="••••••••"
            className="bg-night-sky border-obsidian-border text-starlight-text"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="new-password" className="text-moonlight-text mb-2 block">
            Nova senha
          </Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            className="bg-night-sky border-obsidian-border text-starlight-text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="confirm-password" className="text-moonlight-text mb-2 block">
            Confirmar nova senha
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            className="bg-night-sky border-obsidian-border text-starlight-text"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {errorMessage && <p className="text-sm text-blood-moon-error">{errorMessage}</p>}
        {successMessage && <p className="text-sm text-verdant-success">{successMessage}</p>}

        <div className="pt-4 pb-6 border-b border-obsidian-border">
          <Button
            className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text px-8"
            onClick={handleChangePasswordClick}
            disabled={saving}
          >
            {saving ? "Alterando..." : "Alterar senha"}
          </Button>
        </div>

        {/* 2FA */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-starlight-text mb-1">Autenticação de dois fatores</h4>
            <p className="text-moonlight-text text-sm">
              Adicione uma camada extra de segurança à sua conta com um app autenticador (TOTP)
            </p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={handleToggleTwoFactor}
            disabled={twoFactorSaving}
            className="data-[state=checked]:bg-mystic-indigo"
          />
        </div>
      </div>

      {/* Modal de configuração TOTP */}
      {showTotpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 w-full max-w-md relative">
            {/* Botão X – fundo igual ao modal */}
            <button
              onClick={handleCancelTotpSetup}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-50"
              aria-label="Fechar configuração de 2FA"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h4 className="text-starlight-text text-lg font-semibold mb-2">
              Configurar autenticação de dois fatores (TOTP)
            </h4>
            <p className="text-moonlight-text text-sm mb-4">
              1. Escaneie o QR code abaixo em um app como Google Authenticator, 1Password ou Authy.
              <br />
              2. Digite o código de 6 dígitos gerado pelo app para confirmar.
            </p>

            {totpQrCode ? (
              <img
                src={totpQrCode}
                alt="QR Code para configurar 2FA"
                className="mx-auto my-4 w-56 h-56 rounded-lg bg-night-sky object-contain"
              />
            ) : (
              <p className="text-moonlight-text text-sm mb-4">Carregando QR code...</p>
            )}

            {totpSecret && (
              <p className="text-xs text-moonlight-text mb-4 break-all">
                Se não conseguir escanear, use este código manualmente no app autenticador:
                <br />
                <span className="font-mono text-starlight-text">{totpSecret}</span>
              </p>
            )}

            <div className="mt-2">
              <Label htmlFor="totp-code" className="text-moonlight-text mb-2 block">
                Código de 6 dígitos do app autenticador
              </Label>
              <Input
                id="totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="bg-night-sky border-obsidian-border text-starlight-text tracking-[0.4em] text-center"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {totpError && <p className="text-sm text-blood-moon-error mt-2">{totpError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-obsidian-border text-moonlight-text hover:bg-night-sky px-4 py-2"
                onClick={handleCancelTotpSetup}
                disabled={totpVerifying || twoFactorSaving}
              >
                Cancelar
              </Button>
              <Button
                className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text px-4 py-2"
                onClick={handleConfirmTotp}
                disabled={totpVerifying || twoFactorSaving}
              >
                {totpVerifying ? "Verificando..." : "Ativar 2FA"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para DESATIVAR 2FA */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 w-full max-w-md relative">
            <button
              onClick={handleCancelDisable}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-50"
              aria-label="Fechar desativação de 2FA"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h4 className="text-starlight-text text-lg font-semibold mb-2">Desativar autenticação de dois fatores</h4>
            <p className="text-moonlight-text text-sm mb-4">
              Para desativar o 2FA, confirme com o código de 6 dígitos gerado no seu app autenticador.
            </p>

            <div className="mt-2">
              <Label htmlFor="disable-totp-code" className="text-moonlight-text mb-2 block">
                Código de 6 dígitos do app autenticador
              </Label>
              <Input
                id="disable-totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="bg-night-sky border-obsidian-border text-starlight-text tracking-[0.4em] text-center"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {disableError && <p className="text-sm text-blood-moon-error mt-2">{disableError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-obsidian-border text-moonlight-text hover:bg-night-sky px-4 py-2"
                onClick={handleCancelDisable}
                disabled={disableVerifying || twoFactorSaving}
              >
                Cancelar
              </Button>
              <Button
                className="bg-blood-moon-error/90 hover:bg-blood-moon-error text-starlight-text px-4 py-2"
                onClick={handleConfirmDisableTwoFactor}
                disabled={disableVerifying || twoFactorSaving || disableCode.trim().length !== 6}
              >
                {disableVerifying ? "Desativando..." : "Desativar 2FA"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de 2FA para TROCAR SENHA */}
      {showPassword2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 w-full max-w-md relative">
            <button
              onClick={handleCancelPassword2FA}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-50"
              aria-label="Fechar verificação de 2FA para troca de senha"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h4 className="text-starlight-text text-lg font-semibold mb-2">Confirmar 2FA para alterar senha</h4>
            <p className="text-moonlight-text text-sm mb-4">
              Digite o código de 6 dígitos gerado pelo seu app autenticador para confirmar a alteração de senha.
            </p>

            <div className="mt-2">
              <Label htmlFor="password-totp-code" className="text-moonlight-text mb-2 block">
                Código de 6 dígitos do app autenticador
              </Label>
              <Input
                id="password-totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="bg-night-sky border-obsidian-border text-starlight-text tracking-[0.4em] text-center"
                value={passwordTotpCode}
                onChange={(e) => setPasswordTotpCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {passwordTotpError && <p className="text-sm text-blood-moon-error mt-2">{passwordTotpError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-obsidian-border text-moonlight-text hover:bg-night-sky px-4 py-2"
                onClick={handleCancelPassword2FA}
                disabled={passwordTotpVerifying}
              >
                Cancelar
              </Button>
              <Button
                className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text px-4 py-2"
                onClick={handleConfirmPassword2FA}
                disabled={passwordTotpVerifying}
              >
                {passwordTotpVerifying ? "Verificando..." : "Confirmar e alterar senha"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BillingSection({ onPurchaseClick }: { onPurchaseClick: () => void }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<{ date: string; credits: number; amount: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Erro ao buscar usuário logado:", userError);
          setErrorMessage("Sessão expirada. Faça login novamente.");
          return;
        }

        // Saldo de créditos
        const { data: balanceRow, error: balanceError } = await supabase
          .from("credit_balances")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();

        if (balanceError) {
          console.error("Erro ao buscar saldo:", balanceError);
        } else {
          setBalance(balanceRow?.balance ?? 0);
        }

        // Compras recentes: transações com amount_cents > 0
        const { data: txs, error: txError } = await supabase
          .from("credit_transactions")
          .select("credits_change, amount_cents, currency, created_at")
          .eq("user_id", user.id)
          .gt("amount_cents", 0)
          .order("created_at", { ascending: false })
          .limit(5);

        if (txError) {
          console.error("Erro ao buscar compras recentes:", txError);
          return;
        }

        const mapped = (txs || []).map((row: any) => {
          const d = new Date(row.created_at);
          const date = d.toLocaleDateString("pt-BR");

          const cents = Number(row.amount_cents);
          const value = cents / 100;
          const currencyCode = row.currency || "BRL";

          const amount = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: currencyCode,
          }).format(value);

          return {
            date,
            credits: Number(row.credits_change),
            amount,
          };
        });

        setRecentPurchases(mapped);
      } catch (err) {
        console.error("Erro inesperado ao carregar billing:", err);
        setErrorMessage("Erro ao carregar informações de pagamento.");
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Pagamentos e Créditos</h3>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-mystic-indigo to-mystic-indigo-dark rounded-xl p-6">
          <p className="text-starlight-text/80 mb-2">Saldo Atual</p>
          <p className="text-starlight-text mb-1">{balance !== null ? balance : 0}</p>
          <p className="text-starlight-text/80 mb-4">créditos disponíveis</p>
          <Button
            size="sm"
            className="bg-starlight-text text-mystic-indigo hover:bg-starlight-text/90"
            onClick={onPurchaseClick}
            style={{ paddingLeft: "24px", paddingRight: "24px" }}
          >
            Comprar mais créditos
          </Button>
        </div>

        <div>
          <h4 className="text-starlight-text mb-4">Compras recentes</h4>

          {errorMessage && <p className="text-sm text-blood-moon-error mb-2">{errorMessage}</p>}

          {loading && <p className="text-sm text-moonlight-text">Carregando compras recentes...</p>}

          {!loading && recentPurchases.length === 0 && !errorMessage && (
            <p className="text-sm text-moonlight-text">Você ainda não realizou compras de créditos.</p>
          )}

          {!loading && recentPurchases.length > 0 && (
            <div className="space-y-3">
              {recentPurchases.map((purchase, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-night-sky rounded-lg border border-obsidian-border"
                >
                  <div>
                    <p className="text-starlight-text">{purchase.credits} créditos</p>
                    <p className="text-moonlight-text text-sm">{purchase.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-starlight-text">{purchase.amount}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Check className="w-3 h-3 text-verdant-success" />
                      <span className="text-xs text-verdant-success">Concluído</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
    const subject = (contactSubject || "Contato pelo Tarot Online").trim();
    const body = [
      "Mensagem enviada pelo site Tarot Online",
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
            <h4 className="text-starlight-text text-base">Como usamos aqui no Tarot Online</h4>
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
            <h4 className="text-starlight-text text-base">Como usamos aqui no Tarot Online</h4>
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
            <h4 className="text-starlight-text text-base">Como usamos aqui no Tarot Online</h4>
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
            Última atualização: 2025. Ao usar o Tarot Online, você concorda com estes Termos.
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
                    <Sparkles className="w-5 h-5 text-starlight-text" />
                  </div>
                  <span className="text-xl text-starlight-text">Tarot Online</span>
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
              <p className="text-sm text-moonlight-text/60">© 2025 Tarot Online. Todos os direitos reservados.</p>
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
