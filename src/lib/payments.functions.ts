import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const paymentInput = z.object({
  callId: z.string().uuid(),
});

/**
 * Production payment flow:
 * - Reads the live call and price from Supabase (never trusts the browser price).
 * - Creates a Razorpay order using the server-side key pair.
 * - Creates a matching `purchases` row before opening Checkout.
 */
export const startPurchase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => paymentInput.parse(input))
  .handler(async ({ data }) => {
    const { adminClient } = await import("./calls.server");
    const { razorpayConfig, createRazorpayOrder } = await import("./razorpay.server");

    const db = await adminClient();

    const { data: call, error: callError } = await db
      .from("calls")
      .select("id, call_number, state, price_inr")
      .eq("id", data.callId)
      .maybeSingle();

    if (callError) {
      console.error("startPurchase: call lookup failed", callError);
      throw new Error("Could not load this call.");
    }

    if (!call) throw new Error("This call is unavailable.");
    if (call.state !== "live") throw new Error("This call is no longer on sale.");

    const amount = Number(call.price_inr);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("This call has an invalid price.");
    }

    const cfg = razorpayConfig();
    if (!cfg) {
      throw new Error(
        "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server environment.",
      );
    }

    const receipt = `ml-${call.call_number}-${Date.now()}`;

    const order = await createRazorpayOrder(cfg, {
      amountPaise: Math.round(amount * 100),
      receipt,
      notes: {
        call_id: String(call.id),
        call_number: String(call.call_number),
        amount_inr: amount.toFixed(2),
        source: "market-lens",
      },
    });

    const { error: purchaseError } = await db.from("purchases").insert({
      call_id: String(call.id),
      razorpay_order_id: order.id,
      amount: Math.round(amount),
      currency: "INR",
      status: "created",
    });

    if (purchaseError) {
      console.error("startPurchase: purchase insert failed", purchaseError);
      throw new Error("Could not prepare the payment. Please try again.");
    }

    return {
      orderId: order.id,
      amount,
      keyId: cfg.keyId,
    };
  });

/**
 * Verifies the Checkout signature and immediately marks the matching purchase
 * paid. The webhook remains the server-to-server backup/reconciliation path.
 */
export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().min(6).max(120),
        paymentId: z.string().min(6).max(120),
        signature: z.string().min(10).max(256),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { razorpayConfig, verifyCheckoutSignature, fetchRazorpayOrder } =
      await import("./razorpay.server");

    const cfg = razorpayConfig();
    if (!cfg) throw new Error("Razorpay is not configured.");

    if (!verifyCheckoutSignature(cfg, data.orderId, data.paymentId, data.signature)) {
      console.error("confirmPayment: signature mismatch", data.orderId);
      throw new Error("Payment could not be verified.");
    }

    const order = await fetchRazorpayOrder(cfg, data.orderId);
    const callId = order.notes?.["call_id"];
    if (!callId) throw new Error("Payment verified, but the call could not be identified.");

    const { adminClient } = await import("./calls.server");
    const db = await adminClient();

    const { data: purchase, error: purchaseLookupError } = await db
      .from("purchases")
      .select("id, call_id, amount, status, access_token")
      .eq("razorpay_order_id", data.orderId)
      .maybeSingle();

    if (purchaseLookupError) {
      console.error("confirmPayment: purchase lookup failed", purchaseLookupError);
      throw new Error("Payment was verified, but the purchase record could not be found.");
    }

    if (!purchase) {
      throw new Error("Payment was verified, but the purchase record could not be found.");
    }

    if (String(purchase.call_id) !== String(callId)) {
      throw new Error("Payment was verified for a different call.");
    }

    const { data: updated, error: updateError } = await db
      .from("purchases")
      .update({
        status: "paid",
        razorpay_payment_id: data.paymentId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", purchase.id)
      .neq("status", "paid")
      .select("access_token")
      .maybeSingle();

    if (updateError) {
      console.error("confirmPayment: purchase update failed", updateError);
      throw new Error("Payment was verified, but access could not be activated.");
    }

    return {
      callId: String(callId),
      paymentId: data.paymentId,
      orderId: data.orderId,
      accessToken: String(updated?.access_token ?? purchase.access_token),
    };
  });

/** Kept only for backwards compatibility with older UI code. */
export const confirmTestPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ orderId: z.string().min(6) }).parse(input))
  .handler(async () => {
    throw new Error("Demo payments are disabled. Use Razorpay Checkout.");
  });
