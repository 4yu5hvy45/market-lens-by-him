import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

/**
 * Production Vercel configuration.
 *
 * Use the official TanStack Start Vite plugin directly instead of the
 * Lovable wrapper. The wrapper was the layer involved when Vercel failed
 * inside tanstack-start:route-tree-client-plugin with
 * "Crawling result not available".
 *
 * This application is a dynamic Supabase/Razorpay app, so it does not need
 * build-time link crawling/prerendering.
 */
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      prerender: {
        enabled: false,
        crawlLinks: false,
      },
    }),
    nitro(),
    react(),
  ],
});
