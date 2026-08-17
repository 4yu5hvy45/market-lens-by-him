import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminGate } from "@/components/admin-gate";
import {
  adminDeleteWatchItem,
  adminListWatchlist,
  adminSaveWatchItem,
  type WatchItem,
} from "@/lib/watchlist.functions";

export const Route = createFileRoute("/admin/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist Desk — Market Lens Admin" },
      {
        name: "description",
        content: "Curate the public desk watchlist: add, pause and reorder tracked symbols.",
      },
      { property: "og:title", content: "Watchlist Desk — Market Lens Admin" },
      { property: "og:description", content: "Curate the public desk watchlist symbols." },
    ],
  }),
  component: () => (
    <AdminGate>
      <AdminWatchlist />
    </AdminGate>
  ),
});

function AdminWatchlist() {
  const qc = useQueryClient();
  const list = useServerFn(adminListWatchlist);
  const save = useServerFn(adminSaveWatchItem);
  const remove = useServerFn(adminDeleteWatchItem);

  const [symbol, setSymbol] = useState("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-watchlist"],
    queryFn: () => list(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-watchlist"] });
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  };

  const adding = useMutation({
    mutationFn: () =>
      save({
        data: {
          symbol: symbol.trim().toUpperCase(),
          label: label.trim() || symbol.trim().toUpperCase(),
          note: note.trim(),
          sortOrder: items.length + 1,
          active: true,
        },
      }),
    onSuccess: () => {
      setSymbol("");
      setLabel("");
      setNote("");
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggling = useMutation({
    mutationFn: (item: WatchItem) =>
      save({
        data: {
          id: item.id,
          symbol: item.symbol,
          label: item.label,
          note: item.note,
          sortOrder: item.sortOrder,
          active: !item.active,
        },
      }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleting = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <AppShell>
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Admin desk
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold md:text-4xl">Desk watchlist</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Symbols shown publicly on the home page with live prices. Use Yahoo-style tickers —{" "}
        <span className="num">RELIANCE.NS</span> (NSE), <span className="num">500325.BO</span> (BSE),{" "}
        <span className="num">^NSEI</span> (index).
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-bear/10 px-4 py-3 text-xs font-medium text-bear">
          {error}
        </p>
      )}

      <div className="glass mt-6 grid gap-3 rounded-2xl p-4 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="TICKER.NS"
          className="ml-input"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Company name"
          className="ml-input"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why we're watching it"
          className="ml-input"
        />
        <button
          type="button"
          disabled={adding.isPending || symbol.trim().length === 0}
          onClick={() => adding.mutate()}
          className="btn-blue sheen flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading && <div className="glass h-16 animate-pulse rounded-2xl" />}
        {!isLoading && items.length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No symbols tracked yet.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="glass grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-bold">{item.label}</span>
                <span className="num shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {item.symbol}
                </span>
                {!item.active && (
                  <span className="shrink-0 rounded-full bg-bear/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-bear">
                    paused
                  </span>
                )}
              </div>
              {item.note && (
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.note}</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                title={item.active ? "Hide from site" : "Show on site"}
                aria-label={item.active ? "Hide from site" : "Show on site"}
                onClick={() => toggling.mutate(item)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary"
              >
                {item.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button
                type="button"
                title="Remove"
                aria-label="Remove"
                onClick={() => deleting.mutate(item.id)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground hover:text-bear"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
