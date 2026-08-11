import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callInputSchema } from "./call-schema";
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
      .object({ id: z.string().uuid().optional(), values: callInputSchema })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdminSession } = await import("./admin-session.server");
    await requireAdminSession();
    const { toRow } = await import("./admin-guard.server");
    const { adminClient } = await import("./calls.server");
    const db = await adminClient();
    const row = toRow(data.values);

    if (data.id) {
      const { error } = await db.from("calls").update(row).eq("id", data.id);
      if (error) {
        console.error("adminSaveCall update", error);
        throw new Error(error.message);
      }
      return { id: data.id };
    }

    const { data: created, error } = await db
      .from("calls")
      .insert({ ...row, state: "draft" })
      .select("id")
      .single();
    if (error) {
      console.error("adminSaveCall insert", error);
      throw new Error(error.message);
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

    const blockers: string[] = [];
    if (!Array.isArray(call.research) || call.research.length === 0) {
      blockers.push("Add at least one research block before publishing.");
    }
    if (Number(call.price_inr) <= 0) blockers.push("A live call needs a price above 0.");
    if (!call.summary) blockers.push("Add a short summary before publishing.");
    if (!call.view_text) blockers.push("Add the desk view before publishing.");
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
