// src/utils/oracleCards.ts
import { supabase } from "@/integrations/supabase/client";

export type OracleType = "tarot" | "lenormand" | "cartomancia";

const ORACLE_BUCKET = "oracle-cards";

// Cache em memória pra não ficar gerando URL o tempo todo
const cardUrlCache = new Map<string, string>();
const backUrlCache = new Map<OracleType, string>();

/**
 * Mapeia o código lógico da carta para o caminho no bucket.
 * Isso precisa estar alinhado com a estrutura do archive.zip que você subiu.
 */
export function getCardStoragePath(code: string): string {
  // TAROT – ARCANOS MAIORES
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

  throw new Error(`Código de carta desconhecido: ${code}`);
}

/**
 * Caminho dos VERSOS no bucket.
 * Garante que temos:
 * - oracle-cards/tarot/tarot_back.png
 * - oracle-cards/lenormand/lenormand_back.png
 * - oracle-cards/cartomancy/cartomancy_back.png
 */
export function getCardBackStoragePath(oracleType: OracleType): string {
  if (oracleType === "tarot") {
    return "tarot/tarot_back.png";
  }

  if (oracleType === "lenormand") {
    return "lenormand/lenormand_back.png";
  }

  if (oracleType === "cartomancia") {
    return "cartomancy/cartomancy_back.png";
  }

  throw new Error(`Tipo de oráculo desconhecido: ${oracleType}`);
}

/**
 * Retorna URL pública da FRENTE da carta, com cache.
 */
export function getCardImageUrl(code: string): string {
  const cached = cardUrlCache.get(code);
  if (cached) return cached;

  const path = getCardStoragePath(code);
  const { data, error } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);

  if (error) {
    console.error("Erro ao gerar URL pública da carta:", code, error);
  }

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
  const { data, error } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);

  if (error) {
    console.error("Erro ao gerar URL pública do verso:", oracleType, error);
  }

  const url = data.publicUrl;
  backUrlCache.set(oracleType, url);
  return url;
}
