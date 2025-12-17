import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReadingResultModal } from "./ReadingResultModal";
import { HelloBar } from "./HelloBar";

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
      <footer
        className="relative z-10 border-t border-obsidian-border bg-midnight-surface/80 backdrop-blur-sm"
        style={{ marginTop: "80px", padding: "48px 24px" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            {/* Logo e descrição */}
            <div className="flex-1">
              <h3 className="text-starlight-text" style={{ marginBottom: "8px" }}>
                Tarot Online
              </h3>
              <p className="text-sm text-moonlight-text">
                Tarot, tarot cigano e cartomancia clássica para guiar sua jornada
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              <div>
                <h4 className="text-sm text-starlight-text" style={{ marginBottom: "12px" }}>
                  Navegação
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/historico"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Histórico de leituras
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/transacoes"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Histórico de transações
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm text-starlight-text" style={{ marginBottom: "12px" }}>
                  Informações
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
                      Termos de uso
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
                      Política de privacidade
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
                      Suporte
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div
            className="border-t border-obsidian-border text-center"
            style={{ marginTop: "32px", paddingTop: "24px" }}
          >
            <p className="text-sm text-moonlight-text/50">© 2025 Tarot Online. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
