import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Crown,
  DollarSign,
  Eye,
  Handshake,
  LockKeyhole,
  MousePointerClick,
  Settings2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminAddAffiliate,
  adminAddVip,
  adminGetSettings,
  adminListAffiliates,
  adminListVips,
  adminLogin,
  adminOverview,
  adminSaveSettings,
  adminSetVipActive,
  type Affiliate,
  type AdminOverview,
  type VipMember,
} from "@/lib/admin.functions";
import type { AdsSettings, SiteSettings } from "@/lib/admin-types";
import { DEFAULT_CAPS, DEFAULT_PRIVACY } from "@/lib/admin-types";
import { AbTestsTab } from "@/components/admin/AbTestsTab";
import { ReportsTab } from "@/components/admin/ReportsTab";
import { SearchConsoleTab } from "@/components/admin/SearchConsoleTab";
import { AudienceTab } from "@/components/admin/AudienceTab";
import { TrackingTab } from "@/components/admin/TrackingTab";
import { TrackingMonitorTab } from "@/components/admin/TrackingMonitorTab";
import { RoiCalculatorTab } from "@/components/admin/RoiCalculatorTab";
import { CreativeTestsTab } from "@/components/admin/CreativeTestsTab";
import { PixelDebugTab } from "@/components/admin/PixelDebugTab";
import { RetargetTab } from "@/components/admin/RetargetTab";


export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Control Panel — Senses of Void" },
      {
        name: "description",
        content:
          "Private control panel for ad placements, earnings analytics, visitors, VIP members, affiliates and site settings.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Control Panel — Senses of Void" },
      { property: "og:description", content: "Private operator dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPanel,
});

const TOKEN_KEY = "sov.adminToken";
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const pct = (value: number) => `${value.toFixed(2)}%`;

const TABS = [
  "Overview",
  "Audience",
  "Reports",
  "ROI",
  "Creatives",
  "Retarget",
  "Tracking",
  "Monitor",
  "Pixel debug",
  "A/B tests",
  "Search",
  "Ads",
  "VIP",
  "Affiliates",
  "Site",
] as const;
type Tab = (typeof TABS)[number];


