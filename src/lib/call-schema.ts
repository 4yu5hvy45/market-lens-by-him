import { z } from "zod";
import { normalizeSeries } from "./series";

/**
 * Drafts are intentionally permissive. A draft is a working research note,
 * not a published trade. Nothing is required at draft-save time.
 */
const researchDraftSchema = z.object({
  heading: z.string().default(""),
  body: z.string().default(""),
});

export const callDraftSchema = z.object({
  callNumber: z.coerce.number().int().min(1).max(10),
  state: z.enum(["draft", "live", "closed", "archived"]).default("draft"),
  price: z.coerce.number().min(0).default(499),
  stock: z.string().default(""),
  ticker: z.string().default(""),
  exchange: z.string().default("NSE / BSE"),
  sector: z.string().default(""),
  direction: z.enum(["long", "short"]).default("long"),
  entry: z.coerce.number().min(0).default(0),
  target: z.coerce.number().min(0).default(0),
  stopLoss: z.coerce.number().min(0).default(0),
  currentPrice: z.coerce.number().min(0).default(0),
  term: z.string().default("Swing"),
  coverage: z.string().default("Weekly Pick"),
  segment: z.string().default("Cash / Equity"),
  timeframe: z.string().default(""),
  changePct: z.coerce.number().default(0),
  confidence: z.coerce.number().int().min(0).max(100).default(70),
  summary: z.string().default(""),
  view: z.string().default(""),
  research: z.array(researchDraftSchema).default([]),
  catalysts: z.array(z.string()).default([]),
  series: z.preprocess((value) => normalizeSeries(value), z.array(z.number()).default([])),
  chartImage: z.string().optional(),
  potentialPctOverride: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().finite().optional(),
  ),
  checkoutHeadline: z.string().default(""),
  checkoutSubtext: z.string().default(""),
});

/**
 * Only fields that are genuinely required for a published paid/live call.
 * No arbitrary character counts and no trade-thesis validation are applied.
 */
export const callPublishSchema = z.object({
  callNumber: z.coerce.number().int().min(1).max(10),
  state: z.enum(["live", "closed", "archived"]).default("live"),
  price: z.coerce.number().positive("Unlock price must be greater than 0"),
  stock: z.string().trim().min(1, "Company name is required"),
  ticker: z.string().trim().min(1, "Ticker is required"),
  entry: z.coerce.number().positive("Entry is required"),
  target: z.coerce.number().positive("Target is required"),
  stopLoss: z.coerce.number().positive("Stop loss is required"),
});

export type CallInput = z.input<typeof callDraftSchema>;
export type CallInputParsed = z.output<typeof callDraftSchema>;
export type CallDraftParsed = z.output<typeof callDraftSchema>;

/** Returns only the genuinely required publish fields that are missing. */
export function publishBlockers(v: CallDraftParsed): string[] {
  const result = callPublishSchema.safeParse({
    callNumber: v.callNumber,
    state: "live",
    price: v.price,
    stock: v.stock,
    ticker: v.ticker,
    entry: v.entry,
    target: v.target,
    stopLoss: v.stopLoss,
  });
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.message);
}
