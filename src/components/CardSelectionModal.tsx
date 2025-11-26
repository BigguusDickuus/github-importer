import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Shuffle, Sparkles } from "lucide-react";

interface CardSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOracleQueue: Array<{
    type: 'tarot' | 'lenormand' | 'cartomancia';
    method: string;
  }>;
  currentOracleIndex: number;
  allSelectedCards: Record<string, number[]>;
  onCardSelect?: (oracleType: string, cardIndex: number) => void;
  onComplete: (selectedCards: number[]) => void;
}

// Mapeamento de métodos para número de cartas necessárias
const CARDS_PER_METHOD: Record<string, number> = {
  // Tarot
  'carta_dia': 1,
  'tres_ppp': 3,
  'tres_sct': 3,
  'cruz_celta': 10,
  'dois_caminhos': 6,
  'relacionamento': 7,
  'linha_tempo': 6,
  'mandala': 12,
  
  // Lenormand
  'linha_3': 3,
  'linha_5': 5,
  'retrato_3x3': 9,
  'grand_tableau': 36,
  
  // Cartomancia
  'tres_cartas': 3,
  'cruz_simples': 4,
  'ferradura': 7,
  'nove_cartas': 9,
};

// Número total de cartas por oráculo
const TOTAL_CARDS: Record<string, number> = {
  'tarot': 78,
  'lenormand': 36,
  'cartomancia': 52,
};

// Casas fixas do Grand Tableau (Lenormand)
const GRAND_TABLEAU_HOUSES = [
  { number: 1, name: 'Cavaleiro', meaning: 'notícias, chegada, movimento' },
  { number: 2, name: 'Trevo', meaning: 'sorte, oportunidade, alívio' },
  { number: 3, name: 'Navio', meaning: 'viagens, distância, comércio' },
  { number: 4, name: 'Casa', meaning: 'lar, família, base' },
  { number: 5, name: 'Árvore', meaning: 'saúde, crescimento, raízes' },
  { number: 6, name: 'Nuvens', meaning: 'confusão, dúvidas, incerteza' },
  { number: 7, name: 'Cobra', meaning: 'complicações, desvios, sedução' },
  { number: 8, name: 'Caixão', meaning: 'fim, fechamento, transformação' },
  { number: 9, name: 'Buquê', meaning: 'alegria, convite, charme' },
  { number: 10, name: 'Foice', meaning: 'corte, ruptura, decisão brusca' },
  { number: 11, name: 'Chicote', meaning: 'conflitos, repetição, tensão' },
  { number: 12, name: 'Pássaros', meaning: 'conversas, ansiedade, duo' },
  { number: 13, name: 'Criança', meaning: 'começo, novidade, imaturidade' },
  { number: 14, name: 'Raposa', meaning: 'trabalho, esperteza, desconfiança' },
  { number: 15, name: 'Urso', meaning: 'força, poder, autoridade' },
  { number: 16, name: 'Estrela', meaning: 'metas, inspiração, internet' },
  { number: 17, name: 'Cegonha', meaning: 'mudança, transição, fase' },
  { number: 18, name: 'Cão', meaning: 'amizade, lealdade, apoio' },
  { number: 19, name: 'Torre', meaning: 'instituição, isolamento, visão' },
  { number: 20, name: 'Jardim', meaning: 'público, social, eventos' },
  { number: 21, name: 'Montanha', meaning: 'obstáculo, barreira, atraso' },
  { number: 22, name: 'Caminhos', meaning: 'escolhas, bifurcação' },
  { number: 23, name: 'Ratos', meaning: 'desgaste, perdas, preocupação' },
  { number: 24, name: 'Coração', meaning: 'amor, prazer, afeto' },
  { number: 25, name: 'Anel', meaning: 'compromisso, contrato, ciclos' },
  { number: 26, name: 'Livro', meaning: 'segredo, estudo, oculto' },
  { number: 27, name: 'Carta', meaning: 'mensagem, documento, e-mail' },
  { number: 28, name: 'Homem', meaning: 'consulente masculino' },
  { number: 29, name: 'Mulher', meaning: 'consulente feminina' },
  { number: 30, name: 'Lírios', meaning: 'maturidade, paz, sexualidade' },
  { number: 31, name: 'Sol', meaning: 'sucesso, vitalidade, clareza' },
  { number: 32, name: 'Lua', meaning: 'emoções, reconhecimento, ciclo' },
  { number: 33, name: 'Chave', meaning: 'abertura, solução, garantido' },
  { number: 34, name: 'Peixes', meaning: 'dinheiro, fluxo, negócios' },
  { number: 35, name: 'Âncora', meaning: 'estabilidade, foco, trabalho' },
  { number: 36, name: 'Cruz', meaning: 'peso, destino, prova' },
];

