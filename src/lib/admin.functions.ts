import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callDraftSchema, callPublishSchema } from "./call-schema";
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

/** Creates or updates a draft/live call. Free live calls use price 0. */
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

    // Drafts are intentionally free-form. Published/non-draft calls only
    // need the small set of fields required for the public/payment flow.
    if (data.values.state === "live") {
      const required = callPublishSchema.safeParse(data.values);
      if (!required.success) {
        throw new Error(required.error.issues.map((issue) => issue.message).join(" "));
      }
    }
    const values = callDraftSchema.parse(data.values);
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

    const candidate = callPublishSchema.safeParse({
      callNumber: call.call_number,
      state: "live",
      price: call.price_inr,
      stock: call.stock_name ?? "",
      ticker: call.ticker ?? "",
      entry: call.entry ?? 0,
      target: call.target ?? 0,
      stopLoss: call.stop_loss ?? 0,
    });
    if (!candidate.success) {
      throw new Error(candidate.error.issues.map((issue) => issue.message).join(" "));
    }

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

/** Duplicate a call into a fresh draft. Purchase history is never copied. */
export const adminDuplicateCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callId.parse(input))
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    const { data: source, error: sourceError } = await db
      .from("calls")
      .select("*")
      .eq("id", data.callId)
      .maybeSingle();

    if (sourceError) {
      console.error("adminDuplicateCall source", sourceError);
      throw new Error("Could not load the call to duplicate.");
    }
    if (!source) throw new Error("Call not found.");

    const { data: liveRows, error: liveError } = await db
      .from("calls")
      .select("call_number")
      .eq("state", "live");

    if (liveError) {
      console.error("adminDuplicateCall slots", liveError);
      throw new Error("Could not check available desk slots.");
    }

    const liveSlots = new Set((liveRows ?? []).map((row) => Number(row.call_number)));
    const availableSlot = Array.from({ length: 10 }, (_, i) => i + 1).find((slot) => !liveSlots.has(slot));
    if (!availableSlot) throw new Error("All 10 live slots are occupied. Close a call before duplicating it.");

    const {
      id: _id,
      created_at: _createdAt,
      updated_at: _updatedAt,
      published_at: _publishedAt,
      closed_at: _closedAt,
      exit_price: _exitPrice,
      ...copy
    } = source;

    const { data: created, error } = await db
      .from("calls")
      .insert({
        ...copy,
        call_number: availableSlot,
        state: "draft",
        published_at: null,
        closed_at: null,
        exit_price: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("adminDuplicateCall insert", error);
      throw new Error(`Could not duplicate call: ${error.message}`);
    }

    return { id: created.id as string, callNumber: availableSlot };
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

/** Re-list a previously closed/archived call as live after validating its content. Free calls use price 0. */
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
    const candidate = callPublishSchema.safeParse({
      callNumber: call.call_number,
      state: "live",
      price: call.price_inr,
      stock: call.stock_name ?? "",
      ticker: call.ticker ?? "",
      entry: call.entry ?? 0,
      target: call.target ?? 0,
      stopLoss: call.stop_loss ?? 0,
    });
    if (!candidate.success) {
      throw new Error(candidate.error.issues.map((issue) => issue.message).join(" "));
    }

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
