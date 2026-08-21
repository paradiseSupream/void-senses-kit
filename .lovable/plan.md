# Senses of Void — Build Plan

A dark, futuristic, glassmorphic tool suite with 7 tools, a free asset vault, VIP upsell, and an ad/monetization layer.

## Stack notes (differences from the brief)

This project runs on the fixed Lovable stack, so three substitutions apply:

- **Framework:** TanStack Start (React 19 + Vite 7 + Tailwind v4). Not Next.js App Router. Routing, SSR, and route-level code splitting all come built in.
- **Backend:** Lovable Cloud (Postgres + Auth + storage + server functions). Same Supabase engine underneath; the AI proxy and rate limiting run as server functions instead of standalone Edge Functions.
- **AI:** Lovable AI Gateway (server-side key already provisioned) instead of OpenRouter/Groq. Streaming output works the same for the terminal typing effect, with no external API key to manage.

Everything else — design tokens, fonts, tool behaviour, PDF/canvas exports, ads, schema, RLS — is built as specified.

## Design system

- Tokens in `src/styles.css` (oklch): obsidian background `#09090b`, card `#18181b`, border `#27272a`, emerald `#10b981` primary, violet `#7c3aed` secondary.
- Glass surface + hover-lift + focus-ring utilities defined once as reusable classes; no hardcoded colors in components.
- Fonts via `<link>` in the root route: Space Grotesk, Inter, JetBrains Mono.
- Framer Motion micro-interactions, all gated on `prefers-reduced-motion`. Mobile-first.

## Global shell

- Header: pulsing concentric-ring logo mark, wordmark, instant client-side search across all 7 tools + vault items, "$19 Lifetime VIP" CTA opening a modal (Stripe checkout button + labeled crypto placeholder tab), responsive ad slot (728x90 / 320x50) with non-blocking lazy script.
- Footer: entertainment/self-reflection disclaimer, Privacy Policy, Terms, Cookie settings routes.
- Monetization layer: `Sponsored`-labeled native ad card injected every 4th grid slot; dismissible bottom-right social pill persisted in localStorage; a 3-second animated scanner gate with working Skip before any export/drive link, bypassed for VIP; free exports open a smartlink placeholder in a background tab while the file generates in the active tab.

## Routes

```text
/                      hub grid of 7 tools + search
/tools/child-trauma    /tools/iq        /tools/dark-personality
/tools/love-match      /tools/roast     /tools/prompt-maker
/vault                 /privacy  /terms
```

Each tool is its own lazily-loaded route file; the hub stays light for fast FCP.

## Tools

1. **Child Trauma Test** — 10 scenario questions, one at a time, "Step 3 of 10" progress, animated keyboard-accessible radios, SVG radar chart of emotional dimensions + written summary, jsPDF report after the gate.
2. **Quick IQ Test** — 15 pattern/math items, 15s per-question countdown with auto-advance, percentile calculation, branded certificate rendered on canvas, PNG export.
3. **Dark Personality Test** — 8 sliders, archetype result (Mastermind / Phantom / Architect / Ghost), canvas share card.
4. **Love & Vibe Matcher** — two names + optional birthdates, deterministic hash scoring (same input → same output), pulse-wave animation, witty synergy breakdown, one-click copy formatted for stories.
5. **AI Roast Me** — text/bio/GitHub input + Mild/Savage/Brutal slider, streamed roast from a server function using the AI Gateway, terminal typing effect, 10 requests/hour per hashed IP.
6. **AI Prompt Maker** — keyword field + Midjourney v6 / Flux / ChatGPT / 8K / Unreal Engine / Cyberpunk / Cinematic Lighting selectors, pure client-side string builder, copy toast.
7. **Free Drive Vault** — grid from `vault_assets`, category tabs (All / Dev / Design / AI / Books), instant search, Download Asset → gate → direct drive link, download counter increment.

## Database (Lovable Cloud)

- `vault_assets` (id, title, category, description, drive_link, download_count, created_at) — public read via anon SELECT policy; seeded with real starter rows so the vault is populated on first load.
- `vip_users` (id, email unique, stripe_customer_id, is_active, created_at) — no public access; service-role only.
- `roast_requests` (id, ip_hash, request_count, last_request) — service-role only, used by the roast rate limiter.

All tables get explicit GRANTs, RLS enabled, and least-privilege policies.

## Payments

Stripe checkout for the $19 lifetime VIP, wired through the Stripe integration with a webhook writing `vip_users`. Crypto stays a clearly labeled placeholder tab. This step needs your Stripe account connected; the modal and VIP gating logic ship regardless.

## Compliance & performance

- No clinical or medical claim wording anywhere; disclaimer on every result screen.
- WCAG 2.1 AA focus indicators, keyboard paths through every quiz, alt text, semantic headings.
- Route-level code splitting, lazy ad scripts, per-route SEO metadata and JSON-LD.

## Build order

1. Design tokens, fonts, shell (header/footer/ads/gate/VIP modal), hub page.
2. Cloud enable + schema + seed + vault route.
3. Client-only tools: prompt maker, love match, dark personality.
4. Export-heavy tools: child trauma (PDF), IQ (canvas certificate).
5. AI roast server function + rate limit + streaming UI.
6. Stripe VIP, legal pages, accessibility and performance pass.
