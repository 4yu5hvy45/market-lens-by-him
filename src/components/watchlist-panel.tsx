import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, TrendingDown, TrendingUp } from "lucide-react";
import { getWatchlist } from "@/lib/watchlist.functions";

/** Public desk watchlist — admin-curated symbols on a free live quote feed. */
export function WatchlistPanel() {
  const fetchWatchlist = useServerFn(getWatchlist);
  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => fetchWatchlist(),
    refetchInterval: 90_000,
    staleTime: 45_000,
  });

  const rows = data ?? [];
  if (!isLoading && rows.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            <Eye className="h-3.5 w-3.5 text-primary" /> Desk watchlist
          </div>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">On our radar</h2>
          <p className="mt-1 text-xs font-light text-muted-foreground">
            Names the desk is tracking for the next call · live prices, refreshed automatically
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Tracking only · not a call
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass h-[104px] animate-pulse rounded-2xl" />
            ))
          : rows.map((r) => {
              const up = (r.changePct ?? 0) >= 0;
              return (
                <div key={r.id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{r.label}</div>
                      <div className="num mt-0.5 truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {r.symbol.replace(/\.(NS|BO)$/, "")}
                      </div>
                    </div>
                    {r.changePct !== null && (
                      <span
                        className={`num flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                          up ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"
                        }`}
                      >
                        {up ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {`${up ? "+" : ""}${r.changePct.toFixed(2)}%`}
                      </span>
                    )}
                  </div>

                  <div className="num mt-3 text-xl font-extrabold">
                    {r.price === null
                      ? "—"
                      : `₹${r.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                  </div>

                  <div className="mt-1 truncate text-[11px] font-light text-muted-foreground">
                    {r.note || (r.dayLow !== null && r.dayHigh !== null
                      ? `Day ${r.dayLow.toFixed(0)} – ${r.dayHigh.toFixed(0)}`
                      : "Under observation")}
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
