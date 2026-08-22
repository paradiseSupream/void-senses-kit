CREATE TABLE IF NOT EXISTS public.email_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'result',
  tool_slug text,
  session_id text,
  country text,
  utm_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);

GRANT INSERT ON public.email_leads TO anon, authenticated;
GRANT ALL ON public.email_leads TO service_role;

ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.email_leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS email_leads_created_at_idx ON public.email_leads (created_at DESC);