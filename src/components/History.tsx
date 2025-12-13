import { useEffect, useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Sparkles, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { ReadingResultModal } from "./ReadingResultModal";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { OracleType } from "@/types/oracles";
import { HelloBar } from "./HelloBar";

type FilterKey = "all" | OracleType;

interface Reading {
  id: string;
  // ISO usado internamente para new Date(...)
  date: string;
  time: string;
  // label exibido no chip (ex: "Tarot", "Tarot Cigano", "Tarot + Lenormand")
  oracleLabel: string;
  // nome do spread (ex: "Cruz Celta", "Linha de 5", etc)
  spreadLabel: string;
  question: string;
  preview: string;
  fullReading: string;
  // para o filtro por tipo
  oracleTypes: OracleType[];
}

type ReadingRow = {
  id: string;
  question: string | null;
  response: string | null;
  oracle_types: string[] | null;
  oracles: any;
  created_at: string;
  completed_at: string | null;
  status: string;
  is_deleted?: boolean | null;
};

type CreateCheckoutSessionResponse = {
  ok: boolean;
  checkout_url: string;
  session_id: string;
};

const supabaseClient = supabase as any;

export function History() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [deleteReading, setDeleteReading] = useState<Reading | null>(null);
  const [filterOracle, setFilterOracle] = useState<FilterKey>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Controle de loading do botão de plano (Stripe)
  const [checkoutLoadingSlug, setCheckoutLoadingSlug] = useState<string | null>(null);

  // HelloBar (mensagem pós-Stripe)
  const [helloBarMessage, setHelloBarMessage] = useState("");
  const [helloBarType, setHelloBarType] = useState<"success" | "warning" | "error">("success");
  const [helloBarShow, setHelloBarShow] = useState(false);

  // Lê ?payment_status=success|error do retorno do Stripe e mostra HelloBar
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
    const fetchReadings = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        // 1) Usuário logado
        const {
          data: { user },
          error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError) {
          console.error("Erro ao buscar usuário logado:", userError);
          setErrorMessage("Erro ao identificar usuário logado.");
          setReadings([]);
          return;
        }

        if (!user) {
          setErrorMessage("Sessão expirada. Faça login novamente.");
          setReadings([]);
          return;
        }

        // 2) Busca leituras concluídas e não apagadas (soft delete)
        const { data, error } = await supabaseClient
          .from("readings")
          .select("id, question, response, oracle_types, oracles, created_at, completed_at, status, is_deleted")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .eq("is_deleted", false)
          .order("completed_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar leituras:", error);
          setErrorMessage("Erro ao carregar histórico de leituras.");
          setReadings([]);
          return;
        }

        const rows = (data || []) as ReadingRow[];

        const mapped: Reading[] = rows.map((row) => {
          const baseDate = row.completed_at || row.created_at;
          const dateObj = new Date(baseDate);

          const dateIso = dateObj.toISOString(); // ISO completo
          const time = dateObj.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          const oracleTypes = ((row.oracle_types || []) as string[]).filter(Boolean) as OracleType[];

          // label bonitinho do oráculo
          const oracleLabels = oracleTypes.map((t) => {
            if (t === "tarot") return "Tarot";
            if (t === "lenormand") return "Tarot Cigano";
            if (t === "cartomancy") return "Cartomancia Clássica";
            return t;
          });

          const oracleLabel = oracleLabels.length === 0 ? "Oráculo" : oracleLabels.join(" + ");

          // spread a partir do JSON de oracles
          let spreadLabel = "Leitura";
          try {
            const oracles = row.oracles;
            let spreads: any[] | null = null;

            if (Array.isArray(oracles)) {
              spreads = oracles;
            } else if (oracles && Array.isArray(oracles.spreads)) {
              spreads = oracles.spreads;
            }

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

          const question = row.question || "Pergunta não registrada";
          const fullReading = row.response || "";
          const basePreview = fullReading || "Não há resposta registrada para esta leitura.";

          const preview = basePreview.length > 140 ? basePreview.slice(0, 140).trimEnd() + "..." : basePreview;

          return {
            id: row.id,
            date: dateIso,
            time,
            oracleLabel,
            spreadLabel,
            question,
            preview,
            fullReading,
            oracleTypes,
          };
        });

        setReadings(mapped);
      } catch (err) {
        console.error("Erro inesperado ao buscar leituras:", err);
        setErrorMessage("Erro inesperado ao carregar histórico de leituras.");
        setReadings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReadings();
  }, []);

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

      // Redireciona para o Checkout da Stripe
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error("Erro inesperado ao iniciar o checkout:", err);
      alert("Ocorreu um erro inesperado ao iniciar o pagamento. Tente novamente.");
      setCheckoutLoadingSlug(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReading) return;

    try {
      setDeleteLoading(true);

      const { error } = await supabaseClient.from("readings").update({ is_deleted: true }).eq("id", deleteReading.id);

      if (error) {
        console.error("Erro ao marcar leitura como excluída:", error);
        setErrorMessage("Erro ao excluir leitura. Tente novamente.");
        return;
      }

      // Remove da lista local
      setReadings((prev) => prev.filter((r) => r.id !== deleteReading.id));
    } catch (err) {
      console.error("Erro inesperado ao excluir leitura:", err);
      setErrorMessage("Erro inesperado ao excluir leitura.");
    } finally {
      setDeleteLoading(false);
      setDeleteReading(null);
    }
  };

  const filteredReadings =
    filterOracle === "all" ? readings : readings.filter((r) => r.oracleTypes.includes(filterOracle));

  // Pagination logic
  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredReadings.length / itemsPerPage));
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? filteredReadings.length : startIndex + itemsPerPage;
  const paginatedReadings = filteredReadings.slice(startIndex, endIndex);

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
        message={helloBarMessage}
        type={helloBarType}
        show={helloBarShow}
        onClose={() => setHelloBarShow(false)}
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
            {/* Header */}
            <div className="text-center" style={{ marginBottom: "24px" }}>
              <h1 className="text-starlight-text" style={{ marginBottom: "16px" }}>
                Histórico de Leituras
              </h1>
              <p className="text-lg text-moonlight-text">Todas as suas consultas salvas em um só lugar</p>
            </div>

            {/* Filters */}
            <div
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              style={{ marginBottom: "24px" }}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterOracle("all")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "all"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: "8px 16px" }}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterOracle("tarot")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "tarot"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: "8px 16px" }}
                >
                  Tarot
                </button>
                <button
                  onClick={() => setFilterOracle("lenormand")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "lenormand"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: "8px 16px" }}
                >
                  Tarot Cigano
                </button>
                <button
                  onClick={() => setFilterOracle("cartomancy")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "cartomancy"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: "8px 16px" }}
                >
                  Cartomancia Clássica
                </button>
              </div>

              <div className="text-sm text-moonlight-text">
                {loading
                  ? "Carregando leituras..."
                  : `${filteredReadings.length} ${filteredReadings.length === 1 ? "leitura" : "leituras"}`}
              </div>
            </div>

            {/* Controls Bar */}
            {filteredReadings.length > 0 && (
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

                {/* Return Link */}
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

                {/* Pagination */}
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

            {/* Erro */}
            {errorMessage && (
              <div className="bg-blood-moon-error/10 border border-blood-moon-error/40 text-blood-moon-error px-4 py-3 rounded-xl text-sm mb-4">
                {errorMessage}
              </div>
            )}

            {/* Desktop: Table View */}
            {paginatedReadings.length > 0 && (
              <div
                className="hidden md:block bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-2xl overflow-hidden"
                style={{ padding: "24px", marginBottom: "32px" }}
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-obsidian-border">
                      <th className="text-left text-sm text-moonlight-text" style={{ padding: "16px" }}>
                        Data e Hora
                      </th>
                      <th className="text-left text-sm text-moonlight-text" style={{ padding: "16px" }}>
                        Oráculo
                      </th>
                      <th className="text-left text-sm text-moonlight-text" style={{ padding: "16px" }}>
                        Pergunta
                      </th>
                      <th className="text-right text-sm text-moonlight-text" style={{ padding: "16px" }}>
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReadings.map((reading) => (
                      <tr
                        key={reading.id}
                        className="border-b border-obsidian-border last:border-0 hover:bg-night-sky/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedReading(reading)}
                      >
                        <td style={{ padding: "16px" }}>
                          <div className="text-starlight-text">
                            {new Date(reading.date).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="text-sm text-moonlight-text/70">{reading.time}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div
                            className="inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30"
                            style={{ padding: "6px 12px", gap: "8px" }}
                          >
                            <Sparkles className="w-3 h-3 text-mystic-indigo" />
                            <span className="text-xs text-mystic-indigo">{reading.oracleLabel}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <p className="text-starlight-text line-clamp-1">{reading.question}</p>
                          <p className="text-moonlight-text text-sm line-clamp-1" style={{ marginTop: "4px" }}>
                            {reading.preview}
                          </p>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div className="flex items-center justify-end" style={{ gap: "8px" }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReading(reading);
                              }}
                              className="text-mystic-indigo hover:text-mystic-indigo-dark"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteReading(reading);
                              }}
                              className="text-blood-moon-error hover:text-blood-moon-error/80"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile: Card View */}
            <div className="md:hidden" style={{ marginBottom: "32px" }}>
              {paginatedReadings.map((reading, index) => (
                <div
                  key={reading.id}
                  className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-xl hover:border-mystic-indigo transition-all cursor-pointer"
                  onClick={() => setSelectedReading(reading)}
                  style={{
                    padding: "24px",
                    marginBottom: index < paginatedReadings.length - 1 ? "16px" : "0",
                  }}
                >
                  <div className="flex items-start justify-between" style={{ marginBottom: "12px" }}>
                    <div
                      className="inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30"
                      style={{ padding: "6px 12px", gap: "8px" }}
                    >
                      <Sparkles className="w-3 h-3 text-mystic-indigo" />
                      <span className="text-xs text-mystic-indigo">{reading.oracleLabel}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-moonlight-text">
                        {new Date(reading.date).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="text-xs text-moonlight-text/70">{reading.time}</div>
                    </div>
                  </div>

                  <p className="text-starlight-text line-clamp-2" style={{ marginBottom: "8px" }}>
                    {reading.question}
                  </p>
                  <p className="text-moonlight-text text-sm line-clamp-2" style={{ marginBottom: "16px" }}>
                    {reading.preview}
                  </p>

                  <div className="flex" style={{ gap: "8px" }}>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReading(reading);
                      }}
                      className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                    >
                      <Eye className="w-4 h-4" style={{ marginRight: "8px" }} />
                      Ver leitura
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteReading(reading);
                      }}
                      className="border-blood-moon-error text-blood-moon-error hover:bg-blood-moon-error hover:text-starlight-text"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!loading && filteredReadings.length === 0 && (
              <div
                className="text-center"
                style={{
                  paddingTop: "48px",
                  paddingBottom: "48px",
                  marginBottom: "48px",
                }}
              >
                <Sparkles className="w-12 h-12 text-moonlight-text mx-auto" style={{ marginBottom: "16px" }} />
                <h3 className="text-starlight-text" style={{ marginBottom: "8px" }}>
                  Nenhuma leitura encontrada
                </h3>
                <p className="text-moonlight-text" style={{ marginBottom: "24px" }}>
                  {filterOracle === "all"
                    ? "Você ainda não fez nenhuma consulta"
                    : "Você não tem leituras desse tipo de oráculo"}
                </p>
                <Button className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text" asChild>
                  <Link to="/dashboard">Fazer uma consulta</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <TarotOnlineFooter />

      {/* Payment Modal - igual HomeLogada */}
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
                    <button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto h-11 rounded-full text-sm font-medium transition-colors"
                      onClick={() => handlePlanCheckout("credits_10")}
                      disabled={checkoutLoadingSlug !== null}
                    >
                      {checkoutLoadingSlug === "credits_10" ? "Redirecionando..." : "Escolher"}
                    </button>
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
                    <button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto h-11 rounded-full text-sm font-medium transition-colors"
                      onClick={() => handlePlanCheckout("credits_25")}
                      disabled={checkoutLoadingSlug !== null}
                    >
                      {checkoutLoadingSlug === "credits_25" ? "Redirecionando..." : "Escolher"}
                    </button>
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
                    <button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto h-11 rounded-full text-sm font-medium transition-colors"
                      onClick={() => handlePlanCheckout("credits_60")}
                      disabled={checkoutLoadingSlug !== null}
                    >
                      {checkoutLoadingSlug === "credits_60" ? "Redirecionando..." : "Escolher"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reading Result Modal */}
      {selectedReading && (
        <ReadingResultModal
          isOpen={!!selectedReading}
          onClose={() => setSelectedReading(null)}
          spread={selectedReading.spreadLabel}
          question={selectedReading.question}
          selectedCards={[]}
          response={selectedReading.fullReading}
          isLoading={false}
          currentCredits={null}
          onOpenPurchaseCredits={() => {
            window.location.href = "/dashboard";
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteReading && (
        <>
          <div className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md" onClick={() => setDeleteReading(null)} />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: "16px" }}
          >
            <div className="relative pointer-events-auto">
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => setDeleteReading(null)}
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
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-md"
                style={{ padding: "32px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: "24px" }}>
                  <h2 className="text-starlight-text">Confirmar Exclusão</h2>
                </div>

                <p className="text-moonlight-text" style={{ marginBottom: "32px" }}>
                  Esta ação remove a leitura do seu histórico. Ela permanece registrada internamente para fins de
                  auditoria. Deseja continuar?
                </p>

                <div className="flex" style={{ gap: "12px" }}>
                  <Button
                    className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                    onClick={() => setDeleteReading(null)}
                    disabled={deleteLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-blood-moon-error text-blood-moon-error hover:bg-blood-moon-error hover:text-starlight-text"
                    onClick={handleDeleteConfirm}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
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
