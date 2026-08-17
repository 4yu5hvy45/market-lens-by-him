import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Phone, Send, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { MarketTicker } from "./market-ticker";

export function AppShell({ children, hero }: { children: ReactNode; hero?: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="hero-navy">


        <div className="app-header relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:gap-4 md:px-8 md:py-5">
          <BrandLogo onDark />

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/18 bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/85 sm:flex">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.12_84)]" />
              Desk Live
            </span>
            <span className="hidden text-[11px] font-light uppercase tracking-[0.18em] text-white/45 lg:block">
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <Link
              to="/admin"
              aria-label="Admin login"
              title="Admin"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/[0.07] text-white/80 transition-colors hover:border-[oklch(0.78_0.12_84/0.6)] hover:text-white"
            >
              <ShieldCheck className="h-[17px] w-[17px]" strokeWidth={1.7} />
            </Link>
          </div>
        </div>

        {hero && (
          <div className="relative z-10 mx-auto max-w-6xl min-w-0 px-4 pb-12 pt-6 md:px-8 md:pb-20 md:pt-10">
            {hero}
          </div>
        )}
      </div>

      <MarketTicker />

      <main className="mx-auto max-w-6xl min-w-0 overflow-x-clip px-4 pb-20 pt-8 md:px-8 md:pt-12">{children}</main>

      <footer className="footer-navy mt-24">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-8">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_auto]">
            <div>
              <BrandLogo onDark />
              <p className="mt-5 max-w-md text-[11px] leading-relaxed text-white/50">
                Educational research only. Not investment advice. Markets carry risk; consult a
                SEBI-registered advisor before acting on any idea.
              </p>
            </div>

            <div className="md:text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                Contact the desk
              </div>
              <div className="mt-4 flex flex-col gap-2.5 md:items-end">
                <a
                  href="https://t.me/Himanshuuu15"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/90 transition-colors hover:border-white/30"
                >
                  <Send className="h-3.5 w-3.5" />
                  @Himanshuuu15
                  <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/40">
                    Telegram
                  </span>
                </a>
                <a
                  href="tel:+918959227202"
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/90 transition-colors hover:border-white/30"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="num">+91 89592 27202</span>
                </a>
                <a
                  href="mailto:marketlensbyhim@gmail.com"
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-white/90 transition-colors hover:border-white/30"
                >
                  marketlensbyhim@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.18em] text-white/35 md:flex-row md:items-center">
            <span>© {new Date().getFullYear()} Market Lens by Him</span>
            <span className="normal-case tracking-normal">Research desk · India equities</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
