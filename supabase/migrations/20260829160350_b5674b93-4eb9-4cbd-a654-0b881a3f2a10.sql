alter table public.tracking_events add column if not exists country text;
create index if not exists tracking_events_country_idx on public.tracking_events (country, created_at desc);