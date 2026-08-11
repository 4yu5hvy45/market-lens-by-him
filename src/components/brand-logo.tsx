import { Link } from "@tanstack/react-router";

/**
 * Market Lens brand unit — a quiet rounded container holding a single
 * ascending market line with an aperture dot. Navy / white / blue only:
 * no gold, no gradients, no decoration. Legible down to 16px.
 */
export function BrandLogo({ onDark = false, compact }: { onDark?: boolean; compact?: boolean }) {
  const stroke = onDark ? "rgba(255,255,255,0.92)" : "var(--navy)";
  const accent = onDark ? "oklch(0.72 0.13 258)" : "var(--primary)";

  return (
    <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Market Lens by Him">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          onDark ? "border border-white/12 bg-white/[0.05]" : "border border-border bg-surface"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
          <path
            d="M4 16.5 9.5 11l3.2 3.2L18.6 7.9"
            stroke={stroke}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="7.3" r="2" fill="none" stroke={accent} strokeWidth="1.6" />
        </svg>
      </span>

      {!compact && (
        <span className="min-w-0 leading-none">
          <span
            className={`block truncate font-display text-[15px] font-bold tracking-[0.2em] ${
              onDark ? "text-white" : "text-foreground"
            }`}
          >
            MARKET LENS
          </span>
          <span
            className="mt-[7px] block text-[9px] font-medium uppercase tracking-[0.4em]"
            style={{ color: onDark ? "oklch(0.75 0.09 258)" : "var(--primary)" }}
          >
            by Him
          </span>
        </span>
      )}
    </Link>
  );
}
