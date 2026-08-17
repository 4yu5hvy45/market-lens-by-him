import type { CallDraftParsed } from "./call-schema";

export function toRow(v: CallDraftParsed) {
  return {
    call_number: v.callNumber,
    price_inr: v.price,
    stock_name: v.stock.trim() || null,
    ticker: v.ticker.trim() || null,
    exchange: v.exchange,
    sector: v.sector,
    direction: v.direction,
    entry: v.entry > 0 ? v.entry : null,
    target: v.target > 0 ? v.target : null,
    stop_loss: v.stopLoss > 0 ? v.stopLoss : null,
    current_price: v.currentPrice > 0 ? v.currentPrice : (v.entry > 0 ? v.entry : null),
    term: v.term,
    coverage: v.coverage,
    segment: v.segment,
    timeframe: v.timeframe.trim() || null,
    change_pct: v.changePct,
    confidence: v.confidence,
    summary: v.summary,
    view_text: v.view.trim() || null,
    research: v.research,
    catalysts: v.catalysts,
    series: v.series,
    chart_image: v.chartImage ?? null,
    potential_pct_override:
      v.potentialPctOverride === undefined ? null : v.potentialPctOverride,
    checkout_headline: v.checkoutHeadline ?? "",
    checkout_subtext: v.checkoutSubtext ?? "",
  };
}
