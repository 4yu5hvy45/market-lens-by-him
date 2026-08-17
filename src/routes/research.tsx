import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCalls } from "@/lib/calls-store";
import { closedPnlPct, isUnlocked } from "@/lib/types";
import { fmtCurrency, fmtDate, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Archive — Market Lens by HIM" },
      {
        name: "description",
        content:
          "Searchable archive of every Market Lens research note, from live conviction picks to closed track-record calls.",
      },
      { property: "og:title", content: "Research Archive — Market Lens by HIM" },
      {
        property: "og:description",
        content: "Every Market Lens research note in one searchable archive.",
      },
    ],
  }),
  component: ResearchArchive,
});

function ResearchArchive() {
  const { calls } = useCalls();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...calls]
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
      .filter(
        (c) =>
          !term ||
          c.stock.toLowerCase().includes(term) ||
          c.ticker.toLowerCase().includes(term) ||
          c.sector.toLowerCase().includes(term),
      );
  }, [calls, q]);

  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold md:text-4xl">Research archive</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every note the desk has published. Closed notes are free to read in full.
      </p>

      <div className="glass mt-4 flex items-center gap-3 rounded-2xl px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search stock, ticker or sector"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((c) => {
          const done = c.status !== "live";
          const perf = closedPnlPct(c);
          return (
            <Link
              key={c.id}
              to="/call/$callId"
              params={{ callId: c.id }}
              className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:border-primary/30"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold">{c.stock}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      c.status === "live"
                        ? "bg-primary/15 text-primary"
                        : c.status === "closed"
                          ? "bg-violet/15 text-violet"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">
                  <span className="num">{c.ticker}</span> · {c.coverage} · {fmtDate(c.publishedAt)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <div
                    className={`num text-sm font-bold ${
                      done ? (perf >= 0 ? "text-bull" : "text-bear") : "text-muted-foreground"
                    }`}
                  >
                    {done ? fmtPct(perf) : fmtCurrency(c.currentPrice, 0)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {isUnlocked(c) ? "Free" : `₹${c.price}`}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
