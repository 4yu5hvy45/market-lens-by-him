import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FileBarChart } from "lucide-react";
import { listResearchPosts } from "@/lib/research-posts.functions";
import { fmtDate } from "@/lib/format";

/** Home-page strip featuring the weekly market research notes. */
export function ResearchFeature({ limit = 3 }: { limit?: number }) {
  const fetchPosts = useServerFn(listResearchPosts);
  const { data } = useQuery({
    queryKey: ["research-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 5 * 60_000,
  });

  const posts = (data ?? []).slice(0, limit);
  const [lead, ...rest] = posts;

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[oklch(0.6_0.1_74)]">
            <FileBarChart className="h-3.5 w-3.5" /> Market research
          </div>
          <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
            This Week on the Desk
          </h2>
          <p className="mt-1 text-xs font-light text-muted-foreground">
            Weekly market study — structure, charts and what the desk is positioning for
          </p>
        </div>
        <Link
          to="/insights"
          className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          All research <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6">
        {lead ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Link
              to="/insights/$slug"
              params={{ slug: lead.slug }}
              className="glass group overflow-hidden rounded-3xl transition-colors hover:border-primary/30"
            >
              {lead.chartImage ? (
                <img
                  src={lead.chartImage}
                  alt={lead.chartCaption || `${lead.title} chart`}
                  loading="lazy"
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="h-56 w-full bg-navy" />
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="rounded-full bg-primary/12 px-2.5 py-1 text-primary">
                    {lead.category}
                  </span>
                  {lead.weekLabel && <span>{lead.weekLabel}</span>}
                  <span className="opacity-50">{fmtDate(lead.publishedAt ?? lead.updatedAt ?? new Date().toISOString())}</span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-extrabold leading-snug group-hover:text-primary">
                  {lead.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm font-light leading-relaxed text-muted-foreground">
                  {lead.summary}
                </p>
              </div>
            </Link>

            <div className="space-y-3">
              {rest.map((p) => (
                <Link
                  key={p.id}
                  to="/insights/$slug"
                  params={{ slug: p.slug }}
                  className="glass block rounded-2xl p-4 transition-colors hover:border-primary/30"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {p.weekLabel || p.category}
                  </div>
                  <div className="mt-1.5 text-sm font-bold leading-snug">{p.title}</div>
                  <p className="mt-1 line-clamp-2 text-[12px] font-light text-muted-foreground">
                    {p.summary}
                  </p>
                </Link>
              ))}
              {rest.length === 0 && (
                <div className="glass rounded-2xl p-5 text-xs font-light text-muted-foreground">
                  More weekly studies land every week.
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            to="/insights"
            className="glass group block overflow-hidden rounded-3xl transition-colors hover:border-primary/30"
          >
            <div className="grid min-h-56 items-center gap-6 bg-navy px-6 py-8 md:grid-cols-[1fr_auto] md:px-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  Weekly desk study
                </div>
                <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white md:text-3xl">
                  Market structure. Sector rotation. The next move.
                </h3>
                <p className="mt-3 max-w-2xl text-sm font-light leading-relaxed text-white/55">
                  The desk&apos;s weekly market research will appear here with charts, context and
                  the thinking behind the next set of calls.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-xs font-bold text-white transition-colors group-hover:bg-white/[0.1]">
                Open research <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
