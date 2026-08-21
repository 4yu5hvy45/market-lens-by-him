import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { FilterRail } from "@/components/filter-rail";
import { useCalls } from "@/lib/calls-store";
import { closedPnlPct } from "@/lib/types";
import { fmtCurrency, fmtDate, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/closed")({
  head: () => ({
    meta: [
      { title: "Closed Trades & Track Record — Market Lens by HIM" },
      {
        name: "description",
        content:
          "Completed equity calls with entry, exit and realised performance. Full research is free once a call closes.",
      },
      { property: "og:title", content: "Closed Trades — Market Lens by HIM" },
      {
        property: "og:description",
        content: "Every completed call with entry, exit and realised return.",
      },
    ],
  }),
  component: ClosedCalls,
});

const filters = ["All", "Profit", "Loss"];

function ClosedCalls() {
  const { calls } = useCalls();
  const [filter, setFilter] = useState("All");

  const closed = useMemo(
    () => calls.filter((c) => c.status === "closed" || c.status === "archived"),
    [calls],
  );

  const shown = useMemo(() => {
    if (filter === "Profit") return closed.filter((c) => closedPnlPct(c) >= 0);
    if (filter === "Loss") return closed.filter((c) => closedPnlPct(c) < 0);
    return closed;
  }, [closed, filter]);

  const wins = closed.filter((c) => closedPnlPct(c) >= 0).length;
  const avg = closed.length ? closed.reduce((a, c) => a + closedPnlPct(c), 0) / closed.length : 0;
  const best = closed.length ? Math.max(...closed.map(closedPnlPct)) : 0;

  return (
    <AppShell>
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[11px] font-light uppercase tracking-[0.28em] text-muted-foreground">
            Public track record
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Closed Trades</h1>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <Stat label="Hit rate" value={`${Math.round((wins / Math.max(closed.length, 1)) * 100)}%`} />
          <Stat label="Avg return" value={fmtPct(avg)} tone={avg >= 0 ? "text-bull" : "text-bear"} />
          <Stat label="Best call" value={fmtPct(best)} tone="text-bull" />
        </div>
      </section>

      <div className="mt-8">
        <FilterRail options={filters} value={filter} onChange={setFilter} />
      </div>

      <div className="glass mt-6 overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-5 py-3 font-medium">Trade</th>
              <th className="px-5 py-3 text-right font-medium">Gain</th>
              <th className="px-5 py-3 font-medium">Entry</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Exit</th>
              <th className="hidden px-5 py-3 text-right font-medium md:table-cell">Closed on</th>
              <th className="hidden px-5 py-3 text-right font-medium sm:table-cell">Result</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => {
              const pnl = closedPnlPct(c);
              const win = pnl >= 0;
              return (
                <tr key={c.id} className="border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2/60">
                  <td className="px-5 py-4 font-medium">
                    <Link to="/call/$callId" params={{ callId: c.id }} className="hover:text-primary">
                      {c.stock}
                    </Link>
                  </td>
                  <td className={`num px-5 py-4 text-right font-semibold ${win ? "text-bull" : "text-bear"}`}>
                    {fmtPct(pnl, 2)}
                  </td>
                  <td className="num px-5 py-4">{fmtCurrency(c.entry, 0)}</td>
                  <td className="num hidden px-5 py-4 sm:table-cell">
                    {fmtCurrency(c.exitPrice ?? c.currentPrice, 0)}
                  </td>
                  <td className="hidden px-5 py-4 text-right text-xs font-light text-muted-foreground md:table-cell">
                    {fmtDate(c.closedAt ?? c.publishedAt)}
                  </td>
                  <td className="hidden px-5 py-4 text-right sm:table-cell">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] ${
                        win ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear"
                      }`}
                    >
                      {win ? "Profit" : "Loss"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && (
          <p className="py-14 text-center text-sm font-light text-muted-foreground">
            No trades in this view.
          </p>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className={`num text-2xl font-bold leading-none ${tone ?? ""}`}>{value}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
