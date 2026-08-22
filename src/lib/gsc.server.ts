/**
 * Server-only Google Search Console client.
 *
 * All calls go through the Lovable connector gateway using the linked
 * Search Console connection. Never import this from client code.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITEMAP_URL = "https://sensesofvoid.app/sitemap.xml";
const TARGET_URL = "https://sensesofvoid.app/";

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function headers(): Record<string, string> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Search Console is not connected for this project.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
  };
}

async function gsc<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${GATEWAY}${path}`, {
    method: init.method ?? "GET",
    headers: { ...headers(), ...(init.body ? { "Content-Type": "application/json" } : {}) },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Search Console request failed [${response.status}]: ${text}`);
  }
  if (response.status === 204) return {} as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

function coversTarget(siteUrl: string, target: URL): boolean {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

export type SiteResolution =
  | { status: "selected"; siteUrl: string }
  | { status: "selection_required"; candidates: string[] };

export async function resolveSiteUrl(selected?: string): Promise<SiteResolution> {
  const { siteEntry = [] } = await gsc<{ siteEntry?: SiteEntry[] }>("/webmasters/v3/sites");
  const target = new URL(TARGET_URL);
  const matches = siteEntry.filter(
    (entry) => entry.permissionLevel !== "siteUnverifiedUser" && coversTarget(entry.siteUrl, target),
  );
  if (selected) {
    const hit = matches.find((entry) => entry.siteUrl === selected);
    if (!hit) throw new Error("The selected Search Console property is not verified.");
    return { status: "selected", siteUrl: hit.siteUrl };
  }
  if (matches.length === 0) throw new Error("No verified Search Console property covers this site.");
  if (matches.length === 1) return { status: "selected", siteUrl: matches[0]!.siteUrl };
  return { status: "selection_required", candidates: matches.map((entry) => entry.siteUrl) };
}

/* ------------------------------------------------------------------ reports */

