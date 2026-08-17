import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callDraftSchema, callInputSchema, publishBlockers } from "./call-schema";
import type { FullCall } from "./types";

const callId = z.object({ callId: z.string().uuid() });

/** Every call including drafts. Admin only. */
export const adminListCalls = createServerFn({ method: "GET" })
  .handler(async () => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient, mapFull } = await import("./calls.server");
    const db = await adminClient();
    const { data, error } = await db
      .from("calls")
      .select("*")
      .order("state", { ascending: true })
      .order("call_number", { ascending: true });
    if (error) {
      console.error("adminListCalls", error);
      throw new Error("Could not load the desk.");
    }
    return (data ?? []).map(mapFull) as FullCall[];
  });

export const adminGetCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callId.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient, mapFull } = await import("./calls.server");
    const db = await adminClient();
    const { data: row } = await db.from("calls").select("*").eq("id", data.callId).maybeSingle();
    return row ? (mapFull(row) as FullCall) : null;
  });

/** Creates or updates a draft/live call. */
export const adminSaveCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid().optional(), values: callDraftSchema })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { toRow } = await import("./admin-guard.server");
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    // Drafts may be incomplete. Any non-draft save must pass the strict
    // publish schema so a live/closed/archived call can never be corrupted
    // with empty trade levels or research.
    const values =
      data.values.state === "draft"
        ? data.values
        : callInputSchema.parse(data.values);
    const row = toRow(values);

    if (data.id) {
      const { data: updated, error } = await db
        .from("calls")
        .update(row)
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("adminSaveCall update", error);
        throw new Error(`Could not save call: ${error.message}`);
      }
      if (!updated) throw new Error("Could not save call: the call no longer exists.");
      return { id: data.id };
    }

    const { data: created, error } = await db
      .from("calls")
      .insert({ ...row, state: "draft" })
      .select("id")
      .single();
    if (error) {
      console.error("adminSaveCall insert", error);
      throw new Error(`Could not create call: ${error.message}`);
    }
    return { id: created.id as string };
  });

/** draft → live. Fails when the slot already holds a live call. */
export const adminPublishCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callId.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    const { data: call } = await db.from("calls").select("*").eq("id", data.callId).maybeSingle();
    if (!call) throw new Error("Call not found.");
    if (call.state !== "draft") throw new Error("Only a draft call can be published. Create a new draft for a new call.");

    const candidate = callInputSchema.safeParse({
      callNumber: call.call_number,
      state: "live",
      price: call.price_inr,
      stock: call.stock_name ?? "",
      ticker: call.ticker ?? "",
      exchange: call.exchange ?? "NSE / BSE",
      sector: call.sector ?? "",
      direction: call.direction ?? "long",
      entry: call.entry ?? 0,
      target: call.target ?? 0,
      stopLoss: call.stop_loss ?? 0,
      currentPrice: call.current_price ?? call.entry ?? 0,
      term: call.term ?? "Swing",
      coverage: call.coverage ?? "Weekly Pick",
      segment: call.segment ?? "Cash / Equity",
      timeframe: call.timeframe ?? "",
      changePct: call.change_pct ?? 0,
      confidence: call.confidence ?? 70,
      summary: call.summary ?? "",
      view: call.view_text ?? "",
      research: Array.isArray(call.research) ? call.research : [],
      catalysts: Array.isArray(call.catalysts) ? call.catalysts : [],
      series: call.series ?? [],
      chartImage: call.chart_image ?? undefined,
      checkoutHeadline: "",
      checkoutSubtext: "",
    });
    if (!candidate.success) {
      const messages = candidate.error.issues.map((issue) => issue.message);
      throw new Error(messages.join(" "));
    }
    const blockers = publishBlockers(candidate.data);
    if (blockers.length) throw new Error(blockers.join(" "));

    const { error } = await db
      .from("calls")
      .update({ state: "live", published_at: call.published_at ?? new Date().toISOString() })
      .eq("id", data.callId);
    if (error) {
      console.error("adminPublishCall", error);
      throw new Error(
        error.code === "23505"
          ? `Slot ${call.call_number} already has a live call. Close it first.`
          : error.message,
      );
    }
    return { ok: true };
  });

