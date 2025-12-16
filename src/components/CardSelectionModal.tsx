import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Shuffle, Sparkles } from "lucide-react";
import { getCardImageUrl, getCardBackImageUrl } from "@/utils/oracleCards";
import { supabase } from "@/integrations/supabase/client";

type OracleType = "tarot" | "lenormand" | "cartomancia";

interface OracleDeck {
  type: OracleType;
  method: string;
  spreadCode?: string;
  deck: {
    code: string;
    reversed?: boolean;
    is_reversed?: boolean;
    orientation?: string; // "reversed" ou "upright"
  }[];
}

interface CardSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOracleQueue: Array<{
    type: "tarot" | "lenormand" | "cartomancia";
    method: string;
  }>;
  currentOracleIndex: number;
  allSelectedCards: Record<string, number[]>;
  onCardSelect?: (oracleType: string, cardIndex: number) => void;
  onComplete: (selectedCards: number[]) => void;
  oracleDecks?: OracleDeck[];
}

// Mapeamento de métodos para número de cartas necessárias
const CARDS_PER_METHOD: Record<string, number> = {
  // Tarot
  carta_dia: 1,
  tres_ppp: 3,
  tres_sct: 3,
  cruz_celta: 10,
  dois_caminhos: 6,
  relacionamento: 7,
  linha_tempo: 6,
  mandala: 12,

  // Lenormand
  linha_3: 3,
  linha_5: 5,
  retrato_3x3: 9,
  grand_tableau: 36,

  // Cartomancia
  tres_cartas: 3,
  cruz_simples: 4,
  ferradura: 7,
  nove_cartas: 9,
};

// Número total de cartas por oráculo
const TOTAL_CARDS: Record<string, number> = {
  tarot: 78,
  lenormand: 36,
  cartomancia: 52,
};

// Casas fixas do Grand Tableau (Lenormand)
const GRAND_TABLEAU_HOUSES = [
  { number: 1, name: "Cavaleiro", meaning: "notícias, chegada, movimento" },
  { number: 2, name: "Trevo", meaning: "sorte, oportunidade, alívio" },
  { number: 3, name: "Navio", meaning: "viagens, distância, comércio" },
  { number: 4, name: "Casa", meaning: "lar, família, base" },
  { number: 5, name: "Árvore", meaning: "saúde, crescimento, raízes" },
  { number: 6, name: "Nuvens", meaning: "confusão, dúvidas, incerteza" },
  { number: 7, name: "Cobra", meaning: "complicações, desvios, sedução" },
  { number: 8, name: "Caixão", meaning: "fim, fechamento, transformação" },
  { number: 9, name: "Buquê", meaning: "alegria, convite, charme" },
  { number: 10, name: "Foice", meaning: "corte, ruptura, decisão brusca" },
  { number: 11, name: "Chicote", meaning: "conflitos, repetição, tensão" },
  { number: 12, name: "Pássaros", meaning: "conversas, ansiedade, duo" },
  { number: 13, name: "Criança", meaning: "começo, novidade, imaturidade" },
  { number: 14, name: "Raposa", meaning: "trabalho, esperteza, desconfiança" },
  { number: 15, name: "Urso", meaning: "força, poder, autoridade" },
  { number: 16, name: "Estrela", meaning: "metas, inspiração, internet" },
  { number: 17, name: "Cegonha", meaning: "mudança, transição, fase" },
  { number: 18, name: "Cão", meaning: "amizade, lealdade, apoio" },
  { number: 19, name: "Torre", meaning: "instituição, isolamento, visão" },
  { number: 20, name: "Jardim", meaning: "público, social, eventos" },
  { number: 21, name: "Montanha", meaning: "obstáculo, barreira, atraso" },
  { number: 22, name: "Caminhos", meaning: "escolhas, bifurcação" },
  { number: 23, name: "Ratos", meaning: "desgaste, perdas, preocupação" },
  { number: 24, name: "Coração", meaning: "amor, prazer, afeto" },
  { number: 25, name: "Anel", meaning: "compromisso, contrato, ciclos" },
  { number: 26, name: "Livro", meaning: "segredo, estudo, oculto" },
  { number: 27, name: "Carta", meaning: "mensagem, documento, e-mail" },
  { number: 28, name: "Homem", meaning: "consulente masculino" },
  { number: 29, name: "Mulher", meaning: "consulente feminina" },
  { number: 30, name: "Lírios", meaning: "maturidade, paz, sexualidade" },
  { number: 31, name: "Sol", meaning: "sucesso, vitalidade, clareza" },
  { number: 32, name: "Lua", meaning: "emoções, reconhecimento, ciclo" },
  { number: 33, name: "Chave", meaning: "abertura, solução, garantido" },
  { number: 34, name: "Peixes", meaning: "dinheiro, fluxo, negócios" },
  { number: 35, name: "Âncora", meaning: "estabilidade, foco, trabalho" },
  { number: 36, name: "Cruz", meaning: "peso, destino, prova" },
];

