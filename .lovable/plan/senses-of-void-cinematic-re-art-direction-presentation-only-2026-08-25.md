# Senses of Void — Cinematic Re-Art-Direction (Presentation Only)

Redesign the existing UI in place. No logic, scoring, randomisation, API, database, auth, routing, payment, paywall, export or feature behaviour changes. Every file touched is presentation: CSS tokens, layout/markup, animation, and per-tool visual identity.

## 1. Visual system (src/styles.css)

- Replace the single flat obsidian base with four layered void surfaces (`#020205`, `#05070B`, `#080B12`, `#0B1018`) as oklch tokens: `--void-0..3`, remapping `--background`, `--card`, `--surface`, `--surface-2` onto them.
- Keep emerald primary, add cyan and violet as controlled accent-light tokens only (halo, edge, gradient text) — no broad neon fills.
- Rework `panel`, `glass`, `lift`, `grain`, `aurora` utilities: thinner hairlines, directional inner highlight, softer and larger shadow falloff, lower blur radius, restrained glow. Add new utilities: `spotlight` (cursor-tracked radial highlight via CSS vars), `tilt-3d` (perspective wrapper), `hud-tile`, `capsule`, `sheen-word` (shimmer on selected hero words), `dock`.
- Add motion tokens: `--dur-micro: 160ms`, `--dur-ui: 320ms`, `--dur-major: 560ms`, plus spring-ish cubic-beziers. Reuse them everywhere instead of ad-hoc values.

## 2. Hero (src/routes/index.tsx)

Re-art-direct composition only; keep the `?t=` redirect, copy variants, experiment tracking, CTA targets and all existing text/links.

- Oversized cinematic display type with tight tracking, fluid `clamp()` sizing across 320→1920.
- Selective emerald/cyan/violet gradient emphasis on 1–2 words with a slow shimmer sweep (disabled under reduced motion).
- Layered background: deep void gradient + fine technical grid + volumetric light pool + grain, all pure CSS, mask-faded so it never competes with text.
- Rebuild the `STATS` row (`< 1.5s`, `On-device`, `PDF · PNG`, `7 tools`) into HUD analytical tiles: monospace micro-label, value, hairline divider, subtle icon, depth.
- Category filters → premium capsules with a sliding active indicator and spring transition; filtering logic untouched.

## 3. Test cards (src/components/tools/ToolCard.tsx + `accent` values in src/lib/tools.ts)

One shared card component, per-tool identity driven by data (accent token + gradient recipe already exposed as `--tool-accent`):

- Child Trauma — violet-blue atmosphere, fractured/memory geometry overlay.
- Quick IQ — cyan precision, neural/mathematical line lattice.
- Dark Personality — reflective black with deep violet crystal facets.
- Love & Vibe, AI Roast, Prompt Maker, Vault keep their accents with matching overlay recipes.

Interaction: desktop pointer-reactive `rotateX/rotateY` tilt (small, damped), cursor-following spotlight, parallax cover layer, soft border illumination. Mobile: tilt off, press-scale feedback only. Existing cover images, text, CTA labels and link targets unchanged.

## 4. Buttons and CTAs

Single upgraded CTA treatment applied through existing classes/utilities: layered surface, hairline border, inner highlight, restrained ambient glow, hover elevation, light sweep, `scale(0.97)` spring press. Applies to hero CTA, card CTA, VIP buttons, export/share buttons — same handlers.

## 5. Navigation (Header.tsx, MobileTabBar.tsx)

Same routes, same VIP button behaviour. Header becomes a slim floating dock with deep blur and hairline edge. Mobile tab bar becomes a floating island: inset margins, rounded, deep blur, soft shadow, spring-animated active indicator, `env(safe-area-inset-bottom)` respected, and page bottom padding adjusted so nothing overlaps.

## 6. Test and result experience (QuizRunner.tsx, ToolShell.tsx, RadarChart.tsx, TraitBars.tsx, ResultActions.tsx, ShadowDossier.tsx, LockedReport.tsx)

- Quiz screen: distraction-free frame, elegant thin progress + timer, larger readable question type, tactile answer rows with press/selected states, smooth question cross-fade/slide. Question order, randomisation, timing logic, and ad-phase gating stay exactly as they are.
- Result screen: staged cinematic reveal (score → radar draw-in → traits → interpretation), stronger score hierarchy, refined radar (animated polygon stroke, graded rings, axis labels, responsive scaling down to 320px), polished share/export control cluster. Existing `canvas-card`, PDF token flow and gate logic untouched.

## 7. VIP, paywall, modals (VipModal, MatrixUpsellModal, ExitIntentOffer, ActionGate, CookieBanner)

Presentation only: spatial depth, blur, hairline borders, spring entrance, exclusive-not-aggressive tone in layout, and a proper mobile sheet layout with safe areas. All pricing, tiers, checkout calls and entitlement checks unchanged.

## 8. Motion and performance

- Prefer CSS transforms/opacity driven by the motion tokens. Add `framer-motion` only for the card tilt/spotlight and result reveal orchestration where CSS gets unwieldy; no Three.js — a single lightweight `<canvas>` ambient light-drift layer behind the hero, DPR-capped, paused off-screen via IntersectionObserver, and skipped on mobile/low-power/reduced-motion.
- Off-screen animations paused; blur reduced on small screens (existing mobile media block extended); no scroll-jacking; no layout-thrashing animations.

## 9. Responsive and accessibility

Intentional layouts at 320 / 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920+: fluid type scale, corrected card proportions, denser mobile spacing, 44px+ touch targets, chart scaling, no bottom-nav overlap. Contrast verified against the darker base, visible focus rings kept, semantic structure preserved, and a full `prefers-reduced-motion` path that disables tilt, parallax, shimmer, canvas and reveal staging.

## 10. Final QA

Typecheck, existing Vitest suite (must stay green — includes premium lockdown, entitlement, ad policy), build, then a Playwright pass over every route at mobile and desktop: home, /tools, all 7 tool routes incl. a full quiz run and result, /vault, /compare, /vip/checkout, /vip/success, /admin pages, /privacy, /terms. Verify scoring output unchanged, exports/downloads work, no console errors, no placeholder UI.

## Technical notes

- Tailwind v4: all tokens in `src/styles.css` under `@theme inline` / `:root`; custom utilities via `@utility`; no config file, no remote `@import`.
- No changes to `src/lib/archetype-core.ts`, `*.server.ts`, `*.functions.ts`, `src/routes/api/**`, `src/integrations/supabase/**`, quiz banks, or `quiz-engine.ts`.
- New presentation-only helpers: `src/hooks/use-pointer-tilt.ts`, `src/hooks/use-reduced-motion.ts`, `src/components/visuals/AmbientCanvas.tsx`.
