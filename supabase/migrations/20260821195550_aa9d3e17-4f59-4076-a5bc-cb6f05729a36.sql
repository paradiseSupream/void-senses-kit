UPDATE public.app_settings
SET value = jsonb_set(value::jsonb, '{slots,sticky_mobile}', 'false'::jsonb, true)
  || jsonb_build_object(
      'adsterra_social_bar', true,
      'adsterra_social_bar_src', 'https://pl30960638.profitableratecpmnetwork.com/68/e2/ce/68e2ce9955813c71eea7a3705a5d4a1e.js'
     )
WHERE key = 'ads';