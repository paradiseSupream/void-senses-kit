CREATE TABLE public.vault_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  drive_link TEXT NOT NULL,
  download_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vault_assets TO anon, authenticated;
GRANT ALL ON public.vault_assets TO service_role;
ALTER TABLE public.vault_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vault assets are publicly readable" ON public.vault_assets FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.vip_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.vip_users TO service_role;
ALTER TABLE public.vip_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.roast_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL UNIQUE,
  request_count INT NOT NULL DEFAULT 1,
  last_request TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.roast_requests TO service_role;
ALTER TABLE public.roast_requests ENABLE ROW LEVEL SECURITY;

INSERT INTO public.vault_assets (title, category, description, drive_link) VALUES
('Void UI Kit — 120 Glass Components', 'Design', 'Figma library of dark glassmorphic buttons, cards, modals and navigation blocks.', 'https://drive.google.com/drive/folders/void-ui-kit'),
('Neon Dashboard Templates', 'Design', 'Six responsive analytics dashboard layouts in Figma and Tailwind markup.', 'https://drive.google.com/drive/folders/neon-dashboards'),
('1000+ AI Prompt Megapack', 'AI', 'Curated prompt library for image, code, writing and research workflows.', 'https://drive.google.com/drive/folders/prompt-megapack'),
('Midjourney v6 Style Codex', 'AI', 'Reference sheet of lighting, lens, and render keywords with sample outputs.', 'https://drive.google.com/drive/folders/mj-style-codex'),
('React + Vite SaaS Boilerplate', 'Dev', 'Production starter with auth, billing hooks, and typed API layer.', 'https://drive.google.com/drive/folders/saas-boilerplate'),
('Edge Functions Cookbook', 'Dev', 'Twenty copy-paste serverless recipes: webhooks, rate limiting, streaming.', 'https://drive.google.com/drive/folders/edge-cookbook'),
('Postgres Performance Cheat Sheet', 'Dev', 'Indexing, query planning and RLS patterns condensed to four pages.', 'https://drive.google.com/drive/folders/pg-cheatsheet'),
('Tailwind Layout Patterns', 'Design', 'Forty responsive layout snippets with dark-mode tokens included.', 'https://drive.google.com/drive/folders/tw-patterns'),
('Deep Work — Reading Notes Pack', 'Books', 'Structured summaries and action checklists for eight focus classics.', 'https://drive.google.com/drive/folders/deepwork-notes'),
('Systems Thinking Library', 'Books', 'Public-domain reading list with annotated mental model maps.', 'https://drive.google.com/drive/folders/systems-library'),
('LLM Fine-Tuning Field Guide', 'AI', 'Dataset prep, LoRA configs, and evaluation harness templates.', 'https://drive.google.com/drive/folders/llm-fieldguide'),
('Icon Foundry — 800 Line Icons', 'Design', 'SVG icon set with consistent 1.5px stroke and React export script.', 'https://drive.google.com/drive/folders/icon-foundry');