import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ResearchPost {
  id: string;
  title: string;
  slug: string;
  weekLabel: string;
  category: string;
  summary: string;
  body: string;
  chartImage: string | null;
  chartCaption: string;
  tags: string[];
  state: "draft" | "published" | "archived";
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
}

type Row = Record<string, unknown>;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function mapPost(row: Row): ResearchPost {
  return {
    id: String(row["id"]),
    title: String(row["title"]),
    slug: String(row["slug"]),
    weekLabel: String(row["week_label"] ?? ""),
    category: String(row["category"] ?? ""),
    summary: String(row["summary"] ?? ""),
    body: String(row["body"] ?? ""),
    chartImage: (row["chart_image"] as string | null) ?? null,
    chartCaption: String(row["chart_caption"] ?? ""),
    tags: (row["tags"] as string[] | null) ?? [],
    state: (row["state"] as ResearchPost["state"]) ?? "draft",
    featured: Boolean(row["featured"]),
    publishedAt: (row["published_at"] as string | null) ?? null,
    updatedAt: (row["updated_at"] as string | null) ?? null,
  };
}

const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(140),
  slug: z.string().trim().max(80).optional(),
  weekLabel: z.string().trim().max(60).default(""),
  category: z.string().trim().max(60).default("Weekly Outlook"),
  summary: z.string().trim().max(400).default(""),
  body: z.string().max(20000).default(""),
  // Chart PNG arrives as a data URL from the admin uploader.
  chartImage: z.string().max(4_000_000).nullable().default(null),
  chartCaption: z.string().trim().max(160).default(""),
  tags: z.array(z.string().trim().max(30)).max(8).default([]),
  featured: z.boolean().default(false),
});

/** Published weekly research, newest first. Safe for anonymous visitors. */
export const listResearchPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { adminClient } = await import("./calls.server");
  const db = await adminClient();
  const { data, error } = await db
    .from("research_posts")
    .select("*")
    .eq("state", "published")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("listResearchPosts", error);
    throw new Error("Could not load market research.");
  }
  return (data ?? []).map(mapPost);
});

export const getResearchPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();
    const { data: row, error } = await db
      .from("research_posts")
      .select("*")
      .eq("state", "published")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) {
      console.error("getResearchPost", error);
      throw new Error("Could not load this research note.");
    }
    return row ? mapPost(row as Row) : null;
  });

/** Admin desk listing (drafts included). */
export const adminListResearch = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminSession } = await import("./admin-session.server");
  await requireAdminSession();
  const { adminClient } = await import("./calls.server");
  const db = await adminClient();
  const { data, error } = await db
    .from("research_posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("adminListResearch", error);
    throw new Error("Could not load research posts.");
  }
  return (data ?? []).map(mapPost);
});

export const adminSaveResearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => postSchema.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    const base = {
      title: data.title,
      slug: (data.slug && slugify(data.slug)) || `${slugify(data.title)}-${Date.now().toString(36)}`,
      week_label: data.weekLabel,
      category: data.category,
      summary: data.summary,
      body: data.body,
      chart_image: data.chartImage,
      chart_caption: data.chartCaption,
      tags: data.tags,
      featured: data.featured,
    };

    if (data.id) {
      const { error } = await db.from("research_posts").update(base).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: created, error } = await db
      .from("research_posts")
      .insert(base)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: String((created as Row)["id"]) };
  });

export const adminSetResearchState = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        state: z.enum(["draft", "published", "archived"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();
    const patch: Record<string, unknown> = { state: data.state };
    if (data.state === "published") patch["published_at"] = new Date().toISOString();
    const { error } = await db.from("research_posts").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteResearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();
    const { error } = await db.from("research_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
