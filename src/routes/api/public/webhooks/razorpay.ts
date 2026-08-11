import { createFileRoute } from "@tanstack/react-router";

/**
 * Razorpay webhook. Signature is verified against the raw body before any
 * database write, and payment IDs make the write idempotent.
 */
export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";

        const { verifyWebhookSignature } = await import("@/lib/razorpay.server");
        if (!verifyWebhookSignature(raw, signature)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: {
          event?: string;
          payload?: { payment?: { entity?: { id?: string; order_id?: string; email?: string; contact?: string } } };
        };
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const entity = payload.payload?.payment?.entity;
        const orderId = entity?.order_id;
        const paymentId = entity?.id;
        if (!orderId || !paymentId) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (payload.event === "payment.captured" || payload.event === "order.paid") {
          await supabaseAdmin
            .from("purchases")
            .update({
              status: "paid",
              razorpay_payment_id: paymentId,
              paid_at: new Date().toISOString(),
              ...(entity.email ? { customer_email: entity.email } : {}),
              ...(entity.contact ? { customer_phone: entity.contact } : {}),
            })
            .eq("razorpay_order_id", orderId)
            .neq("status", "paid");
        } else if (payload.event === "payment.failed") {
          await supabaseAdmin
            .from("purchases")
            .update({ status: "failed" })
            .eq("razorpay_order_id", orderId)
            .eq("status", "created");
        }

        return new Response("ok");
      },
    },
  },
});
