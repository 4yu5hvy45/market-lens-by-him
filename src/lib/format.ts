export const fmtCurrency = (v: number, digits = 2) =>
  `₹${v.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const fmtPct = (v: number, digits = 1) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const relativeDays = (iso: string) => {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
};
