CREATE TABLE public.norm_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool text NOT NULL CHECK (char_length(tool) BETWEEN 2 AND 40),
  dim text NOT NULL CHECK (char_length(dim) BETWEEN 1 AND 40),
  value smallint NOT NULL CHECK (value BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX norm_samples_tool_dim_idx ON public.norm_samples (tool, dim);

GRANT INSERT ON public.norm_samples TO anon, authenticated;
GRANT ALL ON public.norm_samples TO service_role;

ALTER TABLE public.norm_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone may contribute an anonymous score"
  ON public.norm_samples FOR INSERT TO anon, authenticated
  WITH CHECK (value BETWEEN 0 AND 100);

CREATE OR REPLACE FUNCTION public.norm_stats(_tool text)
RETURNS TABLE (dim text, n bigint, mean numeric, sd numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.dim,
         count(*)::bigint,
         round(avg(s.value)::numeric, 2),
         round(coalesce(stddev_samp(s.value), 0)::numeric, 2)
  FROM public.norm_samples s
  WHERE s.tool = _tool
  GROUP BY s.dim
$$;

GRANT EXECUTE ON FUNCTION public.norm_stats(text) TO anon, authenticated, service_role;