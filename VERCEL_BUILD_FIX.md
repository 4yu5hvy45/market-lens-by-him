# Vercel build fix

This version removes the Lovable Vite/TanStack wrapper and uses the official
TanStack Start Vite plugin plus Nitro directly. The app keeps SSR/server
functions and the Vercel Nitro preset, while disabling static prerender/link
crawling because Market Lens is a dynamic Supabase/Razorpay application.

No Supabase schema or Razorpay code was changed by this build fix.
