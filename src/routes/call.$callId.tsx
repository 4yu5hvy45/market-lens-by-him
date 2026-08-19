import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Lock, Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResearchNote } from "@/components/research-note";
import { useCalls } from "@/lib/calls-store";
import { potentialPct, type StockCall } from "@/lib/types";
import { fmtPct } from "@/lib/format";

export const Route = createFileRoute("/call/$callId")({
  head: () => ({
    meta: [
      { title: "Call Sheet — Market Lens by HIM" },
      {
        name: "description",
        content:
          "Full call sheet: entry, target, stop loss, potential, timeframe and the research view behind the position.",
      },
      { property: "og:title", content: "Call Sheet — Market Lens by HIM" },
      {
        property: "og:description",
        content: "Entry, target, stop loss, potential and the research view behind the call.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CallDetail,
});

function CallDetail() {
  const { callId } = useParams({ from: "/call/$callId" });
  const { getCall, unlocked } = useCalls();
  const call = getCall(callId);

  if (!call) {
    return (
      <AppShell>
        <p className="py-24 text-center text-sm text-muted-foreground">
          This call no longer exists.
        </p>
      </AppShell>
    );
  }

  const closed = call.status !== "live";
  const locked = call.access === "paid" && !closed && !unlocked.includes(call.id);

  if (locked) return <LockedSheet call={call} />;

  return (
    <AppShell>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={closed ? "/closed" : "/"}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {closed ? "All closed trades" : "Back to desk"}
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-bull/35 bg-bull/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-bull">
            <Check className="h-3 w-3" /> {closed ? "Free · closed call" : "Unlocked"}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-blue sheen flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em]"
          >
            <Printer className="h-3.5 w-3.5" /> Print page
          </button>
        </div>
      </div>

      <div className="screen-call-sheet">
        <ResearchNote call={call} />

        {call.research.length > 0 && (
          <section className="glass mt-4 rounded-3xl p-6 md:p-8">
            <h2 className="font-display text-xl font-extrabold text-navy">Detailed Research</h2>
            <div className="mt-4 space-y-5">
              {call.research.map((r, index) => (
                <div key={`${r.heading}-${index}`}>
                  <h3 className="text-sm font-bold text-primary">{r.heading}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

    </AppShell>
  );
}

function LockedSheet({ call }: { call: StockCall }) {
  return (
    <AppShell>
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to desk
      </Link>

      <div className="card-premium relative overflow-hidden rounded-3xl p-8 text-center md:p-14">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[oklch(0.78_0.12_84/0.16)] blur-3xl"
        />
        <span className="gold-orb mx-auto grid h-16 w-16 place-items-center rounded-2xl">
          <Lock className="h-6 w-6 text-navy" strokeWidth={1.9} />
        </span>
        <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          Call No. {String(call.callNumber).padStart(2, "0")} · {call.coverage}
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
          This call sheet is locked
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Live calls stay locked while active. Unlock to see the company, entry, target, stop loss,
          the desk view and the annotated chart — plus a downloadable PDF.
        </p>

        <div className="mx-auto mt-7 grid max-w-md grid-cols-3 gap-3">
          <Blur label="Entry" />
          <Blur label="Target" />
          <Blur label="Stop loss" />
        </div>

        <div className="mx-auto mt-6 flex max-w-md items-center justify-between rounded-2xl border border-border bg-surface-2 px-5 py-4 text-sm">
          <span className="text-muted-foreground">Indicative potential</span>
          <span className="num font-extrabold text-bull">{fmtPct(potentialPct(call))}</span>
        </div>

        <Link
          to="/checkout/$callId"
          params={{ callId: call.id }}
          className="btn-gold sheen mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-2xl py-4 text-[12px] font-bold uppercase tracking-[0.18em]"
        >
          Unlock now · ₹{call.price}
        </Link>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Closed calls unlock automatically and stay free for everyone.
        </p>
      </div>
    </AppShell>
  );
}

function Blur({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-4">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="num mt-1 select-none text-lg font-extrabold blur-[6px]">₹0,000</div>
    </div>
  );
}