// Nomes dos oráculos para exibição
const ORACLE_NAMES: Record<string, string> = {
  'tarot': 'Tarot',
  'lenormand': 'Lenormand',
  'cartomancia': 'Cartomancia Clássica',
};

export function CardSelectionModal({
  isOpen,
  onClose,
  currentOracleQueue,
  currentOracleIndex,
  allSelectedCards,
  onCardSelect,
  onComplete,
}: CardSelectionModalProps) {
  // Verifica se há um oráculo na fila antes de continuar
  if (!currentOracleQueue || currentOracleQueue.length === 0 || !currentOracleQueue[currentOracleIndex]) {
    return null;
  }

  const { type: oracleType, method } = currentOracleQueue[currentOracleIndex];
  const totalCards = TOTAL_CARDS[oracleType];
  const cardsNeeded = CARDS_PER_METHOD[method] || 1;
  const isGrandTableau = method === 'grand_tableau';
  
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [hasFlippedAny, setHasFlippedAny] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  // Reset state when modal opens or method changes
  useEffect(() => {
    if (isOpen) {
      setSelectedCards([]);
      setFlippedCards(new Set());
      setHasFlippedAny(false);
      setShuffleKey(prev => prev + 1);
    }
  }, [isOpen, method]);

  const handleCardClick = (cardIndex: number) => {
    // Grand Tableau: ao clicar em qualquer carta, vira todas
    if (isGrandTableau && !hasFlippedAny) {
      const allCards = Array.from({ length: totalCards }, (_, i) => i);
      setSelectedCards(allCards);
      setFlippedCards(new Set(allCards));
      setHasFlippedAny(true);
      return;
    }

    // Se já está virada, não faz nada
    if (flippedCards.has(cardIndex)) return;

    // Se já selecionou o número necessário de cartas, não permite mais
    if (selectedCards.length >= cardsNeeded) return;

    // Adiciona carta à seleção
    setSelectedCards(prev => [...prev, cardIndex]);
    setFlippedCards(prev => new Set([...prev, cardIndex]));
    setHasFlippedAny(true);
    if (onCardSelect) {
      onCardSelect(oracleType, cardIndex);
    }
  };

  const handleShuffle = () => {
    if (hasFlippedAny) return; // Não pode embaralhar após virar primeira carta
    setShuffleKey(prev => prev + 1);
  };

  const handleProceed = () => {
    if (selectedCards.length === cardsNeeded || isGrandTableau) {
      onComplete(selectedCards);
    }
  };

  const canProceed = selectedCards.length === cardsNeeded || (isGrandTableau && hasFlippedAny);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop com blur */}
      <div 
        className="fixed inset-0 z-50 bg-night-sky/90 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '16px' }}>
        <div className="relative pointer-events-auto w-full max-w-7xl flex flex-col" style={{ maxHeight: '90vh' }}>
          
          {/* Botão X fora do modal */}
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
          
          {/* Header fixo */}
          <div className="bg-midnight-surface border border-obsidian-border rounded-t-3xl shadow-2xl" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl text-starlight-text">
                  {ORACLE_NAMES[oracleType]}
                </h2>
                <p className="text-base text-moonlight-text/80" style={{ marginTop: '8px' }}>
                  {isGrandTableau 
                    ? 'Clique em qualquer carta para revelar todas'
                    : `Escolha ${cardsNeeded} ${cardsNeeded === 1 ? 'carta' : 'cartas'}`
                  }
                  {!isGrandTableau && selectedCards.length > 0 && (
                    <span className="text-mystic-indigo ml-2">
                      ({selectedCards.length}/{cardsNeeded})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Área de cartas com textura de feltro - scrollável */}
          <div 
            className="flex-1 overflow-y-auto bg-midnight-surface border-x border-obsidian-border"
            style={{
              background: `
                radial-gradient(ellipse at center, rgba(16, 19, 34, 0.95) 0%, rgba(5, 8, 22, 0.98) 100%),
                repeating-linear-gradient(
                  0deg,
                  rgba(99, 102, 241, 0.03) 0px,
                  transparent 1px,
                  transparent 2px,
                  rgba(99, 102, 241, 0.03) 3px
                ),
                repeating-linear-gradient(
                  90deg,
                  rgba(249, 115, 22, 0.02) 0px,
                  transparent 1px,
                  transparent 2px,
                  rgba(249, 115, 22, 0.02) 3px
                ),
                linear-gradient(135deg, #0a0e1a 0%, #050816 50%, #0a0e1a 100%)
              `,
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px 32px' }}>
              {/* Renderização condicional: Grand Tableau vs outros métodos */}
              {isGrandTableau ? (
                // Layout especial do Grand Tableau: 8x4 + 4
                <GrandTableauGrid
                  shuffleKey={shuffleKey}
                  flippedCards={flippedCards}
                  selectedCards={selectedCards}
                  onCardClick={handleCardClick}
                />
              ) : (
                // Grid de cartas com sobreposição (outros métodos)
                <div 
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: '0',
                    margin: '0 auto',
                    // Compensar a extensão das cartas além dos wrappers
                    transform: totalCards > 52 ? 'translateX(-12px)' : 'translateX(-16px)',
                  }}
                >
                  {Array.from({ length: totalCards }, (_, i) => {
                    const cardSize = totalCards > 52 ? 'small' : 'medium';
                    const cardWidth = cardSize === 'small' ? 60 : 80;
                    const visiblePart = cardWidth * 0.6; // 60% VISÍVEL (40% sobreposto)
                    
                    return (
                      <div
                        key={`${shuffleKey}-${i}`}
                        style={{
                          width: `${visiblePart}px`, // Wrapper tem 60% da largura da carta
                          height: `${cardWidth * 1.5}px`, // Altura da carta (aspect 2:3)
                          marginTop: '12px',
                          marginBottom: '12px',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: `${cardWidth}px`, // Carta tem tamanho completo (100%)
                            height: `${cardWidth * 1.5}px`,
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            zIndex: selectedCards.includes(i) ? 20 : 10,
                          }}
                        >
                          <Card
                            index={i}
                            isFlipped={flippedCards.has(i)}
                            isSelected={selectedCards.includes(i)}
                            onClick={() => handleCardClick(i)}
                            delay={i * 0.008}
                            oracleType={oracleType}
                            cardSize={cardSize}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer fixo com botões */}
          <div className="bg-midnight-surface border border-obsidian-border rounded-b-3xl shadow-2xl" style={{ padding: '24px' }}>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-oracle-ember/90 hover:bg-oracle-ember border-2 border-oracle-ember text-starlight-text disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-obsidian-border disabled:border-obsidian-border"
                style={{ padding: '16px 32px' }}
                onClick={handleShuffle}
                disabled={hasFlippedAny}
              >
                <Shuffle className="mr-2 w-5 h-5" />
                Embaralhar
              </Button>

              <Button
                size="lg"
                className="w-full sm:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark border-2 border-mystic-indigo text-starlight-text disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: '16px 32px' }}
                onClick={handleProceed}
                disabled={!canProceed}
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Seguir
              </Button>
            </div>

            {!canProceed && hasFlippedAny && !isGrandTableau && (
              <p className="text-sm text-oracle-ember text-center" style={{ marginTop: '12px' }}>
                Selecione mais {cardsNeeded - selectedCards.length} {cardsNeeded - selectedCards.length === 1 ? 'carta' : 'cartas'}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Componente individual da carta com animação de flip 3D
interface CardProps {
  index: number;
  isFlipped: boolean;
  isSelected: boolean;
  onClick: () => void;
  delay: number;
  oracleType: string;
  cardSize: 'small' | 'medium';
}

function Card({ index, isFlipped, isSelected, onClick, delay, oracleType, cardSize }: CardProps) {
  // Define tamanho baseado no cardSize
  const width = cardSize === 'small' ? '60px' : '80px';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: isSelected ? 1.05 : 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: delay,
        ease: "easeOut" 
      }}
      className="relative cursor-pointer"
      style={{
        width: width,
        aspectRatio: '2/3',
        perspective: '1000px',
      }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ 
          duration: 0.6, 
          ease: "easeInOut" 
        }}
      >
        {/* Verso da carta */}
        <div
          className="absolute inset-0 rounded-xl border-2 border-mystic-indigo/30 shadow-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1423 100%)',
          }}
        >
          {/* Padrão decorativo no verso */}
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Borda interna */}
            <div 
              className="absolute inset-0"
              style={{
                border: '8px solid',
                borderImage: 'linear-gradient(135deg, #6366F1, #F97316) 1',
                borderRadius: '12px',
                margin: '8px',
              }}
            />
            
            {/* Padrão central */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <Sparkles className={cardSize === 'small' ? 'w-5 h-5' : 'w-8 h-8'} style={{ color: '#6366F1', marginBottom: cardSize === 'small' ? '4px' : '8px' }} />
              <div className={cardSize === 'small' ? 'w-4 h-4' : 'w-6 h-6'} style={{ borderRadius: '50%', border: '2px solid #F97316' }} />
            </div>

            {/* Padrão de fundo */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 50% 50%, #6366F1 1px, transparent 1px),
                  radial-gradient(circle at 75% 25%, #F97316 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />
          </div>
        </div>

        {/* Frente da carta (placeholder) */}
        <div
          className="absolute inset-0 rounded-xl border-2 border-mystic-indigo shadow-lg overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
          }}
        >
          <div className="w-full h-full flex items-center justify-center p-2">
            <div className="text-center">
              <div className="text-2xl text-night-sky mb-1">🃏</div>
              <div className="text-xs text-night-sky/70">
                {oracleType === 'tarot' && `Carta ${index + 1}`}
                {oracleType === 'lenormand' && `Carta ${index + 1}`}
                {oracleType === 'cartomancia' && `Carta ${index + 1}`}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Indicador de seleção - fora do elemento que rotaciona */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-mystic-indigo rounded-full flex items-center justify-center shadow-lg"
          style={{ zIndex: 30 }}
        >
          <span className="text-starlight-text text-sm">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Componente para o layout especial do Grand Tableau
interface GrandTableauGridProps {
  shuffleKey: number;
  flippedCards: Set<number>;
  selectedCards: number[];
  onCardClick: (cardIndex: number) => void;
}

function GrandTableauGrid({
  shuffleKey,
  flippedCards,
  selectedCards,
  onCardClick,
}: GrandTableauGridProps) {
  // Tamanho das cartas no Grand Tableau
  const cardWidth = 70; // px
  const cardHeight = cardWidth * 1.5; // aspect ratio 2:3
  const gap = 12; // gap entre cartas

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Primeiras 4 linhas: 8 cartas cada em desktop, responsivo em mobile */}
      {[0, 1, 2, 3].map((row) => (
        <div
          key={`row-${row}`}
          className="flex flex-wrap justify-center gap-3 max-w-full"
        >
          {Array.from({ length: 8 }, (_, col) => {
            const cardIndex = row * 8 + col; // 0-31
            const house = GRAND_TABLEAU_HOUSES[cardIndex];
            
            return (
              <GrandTableauCard
                key={`${shuffleKey}-${cardIndex}`}
                cardIndex={cardIndex}
                house={house}
                isFlipped={flippedCards.has(cardIndex)}
                isSelected={selectedCards.includes(cardIndex)}
                onClick={() => onCardClick(cardIndex)}
                delay={cardIndex * 0.008}
                cardWidth={cardWidth}
              />
            );
          })}
        </div>
      ))}

      {/* 5ª linha: 4 cartas centralizadas */}
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: 4 }, (_, col) => {
          const cardIndex = 32 + col; // 32-35
          const house = GRAND_TABLEAU_HOUSES[cardIndex];
          
          return (
            <GrandTableauCard
              key={`${shuffleKey}-${cardIndex}`}
              cardIndex={cardIndex}
              house={house}
              isFlipped={flippedCards.has(cardIndex)}
              isSelected={selectedCards.includes(cardIndex)}
              onClick={() => onCardClick(cardIndex)}
              delay={cardIndex * 0.008}
              cardWidth={cardWidth}
            />
          );
        })}
      </div>
    </div>
  );
}

