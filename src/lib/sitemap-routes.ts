/**
 * Single source of truth for the sitemap. Keep in sync with the app routes —
 * `src/lib/__tests__/sitemap.test.ts` fails CI when a public route is added or
 * removed without updating this list.
 */

export const SITE_BASE_URL = "https://sensesofvoid.app";

import { ARCHETYPE_PATHS } from "@/lib/archetype-seo";

export type SitemapEntry = {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
};

/** Routes intentionally kept out of the sitemap (private, API, utility). */
// `/lovable/*` are platform-internal email preview/webhook endpoints — never
// public pages, so they must stay out of the sitemap.
export const EXCLUDED_ROUTE_PREFIXES = [
  "/admin",
  "/api",
  "/compare",
  "/vip",
  "/lovable",
] as const;

/**
 * Prefixes served by a dynamic route (`$slug`). Their concrete URLs are
 * generated from data, so they are listed in the sitemap even though the
 * generated route tree only knows the parameterised parent.
 */
export const DYNAMIC_ROUTE_PREFIXES = ["/archetypes/"] as const;

export const SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/tools", changefreq: "weekly", priority: "0.9" },
  { path: "/tools/iq", changefreq: "weekly", priority: "0.9" },
  { path: "/tools/child-trauma", changefreq: "weekly", priority: "0.9" },
  { path: "/tools/dark-personality", changefreq: "weekly", priority: "0.9" },
  { path: "/tools/love-match", changefreq: "weekly", priority: "0.9" },
  { path: "/tools/roast", changefreq: "weekly", priority: "0.8" },
  { path: "/tools/prompt-maker", changefreq: "weekly", priority: "0.8" },
  { path: "/archetypes", changefreq: "weekly", priority: "0.8" },
  ...ARCHETYPE_PATHS.map((path) => ({
    path,
    changefreq: "monthly" as const,
    priority: "0.7",
  })),
  { path: "/vault", changefreq: "weekly", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

export function buildSitemapXml(entries: SitemapEntry[] = SITEMAP_ENTRIES): string {
  const urls = entries.map((entry) =>
    [
      "  <url>",
      `    <loc>${SITE_BASE_URL}${entry.path === "/" ? "/" : entry.path}</loc>`,
      entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
      entry.priority ? `    <priority>${entry.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}
