import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Market Lens is a dynamic Supabase/Razorpay app. Do not prerender/crawl
    // dynamic call, checkout, or admin routes during the Vercel build.
    prerender: {
      enabled: false,
      crawlLinks: false,
    },
  },
});
