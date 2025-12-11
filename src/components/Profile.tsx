import { useState, useRef, useEffect } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Shield, CreditCard, Check, Sparkles, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function Profile() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
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

  // Carrega preferências (manter contexto + limite de uso) ao abrir /profile
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          // Ignora o caso comum de sessão ainda não inicializada para não poluir o console
          if (!(userError as any)?.message?.includes("Auth session missing")) {
            console.error("Erro ao buscar usuário logado:", userError);
          }
          return;
        }

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

        if (error) {
          console.error("Erro ao carregar preferências:", error);
          return;
        }

        if (!data) return;

        // Cast para fugir das limitações de tipo do Supabase (colunas novas)
        const prefs = data as any;

        // Manter contexto

        if (typeof prefs.keep_context === "boolean") {
          setKeepContext(prefs.keep_context);
        }

        // 2FA (flag em profiles.two_factor_enabled)
        if (typeof prefs.two_factor_enabled === "boolean") {
          setTwoFactorEnabled(prefs.two_factor_enabled);
        } else {
          setTwoFactorEnabled(false);
        }

        // Limite de uso
        if (prefs.usage_limit_credits != null && prefs.usage_limit_period) {
          setHasActiveLimit(true);
          setActiveLimitAmount(String(prefs.usage_limit_credits));
          setActiveLimitPeriod(prefs.usage_limit_period); // "dia" | "semana" | "mês"
        } else {
          setHasActiveLimit(false);
          setActiveLimitAmount("");
          setActiveLimitPeriod("dia");
        }

        // Inputs do formulário começam limpos / default
        setLimitAmount("");
        setLimitPeriod("dia");
      } catch (err) {
        console.error("Erro inesperado ao carregar preferências:", err);
      }
    };

    loadPreferences();
  }, []);

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
          .update(
            {
              keep_context: value,
            } as any, // <-- cast pra fugir do tipo que ainda não conhece a coluna
          )
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
      const yOffset = -100; // Offset para compensar o header fixo
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

      <Header isLoggedIn={true} />

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
                <AccountSection />
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
                <BillingSection onPurchaseClick={() => setShowPurchaseModal(true)} />
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
              <AccountSection />
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
              <BillingSection onPurchaseClick={() => setShowPurchaseModal(true)} />
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPurchaseModal && (
        <>
          {/* Backdrop com blur */}
          <div
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => setShowPurchaseModal(false)}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: "16px" }}
          >
            <div className="relative pointer-events-auto">
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => setShowPurchaseModal(false)}
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
                      onClick={() => {
                        /* TODO: Abrir gateway de pagamento */
                      }}
                    >
                      Escolher
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
                      onClick={() => {
                        /* TODO: Abrir gateway de pagamento */
                      }}
                    >
                      Escolher
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
                      onClick={() => {
                        /* TODO: Abrir gateway de pagamento */
                      }}
                    >
                      Escolher
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-obsidian-border bg-midnight-surface/50 backdrop-blur-sm">
        <style>{`
          @media (max-width: 767px) {
            .footer-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .footer-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .footer-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
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
                  Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7 com interpretações profundas
                  e personalizadas.
                </small>
              </div>

              {/* Links - Serviços */}
              <div>
                <h3 className="text-base text-starlight-text mb-4">Serviços</h3>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar navegação */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar navegação */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot Cigano
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar navegação */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Cartomancia Clássica
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar modal */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Como funciona
                    </button>
                  </li>
                </ul>
              </div>

              {/* Links - Informações */}
              <div>
                <h3 className="text-base text-starlight-text mb-4">Informações</h3>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Sobre nós
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Termos de uso
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Política de privacidade
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Contato
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8">
              <small className="block text-center text-moonlight-text/70">
                © 2024 Tarot Online. Todos os direitos reservados.
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AccountSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [hasChanges, setHasChanges] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
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

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar perfil:", error);
          setErrorMessage("Erro ao carregar seus dados.");
          return;
        }

        const fullName = data?.full_name ?? "";
        const emailValue = data?.email ?? user.email ?? "";
        const phoneValue = data?.phone ?? "";

        setName(fullName);
        setEmail(emailValue);
        setPhone(phoneValue);
        setHasChanges(false);
        setConfirmPassword("");
      } catch (err) {
        console.error("Erro inesperado ao buscar perfil:", err);
        setErrorMessage("Erro inesperado ao carregar seus dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Erro ao buscar usuário logado:", userError);
        setErrorMessage("Sessão expirada. Faça login novamente.");
        return;
      }

      if (!confirmPassword) {
        setErrorMessage("Informe sua senha para confirmar as alterações.");
        return;
      }

      // 1) Revalidar senha atual
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: confirmPassword,
      });

      if (reauthError) {
        console.error("Erro ao revalidar senha:", reauthError);
        setErrorMessage("Senha incorreta. Verifique e tente novamente.");
        return;
      }

      // 2) Atualizar dados no profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          phone: phone,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Erro ao salvar perfil:", updateError);
        setErrorMessage("Erro ao salvar seus dados. Tente novamente.");
        return;
      }

      setSuccessMessage("Perfil atualizado com sucesso!");
      setHasChanges(false);
      setConfirmPassword("");
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
      setErrorMessage("Erro inesperado ao salvar seus dados.");
    } finally {
      setSaving(false);
    }
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasChanges(true);
  };

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setHasChanges(true);
  };

  const canSave = hasChanges && !!confirmPassword && !loading;

  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Dados da Conta</h3>

      <div className="space-y-6">
        {loading && <p className="text-sm text-moonlight-text">Carregando seus dados...</p>}

        {!loading && (
          <>
            <div>
              <Label htmlFor="name" className="text-moonlight-text mb-2 block">
                Nome completo
              </Label>
              <Input
                id="name"
                className="bg-night-sky border-obsidian-border text-starlight-text"
                value={name}
                onChange={onNameChange}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-moonlight-text mb-2 block">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                className="bg-night-sky border-obsidian-border text-starlight-text opacity-70 cursor-not-allowed"
                value={email}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-moonlight-text mb-2 block">
                Telefone
              </Label>
              <Input
                id="phone"
                className="bg-night-sky border-obsidian-border text-starlight-text"
                value={phone}
                onChange={onPhoneChange}
                placeholder="+55 11 99999-9999"
              />
            </div>

            {hasChanges && (
              <div>
                <Label htmlFor="confirm-password-profile" className="text-moonlight-text mb-2 block">
                  Senha para confirmar as alterações
                </Label>
                <Input
                  id="confirm-password-profile"
                  type="password"
                  className="bg-night-sky border-obsidian-border text-starlight-text"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Informe sua senha atual"
                />
                <p className="text-xs text-moonlight-text mt-1">
                  Por segurança, é necessário confirmar sua senha ao alterar dados da conta.
                </p>
              </div>
            )}

            {errorMessage && <p className="text-sm text-blood-moon-error">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-verdant-success">{successMessage}</p>}

            <div className="pt-4">
              <Button
                className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
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

  // --------- ALTERAR SENHA ---------
  const handleChangePassword = async () => {
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

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // Esse erro já é tratado no loadPreferences, aqui só abortamos
        if (!(userError as any)?.message?.includes("Auth session missing")) {
          console.error("Erro ao buscar usuário logado:", userError);
        }
        setErrorMessage("Sessão expirada. Faça login novamente.");
        return;
      }

      // 1) Revalidar a senha atual
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (reauthError) {
        console.error("Erro ao revalidar senha atual:", reauthError);
        setErrorMessage("Senha atual incorreta. Verifique e tente novamente.");
        return;
      }

      // (POR ENQUANTO) ainda sem exigir TOTP aqui – plugamos isso na próxima etapa

      // 2) Atualizar senha
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

  // --------- HELPERS 2FA ---------
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

  // --------- FLUXO: INICIAR ENROLAMENTO TOTP ---------
  const startTotpEnrollment = async () => {
    setTotpError(null);
    setTwoFactorSaving(true);

    try {
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
      // challenge + verify em um passo (TOTP)
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

      const anyData: any = data;
      const totpFactors = (anyData?.totp ?? []) as Array<{ id: string }>;

      if (!totpFactors.length) {
        setDisableError("Nenhum fator TOTP encontrado para desativar.");
        return;
      }

      setDisableFactorId(totpFactors[0].id);
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

    if (!disableFactorId) {
      setDisableError("Erro interno ao desativar 2FA. Recarregue a página e tente novamente.");
      return;
    }

    if (!disableCode.trim()) {
      setDisableError("Informe o código de 6 dígitos do app autenticador.");
      return;
    }

    setDisableVerifying(true);

    try {
      // 1) Verifica o código TOTP para obter sessão AAL2
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: disableFactorId,
        code: disableCode.trim(),
      } as any);

      if (verifyError) {
        console.error("Erro ao verificar TOTP para desativar:", verifyError);
        setDisableError("Código inválido. Confira no app autenticador e tente novamente.");
        return;
      }

      // 2) Agora pode desativar (unenroll exige aal2)
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: disableFactorId,
      } as any);

      if (unenrollError) {
        console.error("Erro ao desativar fator TOTP:", unenrollError);
        setDisableError("Não foi possível desativar o 2FA. Tente novamente.");
        return;
      }

      // Limpa fatores TOTP residuais, se houver
      try {
        const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
        if (!listError) {
          const anyFactors: any = factorsData;
          const totpFactors = (anyFactors?.totp ?? []) as Array<{ id: string }>;
          for (const factor of totpFactors) {
            if (factor.id !== disableFactorId) {
              try {
                await supabase.auth.mfa.unenroll({ factorId: factor.id } as any);
              } catch (cleanupErr) {
                console.error("Erro ao limpar fator TOTP residual:", cleanupErr);
              }
            }
          }
        }
      } catch (cleanupErrOuter) {
        console.error("Erro ao listar fatores para cleanup de TOTP:", cleanupErrOuter);
      }

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
        setDisableError("2FA foi desativado, mas houve erro ao atualizar suas preferências.");
        return;
      }

      setTwoFactorEnabled(false);
      setSuccessMessage("Autenticação de dois fatores desativada.");
      setShowDisableModal(false);
      resetDisableState();
    } catch (err) {
      console.error("Erro inesperado ao desativar 2FA:", err);
      setDisableError("Erro inesperado ao desativar o 2FA. Tente novamente.");
    } finally {
      setDisableVerifying(false);
    }
  };

  // --------- HANDLER DO SWITCH ---------
  const handleToggleTwoFactor = (value: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (value) {
      // Ativar: abre modal de setup
      resetTotpSetupState();
      setShowTotpModal(true);
      void startTotpEnrollment();
    } else {
      // Desativar: abre modal de confirmação c/ código
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
            onClick={handleChangePassword}
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

      {/* Modal para DESATIVAR 2FA (pede código) */}
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
                disabled={disableVerifying || twoFactorSaving || !disableFactorId}
              >
                {disableVerifying ? "Desativando..." : "Desativar 2FA"}
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
