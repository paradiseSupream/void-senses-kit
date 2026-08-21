ALTER TABLE public.ad_events
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS zone text,
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS metric_value double precision;

CREATE INDEX IF NOT EXISTS ad_events_format_idx ON public.ad_events (format);
CREATE INDEX IF NOT EXISTS ad_events_event_type_created_idx ON public.ad_events (event_type, created_at DESC);