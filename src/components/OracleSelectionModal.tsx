import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface OracleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOracles: {
    tarot: boolean;
    lenormand: boolean;
    cartomancia: boolean;
  };
  selectedMethods: {
    tarot: string;
    lenormand: string;
    cartomancia: string;
  };
  onOracleToggle: (oracle: 'tarot' | 'lenormand' | 'cartomancia') => void;
  onMethodChange: (oracle: 'tarot' | 'lenormand' | 'cartomancia', method: string) => void;
  onProceed: () => void;
}

export function OracleSelectionModal({
  isOpen,
  onClose,
  selectedOracles,
  selectedMethods,
  onOracleToggle,
  onMethodChange,
  onProceed,
}: OracleSelectionModalProps) {
  if (!isOpen) return null;

  const getSelectedCreditsCount = () => {
    let count = 0;
    if (selectedOracles.tarot) count++;
    if (selectedOracles.lenormand) count++;
    if (selectedOracles.cartomancia) count++;
    return count;
  };

  const canProceed = () => {
    if (selectedOracles.tarot && !selectedMethods.tarot) return false;
    if (selectedOracles.lenormand && !selectedMethods.lenormand) return false;
    if (selectedOracles.cartomancia && !selectedMethods.cartomancia) return false;
    return getSelectedCreditsCount() > 0;
  };

  return (
    <>
      {/* Backdrop com blur */}
      <div 
        className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div className="relative pointer-events-auto w-full max-w-2xl">
          {/* Botão X - Fora do modal, canto superior direito */}
          <button
            onClick={onClose}
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
            className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto py-8 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl text-starlight-text text-center">Selecione seu Oráculo</h2>
            </div>

            <p className="text-base text-moonlight-text/80 text-center mb-8">
              Escolha um ou mais oráculos para sua consulta:
            </p>

            {/* Oracle Options List */}
            <div className="flex flex-col gap-4">
              {/* Tarot Option */}
              <div className="bg-night-sky/50 border border-obsidian-border rounded-2xl transition-all hover:border-mystic-indigo/50 p-5">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOracles.tarot}
                    onChange={() => onOracleToggle('tarot')}
                    className="w-5 h-5 rounded border-2 border-mystic-indigo/50 bg-transparent checked:bg-mystic-indigo checked:border-mystic-indigo focus:ring-2 focus:ring-mystic-indigo/50 cursor-pointer accent-mystic-indigo"
                    style={{ flexShrink: 0 }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg text-starlight-text">Tarot</h3>
                      <span className="text-sm text-mystic-indigo">1 crédito</span>
                    </div>
                    <p className="text-sm text-moonlight-text/70 mb-3">
                      Leitura tradicional com arcanos maiores e menores
                    </p>
                    
                    {/* Dropdown appears when checked */}
                    {selectedOracles.tarot && (
                      <div className="mt-3">
                        <label className="block text-sm text-moonlight-text/80 mb-2">
                          Escolha o método:
                        </label>
                        <select
                          value={selectedMethods.tarot}
                          onChange={(e) => onMethodChange('tarot', e.target.value)}
                          className="w-full bg-night-sky border border-obsidian-border rounded-xl text-sm text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors py-[10px] px-4"
                        >
                          <option value="">Selecione um método</option>
                          <option value="carta_dia">Carta do Dia - Check-in rápido, energia do dia</option>
                          <option value="tres_ppp">3 Cartas: Passado/Presente/Futuro - Evolução de situação</option>
                          <option value="tres_sct">3 Cartas: Situação/Conselho/Tendência - Ação prática</option>
                          <option value="cruz_celta">Cruz Celta - Leitura profunda de situações complexas</option>
                          <option value="dois_caminhos">Jogo de Decisão: Dois Caminhos - Escolha entre opções</option>
                          <option value="relacionamento">Jogo de Relacionamento - Dinâmica entre pessoas</option>
                          <option value="linha_tempo">Linha do Tempo: 6 Meses - Visão de médio prazo</option>
                          <option value="mandala">Mandala Geral - Panorama completo da vida</option>
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Lenormand Option */}
              <div className="bg-night-sky/50 border border-obsidian-border rounded-2xl transition-all hover:border-mystic-indigo/50 p-5">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOracles.lenormand}
                    onChange={() => onOracleToggle('lenormand')}
                    className="w-5 h-5 rounded border-2 border-mystic-indigo/50 bg-transparent checked:bg-mystic-indigo checked:border-mystic-indigo focus:ring-2 focus:ring-mystic-indigo/50 cursor-pointer accent-mystic-indigo flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg text-starlight-text">Lenormand (Baralho Cigano)</h3>
                      <span className="text-sm text-mystic-indigo">1 crédito</span>
                    </div>
                    <p className="text-sm text-moonlight-text/70 mb-3">
                      Cartomancia cigana com 36 cartas simbólicas
                    </p>
                    
                    {/* Dropdown appears when checked */}
                    {selectedOracles.lenormand && (
                      <div className="mt-3">
                        <label className="block text-sm text-moonlight-text/80 mb-2">
                          Escolha o método:
                        </label>
                        <select
                          value={selectedMethods.lenormand}
                          onChange={(e) => onMethodChange('lenormand', e.target.value)}
                          className="w-full bg-night-sky border border-obsidian-border rounded-xl text-sm text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors py-[10px] px-4"
                        >
                          <option value="">Selecione um método</option>
                          <option value="carta_dia">Carta do Dia - Recado rápido e direto</option>
                          <option value="linha_3">Linha de 3 Cartas - Perguntas objetivas, eventos próximos</option>
                          <option value="linha_5">Linha de 5 Cartas - Contexto + desenvolvimento + resultado</option>
                          <option value="retrato_3x3">Retrato 3x3 - Visão panorâmica com nuances</option>
                          <option value="relacionamento">Tiragem de Relacionamento - Dinâmica de casal/parceria</option>
                          <option value="grand_tableau">Mesa Real / Grand Tableau - Mapa completo da vida</option>
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Cartomancia Option */}
              <div className="bg-night-sky/50 border border-obsidian-border rounded-2xl transition-all hover:border-mystic-indigo/50 p-5">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOracles.cartomancia}
                    onChange={() => onOracleToggle('cartomancia')}
                    className="w-5 h-5 rounded border-2 border-mystic-indigo/50 bg-transparent checked:bg-mystic-indigo checked:border-mystic-indigo focus:ring-2 focus:ring-mystic-indigo/50 cursor-pointer accent-mystic-indigo flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg text-starlight-text">Cartomancia Clássica</h3>
                      <span className="text-sm text-mystic-indigo">1 crédito</span>
                    </div>
                    <p className="text-sm text-moonlight-text/70 mb-3">
                      Leitura com baralho tradicional de 52 cartas
                    </p>
                    
                    {/* Dropdown appears when checked */}
                    {selectedOracles.cartomancia && (
                      <div className="mt-3">
                        <label className="block text-sm text-moonlight-text/80 mb-2">
                          Escolha o método:
                        </label>
                        <select
                          value={selectedMethods.cartomancia}
                          onChange={(e) => onMethodChange('cartomancia', e.target.value)}
                          className="w-full bg-night-sky border border-obsidian-border rounded-xl text-sm text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors py-[10px] px-4"
                        >
                          <option value="">Selecione um método</option>
                          <option value="carta_dia">Carta do Dia - Insight rápido, clima do dia</option>
                          <option value="tres_cartas">3 Cartas: Situação/Obstáculo/Conselho - Perguntas objetivas</option>
                          <option value="cruz_simples">Cruz Simples - Mapa rápido da situação</option>
                          <option value="ferradura">Ferradura - Situações em movimento, caminhos</option>
                          <option value="relacionamento">Relacionamento - Energia entre pessoas</option>
                          <option value="nove_cartas">Leitura Geral: 9 Cartas - Panorama completo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Proceed Button */}
            <div className="mt-8 pt-6 border-t border-obsidian-border">
              <Button
                size="lg"
                className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onProceed}
                disabled={!canProceed()}
                type="button"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Seguir • {getSelectedCreditsCount()} {getSelectedCreditsCount() === 1 ? 'crédito' : 'créditos'}
              </Button>
              
              {getSelectedCreditsCount() === 0 && (
                <p className="text-sm text-moonlight-text/60 text-center mt-3">
                  Selecione pelo menos um oráculo
                </p>
              )}
              
              {!canProceed() && getSelectedCreditsCount() > 0 && (
                <p className="text-sm text-oracle-ember text-center mt-3">
                  Selecione um método para cada oráculo escolhido
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
