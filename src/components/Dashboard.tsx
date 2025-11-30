import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Sparkles, CreditCard } from "lucide-react";
import { Modal } from "./Modal";
import { OracleSelectionModal } from "./OracleSelectionModal";

export function Dashboard() {
  const [question, setQuestion] = useState("");
  const [showOracleModal, setShowOracleModal] = useState(false);
  const userCredits = 12;

  const suggestions = [
    "Amor",
    "Carreira",
    "Finanças",
    "Espiritualidade",
    "Família",
    "Saúde",
  ];

  const handleAsk = () => {
    if (question.trim()) {
      setShowOracleModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-night-sky">
      <Header isLoggedIn={true} credits={userCredits} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Credits Card */}
        <div className="mb-8 bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="mb-2 text-moonlight-text">Seus créditos</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-starlight-text">{userCredits}</span>
                <span className="text-moonlight-text">
                  consultas disponíveis
                </span>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
              asChild
            >
              <Link to="/creditos">
                <CreditCard className="w-5 h-5 mr-2" />
                Comprar créditos
              </Link>
            </Button>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="mb-8">
          <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="mb-4">
              <label htmlFor="question" className="block text-starlight-text mb-3">
                O que você deseja saber?
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Digite sua pergunta aqui... Seja específico para obter uma resposta mais precisa."
                rows={4}
                className="w-full bg-night-sky border border-obsidian-border rounded-xl px-6 py-4 text-starlight-text placeholder:text-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors resize-none"
              />
            </div>

            <Button
              size="lg"
              onClick={handleAsk}
              disabled={!question.trim()}
              className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Consultar Oráculo
            </Button>

            <p className="mt-4 text-sm text-moonlight-text text-center">
              1 crédito será consumido por cada oráculo selecionado
            </p>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h4 className="mb-4 text-moonlight-text">Temas populares</h4>
          <div className="flex flex-wrap gap-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuestion(`Como está minha vida ${suggestion.toLowerCase()} atualmente?`)}
                className="px-5 py-2.5 bg-midnight-surface border border-obsidian-border rounded-full text-starlight-text hover:border-mystic-indigo hover:bg-mystic-indigo/10 transition-all duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Readings Preview */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-starlight-text">Leituras recentes</h3>
            <Button variant="ghost" className="text-mystic-indigo hover:text-mystic-indigo-dark" asChild>
              <Link to="/historico">Ver todas</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-midnight-surface border border-obsidian-border rounded-xl p-6 hover:border-mystic-indigo transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30">
                    <span className="text-xs text-mystic-indigo">Tarot - Cruz Celta</span>
                  </div>
                  <span className="text-xs text-moonlight-text">Há 2 dias</span>
                </div>
                <p className="text-starlight-text mb-2 line-clamp-2">
                  Como está minha vida profissional neste momento?
                </p>
                <p className="text-moonlight-text text-sm line-clamp-2">
                  As cartas indicam um período de transformação e crescimento...
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Oracle Selection Modal */}
      <OracleSelectionModal
        isOpen={showOracleModal}
        onClose={() => setShowOracleModal(false)}
        selectedOracles={{ tarot: false, lenormand: false, cartomancia: false }}
        selectedMethods={{ tarot: "", lenormand: "", cartomancia: "" }}
        onOracleToggle={() => {}}
        onMethodChange={() => {}}
        onProceed={() => setShowOracleModal(false)}
      />
    </div>
  );
}