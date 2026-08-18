import { Sparkline } from "./sparkline";
import { fmtCurrency, fmtDate, fmtPct } from "@/lib/format";
import { closedPnlPct, potentialPct, type StockCall } from "@/lib/types";

/**
 * The official Market Lens research-note layout (mirrors the printed PDF sheet):
 * meta strip → company → level boxes → time frame → Our View → chart → disclaimer.
 */
export function ResearchNote({ call }: { call: StockCall }) {
  const closed = call.status !== "live";
  const perf = closed ? closedPnlPct(call) : 0;

  return (
    <article className="glass overflow-hidden rounded-3xl">
      <div className="h-2 bg-navy" />

      <div className="p-6 md:p-9">
        <div className="flex flex-wrap gap-x-10 gap-y-2 border-b border-border pb-4 text-[13px]">
          <Meta label="Issue Date" value={fmtDate(call.publishedAt)} />
          <Meta label="Coverage" value={call.coverage} />
          <Meta label="Segment" value={call.segment} />
          <Meta label="Call No." value={String(call.callNumber).padStart(2, "0")} />
        </div>

        <h1 className="mt-7 min-w-0 break-words font-display text-[clamp(1.7rem,7vw,2.5rem)] font-extrabold uppercase leading-tight [overflow-wrap:anywhere]">
          {call.stock}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {call.exchange} <span className="px-1.5 opacity-40">|</span> Ticker:{" "}
          <span className="num">{call.ticker}</span>
          <span className="px-1.5 opacity-40">|</span> CMP (as of chart):{" "}
          <span className="num">{fmtCurrency(call.currentPrice)}</span>
        </p>

        <div className="mt-7 grid min-w-0 gap-4 sm:grid-cols-3">
          <LevelBox label="Entry Level" value={fmtCurrency(call.entry, 0)} tone="navy" />
          <LevelBox label="Target Level" value={`${fmtCurrency(call.target, 0)}+`} tone="bull" />
          <LevelBox label="Stop Loss" value={fmtCurrency(call.stopLoss, 0)} tone="bear" />
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 px-5 py-4 text-sm">
          <span className="font-bold">Suggested Time Frame: </span>
          <span className="text-muted-foreground">{call.timeframe}</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Chip label="Potential left" value={fmtPct(potentialPct(call))} tone="text-bull" />
        </div>

        <h2 className="mt-9 font-display text-xl font-extrabold text-navy">Our View</h2>
        <p className="mt-3 text-[15px] leading-[1.85] text-foreground/80">{call.view}</p>

        {call.catalysts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {call.catalysts.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <h2 className="mt-9 font-display text-xl font-extrabold text-navy">
          Chart Reference (Daily)
        </h2>
        <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4">
          {call.chartImage ? (
            <img
              src={call.chartImage}
              alt={`${call.stock} daily chart reference`}
              loading="lazy"
              className="mx-auto max-h-[420px] w-auto rounded-xl object-contain"
            />
          ) : (
            <>
              <Sparkline data={call.series} positive={perf >= 0} height={180} />
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Indicative price structure · daily
              </p>
            </>
          )}
        </div>

        {closed && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Chip label="Exit price" value={fmtCurrency(call.exitPrice ?? call.currentPrice, 0)} />
            <Chip label="Closed on" value={call.closedAt ? fmtDate(call.closedAt) : "—"} />
            <Chip
              label="Outcome"
              value={perf >= 0 ? "Target achieved" : "Risk exit"}
              tone={perf >= 0 ? "text-bull" : "text-bear"}
            />
          </div>
        )}

        <p className="mt-9 border-t border-border pt-5 text-[11px] italic leading-relaxed text-muted-foreground">
          Disclaimer: This document is prepared for general informational and educational purposes
          only and does not constitute investment advice, a recommendation, or a solicitation to buy
          or sell any security. Equity markets are subject to risk; past performance is not
          indicative of future results. Please consult a SEBI-registered investment advisor and
          conduct your own due diligence before making any investment decision.
        </p>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="font-bold">{label}: </span>
      <span className="text-muted-foreground">{value}</span>
    </span>
  );
}

function LevelBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "navy" | "bull" | "bear";
}) {
  const head =
    tone === "navy" ? "bg-navy" : tone === "bull" ? "bg-bull" : "bg-bear";
  const ring =
    tone === "navy"
      ? "border-navy/45"
      : tone === "bull"
        ? "border-bull/45"
        : "border-bear/45";
  return (
    <div className={`overflow-hidden rounded-xl border ${ring} bg-surface`}>
      <div
        className={`${head} px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[oklch(0.99_0.002_250)]`}
      >
        {label}
      </div>
      <div
        className={`num min-w-0 whitespace-nowrap px-2 py-5 text-center font-extrabold leading-tight ${fitLevelValue(value)}`}
      >
        {value}
      </div>
    </div>
  );
}


function fitLevelValue(value: string) {
  const length = value.replace(/\s/g, "").length;
  if (length <= 8) return "text-2xl";
  if (length <= 10) return "text-xl";
  if (length <= 12) return "text-lg";
  if (length <= 14) return "text-base";
  return "text-sm";
}

function Chip({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`num mt-1 text-sm font-extrabold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
