import { useState, useRef } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Shield, CreditCard, Check, Sparkles, Settings } from "lucide-react";

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

  // Função para scroll suave
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const yOffset = -100; // Offset para compensar o header fixo
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-night-sky">
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
                  setKeepContext={setKeepContext}
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
                setKeepContext={setKeepContext}
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
  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Dados da Conta</h3>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-moonlight-text mb-2 block">
            Nome completo
          </Label>
          <Input
            id="name"
            defaultValue="João Silva"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-moonlight-text mb-2 block">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            defaultValue="joao@example.com"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-moonlight-text mb-2 block">
            Telefone
          </Label>
          <Input
            id="phone"
            defaultValue="+55 11 99999-9999"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div className="pt-4">
          <Button
            className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
            style={{ paddingLeft: "32px", paddingRight: "32px" }}
          >
            Salvar alterações
          </Button>
        </div>
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
  const handleApplyLimit = () => {
    const amount = parseInt(limitAmount);
    if (!limitAmount || amount < 1 || amount > 999) {
      alert("Por favor, insira um valor entre 1 e 999");
      return;
    }

    setHasActiveLimit(true);
    setActiveLimitAmount(limitAmount);
    setActiveLimitPeriod(limitPeriod);
    setLimitAmount("");
    setLimitPeriod("dia");
    alert(`Limite ativado: ${limitAmount} créditos por ${limitPeriod}`);
  };

  const handleRemoveLimit = () => {
    setHasActiveLimit(false);
    setActiveLimitAmount("");
    setActiveLimitPeriod("dia");
    alert("Limite desativado com sucesso!");
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
  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Segurança</h3>

      <div className="space-y-6">
        <div>
          <Label htmlFor="current-password" className="text-moonlight-text mb-2 block">
            Senha atual
          </Label>
          <Input
            id="current-password"
            type="password"
            placeholder="••••••••"
            className="bg-night-sky border-obsidian-border text-starlight-text"
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
          />
        </div>

        <div className="pt-4 pb-6 border-b border-obsidian-border">
          <Button
            className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
            style={{ paddingLeft: "32px", paddingRight: "32px" }}
          >
            Alterar senha
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-starlight-text mb-1">Autenticação de dois fatores</h4>
            <p className="text-moonlight-text text-sm">Adicione uma camada extra de segurança à sua conta</p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
            className="data-[state=checked]:bg-mystic-indigo"
          />
        </div>
      </div>
    </div>
  );
}

function BillingSection({ onPurchaseClick }: { onPurchaseClick: () => void }) {
  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Pagamentos e Créditos</h3>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-mystic-indigo to-mystic-indigo-dark rounded-xl p-6">
          <p className="text-starlight-text/80 mb-2">Saldo Atual</p>
          <p className="text-starlight-text mb-1">12</p>
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
          <div className="space-y-3">
            {[
              { date: "15/11/2025", credits: 10, amount: "R$ 25,00" },
              { date: "01/11/2025", credits: 10, amount: "R$ 25,00" },
            ].map((purchase, index) => (
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
        </div>
      </div>
    </div>
  );
}
