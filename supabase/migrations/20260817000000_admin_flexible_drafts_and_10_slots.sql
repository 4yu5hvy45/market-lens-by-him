-- Market Lens admin flexibility:
-- 1) allow up to 10 desk slots
-- 2) allow incomplete draft calls to be saved and completed later
--
-- IMPORTANT: run this migration in the production Supabase SQL editor.

ALTER TABLE public.calls
  DROP CONSTRAINT IF EXISTS calls_call_number_check;

ALTER TABLE public.calls
  ADD CONSTRAINT calls_call_number_check CHECK (call_number BETWEEN 1 AND 10);

ALTER TABLE public.calls
  ALTER COLUMN stock_name DROP NOT NULL,
  ALTER COLUMN ticker DROP NOT NULL,
  ALTER COLUMN entry DROP NOT NULL,
  ALTER COLUMN target DROP NOT NULL,
  ALTER COLUMN stop_loss DROP NOT NULL,
  ALTER COLUMN current_price DROP NOT NULL,
  ALTER COLUMN timeframe DROP NOT NULL,
  ALTER COLUMN view_text DROP NOT NULL;

-- Existing live/closed/archived calls remain unchanged.
-- The partial unique index continues to enforce one live call per slot.
