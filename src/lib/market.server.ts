export interface Quote {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
  currency?: string | undefined;
  dayHigh?: number | undefined;
  dayLow?: number | undefined;
  previousClose?: number | undefined;
}

/**
 * Free, key-less quote feed (Yahoo Finance public chart endpoint).
 * Returns null instead of throwing so one bad symbol never breaks a board.
 */
export async function yahooQuote(symbol: string, label: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: {
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            regularMarketDayHigh?: number;
            regularMarketDayLow?: number;
            currency?: string;
          };
        }[];
      };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prev = meta?.chartPreviousClose ?? meta?.previousClose;
    if (typeof price !== "number" || !prev) return null;
    return {
      symbol,
      label,
      price,
      changePct: ((price - prev) / prev) * 100,
      currency: meta?.currency ?? "INR",
      dayHigh: meta?.regularMarketDayHigh ?? undefined,
      dayLow: meta?.regularMarketDayLow ?? undefined,
      previousClose: prev,
    };
  } catch {
    return null;
  }
}
