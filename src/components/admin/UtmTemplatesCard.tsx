import { useMemo, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { TOOLS } from "@/lib/tools";
import { UTM_TEMPLATES, buildAdUrl, previewGrouping, type AdPlatformKey } from "@/lib/utm-templates";

/**
 * One-click UTM templates for Facebook, TikTok and Google, with a live preview
 * of how the attribution report will group the resulting sessions.
 */
export function UtmTemplatesCard() {
  const [platform, setPlatform] = useState<AdPlatformKey>("facebook");
  const [tool, setTool] = useState("dark-personality");
  const [campaign, setCampaign] = useState("cold-tier15");
  const [content, setContent] = useState("creative-1");
  const [dynamic, setDynamic] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window === "undefined" ? "https://sensesofvoid.app" : window.location.origin;
  const template = UTM_TEMPLATES.find((t) => t.key === platform)!;

  const input = { platform, tool, campaign, content, dynamic, origin };
  const url = useMemo(() => buildAdUrl(input), [platform, tool, campaign, content, dynamic, origin]);
  const grouping = useMemo(
    () => previewGrouping(input),
    [platform, campaign, content, dynamic],
  );

  const allTools = useMemo(
    () =>
      TOOLS.map((t) => ({
        slug: t.slug,
        name: t.name,
        url: buildAdUrl({ ...input, tool: t.slug }),
      })),
    [platform, campaign, content, dynamic, origin],
  );

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <section className="panel mt-6 p-4">
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-primary" aria-hidden="true" />
        <h2 className="font-display text-lg font-semibold">UTM templates</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ready-to-paste ad URLs with the platform&apos;s own dynamic macros, deep-linked so the quiz
        auto-starts. {template.hint}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {UTM_TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setPlatform(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              platform === t.key ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-muted-foreground">
          Landing tool
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">Home page</option>
            {TOOLS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          Campaign (static)
          <input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            disabled={dynamic}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Creative (static)
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={dynamic}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
          />
        </label>
        <label className="flex items-center gap-2 self-end text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={dynamic}
            onChange={(e) => setDynamic(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Use platform macros
        </label>
      </div>

      <div className="mt-3 rounded-lg border border-hairline bg-surface-2/50 p-3">
        <span className="label-mono">Ad URL</span>
        <div className="mt-1 flex items-start gap-2">
          <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{url}</code>
          <button
            type="button"
            onClick={() => void copy(url, "main")}
            className="shrink-0 rounded-lg border border-hairline p-2 text-muted-foreground hover:text-foreground"
            aria-label="Copy ad URL"
          >
            {copied === "main" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Groups in this report as <span className="font-mono">{grouping.source}</span> ·{" "}
          <span className="font-mono">{grouping.campaign}</span> ·{" "}
          <span className="font-mono">{grouping.content}</span> — click id{" "}
          <span className="font-mono">{template.clickId}</span> is added by the platform.
        </p>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          All tool deep links for {template.label}
        </summary>
        <ul className="mt-2 space-y-2">
          {allTools.map((t) => (
            <li key={t.slug} className="flex items-start gap-2">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">{t.name}</span>
              <code className="min-w-0 flex-1 break-all font-mono text-[11px]">{t.url}</code>
              <button
                type="button"
                onClick={() => void copy(t.url, t.slug)}
                className="shrink-0 rounded-lg border border-hairline p-1.5 text-muted-foreground hover:text-foreground"
                aria-label={`Copy ${t.name} URL`}
              >
                {copied === t.slug ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
