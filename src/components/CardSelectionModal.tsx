import { useEffect, useMemo, useRef, useState } from "react";
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
const TOTAL_CARDS: Record<OracleType, number> = {
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
const ORACLE_NAMES: Record<OracleType, string> = {
  tarot: "Tarot",
  lenormand: "Lenormand",
  cartomancia: "Cartomancia Clássica",
};

const TAROT_MAJORS: Record<number, string> = {
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

const LENORMAND_NAMES: Record<number, string> = {
  1: "Cavaleiro",
  2: "Trevo",
  3: "Navio",
  4: "Casa",
  5: "Árvore",
  6: "Nuvens",
  7: "Cobra",
  8: "Caixão",
  9: "Buquê",
  10: "Foice",
  11: "Chicote",
  12: "Pássaros",
  13: "Criança",
  14: "Raposa",
  15: "Urso",
  16: "Estrelas",
  17: "Cegonha",
  18: "Cão",
  19: "Torre",
  20: "Jardim",
  21: "Montanha",
  22: "Caminhos",
  23: "Ratos",
  24: "Coração",
  25: "Anel",
  26: "Livro",
  27: "Carta",
  28: "Homem",
  29: "Mulher",
  30: "Lírios",
  31: "Sol",
  32: "Lua",
  33: "Chave",
  34: "Peixes",
  35: "Âncora",
  36: "Cruz",
};

function baseNameFromCode(code: string): string {
  const raw = String(code ?? "").trim();
  const base = raw.split("?")[0].split("#")[0].split("/").pop() ?? raw;
  return base.replace(/\.[a-z0-9]+$/i, "");
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function romanToInt(r: string): number | null {
  const map: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
    xiii: 13,
    xiv: 14,
    xv: 15,
    xvi: 16,
    xvii: 17,
    xviii: 18,
    xix: 19,
    xx: 20,
    xxi: 21,
    "0": 0,
  };
  const k = (r || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null;
}

function formatCardLabel(type: OracleType, code?: string, reversed?: boolean): string {
  const isRev = type === "tarot" ? !!reversed : false;
  if (!code) return isRev ? "(invertida)" : "";

  const raw = String(code).trim();
  const base = baseNameFromCode(raw);
  const key = normalizeKey(base);
  const upper = base.toUpperCase();

  // ===== TAROT =====
  if (type === "tarot") {
    const hasSuitHint = /(wands|paus|cups|copas|swords|espadas|pentacles|coins|ouros)/i.test(key);

    // Detecta majors por número (major_XX, arcana_XX, etc) OU por prefixo numérico (ex: "00_o_louco")
    const majorNumMatch =
      key.match(/(?:^|_)(?:major|majors|arcana|arcanos|trump|trunfo)_?([01]?\d|2[01])(?:_|$)/) ||
      (!hasSuitHint ? key.match(/^(0?\d|1\d|2[01])(?:_|$)/) : null);

    if (majorNumMatch) {
      const n = Number(majorNumMatch[1]);
      if (Number.isFinite(n) && TAROT_MAJORS[n]) return TAROT_MAJORS[n] + (isRev ? " (invertida)" : "");
    }

    // Detecta majors por romano (i..xxi) quando NÃO houver pista de naipe
    if (!hasSuitHint) {
      const romanMatch = key.match(
        /^(0|i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx|xxi)(?:_|$)/,
      );
      if (romanMatch) {
        const n = romanToInt(romanMatch[1]);
        if (n !== null && TAROT_MAJORS[n]) return TAROT_MAJORS[n] + (isRev ? " (invertida)" : "");
      }
    }

    // Detecta majors por slug (inglês/pt)
    const majorSlugMap: Record<string, string> = {
      // EN
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
      strength: "A Força",
      the_strength: "A Força",
      hanged_man: "O Enforcado",
      the_hanged_man: "O Enforcado",
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

      // PT (sem acento por normalizeKey)
      louco: "O Louco",
      mago: "O Mago",
      sacerdotisa: "A Sacerdotisa",
      imperatriz: "A Imperatriz",
      imperador: "O Imperador",
      hierofante: "O Hierofante",
      papa: "O Hierofante",
      enamorados: "Os Enamorados",
      carro: "O Carro",
      justica: "A Justiça",
      eremita: "O Eremita",
      roda_da_fortuna: "A Roda da Fortuna",
      forca: "A Força",
      enforcado: "O Enforcado",
      morte: "A Morte",
      temperanca: "A Temperança",
      diabo: "O Diabo",
      torre: "A Torre",
      estrela: "A Estrela",
      lua: "A Lua",
      sol: "O Sol",
      julgamento: "O Julgamento",
      mundo: "O Mundo",
    };

    // Se não tem pista de naipe no nome, tenta slug de major antes dos minors
    if (!hasSuitHint) {
      const direct = key
        .replace(/^tarot_/, "")
        .replace(/^major_/, "")
        .replace(/^majors_/, "")
        .replace(/^arcana_/, "")
        .replace(/^the_/, "");

      if (majorSlugMap[direct]) return majorSlugMap[direct] + (isRev ? " (invertida)" : "");
      if (majorSlugMap[`the_${direct}`]) return majorSlugMap[`the_${direct}`] + (isRev ? " (invertida)" : "");

      const keys = Object.keys(majorSlugMap).sort((a, b) => b.length - a.length);
      for (const k of keys) {
        if (direct.includes(k)) return majorSlugMap[k] + (isRev ? " (invertida)" : "");
      }
    }

    // ===== Minors (rank + suit) =====
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
      [/PAUS|WANDS|\bW\b/i, "Paus"],
      [/COPAS|CUPS|\bH\b/i, "Copas"],
      [/ESPADAS|SWORDS|\bS\b|\bE\b/i, "Espadas"],
      [/OUROS|PENTACLES|COINS|\bD\b|\bO\b/i, "Ouros"],
    ];

    let suitLabel: string | null = null;
    for (const [re, label] of suitMap) {
      if (re.test(upper)) {
        suitLabel = label;
        break;
      }
    }

    const rankMatch =
      upper.match(/\b(ACE|PAGE|KNIGHT|KING|QUEEN|[AJQKN]|\d{1,2})\b/) ||
      upper.match(/^(ACE|PAGE|KNIGHT|KING|QUEEN|[AJQKN]|\d{1,2})/) ||
      upper.match(/(ACE|PAGE|KNIGHT|KING|QUEEN|[AJQKN]|\d{1,2})$/);

    const rankToken = rankMatch?.[1] ?? null;
    let rankLabel: string | null = null;

    if (rankToken) {
      rankLabel =
        rankMap[rankToken] ||
        rankMap[String(Number(rankToken))] ||
        (Number.isFinite(Number(rankToken)) ? String(Number(rankToken)) : rankToken);

      if (/^\d+$/.test(rankLabel)) {
        const n = Number(rankLabel);
        if (n === 1) rankLabel = "Ás";
      }
    }

    if (rankLabel && suitLabel) return `${rankLabel} de ${suitLabel}` + (isRev ? " (invertida)" : "");
    return base + (isRev ? " (invertida)" : "");
  }

  // ===== LENORMAND =====
  if (type === "lenormand") {
    const numMatch = upper.match(/\b([1-9]|[12]\d|3[0-6])\b/);
    if (numMatch) {
      const n = Number(numMatch[1]);
      if (LENORMAND_NAMES[n]) return LENORMAND_NAMES[n];
    }
    return base;
  }

  // ===== CARTOMANCIA =====
  if (type === "cartomancia") {
    const rankMap: Record<string, string> = {
      A: "Ás",
      ACE: "Ás",
      "1": "Ás",
      J: "Valete",
      JACK: "Valete",
      Q: "Rainha",
      QUEEN: "Rainha",
      K: "Rei",
      KING: "Rei",
    };

    const suit = /HEART|COPAS|\bH\b/i.test(upper)
      ? "Copas"
      : /DIAMOND|OUROS|\bD\b/i.test(upper)
        ? "Ouros"
        : /CLUB|PAUS|\bC\b/i.test(upper)
          ? "Paus"
          : /SPADE|ESPADAS|\bS\b/i.test(upper)
            ? "Espadas"
            : null;

    const r =
      upper.match(/\b(A|ACE|K|KING|Q|QUEEN|J|JACK|10|[2-9])\b/)?.[1] || upper.match(/(A|K|Q|J|10|[2-9])$/)?.[1] || null;

    const rankLabel = r ? rankMap[r] || (r === "1" ? "Ás" : r) : null;
    if (rankLabel && suit) return `${rankLabel} de ${suit}`;
    return base;
  }

  return base;
}

// ==============================
// Componentes auxiliares
// ==============================

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

function Card({ index, isFlipped, isSelected, onClick, delay, oracleType, cardSize, cardCode, isReversed }: CardProps) {
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
        {/* VERSO */}
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

        {/* FRENTE */}
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
              loading="lazy"
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
                loading="lazy"
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
  // ===== Anti "click-through" =====
  const [backdropCloseEnabled, setBackdropCloseEnabled] = useState(false);
  const openGuardTimerRef = useRef<number | null>(null);

  // Deck local + seleção
  const [localDeck, setLocalDeck] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [hasFlippedAny, setHasFlippedAny] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showSelectionPreview, setShowSelectionPreview] = useState(false);

  // Oráculo/método atuais (fallback para manter hooks estáveis)
  const current = currentOracleQueue?.[currentOracleIndex];
  const hasCurrent = !!current;

  const oracleType: OracleType = (current?.type ?? "tarot") as OracleType;
  const method: string = current?.method ?? "carta_dia";
  const isGrandTableau = method === "grand_tableau";

  // Deck corrente
  const currentDeck = localDeck;

  // Total de cartas na mesa
  const totalCards = (currentDeck?.length ? currentDeck.length : TOTAL_CARDS[oracleType]) || 0;

  // Quantas cartas precisa selecionar
  const cardsNeeded = CARDS_PER_METHOD[method] || 1;

  // Anti click-through
  useEffect(() => {
    if (!isOpen) {
      setBackdropCloseEnabled(false);
      if (openGuardTimerRef.current) {
        window.clearTimeout(openGuardTimerRef.current);
        openGuardTimerRef.current = null;
      }
      return;
    }

    setBackdropCloseEnabled(false);
    openGuardTimerRef.current = window.setTimeout(() => {
      setBackdropCloseEnabled(true);
      openGuardTimerRef.current = null;
    }, 350);

    return () => {
      if (openGuardTimerRef.current) {
        window.clearTimeout(openGuardTimerRef.current);
        openGuardTimerRef.current = null;
      }
    };
  }, [isOpen]);

  const handleBackdropClick = () => {
    if (!backdropCloseEnabled) return;
    onClose();
  };

  // Sincroniza deck local com oracleDecks
  useEffect(() => {
    if (!isOpen) return;
    if (!hasCurrent) return;

    const entry = oracleDecks?.find((d) => d.type === oracleType && d.method === method);
    const deckFromBackend = entry?.deck ?? [];

    if (!deckFromBackend.length) {
      setLocalDeck([]);
      setSelectedCards([]);
      setFlippedCards(new Set());
      setHasFlippedAny(false);
      setShowSelectionPreview(false);
      setShuffleKey((prev) => prev + 1);
      return;
    }

    setLocalDeck(deckFromBackend);
    setSelectedCards([]);
    setFlippedCards(new Set());
    setHasFlippedAny(false);
    setShowSelectionPreview(false);
    setShuffleKey((prev) => prev + 1);
  }, [isOpen, hasCurrent, method, oracleType, oracleDecks]);

  // Preload do verso
  useEffect(() => {
    if (!isOpen) return;
    const backUrl = getCardBackImageUrl(oracleType);
    const img = new Image();
    img.src = backUrl;
  }, [isOpen, oracleType]);

  // Preload progressivo das frentes
  const preloadAbortRef = useRef<{ aborted: boolean } | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    if (!localDeck?.length) return;

    const abort = { aborted: false };
    preloadAbortRef.current = abort;

    const codes = localDeck.map((c: any) => c?.code).filter(Boolean) as string[];
    let i = 0;
    const batch = 12;

    const tick = () => {
      if (abort.aborted) return;
      const end = Math.min(i + batch, codes.length);
      for (; i < end; i++) {
        const code = codes[i];
        const url = getCardImageUrl(code);
        const img = new Image();
        img.decoding = "async";
        img.src = url;
      }
      if (i < codes.length) window.setTimeout(tick, 80);
    };

    tick();

    return () => {
      abort.aborted = true;
    };
  }, [isOpen, oracleType, method, localDeck]);

  const handleCardClick = (cardIndex: number) => {
    if (!hasCurrent) return;

    // Grand Tableau: ao clicar em qualquer carta, vira todas
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
    if (!hasCurrent) return;
    if (hasFlippedAny || isShuffling) return;

    setIsShuffling(true);

    try {
      const entry = oracleDecks?.find((d) => d.type === oracleType && d.method === method);
      const spreadCode = (entry as any)?.spreadCode || method;

      const { data, error } = await supabase.functions.invoke("rerandomize-oracle", {
        body: {
          oracle_type: oracleType,
          spread_code: spreadCode,
        },
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
      setShowSelectionPreview(false);
      setShuffleKey((prev) => prev + 1);
    } catch (err) {
      console.error("Erro inesperado ao reembaralhar:", err);
    } finally {
      setIsShuffling(false);
    }
  };

  const handleProceed = () => {
    if (!hasCurrent) return;
    if (selectedCards.length === cardsNeeded || isGrandTableau) onComplete(selectedCards);
  };

  const canProceed = hasCurrent && (selectedCards.length === cardsNeeded || (isGrandTableau && hasFlippedAny));

  // Preview quando terminou a seleção (exceto GT)
  useEffect(() => {
    if (!isOpen) return;

    if (!isGrandTableau && cardsNeeded > 0 && selectedCards.length === cardsNeeded) {
      setShowSelectionPreview(true);
    } else if (selectedCards.length < cardsNeeded) {
      setShowSelectionPreview(false);
    }
  }, [isOpen, selectedCards, cardsNeeded, isGrandTableau]);

  const previewCards = useMemo(() => {
    if (!hasCurrent) return [];
    if (isGrandTableau) return [];

    return selectedCards.map((idx) => {
      const deckCard = (currentDeck?.[idx] as any) || undefined;
      const code = deckCard?.code as string | undefined;
      const isReversed =
        oracleType === "tarot" &&
        !!(deckCard?.reversed || deckCard?.is_reversed || deckCard?.orientation === "reversed");
      return { idx, code, isReversed };
    });
  }, [hasCurrent, isGrandTableau, selectedCards, currentDeck, oracleType]);

  useEffect(() => {
    if (!isOpen) return;
    if (!previewCards.length) return;

    for (const c of previewCards) {
      if (!c.code) continue;
      const url = getCardImageUrl(c.code);
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    }
  }, [isOpen, previewCards]);

  // IMPORTANTE: hooks acima sempre rodam -> sem "Rendered more hooks..."
  if (!isOpen) return null;

  if (!hasCurrent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-starlight-text">
        Carregando tiragem...
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-night-sky/90 backdrop-blur-md" onClick={handleBackdropClick} />

          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <div
              className="relative pointer-events-auto w-full max-w-7xl flex flex-col"
              style={{ height: "calc(100vh - 32px)" }}
            >
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
                className="bg-midnight-surface border border-obsidian-border rounded-t-3xl shadow-2xl"
                style={{ padding: "24px" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl text-starlight-text">{ORACLE_NAMES[oracleType]}</h2>
                    <p className="text-base text-moonlight-text/80" style={{ marginTop: "8px" }}>
                      {isGrandTableau
                        ? "Clique em qualquer carta para revelar todas"
                        : `Escolha ${cardsNeeded} ${cardsNeeded === 1 ? "carta" : "cartas"}`}
                      {!isGrandTableau && selectedCards.length > 0 && (
                        <span className="text-mystic-indigo ml-2">
                          ({selectedCards.length}/{cardsNeeded})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto bg-midnight-surface border-x border-obsidian-border"
                style={{
                  background: `
                    radial-gradient(ellipse at center, rgba(16, 19, 34, 0.95) 0%, rgba(5, 8, 22, 0.98) 100%),
                    repeating-linear-gradient(0deg, rgba(99, 102, 241, 0.03) 0px, transparent 1px, transparent 2px, rgba(99, 102, 241, 0.03) 3px),
                    repeating-linear-gradient(90deg, rgba(249, 115, 22, 0.02) 0px, transparent 1px, transparent 2px, rgba(249, 115, 22, 0.02) 3px),
                    linear-gradient(135deg, #0a0e1a 0%, #050816 50%, #0a0e1a 100%)
                  `,
                  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: "24px 32px" }} className="relative">
                  <img src={getCardBackImageUrl(oracleType)} alt="" className="hidden" />

                  <div
                    className={
                      !isGrandTableau && showSelectionPreview
                        ? "transition-all duration-300 blur-sm pointer-events-none"
                        : "transition-all duration-300"
                    }
                  >
                    {isGrandTableau ? (
                      <GrandTableauGrid
                        shuffleKey={shuffleKey}
                        flippedCards={flippedCards}
                        selectedCards={selectedCards}
                        onCardClick={handleCardClick}
                        oracleType={oracleType}
                        currentDeck={localDeck}
                      />
                    ) : (
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "center",
                          alignItems: "flex-start",
                          gap: "0",
                          margin: "0 auto",
                          transform: totalCards > 52 ? "translateX(-12px)" : "translateX(-16px)",
                        }}
                      >
                        {Array.from({ length: totalCards }, (_, i) => {
                          const cardSize: "small" | "medium" = totalCards > 52 ? "small" : "medium";
                          const cardWidth = cardSize === "small" ? 60 : 80;
                          const visiblePart = cardWidth * 0.6;

                          const deckCard = localDeck[i] as any | undefined;
                          const cardCode = deckCard?.code as string | undefined;
                          const isReversed =
                            oracleType === "tarot" &&
                            !!(deckCard?.reversed || deckCard?.is_reversed || deckCard?.orientation === "reversed");

                          return (
                            <div
                              key={`${shuffleKey}-${i}`}
                              style={{
                                width: `${visiblePart}px`,
                                height: `${cardWidth * 1.5}px`,
                                marginTop: "12px",
                                marginBottom: "12px",
                                position: "relative",
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: `${cardWidth}px`,
                                  height: `${cardWidth * 1.5}px`,
                                  position: "absolute",
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
                                  cardCode={cardCode}
                                  isReversed={isReversed}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Preview (sem borda individual nas imagens) */}
                  {!isGrandTableau && showSelectionPreview && selectedCards.length > 0 && (
                    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
                      <div className="relative max-w-5xl w-full mx-auto">
                        <div className="absolute inset-0 bg-night-sky/80 backdrop-blur-xl rounded-3xl border border-obsidian-border shadow-2xl" />

                        <div className="relative z-10 flex flex-col items-center gap-4 p-6 md:p-8">
                          <p className="text-sm md:text-base text-moonlight-text/80 text-center">Cartas selecionadas</p>

                          <div className="flex flex-wrap justify-center gap-4">
                            {previewCards.map((c) => {
                              const frontUrl = c.code ? getCardImageUrl(c.code) : null;
                              const label = formatCardLabel(oracleType, c.code, c.isReversed);

                              return (
                                <div key={`preview-${c.idx}`} className="flex flex-col items-center gap-2">
                                  <div className="w-[140px] h-[224px] rounded-xl overflow-hidden shadow-2xl bg-black/30">
                                    {frontUrl ? (
                                      <img
                                        src={frontUrl}
                                        alt={label || c.code || "Carta"}
                                        className="w-full h-full object-contain"
                                        style={
                                          oracleType === "tarot" && c.isReversed
                                            ? { transform: "rotate(180deg)" }
                                            : undefined
                                        }
                                        loading="eager"
                                        decoding="async"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-starlight-text/70">
                                        {c.idx + 1}
                                      </div>
                                    )}
                                  </div>

                                  <p className="text-sm text-starlight-text text-center">{label || ""}</p>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <Button
                              size="lg"
                              className="bg-mystic-indigo hover:bg-mystic-indigo-dark border-2 border-mystic-indigo text-starlight-text"
                              style={{ padding: "16px 28px" }}
                              onClick={handleProceed}
                              disabled={!canProceed}
                            >
                              <Sparkles className="mr-2 w-5 h-5" />
                              Seguir
                            </Button>

                            <Button
                              size="lg"
                              variant="outline"
                              className="border-obsidian-border text-starlight-text"
                              style={{ padding: "16px 28px" }}
                              onClick={() => setShowSelectionPreview(false)}
                            >
                              Voltar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="bg-midnight-surface border border-obsidian-border rounded-b-3xl shadow-2xl"
                style={{ padding: "24px" }}
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-oracle-ember/90 hover:bg-oracle-ember border-2 border-oracle-ember text-starlight-text disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-obsidian-border disabled:border-obsidian-border"
                    style={{ padding: "16px 32px" }}
                    onClick={handleShuffle}
                    disabled={hasFlippedAny || isShuffling}
                  >
                    <Shuffle className="mr-2 w-5 h-5" />
                    {isShuffling ? "Reembaralhando..." : "Embaralhar"}
                  </Button>

                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark border-2 border-mystic-indigo text-starlight-text disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ padding: "16px 32px" }}
                    onClick={handleProceed}
                    disabled={!canProceed}
                  >
                    <Sparkles className="mr-2 w-5 h-5" />
                    Seguir
                  </Button>
                </div>

                {!canProceed && hasFlippedAny && !isGrandTableau && (
                  <p className="text-sm text-oracle-ember text-center" style={{ marginTop: "12px" }}>
                    Selecione mais {cardsNeeded - selectedCards.length}{" "}
                    {cardsNeeded - selectedCards.length === 1 ? "carta" : "cartas"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
