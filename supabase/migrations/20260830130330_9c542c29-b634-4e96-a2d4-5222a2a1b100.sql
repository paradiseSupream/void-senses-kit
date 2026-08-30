ALTER TABLE public.vip_orders
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS event_id text;