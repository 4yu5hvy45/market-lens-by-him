CREATE TABLE public.research_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  week_label text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Weekly Outlook',
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  chart_image text,
  chart_caption text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  state text NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CONSTRAINT research_posts_state_check CHECK (state IN ('draft','published','archived'))
);

GRANT SELECT ON public.research_posts TO anon;
GRANT SELECT ON public.research_posts TO authenticated;
GRANT ALL ON public.research_posts TO service_role;

ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published research is public"
ON public.research_posts FOR SELECT
TO anon, authenticated
USING (state = 'published');

CREATE TRIGGER research_posts_set_updated_at
BEFORE UPDATE ON public.research_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX research_posts_state_published_idx
ON public.research_posts (state, published_at DESC);

CREATE TABLE public.watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  label text NOT NULL,
  note text NOT NULL DEFAULT '',
  sort_order smallint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.watchlist_items TO anon;
GRANT SELECT ON public.watchlist_items TO authenticated;
GRANT ALL ON public.watchlist_items TO service_role;

ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active watchlist rows are public"
ON public.watchlist_items FOR SELECT
TO anon, authenticated
USING (active);

CREATE TRIGGER watchlist_items_set_updated_at
BEFORE UPDATE ON public.watchlist_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.watchlist_items (symbol, label, note, sort_order) VALUES
  ('RELIANCE.NS', 'Reliance Industries', 'Energy to retail re-rating', 1),
  ('HDFCBANK.NS', 'HDFC Bank', 'Deposit growth watch', 2),
  ('TCS.NS', 'TCS', 'Deal wins, margin defence', 3),
  ('INFY.NS', 'Infosys', 'Guidance revision candidate', 4),
  ('TATAMOTORS.NS', 'Tata Motors', 'JLR volume cycle', 5),
  ('SBIN.NS', 'State Bank of India', 'Credit cost normalising', 6),
  ('ICICIBANK.NS', 'ICICI Bank', 'Best-in-class ROA', 7),
  ('LT.NS', 'Larsen & Toubro', 'Order book visibility', 8);