/** live → closed. Exit price is required; the outcome is derived, not typed in. */
export const adminCloseCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ callId: z.string().uuid(), exitPrice: z.coerce.number().positive("Enter the exit price") })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    const { data: call } = await db
      .from("calls")
      .select("id, state, entry, direction")
      .eq("id", data.callId)
      .maybeSingle();
    if (!call) throw new Error("Call not found.");
    if (call.state !== "live") throw new Error("Only a live call can be closed.");

    const entry = Number(call.entry);
    const sign = call.direction === "short" ? -1 : 1;
    const realisedPct = Number((((data.exitPrice - entry) / entry) * 100 * sign).toFixed(2));

    const { error } = await db
      .from("calls")
      .update({
        state: "closed",
        exit_price: data.exitPrice,
        current_price: data.exitPrice,
        change_pct: realisedPct,
        price_inr: 0,
        closed_at: new Date().toISOString(),
      })
      .eq("id", data.callId);
    if (error) {
      console.error("adminCloseCall", error);
      throw new Error(error.message);
    }
    return { realisedPct };
  });

/** Re-list a previously closed/archived call as live after validating its content. */
export const adminRelistCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callId.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    const { data: call } = await db.from("calls").select("*").eq("id", data.callId).maybeSingle();
    if (!call) throw new Error("Call not found.");
    if (!["closed", "archived", "draft"].includes(String(call.state))) {
      throw new Error("Only a closed, archived or draft call can be re-listed.");
    }
    const candidate = callInputSchema.safeParse({
      callNumber: call.call_number,
      state: "live",
      price: call.price_inr,
      stock: call.stock_name ?? "",
      ticker: call.ticker ?? "",
      exchange: call.exchange ?? "NSE / BSE",
      sector: call.sector ?? "",
      direction: call.direction ?? "long",
      entry: call.entry ?? 0,
      target: call.target ?? 0,
      stopLoss: call.stop_loss ?? 0,
      currentPrice: call.current_price ?? call.entry ?? 0,
      term: call.term ?? "Swing",
      coverage: call.coverage ?? "Weekly Pick",
      segment: call.segment ?? "Cash / Equity",
      timeframe: call.timeframe ?? "",
      changePct: call.change_pct ?? 0,
      confidence: call.confidence ?? 70,
      summary: call.summary ?? "",
      view: call.view_text ?? "",
      research: Array.isArray(call.research) ? call.research : [],
      catalysts: Array.isArray(call.catalysts) ? call.catalysts : [],
      series: call.series ?? [],
      chartImage: call.chart_image ?? undefined,
      checkoutHeadline: "",
      checkoutSubtext: "",
    });
    if (!candidate.success) {
      throw new Error(candidate.error.issues.map((issue) => issue.message).join(" "));
    }
    const blockers = publishBlockers(candidate.data);
    if (blockers.length) throw new Error(blockers.join(" "));

    const { error } = await db.from("calls")
      .update({ state: "live", price_inr: Number(call.price_inr), published_at: new Date().toISOString(), closed_at: null, exit_price: null })
      .eq("id", data.callId);
    if (error) {
      console.error("adminRelistCall", error);
      throw new Error(error.code === "23505" ? `Slot ${call.call_number} already has a live call. Close it first.` : error.message);
    }
    return { ok: true };
  });

/** closed → archived (or pull a draft/live call out of rotation). */
export const adminArchiveCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callId.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();
    const { error } = await db
      .from("calls")
      .update({ state: "archived", price_inr: 0 })
      .eq("id", data.callId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Purchase log for a call. Admin only. */
export const adminCallPurchases = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callId.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();
    const { data: rows } = await db
      .from("purchases")
      .select("id, amount, status, customer_email, customer_phone, created_at, paid_at")
      .eq("call_id", data.callId)
      .order("created_at", { ascending: false });
    return rows ?? [];
  });

/** Tells the admin UI whether live Razorpay keys are configured. */
export const adminPaymentStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { razorpayConfig } = await import("./razorpay.server");
    return {
      razorpayConnected: Boolean(razorpayConfig()),
      webhookConfigured: Boolean(process.env["RAZORPAY_WEBHOOK_SECRET"]),
    };
  });
