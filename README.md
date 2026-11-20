# Senses of Void

Build a production-grade, ultra-fast web application named "Senses of Void" (domain: sensesofvoid.app). Dark, futuristic, glassmorphic, and highly performant. This must look and feel like a top-tier venture-backed product with clean architecture and zero fluff.



## 1. Technical Stack & Core Setup

- Frontend: React + Vite (or Next.js App Router), Tailwind CSS, Framer Motion, Lucide React Icons.

- Backend/DB: Supabase (PostgreSQL + Auth + Edge Functions).

- State/PDF/Canvas: Zustand/Context API, jspdf (client-side PDF generation), html2canvas.

- AI Gateway: Supabase Edge Function routing to OpenRouter API (Fallback: Groq / DeepSeek).

- Fonts: Space Grotesk (Headings), Inter (Body), JetBrains Mono (Data/Labels).



## 2. Design Tokens & Visual Language

- Backgrounds: Obsidian (#09090b base), Slate Dark (#18181b cards), Border line (#27272a).

- Accents: Emerald Neon (#10b981 primary CTA & focus), Violet Void (#7c3aed secondary/badges).

- Glassmorphism: `bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] shadow-2xl`.

- Animations: Smooth micro-interactions, subtle hover lift (translate-y-[-3px]), respects `prefers-reduced-motion`. Mobile-first, fully responsive.



## 3. Global Layout & Components

- Header:

  - Pulsing abstract logo mark (concentric rings, radial glow) + "Senses of Void" typography.

  - Global real-time instant search bar (filters all 7 tools and Drive vault items client-side without page reload).

  - "$19 Lifetime VIP" CTA button opening a modal with Stripe Checkout button and a labeled "Pay with Crypto" placeholder tab.

  - Dedicated Header Ad Container (728x90 desktop / 320x50 mobile placeholder div with non-blocking lazy script execution).

- Footer:

  - Standard entertainment/self-reflection disclaimer: "All tests and tools are for entertainment and self-reflection only, not clinical psychological or medical assessment."

  - Links to Privacy Policy, Terms of Service, and Cookie Consent settings.

- Ad & Monetization Architecture (Compliant & High-CTR):

  - Global MultiTag/Script initialization in root layout.

  - Native Ad Cards: Injected cleanly every 4th slot in tool and vault grids, labeled with a subtle "Sponsored" badge.

  - Social Bar Floating Widget: Dismissible bottom-right floating pill; stores dismissal state in localStorage.

  - Action Gate / Interstitial: Before exporting certificates, PDFs, or Drive links, show a 3-second animated scanner with a functional "Skip" button. VIP users bypass this gate instantly.

  - Dual-action trigger on free exports: opens affiliate/smartlink placeholder in a new background tab (`target="_blank"`) while generating the actual file in the active window.



## 4. The 7 Core Tools Implementation



### 1. Child Trauma Test

- 10 multi-choice scenario questions loaded one by one with a progress indicator ("Step 3 of 10") and zero page refresh.

- Animated custom radio buttons with keyboard accessibility.

- Result Screen: Interactive Canvas/SVG radar chart of emotional dimensions + written analytical summary.

- Export: "Download Analysis Report (PDF)" compiles real data into a high-res PDF via `jspdf` after the skippable gate.



### 2. Quick IQ Test

- 15 visual pattern recognition and mathematical puzzles with an active 15-second countdown timer per question. Auto-advances on timeout.

- Result Screen: Generates a branded "Verified Cognitive Performance Certificate" with calculated estimated percentile, date, and user name.

- Export: "Download HD Certificate" exports dynamic HTML5 Canvas directly to PNG.



### 3. Dark Personality Test

- 8 interactive slider inputs evaluating Machiavellianism and Shadow Archetypes.

- Result: Visual breakdown with archetypes ("The Mastermind", "The Phantom", "The Architect", "The Ghost") and a 1-click "Generate Shareable Card" via Canvas.



### 4. Love & Vibe Matcher

- Two name and optional birthdate input fields using deterministic string-hashing algorithms (consistent outputs for identical inputs).

- Visual heart/pulse frequency wave animation and witty personality synergy breakdown.

- 1-click "Copy Vibe Score" formatted for Instagram/TikTok stories.



### 5. AI Roast Me

- Text input for bio, GitHub username, or text snippet + Roast Level slider (Mild / Savage / Brutal).

- Connects to Supabase Edge Function `/api/roast` that proxies to OpenRouter API (`meta-llama/llama-3-8b-instruct:free` or `deepseek/deepseek-chat`). Server-side API key only.

- Terminal typing effect for streamed output. Rate limited to 10 requests/hour per IP.



### 6. AI Prompt Maker

- Input keyword field + structured dropdown selectors (Midjourney v6, Flux, ChatGPT, 8K, Unreal Engine, Cyberpunk, Cinematic Lighting).

- Pure client-side string builder (zero API cost) producing optimized, copy-ready prompt syntax with toast notifications.



### 7. Free Drive Vault

- Live grid populated from Supabase `vault_assets` table (UI kits, developer boilerplates, 1000+ AI prompts, design cheat sheets).

- Category filter tabs (All / Dev / Design / AI / Books) and instant search.

- Clean "Download Asset" action invoking the skippable gate, then resolving to the direct Google Drive link.



## 5. Supabase Database Schema & RLS

Create the following PostgreSQL tables with full Row Level Security:

1. `vault_assets` (id UUID PRIMARY KEY, title TEXT, category TEXT, description TEXT, drive_link TEXT, download_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()).

2. `vip_users` (id UUID PRIMARY KEY, email TEXT UNIQUE, stripe_customer_id TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()).

3. `roast_requests` (id UUID PRIMARY KEY, ip_hash TEXT, request_count INT DEFAULT 1, last_request TIMESTAMPTZ DEFAULT NOW()).

- RLS Policies: Allow public read-only access to `vault_assets`. Allow Edge Functions service-role access to `roast_requests`.



## 6. Performance & Compliance

- Route-level lazy loading for all 7 tools to ensure sub-1.5s First Contentful Paint (FCP).

- Zero deceptive clickbait, ze

ro medical claim wording, and fully accessible WCAG 2.1 AA focus indicators.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://void-senses-kit.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0e23938a-7518-43a8-af48-cf1ecbad34aa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
