import type { CallInputParsed } from "./call-schema";

export function toRow(v: CallInputParsed) {
  return {
    call_number: v.callNumber,
    price_inr: v.price,
    stock_name: v.stock,
    ticker: v.ticker,
    exchange: v.exchange,
    sector: v.sector,
    direction: v.direction,
    entry: v.entry,
    target: v.target,
    stop_loss: v.stopLoss,
    current_price: v.currentPrice || v.entry,
    term: v.term,
    coverage: v.coverage,
    segment: v.segment,
    timeframe: v.timeframe,
    change_pct: v.changePct,
    confidence: v.confidence,
    summary: v.summary,
    view_text: v.view,
    research: v.research,
    catalysts: v.catalysts,
    series: v.series,
    chart_image: v.chartImage ?? null,
    checkout_headline: v.checkoutHeadline ?? "",
    checkout_subtext: v.checkoutSubtext ?? "",
  };
}
