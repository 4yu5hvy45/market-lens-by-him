import type { StockCall } from "@/lib/types";
import { ResearchNote } from "./research-note";

function previewCall(call: StockCall): StockCall {
  // Drafts are previewed as they will appear once published live.
  return call.status === "draft" ? { ...call, status: "live", access: "paid" } : call;
}

/**
 * Canonical printable document. The same component is shown in the admin PDF
 * preview and printed from the public call page, so the admin is not editing
 * against a separate mock-up.
 */
export function CallPdfDocument({ call }: { call: StockCall }) {
  const value = previewCall(call);
  return (
    <div className="pdf-document">
      <ResearchNote call={value} />

      {value.research.length > 0 && (
        <section className="pdf-research mt-4 rounded-3xl border border-border bg-white p-6 md:p-8">
          <h2 className="font-display text-xl font-extrabold text-navy">Detailed Research</h2>
          <div className="mt-4 space-y-5">
            {value.research.map((r, index) => (
              <div key={`${r.heading}-${index}`} className="pdf-break-avoid">
                <h3 className="text-sm font-bold text-primary">{r.heading}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
