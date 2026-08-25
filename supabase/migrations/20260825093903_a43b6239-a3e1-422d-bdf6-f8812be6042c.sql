ALTER TABLE public.vip_members
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS vip_members_email_provider_idx ON public.vip_members (lower(email));

CREATE TABLE IF NOT EXISTS public.vip_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  email text,
  plan text NOT NULL DEFAULT 'lifetime',
  amount_cents integer NOT NULL DEFAULT 1900,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'whop',
  checkout_id text,
  whop_plan_id text,
  payment_id text,
  session_id text,
  utm_source text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

GRANT ALL ON public.vip_orders TO service_role;
ALTER TABLE public.vip_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS vip_orders_status_idx ON public.vip_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS vip_orders_email_idx ON public.vip_orders (lower(email));