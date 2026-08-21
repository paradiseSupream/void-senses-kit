CREATE TABLE public.ad_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','click','conversion','tool_start','tool_complete','gate_shown','gate_completed')),
  slot TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'control',
  session_id TEXT NOT NULL,
  tool_slug TEXT,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  device TEXT,
  path TEXT,
  click_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ad_events_created_at_idx ON public.ad_events (created_at DESC);
CREATE INDEX ad_events_slot_idx ON public.ad_events (slot, event_type);
CREATE INDEX ad_events_variant_idx ON public.ad_events (variant, event_type);
CREATE INDEX ad_events_click_id_idx ON public.ad_events (click_id) WHERE click_id IS NOT NULL;

GRANT ALL ON public.ad_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ad_events_id_seq TO service_role;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: all writes and reads go through trusted server code.