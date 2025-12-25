import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReadingResultModal } from "./ReadingResultModal";
import { HelloBar } from "./HelloBar";
import { Modal } from "./Modal";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Sparkles } from "lucide-react";

type CreateCheckoutSessionResponse = {
  ok: boolean;
  checkout_url: string;
  session_id: string;
};

interface Transaction {
  id: string;
  date: string; // ISO para exibição (data)
  time: string;
  amount: string;
  eventLabel: string;
  isUsage: boolean;
  creditsChangeAbs?: number;
  completedAtRaw?: string; // created_at original da credit_transactions (para vincular à leitura)
}

type ReadingRow = {
  question: string | null;
  response: string | null;
  oracles: any;
  total_credits_cost: number | null;
  created_at: string;
  completed_at: string | null;
};

export function TransactionHistory() {
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutLoadingSlug, setCheckoutLoadingSlug] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [helloBarMessage, setHelloBarMessage] = useState("");
  const [helloBarType, setHelloBarType] = useState<"success" | "warning" | "error">("success");
  const [helloBarShow, setHelloBarShow] = useState(false);

  // Modal de leitura vinculada ao uso de créditos
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [readingModalLoading, setReadingModalLoading] = useState(false);
  const [readingModalQuestion, setReadingModalQuestion] = useState("");
  const [readingModalSpread, setReadingModalSpread] = useState("");
  const [readingModalResponse, setReadingModalResponse] = useState("");

  // Pagination logic
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(transactions.length / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? transactions.length : startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

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
        console.error("Erro ao criar sessão de checkout:", error);
        setCheckoutLoadingSlug(null);
        setHelloBarType("error");
        setHelloBarMessage("Não foi possível iniciar o pagamento. Tente novamente.");
        setHelloBarShow(true);
        return;
      }

      if (!data?.ok || !data.checkout_url) {
        console.error("Resposta inesperada de create-checkout-session:", data);
        setCheckoutLoadingSlug(null);
        setHelloBarType("error");
        setHelloBarMessage("Não foi possível iniciar o pagamento. Tente novamente.");
        setHelloBarShow(true);
        return;
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      console.error("Erro inesperado ao iniciar checkout:", err);
      setCheckoutLoadingSlug(null);
      setHelloBarType("error");
      setHelloBarMessage("Erro inesperado ao iniciar o pagamento.");
      setHelloBarShow(true);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // 1) Pega usuário logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erro ao buscar usuário logado:", userError);
        setErrorMessage("Erro ao identificar usuário logado.");
        setTransactions([]);
        return;
      }

      if (!user) {
        setErrorMessage("Sessão expirada. Faça login novamente.");
        setTransactions([]);
        return;
      }

      // 2) Busca histórico em credit_transactions
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, credits_change, amount_cents, currency, description, created_at, tx_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar transações:", error);
        setErrorMessage("Erro ao carregar histórico de créditos.");
        setTransactions([]);
        return;
      }

      const mapped: Transaction[] = (data || []).map((row: any) => {
        const d = new Date(row.created_at);

        const dateIso = d.toISOString();
        const time = d.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const description: string = row.description ?? "";
        const txType: string = row.tx_type ?? "";
        const isUsage = description === "Uso de créditos em leitura";
        const creditsChangeAbs = row.credits_change != null ? Math.abs(Number(row.credits_change)) : undefined;

        // --- COLUNA VALOR ---
        let amount: string;

        if (row.amount_cents == null) {
          // Sem valor financeiro:
          // - uso de créditos em leitura -> "–"
          // - bônus etc -> "Grátis"
          if (isUsage) {
            amount = "–";
          } else {
            amount = "Grátis";
          }
        } else {
          const cents = Number(row.amount_cents);
          const value = cents / 100;
          const currencyCode = row.currency || "BRL";

          amount = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
        }

        // --- COLUNA EVENTO ---
        let eventLabel = description || "Movimentação de créditos";

        // Se for compra de pacote via Stripe, tentar mapear pelo "credits_XX"
        if (txType === "purchase" && description) {
          const match = description.match(/credits_(\d+)/);
          if (match) {
            const creditsAmount = Number(match[1]);

            if (creditsAmount === 10) {
              eventLabel = "Pacote Iniciante (10 créditos)";
            } else if (creditsAmount === 25) {
              eventLabel = "Pacote Explorador (25 créditos)";
            } else if (creditsAmount === 60) {
              eventLabel = "Pacote Místico (60 créditos)";
            } else {
              eventLabel = `Pacote de créditos (${creditsAmount})`;
            }
          }
        }

        // Pequeno ajuste pra deixar o texto de boas-vindas mais amigável
        if (txType === "bonus" && description === "Boas-vindas (3 créditos)") {
          eventLabel = "Bônus de boas-vindas (3 créditos)";
        }

        return {
          id: row.id,
          date: dateIso,
          time,
          amount,
          eventLabel,
          isUsage,
          creditsChangeAbs,
          completedAtRaw: row.created_at as string,
        };
      });

      setTransactions(mapped);
    } catch (err) {
      console.error("Erro inesperado ao buscar transações:", err);
      setErrorMessage("Erro inesperado ao carregar histórico.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReadingFromTransaction = async (transaction: Transaction) => {
    if (!transaction.isUsage || !transaction.creditsChangeAbs) return;

    try {
      setShowReadingModal(true);
      setReadingModalLoading(true);
      setReadingModalQuestion("");
      setReadingModalSpread("");
      setReadingModalResponse("");

      // completed_at da leitura == created_at da transação (mesmo now() na mesma transação)
      const completedAtValue = transaction.completedAtRaw ?? transaction.date;

      const { data, error } = await supabase
        .from("readings")
        .select("question, response, oracles, total_credits_cost, created_at, completed_at")
        .eq("total_credits_cost", transaction.creditsChangeAbs)
        .eq("completed_at", completedAtValue)
        .order("completed_at", { ascending: true })
        .limit(1);

      if (error) {
        console.error("Erro ao buscar leitura vinculada:", error);
        setReadingModalResponse("Não foi possível carregar os detalhes dessa leitura. Tente novamente mais tarde.");
        return;
      }

      const rows = (data as ReadingRow[] | null) ?? [];
      const reading = rows[0] ?? null;

      if (!reading) {
        setReadingModalResponse("Não foi possível localizar a leitura vinculada a este uso de créditos.");
        return;
      }

      const question: string = reading.question ?? "";
      const response: string = reading.response ?? "";

      // Tentar extrair o nome do método/spread do JSON oracles
      let spreadLabel = "Leitura anterior";
      const oracles = reading.oracles as any;

      try {
        const spreads = Array.isArray(oracles)
          ? oracles
          : oracles?.spreads && Array.isArray(oracles.spreads)
            ? oracles.spreads
            : null;

        if (spreads && spreads.length > 0) {
          const first = spreads[0];
          if (first?.spread_name) {
            spreadLabel = String(first.spread_name);
          } else if (first?.spread_code) {
            spreadLabel = String(first.spread_code);
          }
        }
      } catch (e) {
        console.warn("Não foi possível interpretar spreads da leitura:", e);
      }

      setReadingModalQuestion(question);
      setReadingModalSpread(spreadLabel);
      setReadingModalResponse(response || "Não há resposta registrada para esta leitura.");
    } catch (err) {
      console.error("Erro inesperado ao carregar leitura vinculada:", err);
      setReadingModalResponse("Ocorreu um erro ao carregar os detalhes desta leitura.");
    } finally {
      setReadingModalLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment_status");
    if (!status) return;

    if (status === "success") {
      setHelloBarType("success");
      setHelloBarMessage("Pacote adquirido com sucesso!");
      setHelloBarShow(true);
    } else if (status === "error") {
      setHelloBarType("error");
      setHelloBarMessage("Erro no pagamento, tente novamente.");
      setHelloBarShow(true);
    }

    // Remove o parâmetro da URL
    const url = new URL(window.location.href);
    url.searchParams.delete("payment_status");
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-night-sky text-moonlight-text relative">
      {/* Background Gradients - Fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
      </div>

      <Header isLoggedIn={true} onBuyCredits={() => setShowPaymentModal(true)} />

      <HelloBar
        show={helloBarShow}
        onClose={() => setHelloBarShow(false)}
        type={helloBarType}
        message={helloBarMessage}
      />

      {/* Main Content */}
      <main className="relative z-10" style={{ marginTop: "calc(80px + 48px)" }}>
        <style>{`
          .history-page-wrapper {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding-left: 24px;
            padding-right: 24px;
          }
          
          @media (min-width: 1440px) {
            .history-page-wrapper {
              max-width: 1200px;
            }
          }

          .history-content-wrapper {
            max-width: 900px;
            margin: 0 auto;
          }

          .return-link-full {
            display: inline;
          }

          .return-link-short {
            display: none;
          }

          @media (max-width: 380px) {
            .return-link-full {
              display: none;
            }
            .return-link-short {
              display: inline;
            }
          }
        `}</style>

        <div className="history-page-wrapper">
          <div className="history-content-wrapper">
            {/* Header - Fixed */}
            <div className="text-center" style={{ marginBottom: "24px" }}>
              <h1 className="text-starlight-text" style={{ marginBottom: "16px" }}>
                Histórico de Transações
              </h1>
              <p className="text-lg text-moonlight-text">Todas as suas movimentações de créditos</p>
            </div>

            {/* Info bar */}
            <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
              <div className="text-sm text-moonlight-text">
                {loading
                  ? "Carregando transações..."
                  : `${transactions.length} ${transactions.length === 1 ? "transação" : "transações"}`}
              </div>

              {errorMessage && <div className="text-xs text-blood-moon-error ml-4">{errorMessage}</div>}
            </div>

            {/* Controls Bar - Fixed (Dropdown + Link + Pagination) */}
            {transactions.length > 0 && (
              <div
                className="flex flex-row items-center justify-between flex-nowrap"
                style={{ marginBottom: "24px", gap: "8px" }}
              >
                {/* Dropdown */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: "120px" }}>
                  <span className="text-sm text-moonlight-text hidden sm:inline">Exibir:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="bg-midnight-surface border border-obsidian-border rounded-lg text-starlight-text focus:outline-none focus:border-mystic-indigo text-sm"
                    style={{ padding: "8px 12px" }}
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>Todos</option>
                  </select>
                </div>

                {/* Return Link - Center */}
                <div className="flex-1 flex items-center justify-center min-w-0">
                  <Link
                    to="/dashboard"
                    className="text-mystic-indigo hover:text-mystic-indigo-dark transition-colors text-sm sm:text-base whitespace-nowrap return-link-full"
                  >
                    ← Retornar à home
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-mystic-indigo hover:text-mystic-indigo-dark transition-colors text-sm sm:text-base whitespace-nowrap return-link-short"
                  >
                    ← Home
                  </Link>
                </div>

                {/* Pagination - Right */}
                <div
                  className="flex items-center flex-shrink-0"
                  style={{
                    gap: "8px",
                    minWidth: "120px",
                    justifyContent: "flex-end",
                  }}
                >
                  {itemsPerPage !== -1 ? (
                    totalPages > 1 ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="border-obsidian-border"
                          style={{ padding: "8px" }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs sm:text-sm text-moonlight-text whitespace-nowrap">
                          <span className="hidden sm:inline">
                            Página {currentPage} de {totalPages}
                          </span>
                          <span className="sm:hidden">
                            {currentPage}/{totalPages}
                          </span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="border-obsidian-border"
                          style={{ padding: "8px" }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm text-moonlight-text whitespace-nowrap">
                        <span className="hidden sm:inline">Página 1 de 1</span>
                        <span className="sm:hidden">1/1</span>
                      </span>
                    )
                  ) : null}
                </div>
              </div>
            )}

            {/* Desktop: Table View */}
            <div
              className="hidden md:block bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-2xl overflow-hidden"
              style={{ padding: "24px", marginBottom: "32px" }}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-obsidian-border">
                    <th className="text-left text-sm text-moonlight-text" style={{ padding: "16px" }}>
                      Data
                    </th>
                    <th className="text-left text-sm text-moonlight-text" style={{ padding: "16px" }}>
                      Horário
                    </th>
                    <th className="text-left text-sm text-moonlight-text" style={{ padding: "16px" }}>
                      Valor
                    </th>
                    <th className="text-left text-sm text-moonlight-text" style={{ padding: "16px" }}>
                      Evento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-obsidian-border last:border-0 hover:bg-night-sky/50 transition-colors"
                    >
                      <td style={{ padding: "16px" }}>
                        <div className="text-starlight-text">
                          {new Date(transaction.date).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div className="text-moonlight-text">{transaction.time}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div className="text-starlight-text">{transaction.amount}</div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div
                          className={`inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30 ${
                            transaction.isUsage ? "cursor-pointer hover:bg-mystic-indigo/20" : ""
                          }`}
                          style={{ padding: "6px 12px", gap: "8px" }}
                          onClick={() => transaction.isUsage && handleOpenReadingFromTransaction(transaction)}
                        >
                          <CreditCard className="w-3 h-3 text-mystic-indigo" />
                          <span className="text-xs text-mystic-indigo">{transaction.eventLabel}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card View */}
            <div className="md:hidden" style={{ marginBottom: "32px" }}>
              {paginatedTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-xl"
                  style={{
                    padding: "20px",
                    marginBottom: index < paginatedTransactions.length - 1 ? "16px" : "0",
                  }}
                >
                  <div className="flex items-start justify-between" style={{ marginBottom: "12px" }}>
                    <div
                      className={`inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30 ${
                        transaction.isUsage ? "cursor-pointer hover:bg-mystic-indigo/20" : ""
                      }`}
                      style={{ padding: "6px 12px", gap: "8px" }}
                      onClick={() => transaction.isUsage && handleOpenReadingFromTransaction(transaction)}
                    >
                      <CreditCard className="w-3 h-3 text-mystic-indigo" />
                      <span className="text-xs text-mystic-indigo">{transaction.eventLabel}</span>
                    </div>
                    <div className="text-starlight-text">{transaction.amount}</div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-moonlight-text">{new Date(transaction.date).toLocaleDateString("pt-BR")}</div>
                    <div className="text-moonlight-text/70">{transaction.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {transactions.length === 0 && (
              <div
                className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-2xl text-center"
                style={{ padding: "48px 24px" }}
              >
                <CreditCard className="w-12 h-12 text-moonlight-text/50 mx-auto" style={{ marginBottom: "16px" }} />
                <h3 className="text-starlight-text" style={{ marginBottom: "8px" }}>
                  Nenhuma transação encontrada
                </h3>
                <p className="text-moonlight-text text-sm">Suas movimentações de créditos aparecerão aqui</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de leitura vinculada a "Uso de créditos em leitura" */}
      <ReadingResultModal
        isOpen={showReadingModal}
        onClose={() => setShowReadingModal(false)}
        spread={readingModalSpread}
        question={readingModalQuestion}
        selectedCards={[]}
        response={readingModalResponse}
        isLoading={readingModalLoading}
        currentCredits={null}
        onOpenPurchaseCredits={() => setShowPaymentModal(true)}
      />

      {/* Modal de compra de créditos */}
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
                    <img
                      src="https://jhlosmgvlvjaemtgrhka.supabase.co/storage/v1/object/public/images/mdo_logo.png"
                      alt="Mesa dos Oráculos"
                      className="w-8 h-8 object-contain"
                    />
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
