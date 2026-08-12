import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LiveCallCard } from "@/components/call-card";
import { ResearchFeature } from "@/components/research-feature";
import { useCalls } from "@/lib/calls-store";
import { closedPnlPct } from "@/lib/types";
import { fmtCurrency, fmtDate, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Market Lens by HIM — Premium Equity Calls & Research" },
      {
        name: "description",
        content:
          "Three curated equity calls at a time, each with defined entry, target and stop-loss levels, plus a public closed-trade track record.",
      },
      { property: "og:title", content: "Market Lens by HIM — Premium Equity Calls" },
      {
        property: "og:description",
        content: "Three live premium setups from the desk, with a transparent closed-trade record.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://marketlensbyhim.com/og-image.png" },
      { property: "og:image:width", content: "2400" },
      { property: "og:image:height", content: "1260" },
      { property: "og:image:type", content: "image/png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://marketlensbyhim.com/og-image.png" },
    ],
  }),
  component: LiveCalls,
});

function LiveCalls() {
  const { calls, unlocked } = useCalls();

  const live = useMemo(
    () =>
      calls
        .filter((c) => c.status === "live")
        .sort((a, b) => a.callNumber - b.callNumber)
        .slice(0, 3),
    [calls],
  );
  const closed = useMemo(
    () => calls.filter((c) => c.status === "closed" || c.status === "archived"),
    [calls],
  );
  const preview = closed.slice(0, 4);
  const wins = closed.filter((c) => closedPnlPct(c) >= 0).length;
  const hit = closed.length ? Math.round((wins / closed.length) * 100) : 0;
  const avg = closed.length ? closed.reduce((a, c) => a + closedPnlPct(c), 0) / closed.length : 0;

  return (
    <AppShell
      hero={
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-2xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/45">
              Equity Research Desk
            </div>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-white md:text-7xl">
              Market Lens
              <span className="block text-[oklch(0.66_0.15_262)]">by Him</span>
            </h1>
            <p className="mt-7 max-w-xl text-base font-light leading-relaxed text-white/60">
              Independent market research and structured trade ideas with defined entry, target and
              stop-loss levels.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.26em] text-white/35">
              <span className="num">{fmtDate(new Date().toISOString())}</span>
              <span className="text-white/20">•</span>
              <span>Market Desk</span>
              <span className="text-white/20">•</span>
              <span>India Market</span>
            </div>
          </div>

          <div className="hidden w-64 rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:block">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
              Desk snapshot
            </div>
            <div className="mt-5 flex flex-col gap-4">
              <HeroStat label="Hit rate" value={`${hit}%`} />
              <HeroStat label="Avg return" value={fmtPct(avg)} />
              <HeroStat label="Live slots" value={`${live.length} / 3`} />
            </div>
          </div>
        </div>
      }
    >
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[oklch(0.6_0.1_74)]">
              <Sparkles className="h-3.5 w-3.5" /> Premium desk
            </div>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">Live Calls</h2>
            <p className="mt-1 text-xs font-light text-muted-foreground">
              Slots 01 – 03 · locked while the position is active
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-bull" /> Instant unlock after payment
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {live.map((c) => (
            <LiveCallCard key={c.id} call={c} unlocked={unlocked.includes(c.id)} />
          ))}
        </div>

        {live.length === 0 && (
          <p className="py-16 text-center text-sm font-light text-muted-foreground">
            No live calls right now. The next setup is being prepared.
          </p>
        )}
      </section>

      <ResearchFeature />

      {preview.length > 0 && (
        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                <LineChart className="h-3.5 w-3.5" /> Transparent record
              </div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
                Closed Trades
              </h2>
              <p className="mt-1 text-xs font-light text-muted-foreground">
                Every closed call opens fully — levels, view and chart, free for all
              </p>
            </div>
            <Link
              to="/closed"
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="glass mt-6 overflow-hidden rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-5 py-3 font-bold">No.</th>
                  <th className="px-5 py-3 font-bold">Trade</th>
                  <th className="px-5 py-3 font-bold">Entry</th>
                  <th className="hidden px-5 py-3 font-bold sm:table-cell">Exit</th>
                  <th className="px-5 py-3 text-right font-bold">Gain</th>
                  <th className="hidden px-5 py-3 text-right font-bold md:table-cell">Closed on</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((c) => {
                  const pnl = closedPnlPct(c);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border/70 transition-colors last:border-0 hover:bg-surface-2"
                    >
                      <td className="num px-5 py-3.5 text-xs text-muted-foreground">
                        {String(c.callNumber).padStart(2, "0")}
                      </td>
                      <td className="px-5 py-3.5 font-semibold">
                        <Link
                          to="/call/$callId"
                          params={{ callId: c.id }}
                          className="hover:text-primary hover:underline"
                        >
                          {c.stock}
                        </Link>
                      </td>
                      <td className="num px-5 py-3.5">{fmtCurrency(c.entry, 0)}</td>
                      <td className="num hidden px-5 py-3.5 sm:table-cell">
                        {fmtCurrency(c.exitPrice ?? c.currentPrice, 0)}
                      </td>
                      <td
                        className={`num px-5 py-3.5 text-right font-extrabold ${
                          pnl >= 0 ? "text-bull" : "text-bear"
                        }`}
                      >
                        {fmtPct(pnl, 2)}
                      </td>
                      <td className="hidden px-5 py-3.5 text-right text-xs font-light text-muted-foreground md:table-cell">
                        {fmtDate(c.closedAt ?? c.publishedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="num font-display text-2xl font-extrabold text-white">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</div>
    </div>
  );
}
