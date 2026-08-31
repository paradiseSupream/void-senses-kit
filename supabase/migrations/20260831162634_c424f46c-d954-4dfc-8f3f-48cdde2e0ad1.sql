ALTER TABLE public.vip_orders
  ADD COLUMN IF NOT EXISTS offer_applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_burned_at timestamptz;

-- Backfill: discounted amounts identify offer orders.
UPDATE public.vip_orders SET offer_applied = true
 WHERE amount_cents IN (249, 999) AND offer_applied = false;

UPDATE public.vip_orders SET offer_burned_at = paid_at
 WHERE offer_applied = true AND status = 'paid' AND offer_burned_at IS NULL;

-- Data fix: monthly VIP granted twice (webhook delivered two paid events)
-- stacked 60 days instead of the 30-day billing period.
UPDATE public.vip_members m
   SET expires_at = m.created_at + interval '30 days'
 WHERE m.plan = 'monthly'
   AND m.active
   AND m.expires_at > m.created_at + interval '31 days';