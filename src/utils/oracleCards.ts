// src/utils/oracleCards.ts
import { supabase } from "@/integrations/supabase/client";

export type OracleType = "tarot" | "lenormand" | "cartomancia";

const ORACLE_BUCKET = "oracle-cards";

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
    // Ex.: lenormand_01_rider → lenormand/lenormand_01_rider.png
    return `lenormand/${code}.png`;
  }

  // CARTOMANCY
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
  const path = getCardStoragePath(code);
  const { data } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function getCardBackImageUrl(oracleType: OracleType): string {
  const path = getCardBackStoragePath(oracleType);
  const { data } = supabase.storage.from(ORACLE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
