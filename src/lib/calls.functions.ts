import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PublicCall } from "./types";

const idInput = z.object({ callId: z.string().uuid() });

/** Every published call. Paid live calls are teaser-only; free live calls are fully public. */
export const getPublishedCalls = createServerFn({ method: "GET" }).handler(async () => {
  const { adminClient, mapPublic } = await import("./calls.server");
  // Read the base table only on the server, then map it to the safe public
  // projection. This avoids PostgREST view/schema-cache failures in production.
  const db = await adminClient();
  const { data, error } = await db
    .from("calls")
    .select("*")
    .in("state", ["live", "closed"])
    .order("call_number", { ascending: true });
  if (error) {
    console.error("getPublishedCalls", error);
    throw new Error("Could not load calls right now.");
  }
  return (data ?? []).map(mapPublic) as PublicCall[];
});

/** Public data for a single call. Paid live calls never expose paid fields. */
export const getPublicCall = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data }) => {
    const { adminClient, mapPublic } = await import("./calls.server");
    const db = await adminClient();
    const { data: row, error } = await db
      .from("calls")
      .select("*")
      .eq("id", data.callId)
      .in("state", ["live", "closed"])
      .maybeSingle();
    if (error) {
      console.error("getPublicCall", error);
      throw new Error("Could not load this call.");
    }
    return row ? (mapPublic(row) as PublicCall) : null;
  });

/**
 * Full call content. Closed/archived calls and free live calls are public;
 * paid live calls require a verified purchase.
 */
export const getCallContent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ callId: z.string().uuid(), accessToken: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { adminClient, mapFull, mapPublic, hasVerifiedPurchase } = await import(
      "./calls.server"
    );

    const db = await adminClient();
    const { data: pub } = await db
      .from("calls")
      .select("*")
      .eq("id", data.callId)
      .in("state", ["live", "closed"])
      .maybeSingle();
    if (!pub) return null;

    const publicCall = mapPublic(pub) as PublicCall;
    if (!publicCall.locked) return publicCall;

    const { customerAccessToken } = await import("./customer-session.server");
    const accessToken = data.accessToken ?? (await customerAccessToken(data.callId));
    if (!accessToken) return publicCall;
    const owns = await hasVerifiedPurchase(data.callId, accessToken);
    if (!owns) return publicCall;

    const { data: row } = await db.from("calls").select("*").eq("id", data.callId).maybeSingle();
    return row ? (mapFull(row) as PublicCall) : publicCall;
  });
