// src/utils/oracleCards.ts
import { supabase } from "@/integrations/supabase/client";

/**
 * IMPORTANTE:
 * - O backend/edge usa "cartomancy"
 * - Em alguns lugares antigos do front pode existir "cartomancia"
 * Aqui aceitamos ambos e NORMALIZAMOS para "cartomancy" internamente.
 */
export type OracleType = "tarot" | "lenormand" | "cartomancy" | "cartomancia";
type OracleTypeCanonical = "tarot" | "lenormand" | "cartomancy";

export function normalizeOracleType(t: any): OracleTypeCanonical {
  if (t === "cartomancia") return "cartomancy";
  if (t === "cartomancy") return "cartomancy";
  if (t === "tarot") return "tarot";
  if (t === "lenormand") return "lenormand";
  // fallback seguro (não quebra o app)
  console.warn("[oracleCards] normalizeOracleType: tipo desconhecido:", t);
  return "tarot";
}

const ORACLE_BUCKET = "oracle-cards";

// Cache simples em memória pra não ficar chamando getPublicUrl toda hora
const cardUrlCache = new Map<string, string>();
const backUrlCache = new Map<OracleTypeCanonical, string>();

/**
 * Mapeia o código lógico da carta para o caminho no bucket.
 * NÃO lança erro: se não reconhecer, loga e retorna string vazia
 * pra não quebrar o React.
 */
export function getCardStoragePath(code: string): string {
  try {
    // TAROT – MAIORES
    if (code.startsWith("tarot_major_")) {
      return `tarot/majors/${code}.png`;
    }

    // TAROT – MOEDAS / OUROS
    if (code.startsWith("tarot_minor_coins_")) {
      return `tarot/minors/coins/${code}.png`;
    }

    // TAROT – COPAS
    if (code.startsWith("tarot_minor_cups_")) {
      return `tarot/minors/cups/${code}.png`;
    }

    // TAROT – ESPADAS
    if (code.startsWith("tarot_minor_swords_")) {
      return `tarot/minors/swords/${code}.png`;
    }

    // TAROT – PAUS
    if (code.startsWith("tarot_minor_wands_")) {
      return `tarot/minors/wands/${code}.png`;
    }

    // LENORMAND
    if (code.startsWith("lenormand_")) {
      return `lenormand/${code}.png`;
    }

    // CARTOMANCIA – PAUS
    if (code.startsWith("cartomancy_clubs_")) {
      return `cartomancy/clubs/${code}.png`;
    }

    // CARTOMANCIA – OUROS
    if (code.startsWith("cartomancy_diamonds_")) {
      return `cartomancy/diamonds/${code}.png`;
    }

    // CARTOMANCIA – COPAS
    if (code.startsWith("cartomancy_hearts_")) {
      return `cartomancy/hearts/${code}.png`;
    }

    // CARTOMANCIA – ESPADAS
    if (code.startsWith("cartomancy_spades_")) {
      return `cartomancy/spades/${code}.png`;
    }

    console.warn("[oracleCards] Código de carta desconhecido:", code);
    return "";
  } catch (e) {
    console.error("[oracleCards] Erro em getCardStoragePath:", code, e);
    return "";
  }
}

/**
 * Caminho dos VERSOS no bucket.
 * Garante que temos:
 * - oracle-cards/tarot/tarot_back.png
 * - oracle-cards/lenormand/lenormand_back.png
 * - oracle-cards/cartomancy/cartomancy_back.png
 */
export function getCardBackStoragePath(oracleType: OracleType): string {
  const t = normalizeOracleType(oracleType);

  switch (t) {
    case "tarot":
      return "tarot/tarot_back.png";
    case "lenormand":
      return "lenormand/lenormand_back.png";
    case "cartomancy":
      return "cartomancy/cartomancy_back.png";
    default:
      console.warn("[oracleCards] Tipo de oráculo desconhecido para verso:", oracleType);
      return "";
  }
}

/**
 * Retorna URL pública da FRENTE da carta, com cache.
 */
export function getCardImageUrl(code: string): string {
  const cached = cardUrlCache.get(code);
  if (cached) return cached;

  const path = getCardStoragePath(code);
  if (!path) {
    // path vazio -> não tenta chamar o storage, deixa o front cair no placeholder
    return "";
  }

  const { data } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  cardUrlCache.set(code, url);
  return url;
}

/**
 * Retorna URL pública do VERSO, com cache.
 */
export function getCardBackImageUrl(oracleType: OracleType): string {
  const t = normalizeOracleType(oracleType);

  const cached = backUrlCache.get(t);
  if (cached) return cached;

  const path = getCardBackStoragePath(t);
  if (!path) return "";

  const { data } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  backUrlCache.set(t, url);
  return url;
}
