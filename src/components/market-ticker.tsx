import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getMarketQuotes, type MarketQuote } from "@/lib/market.functions";

const FALLBACK: MarketQuote[] = [
  { symbol: "^NSEI", label: "NIFTY 50", price: 24570.65, changePct: 0.32 },
  { symbol: "^BSESN", label: "SENSEX", price: 80512.1, changePct: 0.28 },
  { symbol: "^NSEBANK", label: "BANK NIFTY", price: 55210.4, changePct: -0.14 },
  { symbol: "RELIANCE.NS", label: "RELIANCE", price: 1421.8, changePct: 0.61 },
];

export function MarketTicker() {
  const fetchQuotes = useServerFn(getMarketQuotes);
  const { data } = useQuery({
    queryKey: ["market-ticker"],
    queryFn: () => fetchQuotes(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const quotes = data && data.length > 0 ? data : FALLBACK;
  const loop = [...quotes, ...quotes];

  return (
    <div className="relative overflow-hidden border-b border-border bg-surface">
      <div className="gold-line absolute inset-x-0 top-0 h-[1px] opacity-70" />
      <div className="relative">
        <div className="ticker-track flex w-max items-center">
          {loop.map((q, i) => {
            const up = q.changePct >= 0;
            return (
              <span
                key={`${q.symbol}-${i}`}
                className="flex items-center gap-2 whitespace-nowrap px-5 py-2 text-[11px]"
              >
                <span className="font-semibold uppercase tracking-[0.12em] text-foreground/85">
                  {q.label}
                </span>
                <span className="num text-foreground/70">
                  {q.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`num flex items-center gap-1 font-semibold ${up ? "text-bull" : "text-bear"}`}
                >
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {`${up ? "+" : ""}${q.changePct.toFixed(2)}%`}
                </span>
                <span className="pl-3 text-border">|</span>
              </span>
            );
          })}
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface to-transparent"
        />
      </div>
    </div>
  );
}
