// Oracle types
export type OracleType = "tarot" | "lenormand" | "cartomancy";

export type OracleCardCode = {
  code: string;
  orientation?: "upright" | "reversed";
};

export type OracleRerollLog = {
  ts: string; // ISO string
  deck: OracleCardCode[];
};

export type OracleQueueEntry = {
  oracle_type: OracleType;
  method: string; // ex: "celtic_cross", "three_cards", "grand_tableau"
  spread_code: string; // pode ser igual ao method
  initial_deck?: OracleCardCode[];
  rerolls?: OracleRerollLog[];
  final_deck: OracleCardCode[];
  selected_indices: number[];
  selected_cards: (OracleCardCode & { index: number })[];
};

export type ReadingOraclesPayload = {
  queue: OracleQueueEntry[];
};
