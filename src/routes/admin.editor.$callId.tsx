import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, FileText, ImageUp, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ResearchNote } from "@/components/research-note";
import { CallPdfDocument } from "@/components/call-pdf-document";
import { AdminGate } from "@/components/admin-gate";
import { useCalls } from "@/lib/calls-store";
import type { StockCall, Term } from "@/lib/types";

export const Route = createFileRoute("/admin/editor/$callId")({
  head: () => ({
    meta: [
      { title: "Add or Edit Call — Market Lens by HIM" },
      {
        name: "description",
        content: "Compose a Market Lens call: levels, timeframe, view, chart image and research.",
      },
      { property: "og:title", content: "Add or Edit Call — Market Lens by HIM" },
      { property: "og:description", content: "Compose levels, timeframe, view and research." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AdminGate>
      <CallEditor />
    </AdminGate>
  ),
});

const terms: Term[] = ["Short Term", "Swing", "Positional", "Long Term"];
const slots = Array.from({ length: 10 }, (_, i) => String(i + 1));

const blank = (): StockCall => ({
  id: `ml-${Math.floor(Math.random() * 9000 + 1000)}`,
  callNumber: 1,
  stock: "",
  ticker: "",
  exchange: "NSE / BSE",
  sector: "",
  direction: "long",
  status: "draft",
  access: "paid",
  price: 499,
  currentPrice: 0,
  changePct: 0,
  entry: 0,
  target: 0,
  stopLoss: 0,
  potentialPctOverride: undefined,
  term: "Swing",
  coverage: "Weekly Pick",
  segment: "Cash / Equity",
  timeframe: "15 - 20 Trading Days",
  publishedAt: new Date().toISOString().slice(0, 10),
  summary: "",
  view: "",
  catalysts: [],
  confidence: 70,
  series: Array.from({ length: 30 }, (_, i) => 100 + i * 0.8),
  research: [{ heading: "Thesis", body: "" }],
  checkoutHeadline: "",
  checkoutSubtext: "",
});


function previewCall(call: StockCall): StockCall {
  return call.status === "draft" ? { ...call, status: "live", access: "paid" } : call;
}

function CallEditor() {
  const { callId } = useParams({ from: "/admin/editor/$callId" });
  const { getCall, createCall, updateCall, calls, refreshAdmin } = useCalls();
  const navigate = useNavigate();
  const existing = callId === "new" ? undefined : getCall(callId);
  const firstAvailableSlot = () => {
    const liveSlots = new Set(
      calls.filter((c) => c.status === "live").map((c) => c.callNumber),
    );
    const available = slots.find((slot) => !liveSlots.has(Number(slot)));
    return available ? Number(available) : 1;
  };

  const [form, setForm] = useState<StockCall>(() => {
    if (existing) return existing;
    const draft = blank();
    draft.callNumber = firstAvailableSlot();
    return draft;
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"web" | "pdf">("web");

  const set = <K extends keyof StockCall>(k: K, v: StockCall[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    void refreshAdmin().catch((err) => setError(err instanceof Error ? err.message : "Could not load the call."));
  }, [refreshAdmin]);

  useEffect(() => {
    if (existing) {
      setForm(existing);
      return;
    }
    // Once the admin list has loaded, choose the first free live slot for a new draft.
    const liveSlots = new Set(calls.filter((c) => c.status === "live").map((c) => c.callNumber));
    const available = slots.find((slot) => !liveSlots.has(Number(slot)));
    if (available) setForm((current) => ({ ...current, callNumber: Number(available) }));
  }, [existing?.id, calls]);

  const slotTaken = calls.find(
    (c) => c.status === "live" && c.callNumber === form.callNumber && c.id !== form.id,
  );

  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("chartImage", String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (existing) await updateCall(existing.id, form);
      else await createCall(form);
      navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the call.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="min-w-0">
      <button
        type="button"
        onClick={() => navigate({ to: "/admin" })}
        className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Admin desk
      </button>

      <h1 className="font-display text-2xl font-extrabold md:text-3xl">
        {existing ? "Edit call" : "New call"}
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Everything here renders on the public call sheet exactly as the research note layout.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-bear/10 px-4 py-3 text-xs font-medium leading-relaxed text-bear">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 pb-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
        <Card title="Desk slot & access">
          <Select
            label="Call number (desk slot)"
            value={String(form.callNumber)}
            options={slots}
            onChange={(v) => set("callNumber", Number(v))}
          />
          <Select
            label="Status"
            value={form.status}
            options={["draft", "live", "closed", "archived"]}
            onChange={(v) => set("status", v as StockCall["status"])}
          />
          <Select
            label="Access"
            value={form.access}
            options={["paid", "free"]}
            onChange={(v) => {
              const access = v as StockCall["access"];
              set("access", access);
              if (access === "free") set("price", 0);
              else if (form.price <= 0) set("price", 499);
            }}
          />
          {form.access === "paid" ? (
            <Num label="Unlock price (₹)" value={form.price} onChange={(v) => set("price", v)} />
          ) : (
            <div className="rounded-xl border border-border bg-surface-2 px-3 py-3 text-sm text-muted-foreground">
              Free call — no payment required
            </div>
          )
          {slotTaken && (
            <p className="sm:col-span-2 text-[11px] font-medium text-bear">
              Slot {form.callNumber} is currently occupied by “{slotTaken.stock}”. Drafts may share a
              slot, but only one live call can occupy it at a time.
            </p>
          )}
        </Card>

        <Card title="Header line">
          <Field
            label="Issue date"
            value={form.publishedAt}
            onChange={(v) => set("publishedAt", v)}
          />
          <Field label="Coverage" value={form.coverage} onChange={(v) => set("coverage", v)} />
          <Field label="Segment" value={form.segment} onChange={(v) => set("segment", v)} />
          <Field
            label="Suggested time frame"
            value={form.timeframe}
            onChange={(v) => set("timeframe", v)}
          />
        </Card>

        <Card title="Company">
          <Field label="Company name" value={form.stock} placeholder="e.g. Tata Motors" onChange={(v) => set("stock", v)} />
          <Field label="Ticker" value={form.ticker} placeholder="e.g. TATAMOTORS" onChange={(v) => set("ticker", v)} />
          <Field label="Exchange" value={form.exchange} onChange={(v) => set("exchange", v)} />
          <Field label="Sector" value={form.sector} onChange={(v) => set("sector", v)} />
          <Num
            label="CMP (as of chart)"
            value={form.currentPrice}
            onChange={(v) => set("currentPrice", v)}
          />
        </Card>

        <Card title="Levels">
          <Num label="Entry level" value={form.entry} placeholder="e.g. 680" onChange={(v) => set("entry", v)} />
          <Num label="Target level" value={form.target} placeholder="e.g. 780" onChange={(v) => set("target", v)} />
          <Num label="Stop loss" value={form.stopLoss} placeholder="e.g. 640" onChange={(v) => set("stopLoss", v)} />
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Potential left override (%)
            </span>
            <input
              inputMode="decimal"
              type="number"
              className={`${inputClass} num text-sm font-semibold`}
              value={form.potentialPctOverride ?? ""}
              placeholder="Auto-calculate"
              onChange={(e) => {
                const raw = e.target.value;
                set("potentialPctOverride", raw === "" ? undefined : Number(raw));
              }}
            />
          </label>
          <Select
            label="Term"
            value={form.term}
            options={terms}
            onChange={(v) => set("term", v as Term)}
          />
          <p className="sm:col-span-2 text-[11px] text-muted-foreground">
            Leave empty to calculate Potential left automatically from entry and target.
          </p>
          {form.status !== "live" && (
            <Num
              label="Exit price"
              value={form.exitPrice ?? 0}
              onChange={(v) => set("exitPrice", v)}
            />
          )}
        </Card>

        <Card title="Chart reference (daily)" full>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickImage(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-blue flex items-center gap-2 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em]"
            >
              <ImageUp className="h-4 w-4" /> Upload chart image
            </button>
            {form.chartImage && (
              <button
                type="button"
                onClick={() => set("chartImage", undefined)}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-[11px] font-semibold text-muted-foreground hover:text-bear"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          <Field
            label="…or paste an image URL"
            value={form.chartImage?.startsWith("data:") ? "" : (form.chartImage ?? "")}
            onChange={(v) => set("chartImage", v || undefined)}
          />
          {form.chartImage && (
            <div className="rounded-2xl border border-border bg-surface-2 p-3">
              <img
                src={form.chartImage}
                alt="Chart reference preview"
                className="mx-auto max-h-72 rounded-xl object-contain"
              />
            </div>
          )}
        </Card>


        <Card title="Narrative" full>
          <Area
            label="Summary (public teaser)"
            value={form.summary}
            placeholder="e.g. Tata Motors is showing a constructive breakout setup with improving momentum."
            onChange={(v) => set("summary", v)}
          />
          <Area label="Our view" value={form.view} placeholder="Explain the setup, context and risk in plain language…" onChange={(v) => set("view", v)} rows={6} />
          <Field
            label="Catalysts (comma separated)"
            value={form.catalysts.join(", ")}
            onChange={(v) =>
              set(
                "catalysts",
                v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
          <Area
            label="Detailed research (locked while paid)"
            value={form.research.map((r) => `${r.heading} :: ${r.body}`).join("\n")}
            placeholder="One research block per line, e.g. Technical Setup :: Price has reclaimed the key resistance zone with improving momentum."
            rows={6}
            onChange={(v) =>
              set(
                "research",
                v
                  .split("\n")
                  .filter(Boolean)
                  .map((line) => {
                    const [heading, ...rest] = line.split("::");
                    return { heading: (heading ?? "").trim(), body: rest.join("::").trim() };
                  }),
              )
            }
          />
          <p className="text-[11px] text-muted-foreground">
            One block per line, formatted as <span className="num">Heading :: body text</span>.
          </p>
        </Card>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-blue sheen flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : existing ? "Save changes" : "Save draft"}
        </button>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-5">
          <div className="glass overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Live editor preview</div>
                <div className="mt-1 text-xs text-muted-foreground">What the visitor will see after publishing</div>
              </div>
              <div className="flex rounded-xl border border-border bg-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("web")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] ${previewMode === "web" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  <Eye className="h-3.5 w-3.5" /> Web
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("pdf")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] ${previewMode === "pdf" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-auto bg-surface-2 p-3 md:p-4">
              {previewMode === "web" ? (
                <div className="space-y-4">
                  <ResearchNote call={previewCall(form)} />
                  {form.research.length > 0 && (
                    <section className="glass rounded-3xl p-6">
                      <h2 className="font-display text-xl font-extrabold text-navy">Detailed Research</h2>
                      <div className="mt-4 space-y-5">
                        {form.research.map((r, index) => (
                          <div key={`${r.heading}-${index}`}>
                            <h3 className="text-sm font-bold text-primary">{r.heading}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="pdf-preview-sheet"><CallPdfDocument call={form} /></div>
              )}
            </div>
          </div>
        </aside>
      </div>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  children,
  full,
}: {
  title: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <section className="glass rounded-3xl p-5">
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      <div className={full ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>{children}</div>
    </section>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Num({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <input
        inputMode="decimal"
        className={`${inputClass} num text-sm font-semibold`}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <textarea
        rows={rows}
        className={`${inputClass} leading-relaxed`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o} className="bg-background">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
