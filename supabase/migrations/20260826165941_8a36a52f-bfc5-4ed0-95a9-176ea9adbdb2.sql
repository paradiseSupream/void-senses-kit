CREATE TABLE public.tracking_events (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  channel TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'server',
  event TEXT NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT true,
  status INTEGER,
  detail TEXT,
  event_id TEXT
);

GRANT ALL ON public.tracking_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.tracking_events_id_seq TO service_role;

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX tracking_events_created_at_idx ON public.tracking_events (created_at DESC);
CREATE INDEX tracking_events_channel_idx ON public.tracking_events (channel, created_at DESC);