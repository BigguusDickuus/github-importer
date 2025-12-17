import { useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Sparkles, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { ReadingResultModal } from "./ReadingResultModal";
import { Link } from "react-router-dom";

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

export function History() {
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [deleteReading, setDeleteReading] = useState<Reading | null>(null);
  const [filterOracle, setFilterOracle] = useState<string>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const readings: Reading[] = [
    {
      id: "1",
      date: "2025-11-18",
      time: "14:30",
      oracle: "Tarot",
      spread: "tarot-cruz-celta",
      question: "Como está minha vida profissional neste momento?",
      preview: "As cartas indicam um período de transformação e crescimento...",
      fullReading: "Cruz Celta completa: As cartas revelam um momento de profunda transformação profissional. O Louco sugere novos começos, enquanto o Mago indica que você possui todas as ferramentas necessárias para o sucesso...",
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
      fullReading: "Passado-Presente-Futuro: A leitura revela uma base sólida no passado, harmonia no presente e crescimento conjunto no futuro. As cartas indicam compreensão mútua e desenvolvimento emocional...",
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
      fullReading: "Combinação Lenormand: As cartas sugerem que disciplina financeira e planejamento cuidadoso são essenciais. O Peixe indica prosperidade futura, enquanto o Livro sugere aprendizado...",
      cards: [23, 14, 26],
    },
    {
      id: "4",
      date: "2025-11-14",
      time: "09:00",
      oracle: "Cartomancia Clássica",
      spread: "cartomancia",
      question: "Qual o melhor caminho para meu crescimento espiritual?",
      preview: "As cartas apontam para introspecção e autoconhecimento...",
      fullReading: "Leitura de Cartomancia: O caminho espiritual está iluminado. O Ás de Copas sugere abertura emocional, enquanto os Ouros indicam manifestação prática de sua jornada espiritual...",
      cards: [8, 16, 24],
    },
  ];

  const filteredReadings = filterOracle === "all"
    ? readings
    : readings.filter((r) => r.oracle === filterOracle);

  // Pagination logic
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredReadings.length / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? filteredReadings.length : startIndex + itemsPerPage;
  const paginatedReadings = filteredReadings.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    // TODO: Implementar exclusão no Supabase
    console.log("Excluindo leitura:", deleteReading?.id);
    setDeleteReading(null);
  };

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
      <main className="relative z-10" style={{ marginTop: 'calc(80px + 48px)' }}>
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
            <div className="text-center" style={{ marginBottom: '24px' }}>
              <h1 className="text-starlight-text" style={{ marginBottom: '16px' }}>
                Histórico de Leituras
              </h1>
              <p className="text-lg text-moonlight-text">
                Todas as suas consultas salvas em um só lugar
              </p>
            </div>

            {/* Filters - Fixed */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" style={{ marginBottom: '24px' }}>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterOracle("all")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "all"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: '8px 16px' }}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterOracle("Tarot")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "Tarot"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: '8px 16px' }}
                >
                  Tarot
                </button>
                <button
                  onClick={() => setFilterOracle("Tarot Cigano")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "Tarot Cigano"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: '8px 16px' }}
                >
                  Tarot Cigano
                </button>
                <button
                  onClick={() => setFilterOracle("Cartomancia Clássica")}
                  className={`rounded-md transition-colors ${
                    filterOracle === "Cartomancia Clássica"
                      ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                      : "bg-transparent border border-obsidian-border text-moonlight-text hover:bg-midnight-surface"
                  }`}
                  style={{ padding: '8px 16px' }}
                >
                  Cartomancia Clássica
                </button>
              </div>

              <div className="text-sm text-moonlight-text">
                {filteredReadings.length} {filteredReadings.length === 1 ? 'leitura' : 'leituras'}
              </div>
            </div>

            {/* Controls Bar - Fixed (Dropdown + Link + Pagination) */}
            {filteredReadings.length > 0 && (
              <div className="flex flex-row items-center justify-between flex-nowrap" style={{ marginBottom: '24px', gap: '8px' }}>
                {/* Dropdown */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '120px' }}>
                  <span className="text-sm text-moonlight-text hidden sm:inline">Exibir:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="bg-midnight-surface border border-obsidian-border rounded-lg text-starlight-text focus:outline-none focus:border-mystic-indigo text-sm"
                    style={{ padding: '8px 12px' }}
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
                <div className="flex items-center flex-shrink-0" style={{ gap: '8px', minWidth: '120px', justifyContent: 'flex-end' }}>
                  {itemsPerPage !== -1 ? (
                    totalPages > 1 ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="border-obsidian-border"
                          style={{ padding: '8px' }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs sm:text-sm text-moonlight-text whitespace-nowrap">
                          <span className="hidden sm:inline">Página {currentPage} de {totalPages}</span>
                          <span className="sm:hidden">{currentPage}/{totalPages}</span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="border-obsidian-border"
                          style={{ padding: '8px' }}
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
            <div className="hidden md:block bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-2xl overflow-hidden" style={{ padding: '24px', marginBottom: '32px' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-obsidian-border">
                    <th className="text-left text-sm text-moonlight-text" style={{ padding: '16px' }}>Data e Hora</th>
                    <th className="text-left text-sm text-moonlight-text" style={{ padding: '16px' }}>Oráculo</th>
                    <th className="text-left text-sm text-moonlight-text" style={{ padding: '16px' }}>Pergunta</th>
                    <th className="text-right text-sm text-moonlight-text" style={{ padding: '16px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReadings.map((reading) => (
                    <tr
                      key={reading.id}
                      className="border-b border-obsidian-border last:border-0 hover:bg-night-sky/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedReading(reading)}
                    >
                      <td style={{ padding: '16px' }}>
                        <div className="text-starlight-text">
                          {new Date(reading.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-moonlight-text/70">
                          {reading.time}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30" style={{ padding: '6px 12px', gap: '8px' }}>
                          <Sparkles className="w-3 h-3 text-mystic-indigo" />
                          <span className="text-xs text-mystic-indigo">{reading.oracle}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <p className="text-starlight-text line-clamp-1">{reading.question}</p>
                        <p className="text-moonlight-text text-sm line-clamp-1" style={{ marginTop: '4px' }}>{reading.preview}</p>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="flex items-center justify-end" style={{ gap: '8px' }}>
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

            {/* Mobile: Card View */}
            <div className="md:hidden" style={{ marginBottom: '32px' }}>
              {paginatedReadings.map((reading, index) => (
                <div
                  key={reading.id}
                  className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-xl hover:border-mystic-indigo transition-all cursor-pointer"
                  onClick={() => setSelectedReading(reading)}
                  style={{ padding: '24px', marginBottom: index < paginatedReadings.length - 1 ? '16px' : '0' }}
                >
                  <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
                    <div className="inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30" style={{ padding: '6px 12px', gap: '8px' }}>
                      <Sparkles className="w-3 h-3 text-mystic-indigo" />
                      <span className="text-xs text-mystic-indigo">{reading.oracle}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-moonlight-text">
                        {new Date(reading.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-moonlight-text/70">
                        {reading.time}
                      </div>
                    </div>
                  </div>

                  <p className="text-starlight-text line-clamp-2" style={{ marginBottom: '8px' }}>{reading.question}</p>
                  <p className="text-moonlight-text text-sm line-clamp-2" style={{ marginBottom: '16px' }}>{reading.preview}</p>

                  <div className="flex" style={{ gap: '8px' }}>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReading(reading);
                      }}
                      className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                    >
                      <Eye className="w-4 h-4" style={{ marginRight: '8px' }} />
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
            {filteredReadings.length === 0 && (
              <div className="text-center" style={{ paddingTop: '48px', paddingBottom: '48px', marginBottom: '48px' }}>
                <Sparkles className="w-12 h-12 text-moonlight-text mx-auto" style={{ marginBottom: '16px' }} />
                <h3 className="text-starlight-text" style={{ marginBottom: '8px' }}>Nenhuma leitura encontrada</h3>
                <p className="text-moonlight-text" style={{ marginBottom: '24px' }}>
                  {filterOracle === "all"
                    ? "Você ainda não fez nenhuma consulta"
                    : `Você não tem leituras de ${filterOracle}`}
                </p>
                <Button 
                  className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                  asChild
                >
                  <Link to="/dashboard">Fazer uma consulta</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

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
        <div className="footer-container w-full" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12" style={{ marginBottom: '80px' }}>
              {/* Logo e descrição */}
              <div>
                <div className="flex items-center mb-4" style={{ gap: '12px' }}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-starlight-text" />
                  </div>
                  <span className="text-starlight-text">Tarot Online</span>
                </div>
                <small className="block text-moonlight-text/70">
                  Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7 com interpretações profundas e personalizadas.
                </small>
              </div>

              {/* Links - Serviços */}
              <div>
                <h3 className="text-base text-starlight-text" style={{ marginBottom: '16px' }}>Serviços</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li>
                    <Link to="/dashboard" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
                      Tarot
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
                      Tarot Cigano
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
                      Cartomancia Clássica
                    </Link>
                  </li>
                  <li>
                    <Link to="/historico" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
                      Histórico de leituras
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Links - Informações */}
              <div>
                <h3 className="text-base text-starlight-text" style={{ marginBottom: '16px' }}>Informações</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Sobre nós
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Termos de uso
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Política de privacidade
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Contato
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div style={{ paddingTop: '32px' }}>
              <small className="block text-center text-moonlight-text/70">
                © 2024 Tarot Online. Todos os direitos reservados.
              </small>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      {showPaymentModal && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => setShowPaymentModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '16px' }}>
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
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-starlight-text">Comprar Créditos</h2>
                </div>
                <div className="flex items-center justify-center" style={{ padding: '64px 0' }}>
                  <p className="text-lg text-moonlight-text">
                    Gateway de pagamento será integrado aqui
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reading Detail Modal */}
      {selectedReading && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => setSelectedReading(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '16px' }}>
            <div className="relative pointer-events-auto">
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => setSelectedReading(null)}
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
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-starlight-text">Leitura Completa</h2>
                </div>

                <div>
                  <div className="inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30" style={{ padding: '6px 12px', gap: '8px', marginBottom: '24px' }}>
                    <Sparkles className="w-3 h-3 text-mystic-indigo" />
                    <span className="text-xs text-mystic-indigo">{selectedReading.oracle}</span>
                  </div>
                  <p className="text-sm text-moonlight-text" style={{ marginBottom: '24px' }}>
                    {new Date(selectedReading.date).toLocaleDateString('pt-BR')} às {selectedReading.time}
                  </p>
                  <h3 className="text-starlight-text" style={{ marginBottom: '24px' }}>{selectedReading.question}</h3>
                  <div className="prose prose-invert max-w-none" style={{ marginBottom: '32px' }}>
                    <p className="text-moonlight-text">{selectedReading.fullReading}</p>
                  </div>
                </div>

                <div className="flex" style={{ gap: '12px' }}>
                  <Button
                    className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                    onClick={() => setSelectedReading(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteReading && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => setDeleteReading(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '16px' }}>
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
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: '24px' }}>
                  <h2 className="text-starlight-text">Confirmar Exclusão</h2>
                </div>

                <p className="text-moonlight-text" style={{ marginBottom: '32px' }}>
                  Esta ação não pode ser revertida. Tem certeza que deseja excluir esta tiragem e sua leitura?
                </p>

                <div className="flex" style={{ gap: '12px' }}>
                  <Button
                    className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                    onClick={() => setDeleteReading(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-blood-moon-error text-blood-moon-error hover:bg-blood-moon-error hover:text-starlight-text"
                    onClick={handleDeleteConfirm}
                  >
                    Excluir
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