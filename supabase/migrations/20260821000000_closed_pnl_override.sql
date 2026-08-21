-- Market Lens: optional admin override for realised gain/loss on closed calls.
-- Leave NULL to calculate realised return from entry and exit price.

ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS realised_pnl_pct_override numeric(8,2);

NOTIFY pgrst, 'reload schema';
