# Razorpay Test Mode — Market Lens

This iteration intentionally does **not** require Supabase.

## Environment

Set these server-side variables:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

Use the **Test Mode** API keys from the Razorpay dashboard. Never use live keys for this test build.

## Flow

1. Home → open a live call.
2. Click Unlock now.
3. Checkout creates a real Razorpay Test Mode order.
4. Razorpay Checkout opens.
5. Complete payment with Razorpay's official test credentials/payment methods.
6. The server verifies `razorpay_order_id | razorpay_payment_id` against the test key secret.
7. The server reads the verified Razorpay order notes to recover the local mock call id.
8. The browser unlocks the call in local storage.

No Supabase tables or Supabase environment variables are required for this iteration.

## Important

This is a **test integration**, not production payment storage. Purchases are not persisted in a database and access is local to the browser. Before production, connect purchase records, access tokens and webhook handling to Supabase.
