// src/utils/oracleCards.ts
import { supabase } from "@/integrations/supabase/client";

export type OracleType = "tarot" | "lenormand" | "cartomancia";

const ORACLE_BUCKET = "oracle-cards";

// Cache simples em memória pra não ficar chamando getPublicUrl toda hora
const cardUrlCache = new Map<string, string>();
const backUrlCache = new Map<OracleType, string>();

export function getCardStoragePath(code: string): string {
  // TAROT – MAIORES
  if (code.startsWith("tarot_major_")) {
    return `tarot/majors/${code}.png`;
  }

  // TAROT – MENORES
  if (code.startsWith("tarot_minor_coins_")) {
    return `tarot/minors/coins/${code}.png`;
  }

  if (code.startsWith("tarot_minor_cups_")) {
    return `tarot/minors/cups/${code}.png`;
  }

  if (code.startsWith("tarot_minor_swords_")) {
    return `tarot/minors/swords/${code}.png`;
  }

  if (code.startsWith("tarot_minor_wands_")) {
    return `tarot/minors/wands/${code}.png`;
  }

  // LENORMAND
  if (code.startsWith("lenormand_")) {
    return `lenormand/${code}.png`;
  }

  // CARTOMANCIA
  if (code.startsWith("cartomancy_clubs_")) {
    return `cartomancy/clubs/${code}.png`;
  }

  if (code.startsWith("cartomancy_diamonds_")) {
    return `cartomancy/diamonds/${code}.png`;
  }

  if (code.startsWith("cartomancy_hearts_")) {
    return `cartomancy/hearts/${code}.png`;
  }

  if (code.startsWith("cartomancy_spades_")) {
    return `cartomancy/spades/${code}.png`;
  }

  throw new Error(`Código de carta desconhecido: ${code}`);
}

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

export function getCardImageUrl(code: string): string {
  const cached = cardUrlCache.get(code);
  if (cached) return cached;

  const path = getCardStoragePath(code);
  const { data } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;
  cardUrlCache.set(code, url);
  return url;
}

export function getCardBackImageUrl(oracleType: OracleType): string {
  const cached = backUrlCache.get(oracleType);
  if (cached) return cached;

  const path = getCardBackStoragePath(oracleType);
  const { data } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;
  backUrlCache.set(oracleType, url);
  return url;
}
