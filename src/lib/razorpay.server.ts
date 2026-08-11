import { createHmac, timingSafeEqual } from "crypto";

const API = "https://api.razorpay.com/v1";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

/** Live keys are present only once the user has saved them as secrets. */
export function razorpayConfig(): RazorpayConfig | null {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export async function createRazorpayOrder(
  cfg: RazorpayConfig,
  input: { amountPaise: number; receipt: string; notes: Record<string, string> },
): Promise<{ id: string }> {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${btoa(`${cfg.keyId}:${cfg.keySecret}`)}`,
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("Razorpay order creation failed", res.status, detail);
    throw new Error("Could not start the payment. Please try again.");
  }
  return (await res.json()) as { id: string };
}


export async function fetchRazorpayOrder(
  cfg: RazorpayConfig,
  orderId: string,
): Promise<{ id: string; status?: string; notes?: Record<string, string> }> {
  const res = await fetch(`${API}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      authorization: `Basic ${btoa(`${cfg.keyId}:${cfg.keySecret}`)}`,
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("Razorpay order fetch failed", res.status, detail);
    throw new Error("Payment was verified, but the Razorpay order could not be read.");
  }
  return (await res.json()) as { id: string; status?: string; notes?: Record<string, string> };
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Checkout handshake signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyCheckoutSignature(
  cfg: RazorpayConfig,
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const expected = createHmac("sha256", cfg.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(signature, expected);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(signature, expected);
}
