CREATE TABLE public.daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL,
  tool_slug text NOT NULL,
  session_id text NOT NULL,
  alias text NOT NULL,
  score integer NOT NULL,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day, tool_slug, session_id)
);

CREATE INDEX daily_scores_day_tool_score_idx ON public.daily_scores (day, tool_slug, score DESC);

GRANT ALL ON public.daily_scores TO service_role;

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;