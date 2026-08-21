INSERT INTO public.app_settings (key, value)
VALUES ('site', jsonb_build_object('announcement','', 'vip_price_cents', 1900, 'vip_sol_address','8y9Bo4hHAead7VnkbMEMBUgwxSUMBZzPDKodE1PFs9vP'))
ON CONFLICT (key) DO UPDATE
SET value = public.app_settings.value || jsonb_build_object('vip_sol_address','8y9Bo4hHAead7VnkbMEMBUgwxSUMBZzPDKodE1PFs9vP'),
    updated_at = now();