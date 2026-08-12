import { z } from "zod";
import { normalizeSeries } from "./series";

/** Shared admin form contract — used by both the browser form and the server. */
export const callInputSchema = z
  .object({
    callNumber: z.coerce.number().int().min(1, "Slot must be 1-3").max(3, "Slot must be 1-3"),
    state: z.enum(["draft", "live", "closed", "archived"]).default("draft"),
    price: z.coerce.number().int().min(0, "Price cannot be negative").max(100000),
    stock: z.string().trim().min(2, "Stock name is required").max(120),
    ticker: z.string().trim().min(1, "Ticker is required").max(24),
    exchange: z.string().trim().max(40).default("NSE / BSE"),
    sector: z.string().trim().max(80).default(""),
    direction: z.enum(["long", "short"]),
    entry: z.coerce.number().positive("Entry must be greater than 0"),
    target: z.coerce.number().positive("Target must be greater than 0"),
    stopLoss: z.coerce.number().positive("Stop loss must be greater than 0"),
    currentPrice: z.coerce.number().min(0),
    term: z.string().trim().min(1).max(40),
    coverage: z.string().trim().max(60).default("Weekly Pick"),
    segment: z.string().trim().max(60).default("Cash / Equity"),
    timeframe: z.string().trim().min(1, "Time frame is required").max(80),
    changePct: z.coerce.number().min(-100).max(1000).default(0),
    confidence: z.coerce.number().int().min(0).max(100).default(70),
    summary: z.string().trim().max(600).default(""),
    view: z.string().trim().min(20, "Add the desk view (at least 20 characters)").max(6000),
    research: z
      .array(
        z.object({
          heading: z.string().trim().min(2).max(120),
          body: z.string().trim().min(10).max(4000),
        }),
      )
      .default([]),
    catalysts: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
    // Accept legacy JSON object points and normalise them before validation.
    series: z.preprocess((value) => normalizeSeries(value), z.array(z.number()).max(400).default([])),
    chartImage: z.string().max(2_000_000).optional(),
    checkoutHeadline: z.string().trim().max(180).default(""),
    checkoutSubtext: z.string().trim().max(1200).default(""),
  })
  .superRefine((v, ctx) => {
    if (v.direction === "long") {
      if (v.target <= v.entry) {
        ctx.addIssue({ code: "custom", path: ["target"], message: "Target must be above entry for a long call" });
      }
      if (v.stopLoss >= v.entry) {
        ctx.addIssue({ code: "custom", path: ["stopLoss"], message: "Stop loss must be below entry for a long call" });
      }
    } else {
      if (v.target >= v.entry) {
        ctx.addIssue({ code: "custom", path: ["target"], message: "Target must be below entry for a short call" });
      }
      if (v.stopLoss <= v.entry) {
        ctx.addIssue({ code: "custom", path: ["stopLoss"], message: "Stop loss must be above entry for a short call" });
      }
    }
  });

export type CallInput = z.input<typeof callInputSchema>;
export type CallInputParsed = z.output<typeof callInputSchema>;

/** Extra rules that only apply when a call goes live. */
export function publishBlockers(v: CallInputParsed): string[] {
  const problems: string[] = [];
  if (v.research.length === 0) problems.push("Add at least one research block before publishing.");
  if (v.price <= 0) problems.push("A live call needs a price above 0.");
  if (!v.summary) problems.push("Add a short summary before publishing.");
  return problems;
}
