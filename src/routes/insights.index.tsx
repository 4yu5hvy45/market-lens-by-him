import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listResearchPosts } from "@/lib/research-posts.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/insights/")({
  head: () => ({
    meta: [
      { title: "Market Research — Market Lens by HIM" },
      {
        name: "description",
        content:
          "Weekly market research from the Market Lens desk: index structure, sector rotation and annotated charts, published every week.",
      },
      { property: "og:title", content: "Market Research — Market Lens by HIM" },
      {
        property: "og:description",
        content: "Weekly desk study on index structure, sector rotation and annotated charts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsIndex,
});

function InsightsIndex() {
  const fetchPosts = useServerFn(listResearchPosts);
  const { data, isLoading } = useQuery({
    queryKey: ["research-posts"],
    queryFn: () => fetchPosts(),
    staleTime: 5 * 60_000,
  });

  const posts = data ?? [];

  return (
    <AppShell>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[oklch(0.6_0.1_74)]">
        <FileBarChart className="h-3.5 w-3.5" /> Market research
      </div>
      <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Weekly desk study</h1>
      <p className="mt-2 max-w-2xl text-sm font-light text-muted-foreground">
        Every week the desk publishes its read of the market — index structure, sector rotation,
        breadth and the charts behind the next set of calls. Free to read, always.
      </p>

      {isLoading && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass h-72 animate-pulse rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="glass mt-8 rounded-3xl overflow-hidden">
          <div className="bg-navy px-6 py-12 text-center md:px-10">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              Coming to the desk
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-white md:text-3xl">
              The first weekly market study is being prepared.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-light leading-relaxed text-white/55">
              Index structure, sector rotation, breadth and annotated charts will be published here
              as free weekly research.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((p) => (
          <Link
            key={p.id}
            to="/insights/$slug"
            params={{ slug: p.slug }}
            className="glass group overflow-hidden rounded-3xl transition-colors hover:border-primary/30"
          >
            {p.chartImage ? (
              <img
                src={p.chartImage}
                alt={p.chartCaption || `${p.title} chart`}
                loading="lazy"
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="h-44 w-full bg-navy" />
            )}
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <span className="rounded-full bg-primary/12 px-2.5 py-1 text-primary">
                  {p.category}
                </span>
                {p.weekLabel && <span>{p.weekLabel}</span>}
              </div>
              <h2 className="mt-3 font-display text-lg font-extrabold leading-snug group-hover:text-primary">
                {p.title}
              </h2>
              <p className="mt-1.5 line-clamp-3 text-[13px] font-light leading-relaxed text-muted-foreground">
                {p.summary}
              </p>
              <div className="mt-3 text-[11px] text-muted-foreground">
                {fmtDate(p.publishedAt ?? new Date().toISOString())}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
