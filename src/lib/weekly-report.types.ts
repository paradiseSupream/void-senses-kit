/** Client-safe shape of a stored weekly ad-performance report. */
export type WeeklyReport = {
  week_start: string;
  generated_at: string;
  sessions: number;
  impressions: number;
  clicks: number;
  ctr: number;
  rpm: number;
  revenue_cents: number;
  estimated_revenue_cents: number;
  fraud_rate: number;
  filtered_clicks: number;
  scripts: Array<{
    format: string;
    loads: number;
    errors: number;
    avgLoadMs: number;
    p75LoadMs: number;
  }>;
  vitals: Array<{ metric: string; samples: number; avg: number; p75: number }>;
  top_countries: Array<{ country: string; impressions: number; clicks: number; ctr: number }>;
  deltas: {
    impressions: number;
    clicks: number;
    revenue_cents: number;
    lcp: number;
    fcp: number;
  } | null;
  verdict: string[];
};
