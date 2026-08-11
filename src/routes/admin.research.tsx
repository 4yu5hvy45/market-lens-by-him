import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  PencilLine,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminGate } from "@/components/admin-gate";
import {
  adminDeleteResearch,
  adminListResearch,
  adminSaveResearch,
  adminSetResearchState,
  type ResearchPost,
} from "@/lib/research-posts.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/admin/research")({
  head: () => ({
    meta: [
      { title: "Weekly Research Desk — Market Lens Admin" },
      {
        name: "description",
        content: "Upload and publish the weekly market research note and its chart image.",
      },
      { property: "og:title", content: "Weekly Research Desk — Market Lens Admin" },
      { property: "og:description", content: "Publish the weekly market research note." },
    ],
  }),
  component: () => (
    <AdminGate>
      <AdminResearch />
    </AdminGate>
  ),
});

interface Draft {
  id?: string;
  title: string;
  weekLabel: string;
  category: string;
  summary: string;
  body: string;
  chartImage: string | null;
  chartCaption: string;
  tags: string;
  featured: boolean;
}

const EMPTY: Draft = {
  title: "",
  weekLabel: "",
  category: "Weekly Outlook",
  summary: "",
  body: "",
  chartImage: null,
  chartCaption: "",
  tags: "",
  featured: false,
};

function AdminResearch() {
  const qc = useQueryClient();
  const list = useServerFn(adminListResearch);
  const save = useServerFn(adminSaveResearch);
  const setState = useServerFn(adminSetResearchState);
  const remove = useServerFn(adminDeleteResearch);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-research"],
    queryFn: () => list(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-research"] });
    qc.invalidateQueries({ queryKey: ["research-posts"] });
  };

  const saving = useMutation({
    mutationFn: (d: Draft) =>
      save({
        data: {
          ...(d.id ? { id: d.id } : {}),
          title: d.title,
          weekLabel: d.weekLabel,
          category: d.category,
          summary: d.summary,
          body: d.body,
          chartImage: d.chartImage,
          chartCaption: d.chartCaption,
          tags: d.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 8),
          featured: d.featured,
        },
      }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const stateChange = useMutation({
    mutationFn: (v: { id: string; state: ResearchPost["state"] }) => setState({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleting = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  useEffect(() => {
    if (draft) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [draft]);

  const onPickFile = (file: File | undefined) => {
    if (!file || !draft) return;
    if (file.size > 2_500_000) {
      setError("Chart image must be under 2.5 MB. Export the PNG at a smaller size.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft({ ...draft, chartImage: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <AppShell>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Admin desk
          </Link>
          <h1 className="mt-1 truncate text-2xl font-extrabold md:text-4xl">Weekly research</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload the weekly study with its chart PNG. Published notes feature on the home page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDraft({ ...EMPTY });
          }}
          className="btn-blue sheen flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
        >
          <Plus className="h-4 w-4" /> New note
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-bear/10 px-4 py-3 text-xs font-medium text-bear">
          {error}
        </p>
      )}

      {draft && (
        <div className="glass mt-6 rounded-3xl p-5 md:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">
              {draft.id ? "Edit note" : "New weekly note"}
            </h2>
            <button
              type="button"
              onClick={() => setDraft(null)}
              aria-label="Close editor"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground hover:text-bear"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Nifty holds the 50-DMA: what changes next week"
                className="ml-input"
              />
            </Field>
            <Field label="Week label">
              <input
                value={draft.weekLabel}
                onChange={(e) => setDraft({ ...draft, weekLabel: e.target.value })}
                placeholder="Week of 11 Aug 2026"
                className="ml-input"
              />
            </Field>
            <Field label="Category">
              <input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                placeholder="Weekly Outlook"
                className="ml-input"
              />
            </Field>
            <Field label="Tags (comma separated)">
              <input
                value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                placeholder="Nifty, Banks, Breadth"
                className="ml-input"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Summary (shown on cards)">
              <textarea
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                rows={2}
                className="ml-input resize-y"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Full note (blank line = new paragraph)">
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={10}
                className="ml-input resize-y"
              />
            </Field>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <ImagePlus className="h-4 w-4" /> Chart image (PNG)
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-primary/40"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </button>
                {draft.chartImage && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, chartImage: null })}
                    className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-bear hover:border-bear/40"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {draft.chartImage && (
              <img
                src={draft.chartImage}
                alt="Chart preview"
                className="mt-4 max-h-72 w-auto rounded-xl border border-border object-contain"
              />
            )}

            <div className="mt-4">
              <Field label="Chart caption">
                <input
                  value={draft.chartCaption}
                  onChange={(e) => setDraft({ ...draft, chartCaption: e.target.value })}
                  placeholder="Nifty 50 · daily · 50 & 200 DMA"
                  className="ml-input"
                />
              </Field>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
            />
            Feature this note at the top of the desk
          </label>

          <button
            type="button"
            disabled={saving.isPending || draft.title.trim().length < 3}
            onClick={() => saving.mutate(draft)}
            className="btn-blue sheen mt-6 w-full rounded-2xl py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] disabled:opacity-50"
          >
            {saving.isPending ? "Saving…" : draft.id ? "Save changes" : "Create draft"}
          </button>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {isLoading && <div className="glass h-24 animate-pulse rounded-2xl" />}
        {!isLoading && posts.length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No research notes yet. Create the first weekly study.
          </p>
        )}
        {posts.map((p) => (
          <div key={p.id} className="glass rounded-2xl p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      p.state === "published"
                        ? "bg-bull/15 text-bull"
                        : p.state === "draft"
                          ? "bg-muted text-muted-foreground"
                          : "bg-violet/15 text-violet"
                    }`}
                  >
                    {p.state}
                  </span>
                  <span className="truncate text-sm font-bold">{p.title}</span>
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">
                  {p.weekLabel || p.category} ·{" "}
                  {fmtDate(p.publishedAt ?? p.updatedAt ?? new Date().toISOString())}
                  {p.chartImage ? " · chart attached" : " · no chart"}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {p.state === "published" ? (
                  <>
                    <Link
                      to="/insights/$slug"
                      params={{ slug: p.slug }}
                      title="View live"
                      aria-label="View live"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => stateChange.mutate({ id: p.id, state: "archived" })}
                      className="rounded-xl border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground hover:text-bear"
                    >
                      Unpublish
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => stateChange.mutate({ id: p.id, state: "published" })}
                    className="btn-blue rounded-xl px-3 py-2 text-[11px] font-bold"
                  >
                    Publish
                  </button>
                )}
                <button
                  type="button"
                  title="Edit"
                  aria-label="Edit"
                  onClick={() =>
                    setDraft({
                      id: p.id,
                      title: p.title,
                      weekLabel: p.weekLabel,
                      category: p.category,
                      summary: p.summary,
                      body: p.body,
                      chartImage: p.chartImage,
                      chartCaption: p.chartCaption,
                      tags: p.tags.join(", "),
                      featured: p.featured,
                    })
                  }
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Delete"
                  aria-label="Delete"
                  onClick={() => {
                    if (window.confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                      deleting.mutate(p.id);
                    }
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground hover:text-bear"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
