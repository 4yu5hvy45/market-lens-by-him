import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getResearchPost } from "@/lib/research-posts.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/insights/$slug")({
  head: ({ params }) => {
    const readable = params.slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    return {
      meta: [
        { title: `${readable} — Market Lens Research` },
        {
          name: "description",
          content: `Weekly market research from the Market Lens desk: ${readable}.`,
        },
        { property: "og:title", content: `${readable} — Market Lens Research` },
        {
          property: "og:description",
          content: "Weekly desk study with annotated charts and positioning notes.",
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ResearchPostPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <p role="alert" className="py-24 text-center text-sm text-bear">
        {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="py-24 text-center text-sm text-muted-foreground">Research note not found.</p>
    </AppShell>
  ),
});

function ResearchPostPage() {
  const { slug } = Route.useParams();
  const fetchPost = useServerFn(getResearchPost);
  const { data, isLoading } = useQuery({
    queryKey: ["research-post", slug],
    queryFn: () => fetchPost({ data: { slug } }),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="glass h-[520px] animate-pulse rounded-3xl" />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <p className="py-24 text-center text-sm text-muted-foreground">
          This research note is no longer published.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/insights"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All research
      </Link>

      <article className="glass mt-4 overflow-hidden rounded-3xl">
        <div className="h-2 bg-navy" />
        <div className="p-6 md:p-9">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="rounded-full bg-primary/12 px-2.5 py-1 text-primary">
              {data.category}
            </span>
            {data.weekLabel && <span>{data.weekLabel}</span>}
            <span className="opacity-60">
              {fmtDate(data.publishedAt ?? new Date().toISOString())}
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight md:text-[40px]">
            {data.title}
          </h1>

          {data.summary && (
            <p className="mt-4 border-l-2 border-primary/40 pl-4 text-[15px] font-light leading-relaxed text-foreground/80">
              {data.summary}
            </p>
          )}

          {data.chartImage && (
            <figure className="mt-8 rounded-2xl border border-border bg-surface-2 p-4">
              <img
                src={data.chartImage}
                alt={data.chartCaption || `${data.title} chart`}
                className="mx-auto max-h-[520px] w-auto rounded-xl object-contain"
              />
              {data.chartCaption && (
                <figcaption className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {data.chartCaption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="mt-8 space-y-4 text-[15px] leading-[1.85] text-foreground/85">
            {data.body
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>

          {data.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {data.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <p className="mt-9 border-t border-border pt-5 text-[11px] italic leading-relaxed text-muted-foreground">
            Disclaimer: This research note is prepared for general informational and educational
            purposes only and does not constitute investment advice or a solicitation to buy or sell
            any security. Please consult a SEBI-registered investment advisor before making any
            investment decision.
          </p>
        </div>
      </article>
    </AppShell>
  );
}
