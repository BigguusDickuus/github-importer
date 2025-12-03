import { useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  date: string;
  time: string;
  amount: string;
  package: string;
}

export function TransactionHistory() {
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const transactions: Transaction[] = [
    {
      id: "1",
      date: "2025-11-20",
      time: "15:42",
      amount: "R$ 100,00",
      package: "Pacote Místico (60 créditos)",
    },
    {
      id: "2",
      date: "2025-11-18",
      time: "10:15",
      amount: "R$ 25,00",
      package: "Pacote Iniciante (10 créditos)",
    },
    {
      id: "3",
      date: "2025-11-15",
      time: "14:30",
      amount: "R$ 50,00",
      package: "Pacote Explorador (25 créditos)",
    },
    {
      id: "4",
      date: "2025-11-10",
      time: "09:20",
      amount: "R$ 100,00",
      package: "Pacote Místico (60 créditos)",
    },
    {
      id: "5",
      date: "2025-11-05",
      time: "18:05",
      amount: "R$ 50,00",
      package: "Pacote Explorador (25 créditos)",
    },
    {
      id: "6",
      date: "2025-10-28",
      time: "11:45",
      amount: "R$ 25,00",
      package: "Pacote Iniciante (10 créditos)",
    },
    {
      id: "7",
      date: "2025-10-20",
      time: "16:30",
      amount: "R$ 100,00",
      package: "Pacote Místico (60 créditos)",
    },
    {
      id: "8",
      date: "2025-10-15",
      time: "13:10",
      amount: "R$ 50,00",
      package: "Pacote Explorador (25 créditos)",
    },
  ];

  // Pagination logic
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(transactions.length / itemsPerPage);
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === -1 ? transactions.length : startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
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
              <p className="text-lg text-moonlight-text">Todas as suas compras de créditos</p>
            </div>

            {/* Info bar */}
            <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
              <div className="text-sm text-moonlight-text">
                {transactions.length} {transactions.length === 1 ? "transação" : "transações"}
              </div>
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
                  style={{ gap: "8px", minWidth: "120px", justifyContent: "flex-end" }}
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
                      Pacote
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
                          className="inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30"
                          style={{ padding: "6px 12px", gap: "8px" }}
                        >
                          <CreditCard className="w-3 h-3 text-mystic-indigo" />
                          <span className="text-xs text-mystic-indigo">{transaction.package}</span>
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
                  style={{ padding: "20px", marginBottom: index < paginatedTransactions.length - 1 ? "16px" : "0" }}
                >
                  <div className="flex items-start justify-between" style={{ marginBottom: "12px" }}>
                    <div
                      className="inline-flex items-center rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30"
                      style={{ padding: "6px 12px", gap: "8px" }}
                    >
                      <CreditCard className="w-3 h-3 text-mystic-indigo" />
                      <span className="text-xs text-mystic-indigo">{transaction.package}</span>
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
                <p className="text-moonlight-text text-sm">Suas compras de créditos aparecerão aqui</p>
              </div>
            )}
          </div>
        </div>
      </main>

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
