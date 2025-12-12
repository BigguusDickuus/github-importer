import React, { useEffect, useState } from "react";
import { Header } from "./Header";
import { Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { ReadingResultModal } from "./ReadingResultModal";
import { Link } from "react-router-dom";
import { HelloBar } from "./HelloBar";
import { supabase } from "@/integrations/supabase/client";

type CreateCheckoutSessionResponse = {
  ok: boolean;
  checkout_url: string;
  session_id: string;
};

interface Reading {
  id: string;
  date: string;
  time: string;
  oracle: string;
  spread: string;
  question: string;
  preview: string;
  fullReading: string;
  cards: number[];
}

type OracleFilter = "all" | "tarot" | "lenormand" | "cartomancy";

export function History() {
  const [selectedOracle, setSelectedOracle] = useState<OracleFilter>("all");
  const [selectedSpread, setSelectedSpread] = useState<string>("all");
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [viewingReading, setViewingReading] = useState<Reading | null>(null);
  const [deletingReading, setDeletingReading] = useState<Reading | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checkoutLoadingSlug, setCheckoutLoadingSlug] = useState<string | null>(null);

  const [helloBarMessage, setHelloBarMessage] = useState("");
  const [helloBarType, setHelloBarType] = useState<"success" | "warning" | "error">("success");
  const [helloBarShow, setHelloBarShow] = useState(false);

  // Detecta retorno do Stripe (?payment_status=success|error) e mostra HelloBar
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

    const url = new URL(window.location.href);
    url.searchParams.delete("payment_status");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const readings: Reading[] = [
    {
      id: "1",
      date: "2025-11-18",
      time: "14:32",
      oracle: "Tarot",
      spread: "tarot-cruz-celta",
      question: "Quais são as perspectivas para minha carreira nos próximos meses?",
      preview: "A leitura indica um momento de decisões importantes e novas oportunidades...",
      fullReading:
        "Resumo detalhado: A Cruz Celta revela um período de transição na carreira, onde desafios atuais (posição 1 e 2) são contrabalançados por potenciais oportunidades futuras (posição 6 e 10). O Louco sugere novos começos, enquanto o Mago indica que você possui todas as ferramentas necessárias para o sucesso...",
      cards: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    {
      id: "2",
      date: "2025-11-17",
      time: "10:45",
      oracle: "Tarot",
      spread: "tarot-tres-cartas",
      question: "O que devo esperar do meu relacionamento atual?",
      preview: "A leitura mostra harmonia e compreensão mútua...",
      fullReading:
        "Passado-Presente-Futuro: A leitura revela uma base sólida no passado, harmonia no presente e crescimento conjunto no futuro. As cartas indicam compreensão mútua e desenvolvimento emocional...",
      cards: [5, 12, 18],
    },
    {
      id: "3",
      date: "2025-11-15",
      time: "16:15",
      oracle: "Tarot Cigano",
      spread: "lenormand",
      question: "Como posso melhorar minhas finanças?",
      preview: "As cartas apontam para disciplina e planejamento...",
      fullReading:
        "Combinação Lenormand: As cartas sugerem que a disciplina e a organização serão fundamentais para melhorar sua situação financeira. A presença da carta da Árvore indica crescimento, enquanto o Peixe reforça prosperidade futura, e o Livro sugere aprendizado...",
      cards: [23, 14, 26],
    },
    {
      id: "4",
      date: "2025-11-14",
      time: "09:20",
      oracle: "Cartomancia",
      spread: "cartomancia-sete-cartas",
      question: "O que posso esperar nos próximos 30 dias?",
      preview: "O baralho revela uma sequência de eventos importantes...",
      fullReading:
        "Resumo de 30 dias: Nas primeiras semanas, é possível que surjam desafios de comunicação e pequenos conflitos. Porém, conforme o tempo avança, há indícios de boas notícias, convites e até oportunidades inesperadas. A presença de figuras de corte mostra pessoas importantes colaborando com você...",
      cards: [2, 11, 20, 25, 31, 36, 40],
    },
  ];

  const filteredReadings = readings.filter((reading) => {
    if (selectedOracle !== "all" && reading.oracle.toLowerCase() !== selectedOracle) {
      return false;
    }

    if (selectedSpread !== "all" && reading.spread !== selectedSpread) {
      return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredReadings.length / itemsPerPage);
  const paginatedReadings = filteredReadings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleViewReading = (reading: Reading) => {
    setViewingReading(reading);
  };

  const handleDeleteReading = (reading: Reading) => {
    setDeletingReading(reading);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingReading(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingReading(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#020617] to-[#000000] text-starlight-text">
      {/* Fundo decorativo semelhante à HomeLogada */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 right-[-100px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
        <div className="absolute inset-x-0 top-40 mx-auto h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.10),_transparent_60%)] blur-3xl" />
        <div className="absolute -bottom-32 left-[-120px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.12),_transparent_55%)]" />
      </div>

      <Header isLoggedIn={true} onBuyCredits={() => setShowPaymentModal(true)} />

      <HelloBar
        message={helloBarMessage}
        type={helloBarType}
        show={helloBarShow}
        onClose={() => setHelloBarShow(false)}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-starlight-text mb-3">
              Histórico de Leituras
            </h1>
            <p className="text-moonlight-text text-sm sm:text-base max-w-xl leading-relaxed">
              Revise suas consultas anteriores e acompanhe como os oráculos têm orientado o seu caminho.
            </p>
          </div>

          {/* Link de voltar para dashboard */}
          <div className="flex sm:flex-col items-start sm:items-end gap-3">
            <Link
              to="/dashboard"
              className="text-xs sm:text-sm text-mystic-indigo hover:text-mystic-indigo-light inline-flex items-center gap-2"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-mystic-indigo/40 bg-mystic-indigo/10">
                <ChevronLeft className="h-4 w-4" />
              </span>
              Voltar para a página inicial
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          {/* Oracle Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedOracle("all")}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                selectedOracle === "all"
                  ? "bg-mystic-indigo text-starlight-text border-mystic-indigo"
                  : "bg-night-sky/40 text-moonlight-text border-obsidian-border hover:border-mystic-indigo/70 hover:text-starlight-text"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedOracle("tarot")}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                selectedOracle === "tarot"
                  ? "bg-mystic-indigo text-starlight-text border-mystic-indigo"
                  : "bg-night-sky/40 text-moonlight-text border-obsidian-border hover:border-mystic-indigo/70 hover:text-starlight-text"
              }`}
            >
              Tarot
            </button>
            <button
              onClick={() => setSelectedOracle("lenormand")}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                selectedOracle === "lenormand"
                  ? "bg-mystic-indigo text-starlight-text border-mystic-indigo"
                  : "bg-night-sky/40 text-moonlight-text border-obsidian-border hover:border-mystic-indigo/70 hover:text-starlight-text"
              }`}
            >
              Lenormand
            </button>
            <button
              onClick={() => setSelectedOracle("cartomancy")}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors ${
                selectedOracle === "cartomancy"
                  ? "bg-mystic-indigo text-starlight-text border-mystic-indigo"
                  : "bg-night-sky/40 text-moonlight-text border-obsidian-border hover:border-mystic-indigo/70 hover:text-starlight-text"
              }`}
            >
              Cartomancia
            </button>
          </div>

          {/* Spread Filter */}
          <div className="flex items-center gap-3">
            <label className="text-xs sm:text-sm text-moonlight-text whitespace-nowrap">Tipo de jogo:</label>
            <select
              value={selectedSpread}
              onChange={(e) => setSelectedSpread(e.target.value)}
              className="bg-night-sky/70 border border-obsidian-border rounded-full text-xs sm:text-sm px-3 py-1.5 text-starlight-text focus:border-mystic-indigo focus:outline-none"
            >
              <option value="all">Todos os jogos</option>
              <option value="tarot-cruz-celta">Tarot — Cruz Celta</option>
              <option value="tarot-tres-cartas">Tarot — Três Cartas</option>
              <option value="lenormand">Tarot Cigano / Lenormand</option>
              <option value="cartomancia-sete-cartas">Cartomancia — Sete Cartas</option>
            </select>
          </div>
        </div>

        {/* Table-like list */}
        <div className="border border-obsidian-border/80 rounded-2xl bg-night-sky/60 overflow-hidden shadow-lg">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[120px,90px,120px,1fr,70px,70px] gap-4 px-4 py-3 border-b border-obsidian-border/80 bg-night-sky/90 text-xs text-moonlight-text uppercase tracking-wide">
            <div>Data</div>
            <div>Hora</div>
            <div>Oráculo</div>
            <div>Pergunta</div>
            <div className="text-center">Ver</div>
            <div className="text-center">Apagar</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-obsidian-border/60">
            {paginatedReadings.length === 0 ? (
              <div className="px-4 py-8 text-center text-moonlight-text text-sm">
                Nenhuma leitura encontrada para os filtros selecionados.
              </div>
            ) : (
              paginatedReadings.map((reading) => (
                <div
                  key={reading.id}
                  className={`group px-4 py-3 grid grid-cols-1 sm:grid-cols-[120px,90px,120px,1fr,70px,70px] gap-2 sm:gap-4 items-center text-xs sm:text-sm transition-colors ${
                    hoveredRowId === reading.id ? "bg-night-sky/80" : "bg-night-sky/40"
                  }`}
                  onMouseEnter={() => setHoveredRowId(reading.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-obsidian-border/70 bg-midnight-surface text-[10px] text-moonlight-text/80">
                      {reading.date.split("-").slice(1).reverse().join("/")}
                    </span>
                    <span className="hidden sm:inline text-moonlight-text">
                      {reading.date.split("-").reverse().join("/")}
                    </span>
                  </div>

                  <div className="text-moonlight-text/90">
                    <span className="inline-flex rounded-full bg-midnight-surface/80 px-2 py-1 text-[11px] border border-obsidian-border/80">
                      {reading.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[11px] border ${
                        reading.oracle.toLowerCase().includes("tarot")
                          ? "bg-purple-500/10 border-purple-500/60 text-purple-200"
                          : reading.oracle.toLowerCase().includes("lenormand")
                            ? "bg-cyan-500/10 border-cyan-500/60 text-cyan-200"
                            : "bg-emerald-500/10 border-emerald-500/60 text-emerald-200"
                      }`}
                    >
                      {reading.oracle}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-starlight-text text-[13px] sm:text-sm line-clamp-1">{reading.question}</p>
                    <p className="text-moonlight-text/70 text-[12px] line-clamp-1">{reading.preview}</p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => handleViewReading(reading)}
                      className="inline-flex items-center justify-center rounded-full border border-emerald-500/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition-colors h-8 w-8"
                      aria-label="Ver leitura"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => handleDeleteReading(reading)}
                      className="inline-flex items-center justify-center rounded-full border border-rose-500/60 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition-colors h-8 w-8"
                      aria-label="Apagar leitura"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {filteredReadings.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-moonlight-text">
            <div className="flex items-center gap-2">
              <span>Itens por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="bg-night-sky/70 border border-obsidian-border rounded-full px-2 py-1 text-starlight-text focus:outline-none focus:border-mystic-indigo"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Página{" "}
                <span className="text-starlight-text">
                  {currentPage} / {totalPages || 1}
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border bg-night-sky/70 transition-colors ${
                    currentPage === 1
                      ? "border-obsidian-border/60 text-moonlight-text/40 cursor-not-allowed"
                      : "border-obsidian-border text-moonlight-text hover:border-mystic-indigo hover:text-starlight-text"
                  }`}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages || 1))}
                  disabled={currentPage === (totalPages || 1)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border bg-night-sky/70 transition-colors ${
                    currentPage === (totalPages || 1)
                      ? "border-obsidian-border/60 text-moonlight-text/40 cursor-not-allowed"
                      : "border-obsidian-border text-moonlight-text hover:border-mystic-indigo hover:text-starlight-text"
                  }`}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de confirmação de exclusão */}
      {showDeleteConfirm && deletingReading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-midnight-surface border border-obsidian-border rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-starlight-text mb-3">Apagar leitura</h2>
            <p className="text-sm text-moonlight-text mb-4">
              Tem certeza de que deseja apagar esta leitura? Esta ação não pode ser desfeita.
            </p>
            <div className="bg-night-sky/60 border border-obsidian-border rounded-xl p-3 mb-5">
              <p className="text-xs text-moonlight-text/80 mb-1">
                <span className="text-starlight-text/90">Pergunta:</span> {deletingReading.question}
              </p>
              <p className="text-xs text-moonlight-text/70 line-clamp-2">{deletingReading.preview}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 rounded-full border border-obsidian-border bg-night-sky/60 text-moonlight-text text-xs sm:text-sm hover:border-mystic-indigo/80 hover:text-starlight-text transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full border border-rose-500/70 bg-rose-500/20 text-rose-50 text-xs sm:text-sm hover:bg-rose-500/30 transition-colors"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resultado da leitura */}
      {viewingReading && (
        <ReadingResultModal
          isOpen={!!viewingReading}
          onClose={() => setViewingReading(null)}
          spread={viewingReading.spread}
          question={viewingReading.question}
          selectedCards={viewingReading.cards}
          response={viewingReading.fullReading}
          isLoading={false}
          currentCredits={0}
          onOpenPurchaseCredits={() => setShowPaymentModal(true)}
        />
      )}

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
    </div>
  );
}
