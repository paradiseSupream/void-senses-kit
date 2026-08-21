CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vip_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  wallet TEXT,
  plan TEXT NOT NULL DEFAULT 'lifetime',
  source TEXT NOT NULL DEFAULT 'manual',
  payment_ref TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 1900,
  active BOOLEAN NOT NULL DEFAULT true,
  license_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vip_members_license_key_idx ON public.vip_members (license_key);
CREATE INDEX vip_members_email_idx ON public.vip_members (lower(email));
GRANT ALL ON public.vip_members TO service_role;
ALTER TABLE public.vip_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  contact TEXT,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 30,
  payout_notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_settings (key, value) VALUES
  ('ads', '{"enabled": true, "monetag_verify": "d7498800db613e1e682b5c72b66a050b", "monetag_zone": "", "monetag_popunder": false, "monetag_inpage_push": false, "adsterra_banner_key": "", "adsterra_native_key": "", "slots": {"result": true, "gate": true, "sticky_mobile": true, "native_feed": true}, "rpm_estimate_cents": 120}'::jsonb),
  ('site', '{"maintenance": false, "announcement": "", "vip_price_cents": 1900, "vip_sol_address": "", "stripe_enabled": false}'::jsonb);