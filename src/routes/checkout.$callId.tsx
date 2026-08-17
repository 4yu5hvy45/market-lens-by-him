import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { startPurchase, confirmPayment } from "@/lib/payments.functions";
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Eye,
  FileText,
  Gauge,
  LineChart,
  Lock,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCalls } from "@/lib/calls-store";
import { potentialPct, riskPct, rrRatio } from "@/lib/types";
import { fmtPct } from "@/lib/format";

export const Route = createFileRoute("/checkout/$callId")({
  head: () => ({
    meta: [
      { title: "Unlock This Call — Secure Checkout | Market Lens by HIM" },
      {
        name: "description",
        content:
          "See the potential left on this live desk call, then unlock the company name, entry, target and stop-loss with one secure payment.",
      },
      { property: "og:title", content: "Unlock This Call — Market Lens by HIM" },
      {
        property: "og:description",
        content: "One-time payment unlocks the complete call sheet and research instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { callId } = useParams({ from: "/checkout/$callId" });
  const { getCall, unlock, unlocked } = useCalls();
  const navigate = useNavigate();
  const call = getCall(callId);
  const [state, setState] = useState<"idle" | "paying" | "done">(
    call && unlocked.includes(call.id) ? "done" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  // Keep this hook before all conditional returns so the hook order is stable
  // while the call data is loading.
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (!call) {
    return (
      <AppShell>
        <p className="py-24 text-center text-sm text-muted-foreground">This call is unavailable.</p>
      </AppShell>
    );
  }

  const potential = potentialPct(call);
  const risk = riskPct(call);
  const rr = rrRatio(call);
  const slot = String(call.callNumber).padStart(2, "0");
  const headline =
    call.checkoutHeadline?.trim() || "This setup is live. The levels are still sealed.";
  const subtext =
    call.checkoutSubtext?.trim() ||
    "Every Market Lens call is written by the desk before the move, not explained after it. " +
      "While a call is live we publish only what you can judge us on — the potential left on the table. " +
      "The company, the entry band and the risk line stay behind this one-time unlock so the trade isn't crowded out.";
  // Gauge fill: 25% potential reads as a full arc.
  const fill = Math.max(6, Math.min(100, (Math.abs(potential) / 25) * 100));

  const pay = async () => {
    setState("paying");
    setError(null);

    try {
      const order = await startPurchase({ data: { callId: call.id } });
      if (!(window as typeof window & { Razorpay?: any }).Razorpay) {
        throw new Error("Razorpay Checkout could not be loaded. Check your internet connection and try again.");
      }

      const Razorpay = (window as typeof window & { Razorpay: any }).Razorpay;
      const checkout = new Razorpay({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: "INR",
        name: "Market Lens by HIM",
        description: `Unlock Call No. ${String(call.callNumber).padStart(2, "0")}`,
        order_id: order.orderId,
        theme: { color: "#163a8a" },
        modal: {
          ondismiss: () => setState("idle"),
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verified = await confirmPayment({
              data: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            if (verified.callId !== call.id) throw new Error("Payment was verified for a different call.");
            await unlock(call.id, verified.accessToken);
            setState("done");
            await navigate({ to: "/call/$callId", params: { callId: call.id } });
          } catch (err) {
            setState("idle");
            setError(err instanceof Error ? err.message : "Payment verification failed.");
          }
        },
      });

      checkout.open();
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Could not start payment.");
    }
  };

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to desk
      </Link>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.85fr)] lg:items-start">
        {/* ── Left: the pitch ─────────────────────────────────── */}
        <div className="space-y-5">
          <section className="card-premium rise-in relative overflow-hidden rounded-3xl p-6 md:p-8">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[oklch(0.78_0.12_84/0.16)] blur-3xl"
            />

            <div className="relative flex flex-wrap items-center gap-3">
              <span className="num grid h-9 w-9 place-items-center rounded-xl bg-navy text-[13px] font-extrabold text-white">
                {call.callNumber}
              </span>
              <span className="rounded-full border border-[oklch(0.78_0.12_84/0.45)] bg-[oklch(0.78_0.12_84/0.1)] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[oklch(0.55_0.1_74)]">
                Live desk call · {call.coverage}
              </span>
            </div>

            <h1 className="relative mt-4 font-display text-3xl font-extrabold leading-tight md:text-[2.1rem]">
              {headline}
            </h1>
            <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {subtext}
            </p>

            {/* Potential — the one public number */}
            <div className="relative mt-7 grid gap-4 rounded-2xl border border-border bg-surface-2 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Potential left from here
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <span className="num text-5xl font-extrabold leading-none text-bull md:text-6xl">
                    {fmtPct(potential)}
                  </span>
                  <TrendingUp className="mb-1.5 h-6 w-6 text-bull" strokeWidth={2.2} />
                </div>
                <div
                  className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[oklch(0.56_0.15_155/0.14)]"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full bg-bull transition-[width] duration-700"
                    style={{ width: `${fill}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Distance between the desk's entry band and its published target, measured right
                  now.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:w-56 sm:grid-cols-1">
                <Stat icon={Gauge} label="Risk defined" value={`${risk.toFixed(1)}%`} />
                <Stat icon={Target} label="Reward : risk" value={`${rr.toFixed(1)} : 1`} />
                <Stat icon={LineChart} label="Desk conviction" value={`${call.confidence}/100`} />
              </div>
            </div>
          </section>

          {/* Blurred teaser of the sheet */}
          <section className="glass relative overflow-hidden rounded-3xl p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Inside the sealed sheet
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <Lock className="h-3 w-3" /> Locked
              </span>
            </div>

            <div className="relative mt-5">
              <div aria-hidden className="select-none blur-[7px]">
                <div className="font-display text-2xl font-extrabold">
                  Redacted Industries Limited
                </div>
                <div className="num mt-1 text-xs text-muted-foreground">
                  XXXXXXX · {call.segment} · {call.sector}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Entry band", "₹1,080.00"],
                    ["Target", "₹1,200.00"],
                    ["Stop-loss", "₹999.00"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-border bg-surface-2 p-3">
                      <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                        {k}
                      </div>
                      <div className="num mt-1 text-base font-extrabold">{v}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Structure, execution plan and risk control notes written by the desk, with the
                  annotated daily chart attached to this sheet.
                </p>
              </div>

              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background/70 px-5 py-4 text-center backdrop-blur-[2px]">
                  <span className="lock-orb grid h-11 w-11 place-items-center rounded-full">
                    <Lock className="h-4.5 w-4.5 text-navy" strokeWidth={1.9} />
                  </span>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em]">
                    Name & levels hidden
                  </div>
                  <p className="max-w-[18rem] text-[11px] text-muted-foreground">
                    Unlock once — this sheet stays yours, including the closing update.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What you get */}
          <section className="card-premium rounded-3xl p-6 md:p-7">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              What the unlock includes
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                [Eye, "Company name, ticker and exchange"],
                [Target, "Exact entry band, target and stop-loss"],
                [FileText, "Desk view: structure, execution and risk plan"],
                [LineChart, "Annotated daily chart reference"],
                [BadgeCheck, "Closing update when the desk exits the call"],
                [FileText, "Download the complete sheet as PDF"],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Eye;
                return (
                  <li
                    key={label as string}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <I className="mt-0.5 h-4 w-4 shrink-0 text-bull" strokeWidth={2} />
                    {label as string}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* ── Right: sticky payment rail ──────────────────────── */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="card-premium rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <span className="gold-orb grid h-11 w-11 place-items-center rounded-2xl">
                <Lock className="h-5 w-5 text-navy" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="font-display text-xl font-extrabold">Unlock Call No. {slot}</h2>
                <p className="text-[11px] text-muted-foreground">
                  One-time payment · lifetime access
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Call access fee</span>
                <span className="num font-extrabold">₹{call.price}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential left</span>
                <span className="num font-semibold text-bull">{fmtPct(potential)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold">Total payable</span>
                <span className="num font-extrabold">₹{call.price}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs leading-relaxed text-red-600">
                {error}
              </div>
            )}

            {state === "done" ? (
              <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-bull/35 bg-bull/10 px-4 py-4 text-sm font-bold text-bull">
                <BadgeCheck className="h-4 w-4" /> Payment successful — opening your call
              </div>
            ) : (
              <button
                type="button"
                onClick={pay}
                disabled={state === "paying"}
                className="btn-gold sheen mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[12px] font-bold uppercase tracking-[0.18em] disabled:opacity-70"
              >
                <CreditCard className="h-4 w-4" />
                {state === "paying" ? "Processing payment…" : `Pay ₹${call.price} securely`}
              </button>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 shrink-0" /> Razorpay Test Mode · No real money is charged
            </p>

            <div className="mt-5 space-y-3 border-t border-border pt-5 text-xs">
              <Row label="Call number" value={String(call.callNumber)} />
              <Row label="Segment" value={call.segment} />
              <Row label="Coverage" value={call.coverage} />
              <Row label="Timeframe" value={call.timeframe} />
              <Row label="Term" value={call.term} />
            </div>
          </section>

          <section className="glass rounded-3xl p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              What stays public
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Live calls stay locked while they are active. Once the desk closes a call, the entire
              sheet — levels, view and outcome — becomes free for everyone on the Closed Trades
              page. Read our track record before you pay for this one.
            </p>
            <Link
              to="/closed"
              className="mt-5 flex items-center justify-center rounded-2xl border border-border py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
              See past closed trades
            </Link>
          </section>
        </aside>
      </div>

      <div className="h-24 lg:hidden" />

      {/* ── Mobile sticky purchase bar ───────────────────────── */}
      {state !== "done" && (
        <div className="pay-bar fixed inset-x-0 bottom-0 z-40 lg:hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <div className="num text-xl font-extrabold leading-none">₹{call.price}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                One-time unlock
              </div>
            </div>
            <button
              type="button"
              onClick={pay}
              disabled={state === "paying"}
              className="btn-gold sheen flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] disabled:opacity-70"
            >
              {state === "paying" ? "Processing…" : "Pay securely"}
              {state !== "paying" && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="num mt-1 text-base font-extrabold">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
