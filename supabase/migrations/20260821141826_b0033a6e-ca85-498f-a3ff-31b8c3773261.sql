ALTER TABLE public.ad_events
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS ua_hash text,
  ADD COLUMN IF NOT EXISTS suspect boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ad_events_created_at_idx ON public.ad_events (created_at DESC);
CREATE INDEX IF NOT EXISTS ad_events_country_idx ON public.ad_events (country);

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS weekly_reports_week_start_idx ON public.weekly_reports (week_start);

GRANT ALL ON public.weekly_reports TO service_role;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;