// Nomes dos oráculos para exibição
const ORACLE_NAMES: Record<string, string> = {
  tarot: "Tarot",
  lenormand: "Lenormand",
  cartomancia: "Cartomancia Clássica",
};

export function CardSelectionModal({
  isOpen,
  onClose,
  currentOracleQueue,
  currentOracleIndex,
  allSelectedCards,
  onCardSelect,
  onComplete,
  oracleDecks,
}: CardSelectionModalProps) {
  // ✅ NÃO PODE TER return antes dos hooks. Então: hooks primeiro.

  // Anti click-through (mouseup do modal anterior fechando este)
  const [backdropCloseEnabled, setBackdropCloseEnabled] = useState(false);
  const guardTimerRef = useRef<number | null>(null);

  // Deck local (o que a mesa realmente usa)
  const [localDeck, setLocalDeck] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [hasFlippedAny, setHasFlippedAny] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);

  // Preview (quando completa)
  const [showSelectionPreview, setShowSelectionPreview] = useState(false);

  // Item atual (pode estar undefined por timing)
  const currentItem = currentOracleQueue?.[currentOracleIndex];
  const oracleType = currentItem?.type as OracleType | undefined;
  const method = currentItem?.method as string | undefined;
  const isGrandTableau = method === "grand_tableau";

  const currentDeck = localDeck;

  const totalCards =
    (currentDeck && currentDeck.length > 0 ? currentDeck.length : oracleType ? TOTAL_CARDS[oracleType] : 0) || 0;

  const cardsNeeded = method ? CARDS_PER_METHOD[method] || 1 : 0;

  // Anti click-through
  useEffect(() => {
    if (!isOpen) {
      setBackdropCloseEnabled(false);
      if (guardTimerRef.current) {
        window.clearTimeout(guardTimerRef.current);
        guardTimerRef.current = null;
      }
      return;
    }

    setBackdropCloseEnabled(false);
    guardTimerRef.current = window.setTimeout(() => {
      setBackdropCloseEnabled(true);
      guardTimerRef.current = null;
    }, 350);

    return () => {
      if (guardTimerRef.current) {
        window.clearTimeout(guardTimerRef.current);
        guardTimerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (!backdropCloseEnabled) return;
    onClose();
  };

  // Sync deck local quando abre / troca oráculo
  useEffect(() => {
    if (!isOpen || !oracleType || !method) return;

    const entry = oracleDecks?.find((d) => d.type === oracleType && d.method === method);
    const deckFromBackend = entry?.deck ?? [];

    if (!deckFromBackend.length) {
      setLocalDeck([]);
      setSelectedCards([]);
      setFlippedCards(new Set());
      setHasFlippedAny(false);
      setShuffleKey((prev) => prev + 1);
      return;
    }

    setLocalDeck(deckFromBackend);
    setSelectedCards([]);
    setFlippedCards(new Set());
    setHasFlippedAny(false);
    setShuffleKey((prev) => prev + 1);
  }, [isOpen, method, oracleType, oracleDecks]);

  // Preview quando completa (exceto GT)
  useEffect(() => {
    if (!isOpen) return;
    if (!oracleType || !method) return;

    if (!isGrandTableau && cardsNeeded > 0 && selectedCards.length === cardsNeeded) {
      setShowSelectionPreview(true);
    } else if (selectedCards.length < cardsNeeded) {
      setShowSelectionPreview(false);
    }
  }, [isOpen, oracleType, method, isGrandTableau, cardsNeeded, selectedCards]);

  // Preload do verso
  useEffect(() => {
    if (!oracleType) return;
    const backUrl = getCardBackImageUrl(oracleType);
    const img = new Image();
    img.src = backUrl;
  }, [oracleType]);

  const handleCardClick = (cardIndex: number) => {
    if (!oracleType || !method) return;

    if (isGrandTableau && !hasFlippedAny) {
      const allCards = Array.from({ length: totalCards }, (_, i) => i);
      setSelectedCards(allCards);
      setFlippedCards(new Set(allCards));
      setHasFlippedAny(true);
      return;
    }

    if (flippedCards.has(cardIndex)) return;
    if (selectedCards.length >= cardsNeeded) return;

    setSelectedCards((prev) => [...prev, cardIndex]);
    setFlippedCards((prev) => new Set([...prev, cardIndex]));
    setHasFlippedAny(true);
    onCardSelect?.(oracleType, cardIndex);
  };

  const handleShuffle = async () => {
    if (!oracleType || !method) return;
    if (hasFlippedAny || isShuffling) return;

    setIsShuffling(true);

    try {
      const entry = oracleDecks?.find((d) => d.type === oracleType && d.method === method);
      const spreadCode = (entry as any)?.spreadCode || method;

      const { data, error } = await supabase.functions.invoke("rerandomize-oracle", {
        body: { oracle_type: oracleType, spread_code: spreadCode },
      });

      if (error) {
        console.error("Erro ao chamar rerandomize-oracle:", error);
        return;
      }

      const newDeck = (data as any)?.deck ?? [];
      if (!newDeck.length) {
        console.error("rerandomize-oracle retornou deck vazio:", data);
        return;
      }

      if (entry) {
        (entry as any).deck = newDeck;
        if ((data as any)?.spread_code) (entry as any).spreadCode = (data as any).spread_code;
      }

      setLocalDeck(newDeck);
      setSelectedCards([]);
      setFlippedCards(new Set());
      setHasFlippedAny(false);
      setShuffleKey((prev) => prev + 1);
    } catch (err) {
      console.error("Erro inesperado ao reembaralhar:", err);
    } finally {
      setIsShuffling(false);
    }
  };

  const handleProceed = () => {
    if (!oracleType || !method) return;
    if (selectedCards.length === cardsNeeded || isGrandTableau) onComplete(selectedCards);
  };

  const canProceed = (selectedCards.length === cardsNeeded && cardsNeeded > 0) || (isGrandTableau && hasFlippedAny);

  // ===== Label da carta (preview) =====
  const CardLabel = (type: OracleType, code?: string, reversed?: boolean) => {
    const isRev = !!reversed;

    const rankMap: Record<string, string> = {
      A: "Ás",
      ACE: "Ás",
      "1": "Ás",
      J: "Valete",
      JACK: "Valete",
      PAGE: "Valete",
      KNIGHT: "Cavaleiro",
      N: "Cavaleiro",
      Q: "Rainha",
      QUEEN: "Rainha",
      K: "Rei",
      KING: "Rei",
    };

    const suitMap: Array<[RegExp, string]> = [
      [/PAUS|WANDS|CLUBS|\bW\b|\bP\b/i, "Paus"],
      [/COPAS|CUPS|HEARTS|\bC\b|\bH\b/i, "Copas"],
      [/ESPADAS|SWORDS|\bS\b|\bE\b/i, "Espadas"],
      [/OUROS|PENTACLES|COINS|DIAMONDS|\bD\b|\bO\b/i, "Ouros"],
    ];

    const majors: Record<number, string> = {
      0: "O Louco",
      1: "O Mago",
      2: "A Sacerdotisa",
      3: "A Imperatriz",
      4: "O Imperador",
      5: "O Hierofante",
      6: "Os Enamorados",
      7: "O Carro",
      8: "A Justiça",
      9: "O Eremita",
      10: "A Roda da Fortuna",
      11: "A Força",
      12: "O Enforcado",
      13: "A Morte",
      14: "A Temperança",
      15: "O Diabo",
      16: "A Torre",
      17: "A Estrela",
      18: "A Lua",
      19: "O Sol",
      20: "O Julgamento",
      21: "O Mundo",
    };

    if (!code) return isRev && type === "tarot" ? "(invertida)" : "";

    const raw = String(code).trim();
    const upper = raw.toUpperCase();

    if (type === "tarot") {
      const normalized = raw
        .toLowerCase()
        .split("/")
        .pop()!
        .replace(/\.[a-z0-9]+$/i, "");

      const hasSuitHint = /(wands|paus|cups|copas|swords|espadas|pentacles|coins|ouros)/i.test(normalized);

      const majorSlugMap: Record<string, string> = {
        fool: "O Louco",
        the_fool: "O Louco",
        magician: "O Mago",
        the_magician: "O Mago",
        high_priestess: "A Sacerdotisa",
        the_high_priestess: "A Sacerdotisa",
        priestess: "A Sacerdotisa",
        empress: "A Imperatriz",
        the_empress: "A Imperatriz",
        emperor: "O Imperador",
        the_emperor: "O Imperador",
        hierophant: "O Hierofante",
        the_hierophant: "O Hierofante",
        pope: "O Hierofante",
        lovers: "Os Enamorados",
        the_lovers: "Os Enamorados",
        chariot: "O Carro",
        the_chariot: "O Carro",
        justice: "A Justiça",
        the_justice: "A Justiça",
        hermit: "O Eremita",
        the_hermit: "O Eremita",
        wheel_of_fortune: "A Roda da Fortuna",
        the_wheel_of_fortune: "A Roda da Fortuna",
        wheel: "A Roda da Fortuna",
        strength: "A Força",
        the_strength: "A Força",
        hanged_man: "O Enforcado",
        the_hanged_man: "O Enforcado",
        hanged: "O Enforcado",
        death: "A Morte",
        the_death: "A Morte",
        temperance: "A Temperança",
        the_temperance: "A Temperança",
        devil: "O Diabo",
        the_devil: "O Diabo",
        tower: "A Torre",
        the_tower: "A Torre",
        star: "A Estrela",
        the_star: "A Estrela",
        moon: "A Lua",
        the_moon: "A Lua",
        sun: "O Sol",
        the_sun: "O Sol",
        judgement: "O Julgamento",
        judgment: "O Julgamento",
        the_judgement: "O Julgamento",
        the_judgment: "O Julgamento",
        world: "O Mundo",
        the_world: "O Mundo",
      };

      if (!hasSuitHint) {
        const normNoExt = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        const m2 = normNoExt.match(/(?:^|_)(?:tarot_)?major_([01]?\d|2[01])_([a-z0-9_]+)$/i);
        if (m2) {
          const n = Number(m2[1]);
          const slug = m2[2].replace(/^the_/, "");
          const name = majorSlugMap[slug] || majorSlugMap[`the_${slug}`] || majors[n];
          if (name) return name + (isRev ? " (invertida)" : "");
        }

        const directSlug = normNoExt
          .replace(/^tarot_/, "")
          .replace(/^major_/, "")
          .replace(/^the_/, "");
        if (majorSlugMap[directSlug]) return majorSlugMap[directSlug] + (isRev ? " (invertida)" : "");
        if (majorSlugMap[`the_${directSlug}`]) return majorSlugMap[`the_${directSlug}`] + (isRev ? " (invertida)" : "");

        const keys = Object.keys(majorSlugMap).sort((a, b) => b.length - a.length);
        for (const k of keys) {
          if (directSlug.includes(k)) return majorSlugMap[k] + (isRev ? " (invertida)" : "");
        }

        const numMatch = normalized.match(/(?:^|[^0-9])([01]?\d|2[01])(?:[^0-9]|$)/);
        if (numMatch) {
          const n = Number(numMatch[1]);
          if (Number.isFinite(n) && majors[n]) return majors[n] + (isRev ? " (invertida)" : "");
        }
      }

      let rankToken: string | null = null;
      let suitLabel: string | null = null;

      const rankMatch =
        upper.match(/\b(ACE|PAGE|KNIGHT|KING|QUEEN|[AJQKN]|\d{1,2})\b/) ||
        upper.match(/^(ACE|PAGE|KNIGHT|KING|QUEEN|[AJQKN]|\d{1,2})/) ||
        upper.match(/(ACE|PAGE|KNIGHT|KING|QUEEN|[AJQKN]|\d{1,2})$/);

      if (rankMatch) rankToken = rankMatch[1];

      for (const [re, label] of suitMap) {
        if (re.test(upper)) {
          suitLabel = label;
          break;
        }
      }

      const rankLabel = rankToken ? rankMap[rankToken] || rankToken : null;
      if (rankLabel && suitLabel) return `${rankLabel} de ${suitLabel}` + (isRev ? " (invertida)" : "");

      return raw + (isRev ? " (invertida)" : "");
    }

    if (type === "lenormand") {
      return raw;
    }

    if (type === "cartomancia") {
      return raw;
    }

    return raw;
  };

  // Preview cards (com preload das frentes)
  const previewCards = useMemo(() => {
    if (!oracleType) return [];
    if (isGrandTableau) return [];

    return selectedCards.map((idx) => {
      const deckCard = (currentDeck?.[idx] as any) || undefined;
      const code = deckCard?.code as string | undefined;
      const isReversed =
        oracleType === "tarot" &&
        !!(deckCard?.reversed || deckCard?.is_reversed || deckCard?.orientation === "reversed");
      return { idx, code, isReversed };
    });
  }, [oracleType, isGrandTableau, selectedCards, currentDeck]);

  useEffect(() => {
    if (!previewCards.length) return;
    for (const c of previewCards) {
      if (!c.code) continue;
      const img = new Image();
      img.src = getCardImageUrl(c.code);
    }
  }, [previewCards]);

  // ===== Componentes de carta (iguais aos seus, só ajustei loading/decoding) =====
  interface CardProps {
    index: number;
    isFlipped: boolean;
    isSelected: boolean;
    onClick: () => void;
    delay: number;
    oracleType: OracleType;
    cardSize: "small" | "medium";
    cardCode?: string;
    isReversed?: boolean;
  }

  function Card({
    index,
    isFlipped,
    isSelected,
    onClick,
    delay,
    oracleType,
    cardSize,
    cardCode,
    isReversed,
  }: CardProps) {
    const width = cardSize === "small" ? "60px" : "80px";
    const height = cardSize === "small" ? "96px" : "128px";

    const backUrl = getCardBackImageUrl(oracleType);
    const frontUrl = cardCode ? getCardImageUrl(cardCode) : null;

    const [backLoaded, setBackLoaded] = useState(false);
    const [frontLoaded, setFrontLoaded] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: isSelected ? 1.05 : 1, y: 0 }}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
        className="relative cursor-pointer"
        style={{ width, height }}
        onClick={onClick}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            {!backLoaded && <div className="w-full h-full bg-black border border-neutral-700" />}
            <img
              src={backUrl}
              alt="Verso da carta"
              className="w-full h-full object-contain"
              style={{ display: backLoaded ? "block" : "none" }}
              onLoad={() => setBackLoaded(true)}
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            {!frontLoaded && <div className="w-full h-full bg-black border border-neutral-700" />}

            {frontUrl && (
              <img
                src={frontUrl}
                alt={cardCode ?? `Carta ${index + 1}`}
                className="w-full h-full object-contain"
                style={{
                  display: frontLoaded ? "block" : "none",
                  ...(oracleType === "tarot" && isReversed ? { transform: "rotate(180deg)" } : {}),
                }}
                onLoad={() => setFrontLoaded(true)}
                loading="eager"
                decoding="async"
              />
            )}

            {!frontUrl && !frontLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-black border border-neutral-700 text-xs text-starlight-text/60">
                {index + 1}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  interface GrandTableauGridProps {
    shuffleKey: number;
    flippedCards: Set<number>;
    selectedCards: number[];
    onCardClick: (cardIndex: number) => void;
    oracleType: OracleType;
    currentDeck: {
      code: string;
      reversed?: boolean;
      is_reversed?: boolean;
      orientation?: string;
    }[];
  }

  function GrandTableauGrid({
    shuffleKey,
    flippedCards,
    selectedCards,
    onCardClick,
    oracleType,
    currentDeck,
  }: GrandTableauGridProps) {
    const cardWidth = 70;

    return (
      <div className="flex flex-col items-center gap-6">
        {[0, 1, 2, 3].map((row) => (
          <div key={`row-${row}`} className="flex flex-wrap justify-center gap-3 max-w-full">
            {Array.from({ length: 8 }, (_, col) => {
              const cardIndex = row * 8 + col;
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
                  oracleType={oracleType}
                  currentDeck={currentDeck}
                />
              );
            })}
          </div>
        ))}

        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: 4 }, (_, col) => {
            const cardIndex = 32 + col;
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
                oracleType={oracleType}
                currentDeck={currentDeck}
              />
            );
          })}
        </div>
      </div>
    );
  }

  interface GrandTableauCardProps {
    cardIndex: number;
    house: { number: number; name: string; meaning: string };
    isFlipped: boolean;
    isSelected: boolean;
    onClick: () => void;
    delay: number;
    cardWidth: number;
    oracleType: OracleType;
    currentDeck: {
      code: string;
      reversed?: boolean;
      is_reversed?: boolean;
      orientation?: string;
    }[];
  }

  function GrandTableauCard({
    cardIndex,
    house,
    isFlipped,
    isSelected,
    onClick,
    delay,
    cardWidth,
    oracleType,
    currentDeck,
  }: GrandTableauCardProps) {
    const cardHeight = cardWidth * 1.5;

    const deckCard = (currentDeck[cardIndex] as any) || undefined;
    const cardCode = deckCard?.code as string | undefined;

    const isReversed =
      oracleType === "tarot" && !!(deckCard?.reversed || deckCard?.is_reversed || deckCard?.orientation === "reversed");

    const backUrl = getCardBackImageUrl(oracleType);
    const frontUrl = cardCode ? getCardImageUrl(cardCode) : null;

    const [backLoaded, setBackLoaded] = useState(false);
    const [frontLoaded, setFrontLoaded] = useState(false);

    return (
      <div className="flex flex-col items-center gap-2" style={{ width: `${cardWidth}px`, flexShrink: 0 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: isSelected ? 1.05 : 1, y: 0 }}
          transition={{ duration: 0.3, delay, ease: "easeOut" }}
          className="relative cursor-pointer"
          style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, perspective: "1000px" }}
          onClick={onClick}
        >
          <motion.div
            className="relative w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
              {!backLoaded && <div className="w-full h-full bg-black border border-neutral-700" />}
              <img
                src={backUrl}
                alt="Verso da carta"
                className="w-full h-full object-contain"
                style={{ display: backLoaded ? "block" : "none" }}
                onLoad={() => setBackLoaded(true)}
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              {!frontLoaded && <div className="w-full h-full bg-black border border-neutral-700" />}
              {frontUrl && (
                <img
                  src={frontUrl}
                  alt={cardCode ?? `Carta ${cardIndex + 1}`}
                  className="w-full h-full object-contain"
                  style={{
                    display: frontLoaded ? "block" : "none",
                    ...(oracleType === "tarot" && isReversed ? { transform: "rotate(180deg)" } : {}),
                  }}
                  onLoad={() => setFrontLoaded(true)}
                  loading="eager"
                  decoding="async"
                />
              )}
              {!frontUrl && !frontLoaded && (
                <div className="w-full h-full flex items-center justify-center bg-black border border-neutral-700 text-xs text-starlight-text/60">
                  {cardIndex + 1}
                </div>
              )}
            </div>
          </motion.div>

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

        <div className="text-center" style={{ width: `${cardWidth}px` }}>
          <p className="text-xs text-mystic-indigo leading-tight">
            {house.number}. {house.name}
          </p>
        </div>
      </div>
    );
  }

  // ✅ AGORA SIM: returns condicionais (depois dos hooks)
  if (!isOpen) return null;

  if (!currentItem || !oracleType || !method) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-starlight-text">
        Carregando tiragem...
      </div>
    );
  }

  const backUrl = getCardBackImageUrl(oracleType);

  // Layout “sobreposto” (stack/spread) sem virar grid feio
  const spread = useMemo(() => {
    const n = totalCards;
    const mid = (n - 1) / 2;
    const step = 18; // px (overlap)
    const maxRotate = 10; // graus
    return Array.from({ length: n }, (_, i) => {
      const t = i - mid;
      const x = t * step;
      const rot = (t / Math.max(1, mid)) * maxRotate;
      const y = Math.abs(t) * 0.6;
      return { x, y, rot, z: i };
    });
  }, [totalCards]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-night-sky/90 backdrop-blur-md" onClick={handleBackdropClick} />

          <motion.div
            className="relative pointer-events-auto w-full max-w-7xl h-[calc(100vh-2rem)] rounded-2xl bg-midnight-surface border border-obsidian-border shadow-2xl flex flex-col overflow-hidden"
            initial={{ scale: 0.98, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-starlight-text" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-starlight-text font-semibold">
                    {ORACLE_NAMES[oracleType]} — {method.replace(/_/g, " ")}
                  </h2>
                  {!isGrandTableau ? (
                    <p className="text-moonlight-text text-sm">
                      Selecione {cardsNeeded} carta(s) ({selectedCards.length}/{cardsNeeded})
                    </p>
                  ) : (
                    <p className="text-moonlight-text text-sm">
                      Clique em qualquer carta para virar o Grand Tableau (36 cartas)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isGrandTableau && (
                  <Button
                    variant="outline"
                    onClick={handleShuffle}
                    disabled={hasFlippedAny || isShuffling}
                    className="gap-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    {isShuffling ? "Embaralhando..." : "Reembaralhar"}
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button onClick={handleProceed} disabled={!canProceed}>
                  Continuar
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-6">
              {/* Preview (quando completa, exceto GT) */}
              <AnimatePresence>
                {showSelectionPreview && !isGrandTableau && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mb-6 rounded-xl border border-obsidian-border bg-obsidian-card p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-starlight-text font-medium">Cartas escolhidas</p>
                      <Button onClick={handleProceed} disabled={!canProceed}>
                        Prosseguir
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {previewCards.map((c) => {
                        const frontUrl = c.code ? getCardImageUrl(c.code) : null;
                        const label = CardLabel(oracleType, c.code, c.isReversed);

                        return (
                          <div key={`preview-${c.idx}`} className="flex flex-col items-center gap-2">
                            <div className="w-[140px] h-[224px] rounded-xl bg-black/80 shadow-xl flex items-center justify-center overflow-hidden">
                              {frontUrl ? (
                                <img
                                  src={frontUrl}
                                  alt={label || c.code || "Carta"}
                                  className="w-full h-full object-contain"
                                  style={
                                    oracleType === "tarot" && c.isReversed ? { transform: "rotate(180deg)" } : undefined
                                  }
                                  loading="eager"
                                  decoding="async"
                                />
                              ) : (
                                <img
                                  src={backUrl}
                                  alt="Verso"
                                  className="w-full h-full object-contain"
                                  loading="eager"
                                  decoding="async"
                                />
                              )}
                            </div>
                            <p className="text-sm text-starlight-text text-center">{label || c.code || ""}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mesa */}
              {isGrandTableau ? (
                <GrandTableauGrid
                  shuffleKey={shuffleKey}
                  flippedCards={flippedCards}
                  selectedCards={selectedCards}
                  onCardClick={handleCardClick}
                  oracleType={oracleType}
                  currentDeck={currentDeck}
                />
              ) : (
                <div className="w-full flex justify-center">
                  <div className="relative h-[420px] w-full max-w-6xl">
                    {Array.from({ length: totalCards }, (_, i) => {
                      const deckCard = (currentDeck?.[i] as any) || undefined;
                      const cardCode = deckCard?.code as string | undefined;
                      const isReversed =
                        oracleType === "tarot" &&
                        !!(deckCard?.reversed || deckCard?.is_reversed || deckCard?.orientation === "reversed");

                      const pos = spread[i];

                      return (
                        <div
                          key={`${shuffleKey}-${i}`}
                          className="absolute left-1/2 top-1/2"
                          style={{
                            transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rot}deg)`,
                            zIndex: pos.z,
                          }}
                        >
                          <Card
                            index={i}
                            isFlipped={flippedCards.has(i)}
                            isSelected={selectedCards.includes(i)}
                            onClick={() => handleCardClick(i)}
                            delay={Math.min(i * 0.004, 0.25)}
                            oracleType={oracleType}
                            cardSize="medium"
                            cardCode={cardCode}
                            isReversed={isReversed}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