function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="label-mono">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        checked
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-hairline bg-surface-2 text-muted-foreground"
      }`}
    >
      {label}
      <span className={`size-2.5 rounded-full ${checked ? "bg-primary" : "bg-muted"}`} />
    </button>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Eye }) {
  return (
    <div className="panel p-4">
      <span className="label-mono flex items-center gap-1.5">
        <Icon className="size-3.5 text-primary" aria-hidden="true" />
        {label}
      </span>
      <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function LoginCard({ onToken }: { onToken: (token: string) => void }) {
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { username: string; password: string }) => login({ data: input }),
    onSuccess: (data) => {
      try {
        window.sessionStorage.setItem(TOKEN_KEY, data.token);
      } catch {
        /* storage unavailable */
      }
      onToken(data.token);
      toast.success("Signed in.");
    },
    onError: () => toast.error("Invalid username or password."),
  });

  return (
    <form
      className="panel mx-auto mt-16 w-full max-w-sm p-6"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({ username, password });
      }}
    >
      <span className="label-mono flex items-center gap-1.5">
        <LockKeyhole className="size-3.5 text-primary" aria-hidden="true" /> operator access
      </span>
      <h1 className="mt-2 font-display text-2xl font-semibold">Admin sign in</h1>
      <div className="mt-5 space-y-3">
        <Field label="Username">
          <input
            className={inputCls}
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            className={inputCls}
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-glow mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {mutation.isPending ? "Checking…" : "Enter panel"}
      </button>
    </form>
  );
}

function AdminPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");

  useEffect(() => {
    try {
      setToken(window.sessionStorage.getItem(TOKEN_KEY));
    } catch {
      /* storage unavailable */
    }
  }, []);

  if (!token) return <LoginCard onToken={setToken} />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="label-mono">control panel</span>
          <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Senses of Void ops</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/compliance"
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            FB compliance
          </Link>
          <Link
            to="/admin/monetization"
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Monetization
          </Link>
          <Link
            to="/admin/orders"
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Orders
          </Link>
          <Link
            to="/admin/attribution"
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Attribution
          </Link>
          <Link
            to="/admin/apple-pay"
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Apple Pay
          </Link>

          <button
            type="button"
            onClick={() => {
              try {
                window.sessionStorage.removeItem(TOKEN_KEY);
              } catch {
                /* noop */
              }
              setToken(null);
            }}
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-hairline bg-surface-2/60 p-1">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "Overview" ? <OverviewTab token={token} /> : null}
        {tab === "Audience" ? <AudienceTab token={token} /> : null}
        {tab === "Reports" ? <ReportsTab token={token} /> : null}
        {tab === "ROI" ? <RoiCalculatorTab token={token} /> : null}
        {tab === "Creatives" ? <CreativeTestsTab token={token} /> : null}
        {tab === "Retarget" ? <RetargetTab token={token} /> : null}
        {tab === "Tracking" ? <TrackingTab token={token} /> : null}
        {tab === "Monitor" ? <TrackingMonitorTab token={token} /> : null}
        {tab === "Pixel debug" ? <PixelDebugTab token={token} /> : null}
        {tab === "A/B tests" ? <AbTestsTab token={token} /> : null}
        {tab === "Search" ? <SearchConsoleTab token={token} /> : null}
        {tab === "Ads" || tab === "Site" ? <SettingsTab token={token} which={tab} /> : null}
        {tab === "VIP" ? <VipTab token={token} /> : null}
        {tab === "Affiliates" ? <AffiliateTab token={token} /> : null}
      </div>

    </div>
  );
}

/* ------------------------------------------------------------------ overview */

function OverviewTab({ token }: { token: string }) {
  const fetchOverview = useServerFn(adminOverview);
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AdminOverview | null>(null);

  const mutation = useMutation({
    mutationFn: (input: { token: string; days: number }) => fetchOverview({ data: input }),
    onSuccess: setData,
    onError: () => toast.error("Session expired — sign in again."),
  });

  useEffect(() => {
    mutation.mutate({ token, days });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {[1, 7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              days === d ? "border-primary/50 bg-primary/10" : "border-hairline text-muted-foreground"
            }`}
          >
            {d === 1 ? "24h" : `${d}d`}
          </button>
        ))}
        {mutation.isPending ? <span className="label-mono">loading…</span> : null}
      </div>

      {data ? (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Visitors (sessions)" value={String(data.stats.sessions)} icon={Users} />
            <StatCard label="Impressions" value={String(data.stats.totals.impressions)} icon={Eye} />
            <StatCard label="Clicks" value={String(data.stats.totals.clicks)} icon={MousePointerClick} />
            <StatCard label="CTR" value={pct(data.stats.totals.ctr)} icon={BarChart3} />
            <StatCard label="Est. ad earnings" value={money(data.estimatedAdRevenueCents)} icon={DollarSign} />
            <StatCard label="Tracked ad revenue" value={money(data.stats.totals.revenueCents)} icon={DollarSign} />
            <StatCard label="VIP members" value={String(data.vipCount)} icon={Crown} />
            <StatCard label="VIP revenue" value={money(data.vipRevenueCents)} icon={DollarSign} />
          </div>

          <div className="panel overflow-hidden">
            <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
              Traffic by day
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="label-mono text-left text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Day</th>
                    <th className="px-4 py-2 font-normal">Sessions</th>
                    <th className="px-4 py-2 font-normal">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.visitorsByDay.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                        No traffic recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.visitorsByDay.map((row) => (
                      <tr key={row.day} className="border-t border-hairline/60">
                        <td className="px-4 py-2 font-mono text-xs">{row.day}</td>
                        <td className="px-4 py-2">{row.sessions}</td>
                        <td className="px-4 py-2">{row.pageviews}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
              Tool engagement (start → complete)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="label-mono text-left text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Tool</th>
                    <th className="px-4 py-2 font-normal">Starts</th>
                    <th className="px-4 py-2 font-normal">Completes</th>
                    <th className="px-4 py-2 font-normal">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stats.tools.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                        No tool events yet.
                      </td>
                    </tr>
                  ) : (
                    data.stats.tools.map((tool) => (
                      <tr key={tool.slug} className="border-t border-hairline/60">
                        <td className="px-4 py-2 font-mono text-xs">{tool.slug}</td>
                        <td className="px-4 py-2">{tool.starts}</td>
                        <td className="px-4 py-2">{tool.completes}</td>
                        <td className="px-4 py-2">{pct(tool.conversion)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ settings */

function SettingsTab({ token, which }: { token: string; which: "Ads" | "Site" }) {
  const load = useServerFn(adminGetSettings);
  const save = useServerFn(adminSaveSettings);
  const [ads, setAds] = useState<AdsSettings | null>(null);
  const [site, setSite] = useState<SiteSettings | null>(null);

  const loader = useMutation({
    mutationFn: (input: { token: string }) => load({ data: input }),
    onSuccess: (data) => {
      setAds(data.ads);
      setSite(data.site);
    },
    onError: () => toast.error("Could not load settings."),
  });

  const saver = useMutation({
    mutationFn: (input: { token: string; ads?: AdsSettings; site?: SiteSettings }) =>
      save({ data: input }),
    onSuccess: () => toast.success("Saved. Live within a few minutes."),
    onError: () => toast.error("Save failed."),
  });

  useEffect(() => {
    loader.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!ads || !site) return <p className="label-mono">loading…</p>;

  const caps = { ...DEFAULT_CAPS, ...(ads.caps ?? {}) };
  const privacy = { ...DEFAULT_PRIVACY, ...(ads.privacy ?? {}) };

  return (
    <div className="space-y-4">
      {which === "Ads" ? (
        <div className="panel space-y-4 p-4">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <Settings2 className="size-4 text-primary" aria-hidden="true" /> Ad network & placements
          </h2>
          <Toggle
            label="Ads enabled globally"
            checked={ads.enabled}
            onChange={(v) => setAds({ ...ads, enabled: v })}
          />
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <Toggle
              label="Lean Mode — FB/Meta safe (no pop-under, vignette or push script)"
              checked={ads.lean_mode ?? false}
              onChange={(v) => setAds({ ...ads, lean_mode: v })}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Keep this ON while a Facebook campaign is running. Only the Free Vault and partner
              smartlink anchors stay live.{" "}
              <Link to="/admin/compliance" className="text-primary underline">
                Run the compliance scan
              </Link>
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Monetag verification code">
              <input
                className={inputCls}
                value={ads.monetag_verify}
                onChange={(e) => setAds({ ...ads, monetag_verify: e.target.value })}
              />
            </Field>
            <Field label="Monetag smartlink URL">
              <input
                className={inputCls}
                value={ads.smartlink_url}
                placeholder="https://omg10.com/4/11624273"
                onChange={(e) => setAds({ ...ads, smartlink_url: e.target.value })}
              />
            </Field>
            <Field label="Pop-under zone id">
              <input
                className={inputCls}
                value={ads.monetag_popunder_zone}
                onChange={(e) => setAds({ ...ads, monetag_popunder_zone: e.target.value })}
              />
            </Field>
            <Field label="Vignette zone id">
              <input
                className={inputCls}
                value={ads.monetag_vignette_zone}
                onChange={(e) => setAds({ ...ads, monetag_vignette_zone: e.target.value })}
              />
            </Field>
            <Field label="In-page push zone id">
              <input
                className={inputCls}
                value={ads.monetag_push_zone}
                onChange={(e) => setAds({ ...ads, monetag_push_zone: e.target.value })}
              />
            </Field>
            <Field label="Monetag zone id (legacy)">
              <input
                className={inputCls}
                value={ads.monetag_zone}
                placeholder="e.g. 9123456"
                onChange={(e) => setAds({ ...ads, monetag_zone: e.target.value })}
              />
            </Field>
            <Field label="Adsterra banner key">
              <input
                className={inputCls}
                value={ads.adsterra_banner_key}
                onChange={(e) => setAds({ ...ads, adsterra_banner_key: e.target.value })}
              />
            </Field>
            <Field label="Adsterra native key">
              <input
                className={inputCls}
                value={ads.adsterra_native_key}
                onChange={(e) => setAds({ ...ads, adsterra_native_key: e.target.value })}
              />
            </Field>
            <Field label="Adsterra social bar script URL">
              <input
                className={inputCls}
                value={ads.adsterra_social_bar_src ?? ""}
                placeholder="https://pl30960638.profitableratecpmnetwork.com/..."
                onChange={(e) => setAds({ ...ads, adsterra_social_bar_src: e.target.value })}
              />
            </Field>
            <Field label="RPM estimate (cents per 1000 impressions)">
              <input
                className={inputCls}
                type="number"
                value={ads.rpm_estimate_cents}
                onChange={(e) => setAds({ ...ads, rpm_estimate_cents: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Monetag in-page push"
              checked={ads.monetag_inpage_push}
              onChange={(v) => setAds({ ...ads, monetag_inpage_push: v })}
            />
            <Toggle
              label="Monetag vignette (interstitial)"
              checked={ads.monetag_vignette}
              onChange={(v) => setAds({ ...ads, monetag_vignette: v })}
            />
            <Toggle
              label="Monetag pop-under"
              checked={ads.monetag_popunder}
              onChange={(v) => setAds({ ...ads, monetag_popunder: v })}
            />
            <Toggle
              label="Adsterra social bar"
              checked={ads.adsterra_social_bar ?? false}
              onChange={(v) => setAds({ ...ads, adsterra_social_bar: v })}
            />
            <Toggle
              label="Result page banner"
              checked={ads.slots.result}
              onChange={(v) => setAds({ ...ads, slots: { ...ads.slots, result: v } })}
            />
            <Toggle
              label="Export gate interstitial"
              checked={ads.slots.gate}
              onChange={(v) => setAds({ ...ads, slots: { ...ads.slots, gate: v } })}
            />
            <Toggle
              label="Mobile sticky bottom"
              checked={ads.slots.sticky_mobile}
              onChange={(v) => setAds({ ...ads, slots: { ...ads.slots, sticky_mobile: v } })}
            />
            <Toggle
              label="Desktop sticky corner"
              checked={ads.slots.sticky_desktop ?? false}
              onChange={(v) => setAds({ ...ads, slots: { ...ads.slots, sticky_desktop: v } })}
            />
            <Toggle
              label="Native in-feed cards"
              checked={ads.slots.native_feed}
              onChange={(v) => setAds({ ...ads, slots: { ...ads.slots, native_feed: v } })}
            />
          </div>
          <div className="space-y-3 rounded-lg border border-hairline p-3">
            <h3 className="label-mono">Frequency caps per visitor</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["popunder", "vignette", "inpage_push"] as const).map((format) => (
                <div key={format} className="space-y-2">
                  <p className="font-mono text-xs text-foreground">{format}</p>
                  <Field label="max / hour">
                    <input
                      className={inputCls}
                      type="number"
                      min={0}
                      value={caps[format].perHour}
                      onChange={(e) =>
                        setAds({
                          ...ads,
                          caps: {
                            ...caps,
                            [format]: { ...caps[format], perHour: Number(e.target.value) },
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="max / session">
                    <input
                      className={inputCls}
                      type="number"
                      min={0}
                      value={caps[format].perSession}
                      onChange={(e) =>
                        setAds({
                          ...ads,
                          caps: {
                            ...caps,
                            [format]: { ...caps[format], perSession: Number(e.target.value) },
                          },
                        })
                      }
                    />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-hairline p-3">
            <h3 className="label-mono">Privacy & cookie consent</h3>
            <Toggle
              label="Ask for cookie consent"
              checked={privacy.consent_required}
              onChange={(v) =>
                setAds({ ...ads, privacy: { ...privacy, consent_required: v } })
              }
            />
            <Toggle
              label="Block ad scripts until consent is given"
              checked={privacy.block_until_consent}
              onChange={(v) =>
                setAds({ ...ads, privacy: { ...privacy, block_until_consent: v } })
              }
            />
            <Field label="Consent banner text">
              <textarea
                className={inputCls}
                rows={3}
                value={privacy.banner_text}
                onChange={(e) =>
                  setAds({ ...ads, privacy: { ...privacy, banner_text: e.target.value } })
                }
              />
            </Field>
          </div>

          <button
            type="button"
            disabled={saver.isPending}
            onClick={() => saver.mutate({ token, ads })}
            className="btn-glow rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saver.isPending ? "Saving…" : "Save ad settings"}
          </button>
        </div>
      ) : (
        <div className="panel space-y-4 p-4">
          <h2 className="font-display text-sm font-semibold">Site & payments</h2>
          <Toggle
            label="Maintenance banner"
            checked={site.maintenance}
            onChange={(v) => setSite({ ...site, maintenance: v })}
          />
          <Toggle
            label="Stripe checkout enabled"
            checked={site.stripe_enabled}
            onChange={(v) => setSite({ ...site, stripe_enabled: v })}
          />
          <Field label="Announcement bar text">
            <input
              className={inputCls}
              value={site.announcement}
              onChange={(e) => setSite({ ...site, announcement: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="VIP price (cents)">
              <input
                className={inputCls}
                type="number"
                value={site.vip_price_cents}
                onChange={(e) => setSite({ ...site, vip_price_cents: Number(e.target.value) })}
              />
            </Field>
            <Field label="Solana receiving address (public wallet address only)">
              <input
                className={inputCls}
                value={site.vip_sol_address}
                placeholder="Phantom public address"
                onChange={(e) => setSite({ ...site, vip_sol_address: e.target.value })}
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Never paste a wallet seed phrase or private key anywhere in this app — only the public
            receiving address is needed to accept SOL/USDC payments.
          </p>
          <button
            type="button"
            disabled={saver.isPending}
            onClick={() => saver.mutate({ token, site })}
            className="btn-glow rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saver.isPending ? "Saving…" : "Save site settings"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- vip */

function VipTab({ token }: { token: string }) {
  const list = useServerFn(adminListVips);
  const add = useServerFn(adminAddVip);
  const setActive = useServerFn(adminSetVipActive);
  const [rows, setRows] = useState<VipMember[]>([]);
  const [form, setForm] = useState({ email: "", wallet: "", payment_ref: "", amount: 1900 });

  const loader = useMutation({
    mutationFn: (input: { token: string }) => list({ data: input }),
    onSuccess: setRows,
  });

  const adder = useMutation({
    mutationFn: () =>
      add({
        data: {
          token,
          email: form.email,
          wallet: form.wallet,
          payment_ref: form.payment_ref,
          amount_cents: form.amount,
          source: "phantom-sol",
        },
      }),
    onSuccess: (row) => {
      setRows((prev) => [row, ...prev]);
      setForm({ email: "", wallet: "", payment_ref: "", amount: 1900 });
      toast.success(`VIP added — license ${row.license_key}`);
    },
    onError: () => toast.error("Could not add member."),
  });

  const toggler = useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      setActive({ data: { token, ...input } }),
    onSuccess: (_data, input) => {
      setRows((prev) => prev.map((r) => (r.id === input.id ? { ...r, active: input.active } : r)));
    },
  });

  useEffect(() => {
    loader.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-4">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
          <Crown className="size-4 text-primary" aria-hidden="true" /> Add a VIP member
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email">
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Wallet / payer">
            <input
              className={inputCls}
              value={form.wallet}
              onChange={(e) => setForm({ ...form, wallet: e.target.value })}
            />
          </Field>
          <Field label="Payment reference (SOL tx signature)">
            <input
              className={inputCls}
              value={form.payment_ref}
              onChange={(e) => setForm({ ...form, payment_ref: e.target.value })}
            />
          </Field>
          <Field label="Amount (cents)">
            <input
              className={inputCls}
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </Field>
        </div>
        <button
          type="button"
          disabled={adder.isPending}
          onClick={() => adder.mutate()}
          className="btn-glow rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {adder.isPending ? "Adding…" : "Add member"}
        </button>
      </div>

      <div className="panel overflow-hidden">
        <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
          VIP members ({rows.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-mono text-left text-muted-foreground">
                <th className="px-4 py-2 font-normal">Email</th>
                <th className="px-4 py-2 font-normal">License</th>
                <th className="px-4 py-2 font-normal">Paid</th>
                <th className="px-4 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                    No VIP members yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-hairline/60">
                    <td className="px-4 py-2">{row.email}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.license_key}</td>
                    <td className="px-4 py-2">{money(row.amount_cents)}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggler.mutate({ id: row.id, active: !row.active })}
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          row.active
                            ? "bg-primary/15 text-primary"
                            : "bg-surface-2 text-muted-foreground"
                        }`}
                      >
                        {row.active ? "active" : "disabled"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- affiliates */

function AffiliateTab({ token }: { token: string }) {
  const list = useServerFn(adminListAffiliates);
  const add = useServerFn(adminAddAffiliate);
  const [rows, setRows] = useState<Affiliate[]>([]);
  const [form, setForm] = useState({ code: "", name: "", contact: "", commission: 30 });

  const loader = useMutation({
    mutationFn: (input: { token: string }) => list({ data: input }),
    onSuccess: setRows,
  });

  const adder = useMutation({
    mutationFn: () =>
      add({
        data: {
          token,
          code: form.code,
          name: form.name,
          contact: form.contact,
          commission_pct: form.commission,
        },
      }),
    onSuccess: (row) => {
      setRows((prev) => [row, ...prev]);
      setForm({ code: "", name: "", contact: "", commission: 30 });
      toast.success("Affiliate created.");
    },
    onError: () => toast.error("Could not create affiliate."),
  });

  useEffect(() => {
    loader.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-4">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
          <Handshake className="size-4 text-primary" aria-hidden="true" /> New affiliate partner
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Code (used as ?ref=)">
            <input
              className={inputCls}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label="Name">
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Contact">
            <input
              className={inputCls}
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </Field>
          <Field label="Commission %">
            <input
              className={inputCls}
              type="number"
              value={form.commission}
              onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })}
            />
          </Field>
        </div>
        <button
          type="button"
          disabled={adder.isPending}
          onClick={() => adder.mutate()}
          className="btn-glow rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {adder.isPending ? "Creating…" : "Create affiliate"}
        </button>
      </div>

      <div className="panel overflow-hidden">
        <h2 className="border-b border-hairline px-4 py-3 font-display text-sm font-semibold">
          Partners ({rows.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-mono text-left text-muted-foreground">
                <th className="px-4 py-2 font-normal">Code</th>
                <th className="px-4 py-2 font-normal">Name</th>
                <th className="px-4 py-2 font-normal">Commission</th>
                <th className="px-4 py-2 font-normal">Link</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                    No affiliates yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-hairline/60">
                    <td className="px-4 py-2 font-mono text-xs">{row.code}</td>
                    <td className="px-4 py-2">{row.name}</td>
                    <td className="px-4 py-2">{Number(row.commission_pct).toFixed(0)}%</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      sensesofvoid.app/?ref={row.code}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
