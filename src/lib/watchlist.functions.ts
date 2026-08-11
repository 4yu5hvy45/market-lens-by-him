import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface WatchItem {
  id: string;
  symbol: string;
  label: string;
  note: string;
  sortOrder: number;
  active: boolean;
}

export interface WatchRow extends WatchItem {
  price: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  previousClose: number | null;
}

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  symbol: z.string().trim().min(1).max(24).toUpperCase(),
  label: z.string().trim().min(1).max(80),
  note: z.string().trim().max(160).default(""),
  sortOrder: z.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

type Row = Record<string, unknown>;

function mapItem(row: Row): WatchItem {
  return {
    id: String(row["id"]),
    symbol: String(row["symbol"]),
    label: String(row["label"]),
    note: String(row["note"] ?? ""),
    sortOrder: Number(row["sort_order"] ?? 0),
    active: Boolean(row["active"]),
  };
}

/** Public watchlist: admin-curated symbols enriched with live free-feed quotes. */
export const getWatchlist = createServerFn({ method: "GET" }).handler(async (): Promise<WatchRow[]> => {
  const { adminClient } = await import("./calls.server");
  const db = await adminClient();
  const { yahooQuote } = await import("./market.server");

  const { data, error } = await db
    .from("watchlist_items")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getWatchlist", error);
    throw new Error("Could not load the watchlist right now.");
  }

  const items = (data ?? []).map(mapItem);
  const quotes = await Promise.all(items.map((i) => yahooQuote(i.symbol, i.label)));

  return items.map((item, i) => {
    const q = quotes[i];
    return {
      ...item,
      price: q?.price ?? null,
      changePct: q?.changePct ?? null,
      dayHigh: q?.dayHigh ?? null,
      dayLow: q?.dayLow ?? null,
      previousClose: q?.previousClose ?? null,
    };
  });
});

/** Admin view: includes paused rows. */
export const adminListWatchlist = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminSession } = await import("./admin-session.server");
  await requireAdminSession();
  const { adminClient } = await import("./calls.server");
  const db = await adminClient();
  const { data, error } = await db
    .from("watchlist_items")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("adminListWatchlist", error);
    throw new Error("Could not load the watchlist.");
  }
  return (data ?? []).map(mapItem);
});

export const adminSaveWatchItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => itemSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    const row = {
      symbol: data.symbol,
      label: data.label,
      note: data.note,
      sort_order: data.sortOrder,
      active: data.active,
    };

    if (data.id) {
      const { error } = await db.from("watchlist_items").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: created, error } = await db
      .from("watchlist_items")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: String((created as Row)["id"]) };
  });

export const adminDeleteWatchItem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();
    const { error } = await db.from("watchlist_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
