import { createServerFn } from "@tanstack/react-start";

export interface MarketQuote {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
}

const INSTRUMENTS: { symbol: string; label: string }[] = [
  { symbol: "^NSEI", label: "NIFTY 50" },
  { symbol: "^BSESN", label: "SENSEX" },
  { symbol: "^NSEBANK", label: "BANK NIFTY" },
  { symbol: "RELIANCE.NS", label: "RELIANCE" },
  { symbol: "HDFCBANK.NS", label: "HDFC BANK" },
  { symbol: "TCS.NS", label: "TCS" },
  { symbol: "INFY.NS", label: "INFOSYS" },
  { symbol: "ICICIBANK.NS", label: "ICICI BANK" },
  { symbol: "TATAMOTORS.NS", label: "TATA MOTORS" },
  { symbol: "SBIN.NS", label: "SBI" },
  { symbol: "USDINR=X", label: "USD / INR" },
  { symbol: "GC=F", label: "GOLD" },
];

async function quote(symbol: string, label: string): Promise<MarketQuote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
      { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: {
          meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number };
        }[];
      };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prev = meta?.chartPreviousClose ?? meta?.previousClose;
    if (typeof price !== "number" || !prev) return null;
    return { symbol, label, price, changePct: ((price - prev) / prev) * 100 };
  } catch {
    return null;
  }
}

/** Live market snapshot from a free public feed (no API key required). */
export const getMarketQuotes = createServerFn({ method: "GET" }).handler(async () => {
  const results = await Promise.all(INSTRUMENTS.map((i) => quote(i.symbol, i.label)));
  return results.filter((r): r is MarketQuote => r !== null);
});
