# Market Lens — Razorpay Test Mode Launch

This build is for iterative testing. **Supabase is intentionally disabled for the payment flow.** Calls come from the local mock catalogue and successful payments unlock the call in browser local storage.

## 1. Add Razorpay TEST keys

Create a local `.env` file from `.env.example`:

```env
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
```

Use only the Test Mode API keys from Razorpay. Do not use live keys.

## 2. Run

```bash
npm install
npm run dev
```

Open the URL shown by Vite.

## 3. Test

1. Home → open a live call.
2. Click **Unlock now**.
3. Click **Pay securely**.
4. Razorpay Checkout should open.
5. Complete the payment using Razorpay's Test Mode payment details.
6. The app verifies the Razorpay signature on the server.
7. The verified order notes identify the local mock call.
8. The browser unlocks that call and opens the full call sheet.

## 4. No Supabase required for this payment test

Do not add:

```env
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Those will be added in the final backend integration round.

## Important

This is a real Razorpay **Test Mode** integration, not a fake payment. No real money should move. Payment records are not persisted to Supabase yet, and access is local to the browser. That is intentional for this iteration.
