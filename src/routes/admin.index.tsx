import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Copy, FileBarChart, LogOut, PencilLine, Plus, Radio } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminGate, adminSignOut } from "@/components/admin-gate";
import { useCalls } from "@/lib/calls-store";
import { closedPnlPct } from "@/lib/types";
import { fmtCurrency, fmtDate, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Desk — Market Lens by HIM" },
      {
        name: "description",
        content: "Create, publish, close and archive Market Lens calls from one control desk.",
      },
      { property: "og:title", content: "Admin Desk — Market Lens by HIM" },
      { property: "og:description", content: "Control desk for publishing and closing calls." },
    ],
  }),
  component: () => (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  ),
});

function AdminDashboard() {
  const { calls, refreshAdmin, closeCall, archiveCall, publishCall, duplicateCall } = useCalls();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void refreshAdmin().catch((err) => setActionError(err instanceof Error ? err.message : "Could not load the admin desk."));
  }, [refreshAdmin]);
  const navigate = useNavigate();
  const [closing, setClosing] = useState<string | null>(null);
  const [exit, setExit] = useState("");

  const live = useMemo(() => calls.filter((c) => c.status === "live"), [calls]);
  const rest = useMemo(() => calls.filter((c) => c.status !== "live"), [calls]);

  return (
    <AppShell>
      <div className="grid min-w-0 grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold md:text-4xl">Admin desk</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Up to 10 live desk slots. Save research as drafts, publish when ready, and close calls to make them public.
          </p>
        </div>
        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:shrink-0">
          <button
            type="button"
            onClick={() => navigate({ to: "/admin/editor/$callId", params: { callId: "new" } })}
            className="btn-blue sheen flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold sm:flex-none"
          >
            <Plus className="h-4 w-4" /> New call
          </button>
          <button
            type="button"
            onClick={adminSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-border text-muted-foreground hover:text-bear"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="mt-4 rounded-xl bg-bear/10 px-4 py-3 text-xs font-medium text-bear">
          {actionError}
        </p>
      )}

      <div className="mt-5 grid gap-2">
        <Link
          to="/admin/research"
          className="glass flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:border-primary/30"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <FileBarChart className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">Weekly research</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Upload the study + chart PNG
            </span>
          </span>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Kpi label="Live" value={String(live.length)} tone="text-primary" />
        <Kpi label="Closed" value={String(calls.filter((c) => c.status === "closed").length)} />
        <Kpi label="Archived" value={String(calls.filter((c) => c.status === "archived").length)} />
      </div>

      <h2 className="mt-7 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Radio className="h-4 w-4 text-primary" /> Live board
      </h2>
      <div className="mt-3 space-y-3">
        {live.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-4">
            <div className="grid min-w-0 grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-navy text-[11px] font-extrabold text-white">
                    {c.callNumber}
                  </span>
                  <span className="truncate text-sm font-bold">{c.stock}</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  <span className="num">{c.ticker}</span> · {fmtDate(c.publishedAt)} ·{" "}
                  {c.access === "paid" ? `₹${c.price}` : "Free"}
                </div>
              </div>
            </div>

            {closing === c.id ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={exit}
                  onChange={(e) => setExit(e.target.value)}
                  inputMode="decimal"
                  placeholder="Exit price"
                  className="num min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setActionError(null);
                    setBusyId(c.id);
                    try {
                      await closeCall(c.id, Number(exit) || c.currentPrice);
                      setClosing(null);
                      setExit("");
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : "Could not close the call.");
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
                >
                  Confirm close
                </button>
                <button
                  type="button"
                  onClick={() => setClosing(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Action
                  icon={PencilLine}
                  label="Edit"
                  onClick={() =>
                    navigate({ to: "/admin/editor/$callId", params: { callId: c.id } })
                  }
                />
                <Action
                  icon={Copy}
                  label={busyId === `duplicate-${c.id}` ? "Duplicating…" : "Duplicate"}
                  onClick={async () => {
                    setActionError(null);
                    setBusyId(`duplicate-${c.id}`);
                    try {
                      const result = await duplicateCall(c.id);
                      navigate({ to: "/admin/editor/$callId", params: { callId: result.id } });
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : "Could not duplicate the call.");
                    } finally {
                      setBusyId(null);
                    }
                  }}
                />
                <Action
                  icon={CheckCircle2}
                  label="Close call"
                  primary
                  onClick={() => {
                    setClosing(c.id);
                    setExit(String(c.currentPrice));
                  }}
                />
                <Action icon={Archive} label={busyId === c.id ? "Saving…" : "Archive"} onClick={async () => {
                  setActionError(null); setBusyId(c.id);
                  try { await archiveCall(c.id); } catch (err) { setActionError(err instanceof Error ? err.message : "Could not archive the call."); } finally { setBusyId(null); }
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Drafts, closed & archived
      </h2>
      <div className="mt-3 space-y-2 pb-6">
        {rest.map((c) => (
          <div
            key={c.id}
            className="glass grid min-w-0 grid-cols-1 items-start gap-2 rounded-2xl px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                <span className="num mr-1.5 text-muted-foreground">
                  #{String(c.callNumber).padStart(2, "0")}
                </span>
                {c.stock}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {c.status} · exit {c.exitPrice ? fmtCurrency(c.exitPrice, 0) : "—"} ·{" "}
                {c.closedAt ? fmtDate(c.closedAt) : "—"}
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:flex-nowrap">
              <span
                className={`num text-sm font-bold ${closedPnlPct(c) >= 0 ? "text-bull" : "text-bear"}`}
              >
                {fmtPct(closedPnlPct(c))}
              </span>
              {c.status === "closed" ? (
                <Action icon={Archive} label={busyId === c.id ? "Saving…" : "Archive"} onClick={async () => {
                  setActionError(null); setBusyId(c.id);
                  try { await archiveCall(c.id); } catch (err) { setActionError(err instanceof Error ? err.message : "Could not archive the call."); } finally { setBusyId(null); }
                }} />
              ) : (
                <Action
                  icon={Radio}
                  label={busyId === c.id ? "Saving…" : c.status === "draft" ? "Publish" : "Relist"}
                  onClick={async () => {
                    setActionError(null); setBusyId(c.id);
                    try {
                      await publishCall(c.id);
                    } catch (err) {
                      setActionError(err instanceof Error ? err.message : "Could not publish the call.");
                    } finally {
                      setBusyId(null);
                    }
                  }}
                />
              )}
              <Action
                icon={Copy}
                label={busyId === `duplicate-${c.id}` ? "Duplicating…" : "Duplicate"}
                onClick={async () => {
                  setActionError(null);
                  setBusyId(`duplicate-${c.id}`);
                  try {
                    const result = await duplicateCall(c.id);
                    navigate({ to: "/admin/editor/$callId", params: { callId: result.id } });
                  } catch (err) {
                    setActionError(err instanceof Error ? err.message : "Could not duplicate the call.");
                  } finally {
                    setBusyId(null);
                  }
                }}
              />
              <Link
                to="/call/$callId"
                params={{ callId: c.id }}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-3">
      <div className={`num text-2xl font-extrabold leading-none ${tone ?? ""}`}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: typeof Archive;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
        primary
          ? "bg-primary/15 text-primary hover:bg-primary/25"
          : "border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
