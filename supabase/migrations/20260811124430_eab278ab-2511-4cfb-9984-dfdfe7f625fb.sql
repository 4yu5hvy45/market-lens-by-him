CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE TYPE public.call_state AS ENUM ('draft', 'live', 'closed', 'archived');
CREATE TYPE public.call_direction AS ENUM ('long', 'short');

CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_number smallint NOT NULL CHECK (call_number BETWEEN 1 AND 3),
  state public.call_state NOT NULL DEFAULT 'draft',
  price_inr integer NOT NULL DEFAULT 499 CHECK (price_inr >= 0),

  stock_name text NOT NULL,
  ticker text NOT NULL,
  exchange text NOT NULL DEFAULT 'NSE / BSE',
  sector text NOT NULL DEFAULT '',
  direction public.call_direction NOT NULL DEFAULT 'long',

  entry numeric(14,2) NOT NULL CHECK (entry > 0),
  target numeric(14,2) NOT NULL CHECK (target > 0),
  stop_loss numeric(14,2) NOT NULL CHECK (stop_loss > 0),
  current_price numeric(14,2) NOT NULL CHECK (current_price >= 0),
  exit_price numeric(14,2) CHECK (exit_price IS NULL OR exit_price >= 0),

  term text NOT NULL DEFAULT 'Short Term',
  coverage text NOT NULL DEFAULT 'Weekly Pick',
  segment text NOT NULL DEFAULT 'Cash / Equity',
  timeframe text NOT NULL DEFAULT '',
  change_pct numeric(8,2) NOT NULL DEFAULT 0,
  confidence smallint NOT NULL DEFAULT 70 CHECK (confidence BETWEEN 0 AND 100),

  summary text NOT NULL DEFAULT '',
  view_text text NOT NULL DEFAULT '',
  research jsonb NOT NULL DEFAULT '[]'::jsonb,
  catalysts jsonb NOT NULL DEFAULT '[]'::jsonb,
  series jsonb NOT NULL DEFAULT '[]'::jsonb,
  chart_image text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  closed_at timestamptz
);

CREATE UNIQUE INDEX calls_one_live_per_slot
  ON public.calls (call_number) WHERE state = 'live';

GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER calls_set_updated_at
BEFORE UPDATE ON public.calls
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE VIEW public.calls_public
WITH (security_invoker = false) AS
SELECT
  c.id,
  c.call_number,
  c.state,
  c.price_inr,
  c.direction,
  c.sector,
  c.term,
  c.coverage,
  c.segment,
  c.timeframe,
  c.confidence,
  c.series,
  c.published_at,
  c.closed_at,
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

CREATE TYPE public.purchase_status AS ENUM ('created', 'paid', 'failed', 'refunded');

CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text UNIQUE,
  amount integer NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status public.purchase_status NOT NULL DEFAULT 'created',
  customer_email text,
  customer_phone text,
  access_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX purchases_call_id_idx ON public.purchases (call_id);
CREATE INDEX purchases_email_idx ON public.purchases (lower(customer_email));

GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER purchases_set_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.calls_public FROM anon, authenticated;