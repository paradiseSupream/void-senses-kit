ALTER TABLE public.ad_events
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS ad_click_id text,
  ADD COLUMN IF NOT EXISTS ad_platform text;

CREATE INDEX IF NOT EXISTS ad_events_utm_content_idx ON public.ad_events (utm_content, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_events_ad_platform_idx ON public.ad_events (ad_platform, created_at DESC);