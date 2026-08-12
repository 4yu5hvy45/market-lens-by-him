-- Market Lens production repair: keep Admin create/edit fields in the database.
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS checkout_headline text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS checkout_subtext text NOT NULL DEFAULT '';

-- Recreate the public projection so checkout copy is available to the checkout page
-- without exposing any live-call locked fields.
DROP VIEW IF EXISTS public.calls_public;

CREATE VIEW public.calls_public
WITH (security_invoker = false) AS
SELECT
  c.id, c.call_number, c.state, c.price_inr, c.direction, c.sector, c.term, c.coverage,
  c.segment, c.timeframe, c.confidence, c.series, c.published_at, c.closed_at,
  c.checkout_headline, c.checkout_subtext,
  ROUND(((c.target - c.entry) / c.entry) * 100 * CASE WHEN c.direction = 'short' THEN -1 ELSE 1 END, 2) AS potential_pct,
  ROUND(ABS((c.entry - c.stop_loss) / c.entry) * 100, 2) AS risk_pct,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.stock_name END AS stock_name,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.ticker END AS ticker,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.exchange END AS exchange,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.entry END AS entry,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.target END AS target,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.stop_loss END AS stop_loss,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.current_price END AS current_price,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.exit_price END AS exit_price,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.change_pct END AS change_pct,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.summary END AS summary,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.view_text END AS view_text,
  CASE WHEN c.state = 'live' THEN '[]'::jsonb ELSE c.research END AS research,
  CASE WHEN c.state = 'live' THEN '[]'::jsonb ELSE c.catalysts END AS catalysts,
  CASE WHEN c.state = 'live' THEN NULL ELSE c.chart_image END AS chart_image
FROM public.calls c
WHERE c.state IN ('live', 'closed', 'archived');

GRANT SELECT ON public.calls_public TO anon, authenticated, service_role;
REVOKE INSERT, UPDATE, DELETE ON public.calls_public FROM anon, authenticated;
