CREATE TABLE public.whop_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'unknown',
  order_id text,
  email text,
  verified boolean NOT NULL DEFAULT false,
  outcome text NOT NULL DEFAULT 'received',
  http_status integer,
  capi_payload jsonb,
  capi_status integer,
  capi_response text,
  detail text,
  duration_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.whop_webhook_logs TO service_role;

ALTER TABLE public.whop_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX whop_webhook_logs_created_at_idx ON public.whop_webhook_logs (created_at DESC);
CREATE INDEX whop_webhook_logs_order_idx ON public.whop_webhook_logs (order_id);

ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS arm text;