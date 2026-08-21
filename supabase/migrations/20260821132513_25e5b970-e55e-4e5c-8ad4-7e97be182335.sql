UPDATE public.app_settings
SET value = value || jsonb_build_object(
  'monetag_inpage_push', true,
  'monetag_push_zone', '11624286',
  'monetag_popunder', true,
  'monetag_popunder_zone', '11624275',
  'monetag_vignette', true,
  'monetag_vignette_zone', '11624278',
  'smartlink_url', 'https://omg10.com/4/11624273'
), updated_at = now()
WHERE key = 'ads';