import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { Save, Sparkles, RefreshCw } from "lucide-react";

interface ReadingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  spread: string;
  question: string;
  selectedCards: number[];
}

export function ReadingResultModal({
  isOpen,
  onClose,
  spread,
  question,
  selectedCards,
}: ReadingResultModalProps) {
  // Mock card names for demonstration
  const cardNames = [
    "O Louco",
    "O Mago",
    "A Sacerdotisa",
    "A Imperatriz",
    "O Imperador",
    "O Hierofante",
    "Os Amantes",
    "O Carro",
    "A Força",
    "O Eremita",
  ];

  const getSpreadName = () => {
    if (spread.includes("tres-cartas")) return "3 Cartas";
    if (spread.includes("cruz-celta")) return "Cruz Celta";
    return "Tarot";
  };

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
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Ver histórico
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Question */}
        <div className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
          <p className="text-sm text-moonlight-text mb-1">Sua pergunta:</p>
          <p className="text-starlight-text">{question}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Card Spread */}
          <div className="space-y-4">
            <h4 className="text-starlight-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-mystic-indigo" />
              Spread: {getSpreadName()}
            </h4>

            {/* Card Display */}
            <div className="bg-gradient-to-br from-midnight-surface to-night-sky rounded-xl p-6 border border-obsidian-border">
              {spread.includes("tres-cartas") ? (
                // 3 Cards Layout
                <div className="flex justify-center gap-4">
                  {selectedCards.slice(0, 3).map((cardIndex, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-20 h-32 rounded-lg bg-mystic-indigo/20 border-2 border-mystic-indigo flex items-center justify-center">
                        <span className="text-xs text-center text-mystic-indigo px-2">
                          {cardNames[cardIndex % cardNames.length]}
                        </span>
                      </div>
                      <span className="text-xs text-moonlight-text">
                        {i === 0 ? "Passado" : i === 1 ? "Presente" : "Futuro"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                // Cruz Celta Layout
                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  {selectedCards.slice(0, 10).map((cardIndex, i) => (
                    <div
                      key={i}
                      className={`aspect-[2/3] rounded-lg bg-mystic-indigo/20 border-2 border-mystic-indigo flex items-center justify-center p-2 ${
                        i === 0 ? "col-start-2" : ""
                      } ${i === 1 ? "col-start-2 -mt-16" : ""} ${i === 2 ? "col-start-1 row-start-1" : ""} ${
                        i === 3 ? "col-start-3 row-start-1" : ""
                      }`}
                    >
                      <span className="text-[10px] text-center text-mystic-indigo">
                        {cardNames[cardIndex % cardNames.length]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile: Show cards list */}
            <div className="lg:hidden space-y-2">
              {selectedCards.map((cardIndex, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-midnight-surface border border-obsidian-border rounded-lg"
                >
                  <div className="w-12 h-12 rounded-lg bg-mystic-indigo/20 border border-mystic-indigo flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-mystic-indigo">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-starlight-text text-sm">{cardNames[cardIndex % cardNames.length]}</p>
                    <p className="text-moonlight-text text-xs">Posição {i + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Interpretation */}
          <div className="space-y-4">
            <h4 className="text-starlight-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-mystic-indigo" />
              Interpretação
            </h4>

            <div className="bg-midnight-surface border border-obsidian-border rounded-xl p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-mystic-indigo/10 border border-mystic-indigo">
                <Sparkles className="w-5 h-5 text-mystic-indigo flex-shrink-0 mt-0.5" />
                <p className="text-sm text-mystic-indigo">
                  Interpretação gerada por IA baseada em sua pergunta e nas cartas selecionadas.
                </p>
              </div>

              <div>
                <h4 className="text-starlight-text mb-2">Visão Geral</h4>
                <p className="text-moonlight-text">
                  As cartas revelam um momento de transição importante em sua vida. A energia presente 
                  sugere que você está no caminho certo, mas é necessário manter o foco e a determinação.
                </p>
              </div>

              <div>
                <h4 className="text-starlight-text mb-2">Análise Detalhada</h4>
                <div className="space-y-3">
                  {selectedCards.slice(0, 3).map((cardIndex, i) => (
                    <div key={i} className="p-3 bg-night-sky rounded-lg border border-obsidian-border">
                      <p className="text-sm text-mystic-indigo mb-1">
                        {cardNames[cardIndex % cardNames.length]}
                      </p>
                      <p className="text-sm text-moonlight-text">
                        Esta carta representa {i === 0 ? "as influências do passado" : i === 1 ? "sua situação atual" : "as possibilidades futuras"}. 
                        Ela indica um período de crescimento e aprendizado, onde suas escolhas terão impacto significativo.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-starlight-text mb-2">Conselho Final</h4>
                <p className="text-moonlight-text">
                  Confie em sua intuição e não tenha medo de seguir novos caminhos. O momento é propício 
                  para mudanças positivas, mas lembre-se de manter o equilíbrio e a paciência.
                </p>
              </div>

              <div className="pt-4 border-t border-obsidian-border">
                <p className="text-xs text-moonlight-text">
                  Esta leitura foi gerada em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
