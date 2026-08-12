/**
 * Normalises legacy chart-series JSON into the number[] contract used by the UI.
 * Older records may contain objects such as { value }, { y }, { price }, or
 * { close } instead of raw numbers. Unknown/non-numeric points are ignored.
 */
export function normalizeSeries(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((point) => {
      if (typeof point === "number") return Number.isFinite(point) ? point : null;
      if (typeof point === "string") {
        const n = Number(point);
        return Number.isFinite(n) ? n : null;
      }
      if (point && typeof point === "object") {
        const record = point as Record<string, unknown>;
        const candidates = ["value", "y", "price", "close", "currentPrice", "v"];
        for (const key of candidates) {
          const raw = record[key];
          const n = typeof raw === "number" ? raw : Number(raw);
          if (Number.isFinite(n)) return n;
        }
      }
      return null;
    })
    .filter((n): n is number => n !== null)
    .slice(0, 400);
}
