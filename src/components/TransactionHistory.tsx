import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ReadingResultModal } from "./ReadingResultModal";

interface Transaction {
  id: string;
  date: string; // ISO de created_at
  time: string;
  amount: string;
  eventLabel: string;
  isUsage: boolean;
  creditsChangeAbs?: number;
}

type ReadingRow = {
  question: string | null;
  response: string | null;
  oracles: any;
  total_credits_cost: number | null;
  created_at: string;
};

export function TransactionHistory() {
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      // Procurar a leitura do mesmo usuário que:
      // - tenha total_credits_cost = |credits_change|
      // - tenha created_at >= created_at da transação
      // - primeira em ordem crescente (mais próxima temporalmente desse uso)
      const { data, error } = await supabase
        .from("readings")
        .select<ReadingRow[]>("question, response, oracles, total_credits_cost, created_at")
        .eq("total_credits_cost", transaction.creditsChangeAbs)
        .gte("created_at", transaction.date)
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) {
        console.error("Erro ao buscar leitura vinculada:", error);
        setReadingModalResponse("Não foi possível carregar os detalhes dessa leitura. Tente novamente mais tarde.");
        return;
      }

      const reading = data && data.length > 0 ? data[0] : null;

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
        onOpenPurchaseCredits={() => {
          // Por enquanto, só manda o usuário pra Home,
          // onde ele pode abrir o fluxo de compra normalmente.
          window.location.href = "/dashboard";
        }}
      />

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
