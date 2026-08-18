import { Link, useNavigate } from "@tanstack/react-router";
import type { KeyboardEvent } from "react";
import { ArrowRight, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Sparkline } from "./sparkline";
import { fmtCurrency, fmtPct, relativeDays } from "@/lib/format";
import { closedPnlPct, potentialPct, type StockCall } from "@/lib/types";

/**
 * Premium locked live-call tile. Identity stays hidden — only the slot number,
 * sector, timeframe and access price are public until the call is unlocked.
 */
export function LiveCallCard({ call, unlocked }: { call: StockCall; unlocked: boolean }) {
  const navigate = useNavigate();
  const isFree = call.access === "free";
  const hasAccess = isFree || unlocked;
  const openFreeCall = () => {
    if (isFree) {
      void navigate({ to: "/call/$callId", params: { callId: call.id } });
    }
  };

  const handleFreeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isFree) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFreeCall();
    }
  };

  return (
    <div
      className={`card-premium sheen rise-in group relative overflow-hidden rounded-3xl p-6 ${
        isFree ? "cursor-pointer" : ""
      }`}
      onClick={isFree ? openFreeCall : undefined}
      onKeyDown={isFree ? handleFreeKeyDown : undefined}
      role={isFree ? "link" : undefined}
      tabIndex={isFree ? 0 : undefined}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[oklch(0.78_0.12_84/0.14)] blur-2xl"
      />

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="num grid h-8 w-8 place-items-center rounded-xl bg-navy text-[13px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            {call.callNumber}
          </span>
        </span>

        <span className="flex items-center gap-1.5 rounded-full border border-[oklch(0.78_0.12_84/0.45)] bg-[oklch(0.78_0.12_84/0.1)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[oklch(0.55_0.1_74)]">
          <Sparkles className="h-3 w-3" /> {isFree ? "Free" : "Premium"}
        </span>
      </div>

      <div className="relative mt-7 flex flex-col items-center text-center">
        {hasAccess ? (
          <>
            <div className="font-display text-lg font-extrabold">{call.stock}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              <span className="num">{call.ticker}</span> · {call.sector}
            </div>
            {!isFree && (
              <div className="mt-3 w-full opacity-90">
                <Sparkline data={call.series} positive={potentialPct(call) >= 0} height={44} />
              </div>
            )}

            {isFree && (
              <div className="mt-4 grid w-full grid-cols-3 gap-2 text-left">
                <FreeLevel label="Entry" value={fmtCurrency(call.entry, 0)} />
                <FreeLevel label="Target" value={fmtCurrency(call.target, 0)} />
                <FreeLevel label="Stop Loss" value={fmtCurrency(call.stopLoss, 0)} />
              </div>
            )}
          </>
        ) : (
          <>
            <span className="lock-orb grid h-14 w-14 place-items-center rounded-full">
              <Lock className="h-5 w-5 text-navy" strokeWidth={1.8} />
            </span>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em]">
              Details locked
            </div>
            <p className="mt-2 max-w-[16rem] text-xs font-light leading-relaxed text-muted-foreground">
              Company, levels and the full research sheet unlock instantly after payment.
            </p>
          </>
        )}
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-[oklch(0.78_0.12_84/0.25)] pt-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Potential left
          </div>

          <div className="num mt-1 text-2xl font-extrabold leading-none text-bull">
            {fmtPct(potentialPct(call))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {hasAccess ? "Access" : "Unlock fee"}
          </div>
          <div className="num mt-1 text-xl font-extrabold leading-none">
            {isFree ? "Free" : hasAccess ? "Owned" : `₹${call.price}`}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>{call.term}</span>
        <span className="opacity-40">•</span>
        <span>{call.timeframe}</span>
        <span className="opacity-40">•</span>
        <span>{call.segment}</span>
      </div>

      {isFree ? null : hasAccess ? (
        <Link
          to="/call/$callId"
          params={{ callId: call.id }}
          className="btn-blue sheen mt-5 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
        >
          View full call <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <Link
          to="/checkout/$callId"
          params={{ callId: call.id }}
          className="btn-gold sheen mt-5 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-bold uppercase tracking-[0.18em]"
        >
          Unlock now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}

      {!isFree && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" /> Secure payment · instant access
        </p>
      )}
    </div>
  );
}

function FreeLevel({ label, value }: { label: string; value: string }) {
  const compact = value.replace(/\s/g, "").length > 11;
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface-2 px-2.5 py-2.5">
      <div className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div
        className={`num mt-1 min-w-0 whitespace-nowrap font-extrabold leading-tight ${
          compact ? "text-[0.66rem]" : "text-[clamp(0.72rem,3.2vw,0.95rem)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** Full card used for closed / research listings. */
export function CallCard({ call }: { call: StockCall }) {
  const closed = call.status !== "live";
  const perf = closed ? closedPnlPct(call) : 0;
  const up = closed ? perf >= 0 : true;

  return (
    <Link
      to="/call/$callId"
      params={{ callId: call.id }}
      className="glass rise-in block rounded-2xl p-5 transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-display text-base font-bold">{call.stock}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-light text-muted-foreground">
            <span className="num">{call.ticker}</span>
            <span className="opacity-40">·</span>
            <span>{call.sector}</span>
            <span className="opacity-40">·</span>
            <span>{relativeDays(call.closedAt ?? call.publishedAt)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="num text-base font-semibold leading-none">
            {fmtCurrency(call.currentPrice)}
          </div>
        </div>
      </div>

      <div className="-mx-1 mt-4">
        <Sparkline data={call.series} positive={up} height={40} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
        <Level label="Entry" value={fmtCurrency(call.entry, 0)} />
        <Level label="Exit / Target" value={fmtCurrency(call.exitPrice ?? call.target, 0)} />
        <Level
          label={closed ? "Realised" : "Potential"}
          value={fmtPct(closed ? perf : potentialPct(call))}
          tone={(closed ? perf : potentialPct(call)) >= 0 ? "text-bull" : "text-bear"}
        />
      </div>
    </Link>
  );
}

function Level({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={`num truncate text-sm font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
