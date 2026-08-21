export type CallState = "draft" | "live" | "closed" | "archived";
export type Direction = "long" | "short";

export interface ResearchBlock {
  heading: string;
  body: string;
}

/** Fields every visitor may see, for any published call. */
export interface PublicCall {
  id: string;
  callNumber: number;
  state: CallState;
  price: number;
  direction: Direction;
  sector: string;
  term: string;
  coverage: string;
  segment: string;
  timeframe: string;
  confidence: number;
  series: number[];
  publishedAt: string | null;
  closedAt: string | null;
  potentialPct: number;
  /** Optional admin-set display override for Potential left. */
  potentialPctOverride?: number;
  riskPct: number;
  /** True while the paid fields below are withheld by the server. */
  locked: boolean;
  /** Present only when `locked` is false. */
  stock?: string;
  ticker?: string;
  exchange?: string;
  entry?: number;
  target?: number;
  stopLoss?: number;
  currentPrice?: number;
  exitPrice?: number;
  changePct?: number;
  summary?: string;
  view?: string;
  research?: ResearchBlock[];
  catalysts?: string[];
  chartImage?: string;
  checkoutHeadline?: string;
  checkoutSubtext?: string;
}

/** A fully readable call: every paid field is guaranteed present. */
export interface FullCall extends PublicCall {
  locked: false;
  stock: string;
  ticker: string;
  exchange: string;
  entry: number;
  target: number;
  stopLoss: number;
  currentPrice: number;
  changePct: number;
  summary: string;
  view: string;
  research: ResearchBlock[];
  catalysts: string[];
}

export const isClosed = (c: PublicCall) => c.state === "closed" || c.state === "archived";

/** Realised return for closed calls, live return for open ones, 0 while locked. */
export const perfPct = (c: PublicCall) => {
  if (c.locked || !c.entry) return 0;
  const ref = isClosed(c) ? (c.exitPrice ?? c.currentPrice) : c.currentPrice;
  if (!ref) return 0;
  return ((ref - c.entry) / c.entry) * 100 * (c.direction === "short" ? -1 : 1);
};

export const rrRatio = (c: PublicCall | StockCall) => {
  const potential = "potentialPct" in c ? c.potentialPct : potentialPct(c);
  const risk = "riskPct" in c ? c.riskPct : riskPct(c);
  return Math.abs(potential) / Math.max(risk, 0.01);
};

export const TERMS = ["Short Term", "Swing", "Positional", "Long Term"] as const;

/* ---------------------------------------------------------------------------
 * Legacy model, still used by the current UI while pages are migrated to the
 * database-backed PublicCall/FullCall types above.
 * ------------------------------------------------------------------------ */
export type CallStatus = "draft" | "live" | "closed" | "archived";
export type AccessTier = "paid" | "free";
export type Term = "Short Term" | "Swing" | "Positional" | "Long Term";

export interface StockCall {
  id: string;
  callNumber: number;
  chartImage?: string;
  stock: string;
  ticker: string;
  exchange: string;
  sector: string;
  direction: Direction;
  status: CallStatus;
  access: AccessTier;
  price: number;
  currentPrice: number;
  entry: number;
  target: number;
  stopLoss: number;
  term: Term;
  coverage: string;
  segment: string;
  timeframe: string;
  changePct: number;
  view: string;
  publishedAt: string;
  closedAt?: string;
  exitPrice?: number;
  summary: string;
  research: ResearchBlock[];
  catalysts: string[];
  series: number[];
  confidence: number;
  /** Safe display metrics for locked live calls; never contain paid price levels. */
  potentialPctDisplay?: number;
  riskPctDisplay?: number;
  /** Optional admin override for the public "Potential left" value. */
  potentialPctOverride?: number;
  /** Optional admin override for realised gain/loss on closed calls. */
  realisedPnlPctOverride?: number;
  checkoutHeadline?: string;
  checkoutSubtext?: string;
}

export const potentialPct = (c: StockCall) => {
  if (c.potentialPctOverride !== undefined && Number.isFinite(c.potentialPctOverride)) {
    return c.potentialPctOverride;
  }
  if (c.entry <= 0 && c.potentialPctDisplay !== undefined) return c.potentialPctDisplay;
  return c.entry > 0
    ? ((c.target - c.entry) / c.entry) * 100 * (c.direction === "short" ? -1 : 1)
    : 0;
};

export const riskPct = (c: StockCall) => {
  if (c.entry <= 0 && c.riskPctDisplay !== undefined) return c.riskPctDisplay;
  return c.entry > 0 ? Math.abs((c.entry - c.stopLoss) / c.entry) * 100 : 0;
};

export const livePnlPct = (c: StockCall) =>
  c.entry > 0 && Number.isFinite(c.currentPrice)
    ? ((c.currentPrice - c.entry) / c.entry) * 100 * (c.direction === "short" ? -1 : 1)
    : 0;

export const closedPnlPct = (c: StockCall) => {
  if (c.realisedPnlPctOverride !== undefined && Number.isFinite(c.realisedPnlPctOverride)) {
    return c.realisedPnlPctOverride;
  }
  return c.exitPrice && c.entry > 0
    ? ((c.exitPrice - c.entry) / c.entry) * 100 * (c.direction === "short" ? -1 : 1)
    : 0;
};

export const isUnlocked = (c: StockCall) => c.access === "free" || c.status !== "live";