export type SearchRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function query(
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<SearchRow[]> {
  const data = await gsc<{ rows?: SearchRow[] }>(
    `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    { method: "POST", body },
  );
  return data.rows ?? [];
}

function isoDay(offsetDays: number): string {
  return new Date(Date.now() - offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export type SearchConsoleSnapshot = {
  siteUrl: string;
  range: { startDate: string; endDate: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  byDay: Array<{ day: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  byCountry: Array<{ country: string; clicks: number; impressions: number }>;
  sitemap: {
    path: string;
    lastSubmitted?: string;
    lastDownloaded?: string;
    errors?: string;
    warnings?: string;
    submitted?: string;
    indexed?: string;
  } | null;
  coverage: {
    verdict?: string;
    coverageState?: string;
    indexingState?: string;
    googleCanonical?: string;
    userCanonical?: string;
    lastCrawlTime?: string;
    robotsTxtState?: string;
  } | null;
  refreshedAt: string;
};

export async function getSearchConsoleSnapshot(
  selectedSiteUrl?: string,
  days = 28,
): Promise<SearchConsoleSnapshot | { status: "selection_required"; candidates: string[] }> {
  const resolution = await resolveSiteUrl(selectedSiteUrl);
  if (resolution.status === "selection_required") return resolution;
  const siteUrl = resolution.siteUrl;

  // Search Console data lags ~2 days.
  const startDate = isoDay(days + 2);
  const endDate = isoDay(2);
  const base = { startDate, endDate, rowLimit: 25 };

  const [byDay, topQueries, topPages, byCountry, sitemap, inspection] = await Promise.all([
    query(siteUrl, { ...base, dimensions: ["date"], rowLimit: 100 }),
    query(siteUrl, { ...base, dimensions: ["query"] }),
    query(siteUrl, { ...base, dimensions: ["page"] }),
    query(siteUrl, { ...base, dimensions: ["country"], rowLimit: 15 }),
    gsc<Record<string, unknown>>(
      `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
    ).catch(() => null),
    gsc<{ inspectionResult?: { indexStatusResult?: Record<string, string> } }>(
      "/v1/urlInspection/index:inspect",
      { method: "POST", body: { inspectionUrl: TARGET_URL, siteUrl } },
    ).catch(() => null),
  ]);

  const totals = byDay.reduce(
    (acc, row) => {
      acc.clicks += row.clicks;
      acc.impressions += row.impressions;
      acc.position += row.position * row.impressions;
      return acc;
    },
    { clicks: 0, impressions: 0, ctr: 0, position: 0 },
  );
  totals.ctr = totals.impressions ? totals.clicks / totals.impressions : 0;
  totals.position = totals.impressions ? totals.position / totals.impressions : 0;

  const contents = (sitemap?.["contents"] as Array<Record<string, string>> | undefined)?.[0];

  return {
    siteUrl,
    range: { startDate, endDate },
    totals,
    byDay: byDay.map((row) => ({ day: row.keys[0]!, ...pick(row) })),
    topQueries: topQueries.map((row) => ({ query: row.keys[0]!, ...pick(row) })),
    topPages: topPages.map((row) => ({ page: row.keys[0]!, ...pick(row) })),
    byCountry: byCountry.map((row) => ({
      country: row.keys[0]!,
      clicks: row.clicks,
      impressions: row.impressions,
    })),
    sitemap: sitemap
      ? {
          path: String(sitemap["path"] ?? SITEMAP_URL),
          lastSubmitted: sitemap["lastSubmitted"] as string | undefined,
          lastDownloaded: sitemap["lastDownloaded"] as string | undefined,
          errors: sitemap["errors"] as string | undefined,
          warnings: sitemap["warnings"] as string | undefined,
          submitted: contents?.["submitted"],
          indexed: contents?.["indexed"],
        }
      : null,
    coverage: inspection?.inspectionResult?.indexStatusResult
      ? {
          verdict: inspection.inspectionResult.indexStatusResult["verdict"],
          coverageState: inspection.inspectionResult.indexStatusResult["coverageState"],
          indexingState: inspection.inspectionResult.indexStatusResult["indexingState"],
          googleCanonical: inspection.inspectionResult.indexStatusResult["googleCanonical"],
          userCanonical: inspection.inspectionResult.indexStatusResult["userCanonical"],
          lastCrawlTime: inspection.inspectionResult.indexStatusResult["lastCrawlTime"],
          robotsTxtState: inspection.inspectionResult.indexStatusResult["robotsTxtState"],
        }
      : null,
    refreshedAt: new Date().toISOString(),
  };
}

function pick(row: SearchRow) {
  return { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };
}

/* ------------------------------------------------------- sitemap submission */

export async function submitSitemap(selectedSiteUrl?: string): Promise<{ siteUrl: string }> {
  const resolution = await resolveSiteUrl(selectedSiteUrl);
  if (resolution.status === "selection_required") {
    throw new Error("Multiple Search Console properties match — pick one first.");
  }
  await gsc(
    `/webmasters/v3/sites/${encodeURIComponent(resolution.siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
    { method: "PUT" },
  );
  return { siteUrl: resolution.siteUrl };
}

async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type SyncState = { hash: string; submitted_at: string; site_url?: string };

/**
 * Resubmits the sitemap to Search Console only when its contents changed since
 * the last submission (route change or deploy). Safe to call on every request:
 * the hash is stored in `app_settings` under the `gsc` key.
 */
export async function syncSitemapWithSearchConsole(
  xml: string,
  options: { force?: boolean } = {},
): Promise<{ submitted: boolean; reason: string; hash: string }> {
  const hash = await sha256(xml);
  const { admin } = await import("@/lib/admin-core.server");
  const db = admin();

  const { data } = await db.from("app_settings").select("value").eq("key", "gsc").maybeSingle();
  const state = (data?.value ?? {}) as Partial<SyncState>;

  if (!options.force && state.hash === hash) {
    return { submitted: false, reason: "unchanged", hash };
  }
  if (!process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"] || !process.env["LOVABLE_API_KEY"]) {
    return { submitted: false, reason: "not_connected", hash };
  }

  const { siteUrl } = await submitSitemap();
  await db.from("app_settings").upsert(
    {
      key: "gsc",
      value: { hash, submitted_at: new Date().toISOString(), site_url: siteUrl } satisfies SyncState,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  return { submitted: true, reason: options.force ? "forced" : "changed", hash };
}
