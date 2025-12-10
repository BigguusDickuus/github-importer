// src/utils/oracleCards.ts
import { supabase } from "@/integrations/supabase/client";

export type OracleType = "tarot" | "lenormand" | "cartomancia";

const ORACLE_BUCKET = "oracle-cards";

// Cache simples em memória pra não ficar chamando getPublicUrl toda hora
const cardUrlCache = new Map<string, string>();
const backUrlCache = new Map<OracleType, string>();

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
  switch (oracleType) {
    case "tarot":
      return "tarot/tarot_back.png";
    case "lenormand":
      return "lenormand/lenormand_back.png";
    case "cartomancia":
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
  const cached = backUrlCache.get(oracleType);
  if (cached) return cached;

  const path = getCardBackStoragePath(oracleType);
  if (!path) {
    return "";
  }

  const { data } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  backUrlCache.set(oracleType, url);
  return url;
}
