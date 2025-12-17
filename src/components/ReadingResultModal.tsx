import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { Save, Sparkles, RefreshCw } from "lucide-react";

interface ReadingResultModalProps {
  isOpen: boolean;
  onClose: () => void;

  // já existiam
  spread: string;
  question: string;
  selectedCards: number[];

  // NOVOS
  response?: string; // texto vindo do GPT
  isLoading?: boolean; // true enquanto o GPT está respondendo
}

export function ReadingResultModal({
  isOpen,
  onClose,
  spread,
  question,
  selectedCards,
  response,
  isLoading = false,
}: ReadingResultModalProps) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sua Leitura"
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text">
            <Save className="w-4 h-4 mr-2" />
            Salvar leitura
          </Button>

          <Button variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Nova pergunta
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Cabeçalho com contexto da leitura */}
        <div className="space-y-3">
          <p className="text-sm text-amber-300/90 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Interpretação gerada por IA, personalizada para o seu jogo.
          </p>

          <div className="bg-midnight-surface border border-obsidian-border rounded-xl px-4 py-3 text-sm">
            <div className="text-xs text-slate-400 mb-1">Pergunta</div>
            <div className="text-slate-100 leading-snug">{question}</div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Método: {spread}</span>
              <span>Cartas selecionadas: {selectedCards && selectedCards.length > 0 ? selectedCards.length : 0}</span>
            </div>
          </div>
        </div>

        {/* Conteúdo principal: loading ou resposta do GPT */}
        {isLoading ? (
          <div className="bg-midnight-surface border border-obsidian-border rounded-xl px-6 py-10 flex flex-col items-center justify-center gap-4 text-sm text-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-300" />
            <p>Analisando seu jogo... isso pode levar alguns segundos.</p>
            <p className="text-xs text-slate-500 text-center max-w-md">
              Mantenha esta janela aberta enquanto geramos uma interpretação detalhada com base nas cartas e na sua
              pergunta.
            </p>
          </div>
        ) : (
          <div className="bg-midnight-surface border border-obsidian-border rounded-xl px-6 py-5 max-h-[420px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-starlight-text mb-3">Resultado da leitura</h3>

            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line text-slate-100 leading-relaxed">
              {response && response.trim().length > 0 ? (
                response
              ) : (
                <span className="text-slate-400">
                  Não foi possível carregar a interpretação desta leitura. Tente novamente em alguns instantes.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rodapé com data/hora da leitura */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-obsidian-border">
          <span>
            Leitura gerada em {formattedDate} às {formattedTime}
          </span>
        </div>
      </div>
    </Modal>
  );
}
