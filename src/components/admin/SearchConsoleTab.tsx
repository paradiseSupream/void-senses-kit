import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, UploadCloud } from "lucide-react";

import { gscResubmitSitemap, gscSnapshot, type GscResult } from "@/lib/gsc.functions";

const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
const num = (value: number) => value.toLocaleString();

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-2/60 p-4">
      <div className="label-mono text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function SearchConsoleTab({ token }: { token: string }) {
  const [days, setDays] = useState(28);
  const [siteUrl, setSiteUrl] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<GscResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await gscSnapshot({ data: { token, days, siteUrl } }));
    } catch (error) {
      setResult({ status: "error", message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [token, days, siteUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const resubmit = async () => {
    setNotice("Submitting…");
    const response = await gscResubmitSitemap({ data: { token, force: true } });
    setNotice(response.message);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-lg font-semibold">Google Search Console</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm"
            aria-label="Report window"
          >
            {[7, 28, 90].map((value) => (
              <option key={value} value={value}>
                Last {value} days
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
          </button>
          <button
            type="button"
            onClick={() => void resubmit()}
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-xs font-medium hover:text-foreground"
          >
            <UploadCloud className="h-3.5 w-3.5" aria-hidden /> Resubmit sitemap
          </button>
        </div>
      </div>

      {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading Search Console data…</p> : null}

      {result?.status === "error" ? (
        <p className="rounded-xl border border-hairline bg-surface-2/60 p-4 text-sm text-muted-foreground">
          {result.message}
        </p>
      ) : null}

      {result?.status === "selection_required" ? (
        <div className="rounded-xl border border-hairline bg-surface-2/60 p-4 text-sm">
          <p className="mb-2">Multiple verified properties match this site. Pick one:</p>
          <div className="flex flex-wrap gap-2">
            {result.candidates.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setSiteUrl(candidate)}
                className="rounded-lg border border-hairline px-3 py-2 text-xs"
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {result?.status === "ok" ? <Snapshot data={result.snapshot} /> : null}
    </div>
  );
}

function Snapshot({ data }: { data: NonNullable<Extract<GscResult, { status: "ok" }>["snapshot"]> }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="clicks" value={num(data.totals.clicks)} hint={`${data.range.startDate} → ${data.range.endDate}`} />
        <Stat label="impressions" value={num(data.totals.impressions)} />
        <Stat label="ctr" value={pct(data.totals.ctr)} />
        <Stat label="avg position" value={data.totals.position.toFixed(1)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-surface-2/60 p-4">
          <div className="label-mono text-xs text-muted-foreground">homepage coverage</div>
          {data.coverage ? (
            <dl className="mt-2 space-y-1 text-sm">
              <Row label="Verdict" value={data.coverage.verdict ?? "—"} />
              <Row label="Coverage" value={data.coverage.coverageState ?? "—"} />
              <Row label="Indexing" value={data.coverage.indexingState ?? "—"} />
              <Row label="Google canonical" value={data.coverage.googleCanonical ?? "—"} />
              <Row label="robots.txt" value={data.coverage.robotsTxtState ?? "—"} />
              <Row
                label="Last crawl"
                value={data.coverage.lastCrawlTime ? new Date(data.coverage.lastCrawlTime).toLocaleString() : "—"}
              />
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No inspection data available yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-hairline bg-surface-2/60 p-4">
          <div className="label-mono text-xs text-muted-foreground">sitemap status</div>
          {data.sitemap ? (
            <dl className="mt-2 space-y-1 text-sm">
              <Row label="URLs submitted" value={data.sitemap.submitted ?? "—"} />
              <Row label="URLs indexed" value={data.sitemap.indexed ?? "—"} />
              <Row label="Errors" value={data.sitemap.errors ?? "0"} />
              <Row label="Warnings" value={data.sitemap.warnings ?? "0"} />
              <Row
                label="Last submitted"
                value={data.sitemap.lastSubmitted ? new Date(data.sitemap.lastSubmitted).toLocaleString() : "—"}
              />
              <Row
                label="Last downloaded"
                value={data.sitemap.lastDownloaded ? new Date(data.sitemap.lastDownloaded).toLocaleString() : "—"}
              />
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sitemap not submitted yet.</p>
          )}
        </div>
      </div>

      <Table
        title="Top queries"
        head={["Query", "Clicks", "Impr.", "CTR", "Pos."]}
        rows={data.topQueries.map((row) => [
          row.query,
          num(row.clicks),
          num(row.impressions),
          pct(row.ctr),
          row.position.toFixed(1),
        ])}
      />
      <Table
        title="Top pages"
        head={["Page", "Clicks", "Impr.", "CTR", "Pos."]}
        rows={data.topPages.map((row) => [
          row.page.replace("https://sensesofvoid.app", "") || "/",
          num(row.clicks),
          num(row.impressions),
          pct(row.ctr),
          row.position.toFixed(1),
        ])}
      />
      <Table
        title="Countries"
        head={["Country", "Clicks", "Impressions"]}
        rows={data.byCountry.map((row) => [row.country.toUpperCase(), num(row.clicks), num(row.impressions)])}
      />

      <p className="text-xs text-muted-foreground">
        Property: {data.siteUrl} · refreshed {new Date(data.refreshedAt).toLocaleString()} · Search Console data lags
        about two days.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value}</dd>
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-2/60 p-4">
      <div className="label-mono text-xs text-muted-foreground">{title.toLowerCase()}</div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No data reported for this period yet.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                {head.map((cell) => (
                  <th key={cell} className="py-1.5 pr-3 font-medium">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.join("|")} className="border-t border-hairline/60">
                  {row.map((cell, index) => (
                    <td key={index} className="max-w-[18rem] truncate py-1.5 pr-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
