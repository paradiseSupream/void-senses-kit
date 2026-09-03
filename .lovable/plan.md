# V2 Viral Revenue Engine — Senses of Void

Goal: turn the existing site into a self-reinforcing loop — discovery → test → result → related tool → challenge friend → referral → return → monetization — without touching anything that already earns.

## Audit findings (verified in code)

Already exists, will be reused, not rebuilt:
- 7 tools: Child Trauma, Quick IQ, Dark Personality, Love & Vibe, AI Roast, AI Prompt Maker, Free Drive Vault (`src/lib/tools.ts`).
- Challenge loop v1: `compareUrl`/`decodeCompare` + `/compare` page, "Challenge a friend", share cards (`canvas-card.ts`), story cards, `ShareRow`, UTM + `sid` share attribution (`share-link.ts`).
- Monetization: AdSlot, NativeAdCard, ActionGate, VIP pricing, Whop, Pixel/CAPI, A/B (`vip-ab.ts`, `archetype-ab.ts`), admin analytics tabs.
- SEO: per-tool head + og:image, archetype landing pages, vault pack/category pages, generated sitemap.
- Return-user pieces: `EmailCapture`, `StreakChallenge` (3-test run), vault loop tracking.

Missing (what V2 adds): persistent referral identity + rewards, leaderboards, per-result share/challenge landing pages with real OG previews, cross-tool recommendation logic driven by result content, new repeat-play tools, daily challenge, viral/revenue analytics tab.

## Phases (each shippable and reversible)

### Phase 1 — Referral core + growth analytics
- `src/lib/referral.ts`: stable anonymous `ref` code in localStorage, attach `?ref=` to every existing share/challenge URL through `withUtm`, capture inbound `ref` once per session, self-referral and duplicate guard (own code, same device hash, already-counted visitor).
- New table `referrals` (visit → start → complete → share stages, ref code, tool, country) with GRANTs + insert-only anon policy; reads via a server function for admin/leaderboard only.
- Funnel events reuse existing `track()`; adds `ref_visit`, `ref_start`, `ref_complete`, `ref_share`.
- Reward: unlocking ad-free exports for the session after 3 verified referred completions (genuine, no forced sharing).
- Admin: new "Growth" tab — visitors, starts, completions, shares, referral visits/conversions, viral coefficient (K), pages/session, return rate, DAU, RPM, revenue/user, revenue by tool / landing page / GEO / source.

### Phase 2 — Shareable result engine
- New public route `/r/$token` (SSR): decodes the existing compare token, renders score + archetype + "Beat my score" CTA, unique title/description/OG/Twitter per result, JSON-LD, `noindex` for personal result tokens while the tool hub pages stay indexable.
- OG image endpoint `src/routes/api/public/og/$token.ts` rendering a 1200×630 card server-side (reusing card layout constants) so Facebook/WhatsApp/X previews show the actual score.
- Existing `/compare` keeps working; result links upgrade to `/r/$token`.

### Phase 3 — Cross-tool journeys
- `src/lib/journeys.ts`: result-aware next-tool mapping (IQ→Logic/Memory, Dark Personality→Child Trauma, Love→Compatibility Battle, AI tools→IQ/Personality), rendered through the existing `NextTools` component. Max 2 suggestions, never blocking.

### Phase 4 — New viral tools (prioritised by viral × repeat × SEO × safety)
1. **Memory Challenge** (`/tools/memory`) — 60s grid/sequence recall, score, leaderboard, high repeat value.
2. **Logic Challenge** (`/tools/logic`) — timed logic sprint reusing the IQ engine and bank patterns.
3. **This or That** (`/tools/this-or-that`) — 20 rapid dilemmas → shareable profile, highest share rate, cheapest to build.
4. **Friend Compatibility Battle** (`/tools/battle`) — two-player compare built on the existing compare-token format.
5. **Daily 60-Second Challenge** (`/daily`) — deterministic daily seed, one score per day, daily leaderboard, return driver.
6. **AI Personal Profile Analyzer** (`/profile`) — synthesises already-completed local results into one dossier; VIP-gated deep version using existing pricing.

Each new tool: same `QuizRunner`/`ResultActions`/AdSlot/NativeAdCard patterns, registered in `TOOLS`, own head metadata + og:image, sitemap entry.

### Phase 5 — Social mechanics + return engine
- Leaderboards (daily + all-time, anonymous handle, per-tool) backed by a `leaderboard_scores` table with anon insert + narrow anon select of safe columns only.
- Achievement/streak badges from local completion history, shareable badge card via existing canvas card.
- Return engine: reuse `EmailCapture` on new result pages, daily-challenge reminder opt-in, "new since your last visit" tool strip. Web push only behind explicit consent, matching the existing cookie/consent handling.

### Phase 6 — SEO engine
- Tool/category hubs, "what your score means" percentile explainer pages (real norm data from `norm_stats`), tool comparison pages, FAQ blocks with FAQ JSON-LD where genuinely answering questions, internal linking between hubs/tools/archetypes, sitemap auto-updated from route constants. No mass-generated thin pages.

### Phase 7 — A/B, performance, QA
- Extend the existing A/B framework (no replacement) with arms for challenge CTA, share prompt, related-tool placement, referral reward framing.
- Lazy-load new heavy tool components; keep bundles mobile-first.
- Run the existing 91 tests before and after each phase, plus Playwright route QA on every new route and the full tool → result → share → referral → return flow, mobile viewport.

## Technical notes
- Backup: a restore point is created before Phase 1 (History entry), and every phase lands as isolated new files plus small additive hooks into existing components.
- No changes to pricing, Whop, Pixel/CAPI, VIP gating, ad frequency caps, lean/campaign-safe rules, or existing tests.
- New DB tables follow insert-only anon policies with explicit GRANTs; no PII in share links or leaderboards.

## Delivery order
Phases 1–3 first (loop + measurement), then 4, then 5–7. Final report covers: existing features found, new features, files changed, tests passed, routes tested, viral metrics, revenue metrics, remaining risks.
