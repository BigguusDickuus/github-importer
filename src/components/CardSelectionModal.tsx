import { useState, useEffect } from "react";
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
    orientation?: string; // "reversed" ou "upright", se você escolher esse formato
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
  oracleDecks?: OracleDeck[]; // <- NOVO
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
  // Verifica se há um oráculo na fila antes de continuar
  if (!currentOracleQueue || currentOracleQueue.length === 0 || !currentOracleQueue[currentOracleIndex]) {
    return null;
  }

  // Tipo de oráculo e método atual
  const { type: oracleType, method } = currentOracleQueue[currentOracleIndex];
  const isGrandTableau = method === "grand_tableau";

  // Deck que efetivamente está sendo exibido na mesa
  // (começa vazio, será sincronizado com o que veio do backend via oracleDecks)
  const [localDeck, setLocalDeck] = useState<any[]>([]);

  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [hasFlippedAny, setHasFlippedAny] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);

  // Deck "corrente" que o resto do componente já usa (inclusive GrandTableauGrid)
  const currentDeck = localDeck;

  // Número total de cartas na mesa
  // PRIORIDADE: usar sempre o tamanho do deck retornado pela edge function.
  // Se por algum motivo vier vazio, cai no mapping estático como fallback.
  const totalCards = (currentDeck && currentDeck.length > 0 ? currentDeck.length : TOTAL_CARDS[oracleType]) || 0;

  // Quantidade de cartas que o usuário precisa escolher para esse método
  const cardsNeeded = CARDS_PER_METHOD[method] || 1;

  // Sempre que abrirmos o modal OU trocar o método/oráculo,
  // sincroniza o deck local com o que veio do backend e reseta estado.
  useEffect(() => {
    if (!isOpen) return;

    const entry = oracleDecks?.find((d) => d.type === oracleType && d.method === method);
    const deckFromBackend = entry?.deck ?? [];

    if (!deckFromBackend.length) {
      // fallback: zera deck local, mas não quebra o layout
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
    setSelectedCards((prev) => [...prev, cardIndex]);
    setFlippedCards((prev) => new Set([...prev, cardIndex]));
    setHasFlippedAny(true);
    if (onCardSelect) {
      onCardSelect(oracleType, cardIndex);
    }
  };

  const handleShuffle = async () => {
    // Não pode embaralhar após virar primeira carta
    // e não dispara de novo enquanto já está reembaralhando
    if (hasFlippedAny || isShuffling) return;

    setIsShuffling(true);

    try {
      // Descobre o "entry" desse oráculo/método no array oracleDecks
      const entry = oracleDecks?.find((d) => d.type === oracleType && d.method === method);

      // spread_code que vamos mandar para a função (se tiver no entry, usa; senão cai no method)
      const spreadCode = (entry as any)?.spreadCode || method;

      // Chama a edge function rerandomize-oracle
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

      // Opcional, mas importante: atualiza o objeto dentro de oracleDecks
      // para que quem usar esse deck depois (GPT, interpretação, etc.) veja o novo deck.
      if (entry) {
        (entry as any).deck = newDeck;
        if ((data as any)?.spread_code) {
          (entry as any).spreadCode = (data as any).spread_code;
        }
      }

      // Atualiza o deck local que a mesa está usando
      setLocalDeck(newDeck);

      // Reseta seleção/animação e força a animação de spread de novo
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
    if (selectedCards.length === cardsNeeded || isGrandTableau) {
      onComplete(selectedCards);
    }
  };

  const canProceed = selectedCards.length === cardsNeeded || (isGrandTableau && hasFlippedAny);

  // Quando o usuário termina de escolher as cartas (exceto Grand Tableau),
  // mostramos o preview em destaque
  const [showSelectionPreview, setShowSelectionPreview] = useState(false);

  useEffect(() => {
    if (!isGrandTableau && cardsNeeded > 0 && selectedCards.length === cardsNeeded) {
      setShowSelectionPreview(true);
    } else if (selectedCards.length < cardsNeeded) {
      // Se por algum motivo voltarmos a ter menos cartas (reset, embaralhar, outro método),
      // some o preview
      setShowSelectionPreview(false);
    }
  }, [selectedCards, cardsNeeded, isGrandTableau]);

  // ===== Label da carta (preview) + preload de imagem =====
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

    // ===== TAROT =====
    if (type === "tarot") {
      // majors: tenta por slug (fool/magician/etc) e por número (sem depender de \b)
      const normalized = raw
        .toLowerCase()
        .split("/")
        .pop()!
        .replace(/\.[a-z0-9]+$/i, ""); // remove extensão

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
        // Normaliza pra algo tipo "tarot_major_10_wheel_of_fortune"
        const norm = normalized.replace(/[^a-z0-9]+/g, "_");
        const normNoExt = norm.replace(/^_+|_+$/g, "");

        // 1) Padrão forte: (tarot_)?major_XX_slug
        const m = normNoExt.match(/(?:^|_) (?:tarot_)?major_([01]?\d|2[01])_([a-z0-9_]+)$/i);
        // Regex acima tem espaço acidental se colar errado; então use esta versão correta:
        const m2 = normNoExt.match(/(?:^|_)(?:tarot_)?major_([01]?\d|2[01])_([a-z0-9_]+)$/i);

        if (m2) {
          const n = Number(m2[1]);
          const slug = m2[2].replace(/^the_/, "");
          const name = majorSlugMap[slug] || majorSlugMap[`the_${slug}`] || majors[n];
          if (name) return name + (isRev ? " (invertida)" : "");
        }

        // 2) Match por slug direto (tirando prefixos comuns)
        const directSlug = normNoExt
          .replace(/^tarot_/, "")
          .replace(/^major_/, "")
          .replace(/^the_/, "");

        if (majorSlugMap[directSlug]) return majorSlugMap[directSlug] + (isRev ? " (invertida)" : "");
        if (majorSlugMap[`the_${directSlug}`]) return majorSlugMap[`the_${directSlug}`] + (isRev ? " (invertida)" : "");

        // 3) Fallback por "contains" (keys maiores primeiro)
        const keys = Object.keys(majorSlugMap).sort((a, b) => b.length - a.length);
        for (const k of keys) {
          if (directSlug.includes(k)) {
            return majorSlugMap[k] + (isRev ? " (invertida)" : "");
          }
        }

        // 4) Fallback por número 0..21 (delimitado por não-dígito)
        const numMatch = normalized.match(/(?:^|[^0-9])([01]?\d|2[01])(?:[^0-9]|$)/);
        if (numMatch) {
          const n = Number(numMatch[1]);
          if (Number.isFinite(n) && majors[n]) {
            return majors[n] + (isRev ? " (invertida)" : "");
          }
        }
      }

      // minors: rank + suit
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

      if (!suitLabel) {
        const m1 = upper.match(/(\d{1,2})([WCHSPEOD])/);
        const m2 = upper.match(/([WCHSPEOD])(\d{1,2})/);
        const suitChar = (m1?.[2] || m2?.[1] || "").toUpperCase();
        if (suitChar) {
          for (const [re, label] of suitMap) {
            if (re.test(suitChar)) {
              suitLabel = label;
              break;
            }
          }
        }
      }

      const rankLabel = rankToken ? rankMap[rankToken] || rankMap[String(Number(rankToken))] || rankToken : null;

      if (rankLabel && suitLabel) {
        return `${rankLabel} de ${suitLabel}` + (isRev ? " (invertida)" : "");
      }

      return raw + (isRev ? " (invertida)" : "");
    }

    // ===== LENORMAND =====
    if (type === "lenormand") {
      const numMatch = upper.match(/\b([1-9]|[12]\d|3[0-6])\b/);
      if (numMatch) {
        const n = Number(numMatch[1]);
        const lenormandNames: Record<number, string> = {
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
        if (lenormandNames[n]) return lenormandNames[n];
      }
      return raw;
    }

    // ===== CARTOMANCIA =====
    if (type === "cartomancia") {
      const suit = /H|HEART/i.test(upper)
        ? "Copas"
        : /D|DIAMOND/i.test(upper)
          ? "Ouros"
          : /C|CLUB/i.test(upper)
            ? "Paus"
            : /S|SPADE/i.test(upper)
              ? "Espadas"
              : null;

      const r =
        upper.match(/\b(A|ACE|K|KING|Q|QUEEN|J|JACK|10|[2-9])\b/)?.[1] ||
        upper.match(/(A|K|Q|J|10|[2-9])$/)?.[1] ||
        null;

      const rankLabel = r ? rankMap[r] || r : null;
      if (rankLabel && suit) return `${rankLabel} de ${suit}`;
      return raw;
    }

    return raw;
  };

  // Componente individual da carta com animação de flip 3D
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
        transition={{
          duration: 0.3,
          delay,
          ease: "easeOut",
        }}
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
          {/* VERSO DA CARTA */}
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
            {/* placeholder enquanto o verso não carrega */}
            {!backLoaded && <div className="w-full h-full bg-black border border-neutral-700" />}

            <img
              src={backUrl}
              alt="Verso da carta"
              className="w-full h-full object-contain"
              style={{ display: backLoaded ? "block" : "none" }}
              onLoad={() => setBackLoaded(true)}
              loading="lazy"
            />
          </div>

          {/* FRENTE DA CARTA */}
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            {/* placeholder enquanto a frente não carrega */}
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
              />
            )}

            {/* fallback se por algum motivo não tiver frontUrl */}
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

  // Componente para o layout especial do Grand Tableau
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
    // Tamanho das cartas no Grand Tableau
    const cardWidth = 70; // px
    const cardHeight = cardWidth * 1.5; // aspect ratio 2:3
    const gap = 12; // gap entre cartas

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Primeiras 4 linhas: 8 cartas cada em desktop, responsivo em mobile */}
        {[0, 1, 2, 3].map((row) => (
          <div key={`row-${row}`} className="flex flex-wrap justify-center gap-3 max-w-full">
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
                  oracleType={oracleType}
                  currentDeck={currentDeck}
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
                oracleType={oracleType}
                currentDeck={currentDeck}
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

    // Pega a carta correspondente no deck retornado pela edge function
    const deckCard = (currentDeck[cardIndex] as any) || undefined;
    const cardCode = deckCard?.code as string | undefined;

    const isReversed =
      oracleType === "tarot" && !!(deckCard?.reversed || deckCard?.is_reversed || deckCard?.orientation === "reversed");

    const backUrl = getCardBackImageUrl(oracleType);
    const frontUrl = cardCode ? getCardImageUrl(cardCode) : null;

    const [backLoaded, setBackLoaded] = useState(false);
    const [frontLoaded, setFrontLoaded] = useState(false);

    return (
      <div
        className="flex flex-col items-center gap-2"
        style={{
          width: `${cardWidth}px`,
          flexShrink: 0,
        }}
      >
        {/* Carta com flip 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: isSelected ? 1.05 : 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: delay,
            ease: "easeOut",
          }}
          className="relative cursor-pointer"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            perspective: "1000px",
          }}
          onClick={onClick}
        >
          <motion.div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
            }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
          >
            {/* Verso da carta */}
            <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
              {!backLoaded && <div className="w-full h-full bg-black border border-neutral-700" />}

              <img
                src={backUrl}
                alt="Verso da carta"
                className="w-full h-full object-contain"
                style={{ display: backLoaded ? "block" : "none" }}
                onLoad={() => setBackLoaded(true)}
                loading="lazy"
              />
            </div>

            {/* Frente da carta */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
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
                />
              )}

              {!frontUrl && !frontLoaded && (
                <div className="w-full h-full flex items-center justify-center bg-black border border-neutral-700 text-xs text-starlight-text/60">
                  {cardIndex + 1}
                </div>
              )}
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

        {/* Legenda da casa (sempre visível) */}
        <div
          className="text-center"
          style={{
            width: `${cardWidth}px`,
          }}
        >
          <p className="text-xs text-mystic-indigo leading-tight">
            {house.number}. {house.name}
          </p>
        </div>
      </div>
    );
  }
}
