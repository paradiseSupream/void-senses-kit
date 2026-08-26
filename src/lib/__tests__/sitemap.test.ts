import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DYNAMIC_ROUTE_PREFIXES,
  EXCLUDED_ROUTE_PREFIXES,
  SITEMAP_ENTRIES,
  SITE_BASE_URL,
  buildSitemapXml,
} from "@/lib/sitemap-routes";

/** Reads the `to` paths declared by the generated route tree. */
function routeTreePaths(): string[] {
  const source = readFileSync("src/routeTree.gen.ts", "utf8");
  const block = source.split("export interface FileRoutesByTo {")[1]?.split("}")[0] ?? "";
  return [...block.matchAll(/'([^']+)':/g)]
    .map((match) => match[1]!)
    .filter((path) => !path.includes("$") && !path.includes("*"))
    .filter((path) => !EXCLUDED_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix)))
    .filter((path) => path !== "/sitemap.xml");
}

describe("sitemap", () => {
  it("covers every public route in the route tree", () => {
    const listed = new Set(SITEMAP_ENTRIES.map((entry) => entry.path));
    const missing = routeTreePaths().filter((path) => !listed.has(path));
    expect(missing, `Add these routes to SITEMAP_ENTRIES: ${missing.join(", ")}`).toEqual([]);
  });

  it("does not list routes that no longer exist", () => {
    const existing = new Set(routeTreePaths());
    const stale = SITEMAP_ENTRIES.map((entry) => entry.path)
      .filter((path) => !DYNAMIC_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix)))
      .filter((path) => !existing.has(path));
    expect(stale, `Remove these stale sitemap entries: ${stale.join(", ")}`).toEqual([]);
  });

  it("never lists private or API routes", () => {
    for (const entry of SITEMAP_ENTRIES) {
      expect(EXCLUDED_ROUTE_PREFIXES.some((prefix) => entry.path.startsWith(prefix))).toBe(false);
    }
  });

  it("renders absolute canonical URLs", () => {
    const xml = buildSitemapXml();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    for (const entry of SITEMAP_ENTRIES) {
      expect(xml).toContain(`<loc>${SITE_BASE_URL}${entry.path}</loc>`);
    }
  });
});