// Componente individual para carta do Grand Tableau com legenda de casa
interface GrandTableauCardProps {
  cardIndex: number;
  house: { number: number; name: string; meaning: string };
  isFlipped: boolean;
  isSelected: boolean;
  onClick: () => void;
  delay: number;
  cardWidth: number;
}

function GrandTableauCard({
  cardIndex,
  house,
  isFlipped,
  isSelected,
  onClick,
  delay,
  cardWidth,
}: GrandTableauCardProps) {
  const cardHeight = cardWidth * 1.5;

  return (
    <div 
      className="flex flex-col items-center gap-2"
      style={{ 
        width: `${cardWidth}px`, // Largura fixa garante espaçamento uniforme
        flexShrink: 0 
      }}
    >
      {/* Carta com flip 3D */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: isSelected ? 1.05 : 1, y: 0 }}
        transition={{ 
          duration: 0.3, 
          delay: delay,
          ease: "easeOut" 
        }}
        className="relative cursor-pointer"
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          perspective: '1000px',
        }}
        onClick={onClick}
      >
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ 
            duration: 0.6, 
            ease: "easeInOut" 
          }}
        >
          {/* Verso da carta */}
          <div
            className="absolute inset-0 rounded-lg border-2 border-mystic-indigo/30 shadow-lg overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1423 100%)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center relative">
              <div 
                className="absolute inset-0"
                style={{
                  border: '6px solid',
                  borderImage: 'linear-gradient(135deg, #6366F1, #F97316) 1',
                  borderRadius: '8px',
                  margin: '6px',
                }}
              />
              <div className="relative z-10 flex flex-col items-center justify-center">
                <Sparkles className="w-6 h-6" style={{ color: '#6366F1', marginBottom: '6px' }} />
                <div className="w-5 h-5" style={{ borderRadius: '50%', border: '2px solid #F97316' }} />
              </div>
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, #6366F1 1px, transparent 1px),
                    radial-gradient(circle at 75% 25%, #F97316 1px, transparent 1px)
                  `,
                  backgroundSize: '15px 15px',
                }}
              />
            </div>
          </div>

          {/* Frente da carta */}
          <div
            className="absolute inset-0 rounded-lg border-2 border-mystic-indigo shadow-lg overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center p-2">
              <div className="text-center">
                <div className="text-xl text-night-sky mb-1">🃏</div>
                <div className="text-xs text-night-sky/70">
                  Carta {cardIndex + 1}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Indicador de seleção */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-mystic-indigo rounded-full flex items-center justify-center shadow-lg"
            style={{ zIndex: 30 }}
          >
            <span className="text-starlight-text text-xs">✓</span>
          </motion.div>
        )}
      </motion.div>

      {/* Legenda da casa (sempre visível) - com largura fixa e quebra de linha */}
      <div 
        className="text-center"
        style={{
          width: `${cardWidth}px`, // Mesma largura da carta
        }}
      >
        <p className="text-xs text-mystic-indigo leading-tight">
          {house.number}. {house.name}
        </p>
      </div>
    </div>
  );
}