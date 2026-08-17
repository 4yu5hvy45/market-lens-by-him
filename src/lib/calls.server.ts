import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PublicCall, FullCall, ResearchBlock } from "./types";
import { normalizeSeries } from "./series";

/** Publishable (anon) client used for the safe public projection view. */
export function publicClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["SUPABASE_ANON_KEY"] ??
    process.env["VITE_SUPABASE_ANON_KEY"];
  if (!url || !key) {
    throw new Error(
      "Missing Supabase public configuration. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or the VITE_* equivalents).",
    );
  }
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export async function adminClient(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

type Row = Record<string, unknown>;

/** Maps a row of the public projection view (paid columns arrive as NULL while live). */
export function mapPublic(row: Row): PublicCall {
  const state = row["state"] as PublicCall["state"];
  // Live calls are intentionally locked. The base table contains the real entry/target
  // values, so locking cannot depend on a NULL projection value when we read the base table.
  const locked = state === "live";
  return {
    id: String(row["id"]),
    callNumber: Number(row["call_number"]),
    state,
    price: Number(row["price_inr"]),
    direction: row["direction"] as PublicCall["direction"],
    sector: String(row["sector"] ?? ""),
    term: String(row["term"] ?? ""),
    coverage: String(row["coverage"] ?? ""),
    segment: String(row["segment"] ?? ""),
    timeframe: String(row["timeframe"] ?? ""),
    confidence: Number(row["confidence"] ?? 0),
    series: normalizeSeries(row["series"]),
    publishedAt: (row["published_at"] as string | null) ?? null,
    closedAt: (row["closed_at"] as string | null) ?? null,
    potentialPct: Number(row["potential_pct"] ?? 0),
    riskPct: Number(row["risk_pct"] ?? 0),
    locked,
    checkoutHeadline: String(row["checkout_headline"] ?? ""),
    checkoutSubtext: String(row["checkout_subtext"] ?? ""),
    ...(locked
      ? {}
      : {
          stock: String(row["stock_name"] ?? ""),
          ticker: String(row["ticker"] ?? ""),
          exchange: String(row["exchange"] ?? ""),
          entry: Number(row["entry"]),
          target: Number(row["target"]),
          stopLoss: Number(row["stop_loss"]),
          currentPrice: Number(row["current_price"]),
          changePct: Number(row["change_pct"] ?? 0),
          summary: String(row["summary"] ?? ""),
          view: String(row["view_text"] ?? ""),
          research: (row["research"] as ResearchBlock[] | null) ?? [],
          catalysts: (row["catalysts"] as string[] | null) ?? [],
          ...(row["exit_price"] === null || row["exit_price"] === undefined
            ? {}
            : { exitPrice: Number(row["exit_price"]) }),
          ...(row["chart_image"] ? { chartImage: String(row["chart_image"]) } : {}),
        }),
  };
}

/** Maps a full base-table row. Only ever returned to verified buyers or the admin. */
export function mapFull(row: Row): FullCall {
  const direction = row["direction"] as FullCall["direction"];
  const entry = Number(row["entry"]);
  const target = Number(row["target"]);
  const stopLoss = Number(row["stop_loss"]);
  const sign = direction === "short" ? -1 : 1;
  return {
    id: String(row["id"]),
    callNumber: Number(row["call_number"]),
    state: row["state"] as FullCall["state"],
    price: Number(row["price_inr"]),
    direction,
    sector: String(row["sector"] ?? ""),
    term: String(row["term"] ?? ""),
    coverage: String(row["coverage"] ?? ""),
    segment: String(row["segment"] ?? ""),
    timeframe: String(row["timeframe"] ?? ""),
    confidence: Number(row["confidence"] ?? 0),
    series: normalizeSeries(row["series"]),
    publishedAt: (row["published_at"] as string | null) ?? null,
    closedAt: (row["closed_at"] as string | null) ?? null,
    potentialPct: Number((((target - entry) / entry) * 100 * sign).toFixed(2)),
    riskPct: Number((Math.abs((entry - stopLoss) / entry) * 100).toFixed(2)),
    locked: false,
    stock: String(row["stock_name"] ?? ""),
    ticker: String(row["ticker"] ?? ""),
    exchange: String(row["exchange"] ?? ""),
    entry,
    target,
    stopLoss,
    currentPrice: Number(row["current_price"]),
    ...(row["exit_price"] === null ? {} : { exitPrice: Number(row["exit_price"]) }),
    changePct: Number(row["change_pct"] ?? 0),
    summary: String(row["summary"] ?? ""),
    view: String(row["view_text"] ?? ""),
    research: (row["research"] as ResearchBlock[] | null) ?? [],
    catalysts: (row["catalysts"] as string[] | null) ?? [],
    ...(row["chart_image"] ? { chartImage: String(row["chart_image"]) } : {}),
    checkoutHeadline: String(row["checkout_headline"] ?? ""),
    checkoutSubtext: String(row["checkout_subtext"] ?? ""),
  };
}

/** True when the access token is a paid purchase for this exact call. */
export async function hasVerifiedPurchase(callId: string, accessToken: string) {
  const db = await adminClient();
  const { data } = await db
    .from("purchases")
    .select("id")
    .eq("call_id", callId)
    .eq("access_token", accessToken)
    .eq("status", "paid")
    .maybeSingle();
  return Boolean(data);
}
