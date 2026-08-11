import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const paymentInput = z.object({
  callId: z.string().min(1).max(120),
  // In demo/test mode the admin-edited local price is sent to the server so
  // Razorpay Test orders reflect the current browser-local call catalogue.
  // This MUST be replaced with a database-backed server price before production.
  price: z.coerce.number().finite().positive().max(100000),
});

/**
 * Test/iteration payment flow:
 * - Uses the local mock call catalogue, so Supabase is NOT required.
 * - Creates a real Razorpay order using the configured TEST key pair.
 * - The order stores the call id in Razorpay notes so the payment can be
 *   verified without a database.
 */
export const startPurchase = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => paymentInput.parse(input))
  .handler(async ({ data }) => {
    const { mockCalls } = await import("./mock-calls");
    const { razorpayConfig, createRazorpayOrder } = await import("./razorpay.server");

    const call = mockCalls.find((item) => item.id === data.callId);
    if (!call) throw new Error("This call is unavailable.");
    if (call.status !== "live") throw new Error("This call is no longer on sale.");

    const cfg = razorpayConfig();
    if (!cfg) {
      throw new Error(
        "Razorpay Test Mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.",
      );
    }

    const demoTestMode = process.env["DEMO_TEST_MODE"] !== "false";
    const amount = demoTestMode ? Number(data.price) : Number(call.price);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid call price.");

    const order = await createRazorpayOrder(cfg, {
      amountPaise: Math.round(amount * 100),
      receipt: `ml-${call.callNumber}-${Date.now()}`,
      notes: { call_id: call.id, mode: "test", amount_inr: amount.toFixed(2) },
    });

    return {
      orderId: order.id,
      amount,
      keyId: cfg.keyId,
      testMode: true,
    };
  });

/**
 * Verifies Razorpay's checkout signature and resolves the order's call id
 * directly from Razorpay. No Supabase/database is needed in this iteration.
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
    if (!cfg) throw new Error("Razorpay Test Mode is not configured.");

    if (!verifyCheckoutSignature(cfg, data.orderId, data.paymentId, data.signature)) {
      console.error("confirmPayment: signature mismatch", data.orderId);
      throw new Error("Payment could not be verified.");
    }

    const order = await fetchRazorpayOrder(cfg, data.orderId);
    const callId = order.notes?.["call_id"];
    if (!callId) throw new Error("Payment verified, but the call could not be identified.");

    const { mockCalls } = await import("./mock-calls");
    const call = mockCalls.find((item) => item.id === callId);
    if (!call) throw new Error("Payment verified, but the call is unavailable.");

    return {
      callId,
      paymentId: data.paymentId,
      orderId: data.orderId,
    };
  });

/** Kept only for backwards compatibility with older UI code. */
export const confirmTestPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ orderId: z.string().min(6) }).parse(input))
  .handler(async () => {
    throw new Error("Demo payments are disabled. Use Razorpay Test Mode instead.");
  });
