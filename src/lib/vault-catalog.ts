/**
 * Free Drive Vault — static catalog.
 *
 * Every entry is a genuinely free, legally distributable resource (open
 * source, public domain, CC-licensed, or an official free tier). Nothing here
 * is pirated or paywalled content: that keeps the pages ad-network safe and
 * Facebook-ads safe, which is the whole point of the vault as a traffic
 * surface.
 *
 * The catalog is static on purpose. Vault pages are the cheapest, fastest,
 * most indexable surface on the site — no database round-trip, full SSR HTML,
 * and every item gets its own URL that a smartlink-monetised ad campaign can
 * point at.
 */

export type VaultItem = {
  slug: string;
  title: string;
  category: VaultCategory;
  /** One-line hook shown on the card. */
  tagline: string;
  /** 2-4 sentences shown on the detail page (unique text = indexable page). */
  detail: string;
  /** What the user actually receives. */
  format: string;
  license: string;
  tags: string[];
  /** Official, legal source of the resource. */
  url: string;
  featured?: boolean;
};

export const VAULT_CATEGORIES = [
  "Dev",
  "Design",
  "AI",
  "Books",
  "Data",
  "Media",
  "Business",
  "Learning",
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

const CC0 = "CC0 / public domain";
const MIT = "MIT / open source";
const FREE = "Free tier — no card required";
const CCBY = "Creative Commons";

export const VAULT_ITEMS: VaultItem[] = [
  /* ------------------------------------------------------------------ Dev */
  {
    slug: "react-typescript-starter",
    title: "Vite + React + TypeScript Starter",
    category: "Dev",
    tagline: "Production-ready SPA skeleton with strict TS and fast HMR.",
    detail:
      "The official Vite React-TS template, ready to clone and ship. Strict TypeScript, instant hot reload, and a build output small enough to score green on Core Web Vitals out of the box. Use it as the base for dashboards, landing pages and internal tools instead of rebuilding config every time.",
    format: "Git repository template",
    license: MIT,
    tags: ["react", "typescript", "vite", "boilerplate"],
    url: "https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts",
    featured: true,
  },
  {
    slug: "tailwind-css-docs",
    title: "Tailwind CSS Complete Reference",
    category: "Dev",
    tagline: "Every utility class, searchable and offline-friendly.",
    detail:
      "The full Tailwind utility reference — spacing, typography, flex, grid, transitions and dark mode. Keep it open in a second tab while you build and you stop guessing class names. Pairs well with the design tokens cheat sheet in the Design section.",
    format: "Web reference",
    license: MIT,
    tags: ["css", "tailwind", "frontend"],
    url: "https://tailwindcss.com/docs/utility-first",
  },
  {
    slug: "devdocs-offline",
    title: "DevDocs — Offline API Documentation",
    category: "Dev",
    tagline: "200+ API docs in one offline-capable app.",
    detail:
      "DevDocs bundles the documentation of hundreds of languages and libraries into a single fast interface that works offline once cached. It is the fastest way to check a signature without leaving your editor for a search engine.",
    format: "Progressive web app",
    license: MIT,
    tags: ["docs", "reference", "offline"],
    url: "https://devdocs.io",
  },
  {
    slug: "public-apis-directory",
    title: "Public APIs Mega Directory",
    category: "Dev",
    tagline: "1,400+ free APIs sorted by category and auth type.",
    detail:
      "A maintained index of free public APIs across weather, finance, games, AI, geo and more, each tagged with auth requirements, HTTPS support and CORS. Perfect fuel for side projects and portfolio demos that need real data.",
    format: "Curated list",
    license: MIT,
    tags: ["api", "data", "side-project"],
    url: "https://github.com/public-apis/public-apis",
    featured: true,
  },
  {
    slug: "git-cheat-sheet",
    title: "Git Command Cheat Sheet",
    category: "Dev",
    tagline: "Rebase, stash, bisect and recovery commands on one page.",
    detail:
      "Every Git command you actually use, plus the ones that save you when a branch goes wrong. Includes recovery patterns for detached HEAD, accidental resets and force-push mistakes.",
    format: "PDF / web page",
    license: CCBY,
    tags: ["git", "cheatsheet", "workflow"],
    url: "https://education.github.com/git-cheat-sheet-education.pdf",
  },
  {
    slug: "regex-playground",
    title: "Regex Builder & Tester",
    category: "Dev",
    tagline: "Write, explain and debug regular expressions visually.",
    detail:
      "An interactive regex editor with live match highlighting and a plain-English explanation of each token. Saves hours the first time you have to parse a messy log or validate user input properly.",
    format: "Web tool",
    license: FREE,
    tags: ["regex", "tool", "debug"],
    url: "https://regex101.com",
  },
  {
    slug: "roadmap-sh-paths",
    title: "Developer Roadmaps",
    category: "Dev",
    tagline: "Step-by-step skill maps for frontend, backend, DevOps and AI.",
    detail:
      "Community-maintained visual roadmaps that show exactly what to learn next and in what order. Each node links to free resources, so you can go from zero to job-ready without buying a course.",
    format: "Interactive roadmaps",
    license: MIT,
    tags: ["career", "learning", "roadmap"],
    url: "https://roadmap.sh",
    featured: true,
  },
  {
    slug: "vscode-power-shortcuts",
    title: "VS Code Shortcut & Settings Pack",
    category: "Dev",
    tagline: "Keyboard maps plus a tuned settings.json.",
    detail:
      "The official keyboard shortcut sheets for Windows, macOS and Linux together with the editor settings that most professional teams standardise on: format on save, bracket colours, and a sane font stack.",
    format: "PDF + JSON",
    license: MIT,
    tags: ["vscode", "productivity", "editor"],
    url: "https://code.visualstudio.com/docs/getstarted/keybindings",
  },
  {
    slug: "docker-compose-recipes",
    title: "Docker Compose Recipe Book",
    category: "Dev",
    tagline: "Copy-paste stacks for Postgres, Redis, Nginx and more.",
    detail:
      "Ready compose files for the services every project eventually needs — database, cache, reverse proxy, object storage — with volumes and health checks already wired. Spin a full local environment in one command.",
    format: "YAML samples",
    license: MIT,
    tags: ["docker", "devops", "infra"],
    url: "https://github.com/docker/awesome-compose",
  },
  {
    slug: "supabase-quickstarts",
    title: "Postgres + Auth Backend Quickstarts",
    category: "Dev",
    tagline: "Auth, row-level security and storage patterns you can copy.",
    detail:
      "Working reference implementations for email auth, social login, row-level security policies and file storage on Postgres. The RLS examples alone prevent the most common data-leak bug in small apps.",
    format: "Guides + code",
    license: MIT,
    tags: ["backend", "postgres", "auth"],
    url: "https://supabase.com/docs/guides/getting-started",
  },

  /* --------------------------------------------------------------- Design */
  {
    slug: "figma-community-ui-kits",
    title: "Figma Community UI Kits",
    category: "Design",
    tagline: "Thousands of duplicatable design files and components.",
    detail:
      "The Figma Community library: dashboards, mobile apps, design systems, wireframe kits and icon sets, all duplicatable into your own workspace for free. Filter by 'UI kit' and you have a year of design starting points.",
    format: "Figma files",
    license: FREE,
    tags: ["figma", "ui-kit", "components"],
    url: "https://www.figma.com/community",
    featured: true,
  },
  {
    slug: "google-fonts-library",
    title: "Google Fonts Complete Library",
    category: "Design",
    tagline: "1,600+ typefaces licensed for commercial use.",
    detail:
      "Every family is open-licensed for commercial projects, including client work and products you sell. Download the full family or self-host the exact weights you need to keep page weight low.",
    format: "Font files",
    license: "SIL Open Font License",
    tags: ["fonts", "typography", "commercial-use"],
    url: "https://fonts.google.com",
  },
  {
    slug: "unsplash-photo-library",
    title: "Unsplash Photo Library",
    category: "Design",
    tagline: "High-resolution photography, free for commercial use.",
    detail:
      "Millions of high-resolution photos under a licence that allows commercial use without attribution. Ideal for landing page heroes, ad creatives and social posts when a stock subscription is out of budget.",
    format: "JPEG downloads",
    license: "Unsplash License",
    tags: ["photos", "stock", "hero-images"],
    url: "https://unsplash.com",
  },
  {
    slug: "pexels-video-photos",
    title: "Pexels Photos & Stock Video",
    category: "Design",
    tagline: "Free photos plus 4K stock footage in one library.",
    detail:
      "Pexels covers both stills and short 4K clips under a permissive licence — the fastest source of B-roll for ad creatives, reels and product videos.",
    format: "JPEG + MP4",
    license: "Pexels License",
    tags: ["stock", "video", "photos"],
    url: "https://www.pexels.com",
  },
  {
    slug: "lucide-icon-set",
    title: "Lucide Icon Set",
    category: "Design",
    tagline: "1,400+ consistent open-source SVG icons.",
    detail:
      "A clean, geometric icon family with framework packages for React, Vue and Svelte. Stroke width and size are props, so icons stay pixel-consistent across an entire product.",
    format: "SVG + npm package",
    license: "ISC / open source",
    tags: ["icons", "svg", "react"],
    url: "https://lucide.dev/icons",
  },
  {
    slug: "coolors-palette-generator",
    title: "Coolors — Palette Generator",
    category: "Design",
    tagline: "Generate, lock and export accessible colour systems.",
    detail:
      "Press space to generate palettes, lock the colours that work, and export as CSS variables, Tailwind config or SVG. The contrast checker keeps your text legible before a client complains.",
    format: "Web tool",
    license: FREE,
    tags: ["color", "palette", "branding"],
    url: "https://coolors.co",
  },
  {
    slug: "undraw-illustrations",
    title: "unDraw Illustration Pack",
    category: "Design",
    tagline: "Recolourable SVG illustrations for any brand.",
    detail:
      "Hundreds of flat illustrations where you set the accent colour before downloading, so the artwork matches your palette exactly. Free for commercial use with no attribution.",
    format: "SVG / PNG",
    license: "unDraw open licence",
    tags: ["illustration", "svg", "marketing"],
    url: "https://undraw.co/illustrations",
  },
  {
    slug: "haikei-generators",
    title: "Haikei — SVG Background Generators",
    category: "Design",
    tagline: "Blobs, waves, meshes and grain exported as SVG or PNG.",
    detail:
      "Generate the abstract background shapes modern landing pages use — layered waves, blob scenes, low-poly grids — and export them as lightweight SVG instead of heavy hero images.",
    format: "SVG / PNG",
    license: FREE,
    tags: ["background", "svg", "landing-page"],
    url: "https://app.haikei.app",
  },
  {
    slug: "glassmorphism-toolkit",
    title: "Glassmorphism & Shadow Toolkit",
    category: "Design",
    tagline: "Generate frosted glass and layered shadow CSS visually.",
    detail:
      "Dial in blur, transparency, border glow and multi-layer shadows with live preview, then copy the CSS. The same technique powers the dark glass surfaces across this site.",
    format: "Web tool + CSS",
    license: FREE,
    tags: ["css", "glassmorphism", "ui"],
    url: "https://css.glass",
  },
  {
    slug: "design-cheatsheet-spacing",
    title: "Spacing, Scale & Type Cheat Sheet",
    category: "Design",
    tagline: "The 4pt grid, type scales and layout ratios on one page.",
    detail:
      "Refactoring UI's public guidance distilled into practical rules: use a limited spacing scale, define type sizes in a ratio, and give elements hierarchy with weight and colour instead of size alone.",
    format: "Reference article",
    license: CCBY,
    tags: ["ux", "layout", "typography"],
    url: "https://www.refactoringui.com/previews/building-your-color-palette",
  },

  /* -------------------------------------------------------------------- AI */
  {
    slug: "awesome-chatgpt-prompts",
    title: "Awesome ChatGPT Prompts",
    category: "AI",
    tagline: "Hundreds of role prompts that actually change output quality.",
    detail:
      "A curated collection of persona and task prompts — interviewer, editor, SQL translator, travel planner — that reliably improve model output. Read a few and you learn the structure behind good prompting, not just the copy-paste.",
    format: "Prompt library",
    license: CC0,
    tags: ["prompts", "chatgpt", "llm"],
    url: "https://github.com/f/awesome-chatgpt-prompts",
    featured: true,
  },
  {
    slug: "prompt-engineering-guide",
    title: "Prompt Engineering Guide",
    category: "AI",
    tagline: "From zero-shot to chain-of-thought, with worked examples.",
    detail:
      "A structured course on prompting techniques: few-shot, chain-of-thought, self-consistency, RAG patterns and adversarial prompting. Each technique comes with before/after examples so you can see the improvement.",
    format: "Online guide",
    license: MIT,
    tags: ["prompting", "llm", "guide"],
    url: "https://www.promptingguide.ai",
  },
  {
    slug: "huggingface-model-hub",
    title: "Hugging Face Model Hub",
    category: "AI",
    tagline: "Open models for text, vision, audio and embeddings.",
    detail:
      "Hundreds of thousands of open models with licence information, inference widgets and usage snippets. Filter by task and licence to find something you can legally ship in a commercial product.",
    format: "Model repository",
    license: "Varies — per model",
    tags: ["models", "open-source", "ml"],
    url: "https://huggingface.co/models",
  },
  {
    slug: "stable-diffusion-prompt-book",
    title: "Image Prompt Book",
    category: "AI",
    tagline: "Style, lighting and camera keywords that control output.",
    detail:
      "A visual reference of how style, lens, lighting and composition keywords change generated images. Use it to get repeatable art direction instead of rerolling prompts blindly.",
    format: "Illustrated PDF",
    license: CCBY,
    tags: ["image-gen", "prompts", "art-direction"],
    url: "https://openart.ai/promptbook",
  },
  {
    slug: "llm-course-open",
    title: "Open LLM Course",
    category: "AI",
    tagline: "Fine-tuning, quantisation and deployment, free.",
    detail:
      "A full course covering LLM fundamentals, fine-tuning with LoRA, quantisation for cheap inference, and deployment patterns, with runnable notebooks for every chapter.",
    format: "Notebooks + roadmap",
    license: "Apache 2.0",
    tags: ["llm", "fine-tuning", "course"],
    url: "https://github.com/mlabonne/llm-course",
  },
  {
    slug: "whisper-transcription",
    title: "Whisper — Open Speech-to-Text",
    category: "AI",
    tagline: "Accurate multilingual transcription you can self-host.",
    detail:
      "OpenAI's open-weight speech recognition model, strong on accented English and dozens of other languages. Run it locally to caption videos or transcribe interviews with no per-minute fee.",
    format: "Model + code",
    license: MIT,
    tags: ["speech", "transcription", "audio"],
    url: "https://github.com/openai/whisper",
  },
  {
    slug: "ai-agent-patterns",
    title: "AI Agent Design Patterns",
    category: "AI",
    tagline: "Tool use, planning, memory and evaluation blueprints.",
    detail:
      "Reference patterns for building agents that stay reliable: constrained tool schemas, planner/executor splits, memory scoping and evaluation harnesses. Written for engineers shipping to real users.",
    format: "Guide + examples",
    license: MIT,
    tags: ["agents", "architecture", "llm"],
    url: "https://github.com/anthropics/anthropic-cookbook",
  },
  {
    slug: "vector-db-primer",
    title: "Embeddings & Vector Search Primer",
    category: "AI",
    tagline: "How semantic search actually works, with code.",
    detail:
      "Explains embeddings, cosine similarity, chunking strategy and hybrid search, then shows a working retrieval pipeline. The chunking chapter is the difference between a demo and a useful RAG system.",
    format: "Tutorial",
    license: "Apache 2.0",
    tags: ["embeddings", "rag", "search"],
    url: "https://github.com/pgvector/pgvector",
  },

  /* ----------------------------------------------------------------- Books */
  {
    slug: "project-gutenberg",
    title: "Project Gutenberg Library",
    category: "Books",
    tagline: "70,000+ public-domain books in EPUB and Kindle formats.",
    detail:
      "The original digital library: classics, philosophy, science and reference works whose copyright has expired, in clean EPUB, Kindle and plain-text formats. Fully legal to download, read and redistribute.",
    format: "EPUB / MOBI / TXT",
    license: CC0,
    tags: ["ebooks", "classics", "public-domain"],
    url: "https://www.gutenberg.org",
    featured: true,
  },
  {
    slug: "openstax-textbooks",
    title: "OpenStax Peer-Reviewed Textbooks",
    category: "Books",
    tagline: "University textbooks in psychology, maths, economics and more.",
    detail:
      "Openly licensed, peer-reviewed textbooks used by real universities. The psychology and statistics volumes are the ones most people here come back for — proper foundations, not blog summaries.",
    format: "PDF / web",
    license: CCBY,
    tags: ["textbooks", "psychology", "study"],
    url: "https://openstax.org/subjects",
  },
  {
    slug: "arxiv-preprints",
    title: "arXiv — Open Research Preprints",
    category: "Books",
    tagline: "Read the papers before they reach the headlines.",
    detail:
      "Open-access preprints across computer science, physics, statistics and quantitative biology. The cs.CL and cs.LG sections are where nearly every AI advance appears first.",
    format: "PDF papers",
    license: "Open access",
    tags: ["research", "papers", "science"],
    url: "https://arxiv.org",
  },
  {
    slug: "standard-ebooks",
    title: "Standard Ebooks",
    category: "Books",
    tagline: "Public-domain classics, typeset properly.",
    detail:
      "The same public-domain texts as Gutenberg, but carefully proofread and typeset with real typography, covers and metadata. If you read on an e-reader, start here.",
    format: "EPUB",
    license: CC0,
    tags: ["ebooks", "typography", "classics"],
    url: "https://standardebooks.org",
  },
  {
    slug: "open-library-borrow",
    title: "Open Library",
    category: "Books",
    tagline: "Catalogue and legal borrowing for millions of titles.",
    detail:
      "An open, editable catalogue of published books with legal controlled-digital-lending access to many scanned titles. Useful for research and citation as much as for reading.",
    format: "Web reader",
    license: "Library lending",
    tags: ["library", "reading", "research"],
    url: "https://openlibrary.org",
  },
  {
    slug: "psychology-classics-archive",
    title: "Classics in the History of Psychology",
    category: "Books",
    tagline: "Original texts from Freud, Jung, James and Skinner.",
    detail:
      "Full-text originals of the papers that built modern psychology, hosted for open academic use. Reading Jung on the shadow in his own words changes how you read every modern personality test — including ours.",
    format: "Web / HTML",
    license: "Open access",
    tags: ["psychology", "jung", "primary-source"],
    url: "https://psychclassics.yorku.ca",
  },

  /* ------------------------------------------------------------------ Data */
  {
    slug: "kaggle-datasets",
    title: "Kaggle Dataset Library",
    category: "Data",
    tagline: "Tens of thousands of analysis-ready datasets.",
    detail:
      "Public datasets with licences, previews and community notebooks showing what others already found. The fastest way to get a portfolio analysis project off the ground.",
    format: "CSV / notebooks",
    license: "Varies — per dataset",
    tags: ["datasets", "analytics", "portfolio"],
    url: "https://www.kaggle.com/datasets",
  },
  {
    slug: "our-world-in-data",
    title: "Our World in Data",
    category: "Data",
    tagline: "Charts and raw data on global trends, free to reuse.",
    detail:
      "Research-grade charts on health, energy, population and technology, each with the underlying CSV and a permissive reuse licence. Excellent source material for content, decks and ad creative.",
    format: "CSV + charts",
    license: CCBY,
    tags: ["statistics", "charts", "research"],
    url: "https://ourworldindata.org",
  },
  {
    slug: "google-dataset-search",
    title: "Google Dataset Search",
    category: "Data",
    tagline: "One search box across the world's open datasets.",
    detail:
      "Indexes datasets published by governments, universities and companies, with licence and update metadata surfaced in the results. Use it when Kaggle does not have your niche.",
    format: "Search engine",
    license: "Varies",
    tags: ["search", "datasets", "open-data"],
    url: "https://datasetsearch.research.google.com",
  },
  {
    slug: "world-bank-open-data",
    title: "World Bank Open Data",
    category: "Data",
    tagline: "Economic indicators for every country, via API.",
    detail:
      "GDP, population, internet penetration and hundreds of other indicators by country and year, downloadable or queryable through a free API — ideal for market-sizing before you run ads in a new country.",
    format: "CSV / API",
    license: CCBY,
    tags: ["economics", "api", "market-research"],
    url: "https://data.worldbank.org",
  },
  {
    slug: "openstreetmap-extracts",
    title: "OpenStreetMap Data Extracts",
    category: "Data",
    tagline: "Full map data by country or region.",
    detail:
      "Download raw map data for any region — roads, buildings, points of interest — and use it in products without a per-request map fee. The base layer behind most independent map apps.",
    format: "PBF / GeoJSON",
    license: "ODbL",
    tags: ["maps", "geo", "osm"],
    url: "https://download.geofabrik.de",
  },
  {
    slug: "mockaroo-test-data",
    title: "Realistic Test Data Generator",
    category: "Data",
    tagline: "Generate believable CSV and JSON fixtures instantly.",
    detail:
      "Define a schema and generate thousands of realistic rows — names, addresses, emails, dates — for demos, load tests and seeded databases. Screenshots of a product look far better with real-looking data.",
    format: "CSV / JSON / SQL",
    license: FREE,
    tags: ["test-data", "fixtures", "demo"],
    url: "https://www.mockaroo.com",
  },

  /* ----------------------------------------------------------------- Media */
  {
    slug: "davinci-resolve-free",
    title: "DaVinci Resolve (Free Edition)",
    category: "Media",
    tagline: "Hollywood-grade editing and colour grading, no cost.",
    detail:
      "A complete NLE with colour grading, Fairlight audio and Fusion VFX. The free edition is enough to cut and grade commercial work — the paid version mainly adds high-end hardware features.",
    format: "Desktop app",
    license: FREE,
    tags: ["video-editing", "color", "post"],
    url: "https://www.blackmagicdesign.com/products/davinciresolve",
    featured: true,
  },
  {
    slug: "capcut-templates",
    title: "Short-Form Video Editing Kit",
    category: "Media",
    tagline: "Caption styles, hooks and pacing for reels.",
    detail:
      "A practical guide to editing short-form video that retains: hook in the first second, hard cuts every two to three seconds, burned-in captions, and a loop-friendly ending. Includes free caption workflows.",
    format: "Guide + presets",
    license: FREE,
    tags: ["reels", "tiktok", "short-form"],
    url: "https://www.capcut.com/tools/video-editor",
  },
  {
    slug: "audacity-audio",
    title: "Audacity — Audio Editor",
    category: "Media",
    tagline: "Record, clean and master audio for free.",
    detail:
      "Open-source audio editing with noise reduction, compression and normalisation — enough to make phone-recorded voiceover sound like it came from a booth. Standard tool for podcasters on a budget.",
    format: "Desktop app",
    license: "GPL / open source",
    tags: ["audio", "podcast", "voiceover"],
    url: "https://www.audacityteam.org",
  },
  {
    slug: "free-music-archive",
    title: "Free Music Archive",
    category: "Media",
    tagline: "Licensed music for video, no copyright strikes.",
    detail:
      "Curated tracks under Creative Commons licences with the terms stated per track. Check the licence, credit where required, and your uploads stay clear of automated copyright claims.",
    format: "MP3 downloads",
    license: CCBY,
    tags: ["music", "royalty-free", "youtube"],
    url: "https://freemusicarchive.org",
  },
  {
    slug: "handbrake-encoder",
    title: "HandBrake — Video Compressor",
    category: "Media",
    tagline: "Shrink video files without visible quality loss.",
    detail:
      "Batch-convert and compress video with sensible presets for web, mobile and social. Cutting a 400MB upload to 40MB at the same perceived quality is a one-click preset here.",
    format: "Desktop app",
    license: "GPL / open source",
    tags: ["compression", "encoding", "video"],
    url: "https://handbrake.fr",
  },
  {
    slug: "canva-free-templates",
    title: "Ad Creative Template Library",
    category: "Media",
    tagline: "Editable ad, story and thumbnail templates.",
    detail:
      "Thousands of free editable templates sized for feed ads, stories, reels covers and thumbnails. Swap the copy and colours to match your brand and you have a week of creative in an afternoon.",
    format: "Editable templates",
    license: FREE,
    tags: ["ads", "creative", "social"],
    url: "https://www.canva.com/templates",
  },

  /* -------------------------------------------------------------- Business */
  {
    slug: "startup-legal-docs",
    title: "Open Startup Legal Templates",
    category: "Business",
    tagline: "NDAs, contractor agreements and SAFEs, openly licensed.",
    detail:
      "Standardised, openly published startup documents used across the industry. They are a starting point, not legal advice — but they save your lawyer from drafting from scratch, which saves you money.",
    format: "DOCX / PDF",
    license: CCBY,
    tags: ["legal", "startup", "contracts"],
    url: "https://www.ycombinator.com/documents",
  },
  {
    slug: "financial-model-template",
    title: "Startup Financial Model Template",
    category: "Business",
    tagline: "Revenue, churn, CAC and runway in one spreadsheet.",
    detail:
      "A working model where you enter traffic, conversion rate, price and churn, and see runway, LTV and payback period update live. Use it before scaling ad spend, not after.",
    format: "Spreadsheet",
    license: FREE,
    tags: ["finance", "saas", "metrics"],
    url: "https://docs.google.com/spreadsheets/u/0/?ftv=1",
  },
  {
    slug: "pitch-deck-library",
    title: "Real Pitch Deck Library",
    category: "Business",
    tagline: "The decks that raised money, page by page.",
    detail:
      "Publicly shared decks from companies that actually closed rounds, with the narrative structure visible: problem, insight, traction, ask. Copy the structure, not the slides.",
    format: "PDF collection",
    license: "Publicly shared",
    tags: ["fundraising", "pitch", "startup"],
    url: "https://www.pitchdeckhunt.com",
  },
  {
    slug: "meta-ads-playbook",
    title: "Meta Ads Fundamentals",
    category: "Business",
    tagline: "Official targeting, budget and measurement training.",
    detail:
      "Meta's own free courses on campaign structure, audience targeting, creative testing and conversion measurement, including the Pixel and Conversions API. Free certification exams are included.",
    format: "Course",
    license: FREE,
    tags: ["ads", "facebook", "marketing"],
    url: "https://www.facebookblueprint.com",
    featured: true,
  },
  {
    slug: "google-analytics-academy",
    title: "Analytics & Measurement Academy",
    category: "Business",
    tagline: "Track what matters and read the numbers correctly.",
    detail:
      "Free official training in analytics setup, event tracking, attribution and reporting. Understanding attribution windows alone will change how you judge a campaign's real ROI.",
    format: "Course",
    license: FREE,
    tags: ["analytics", "attribution", "measurement"],
    url: "https://skillshop.withgoogle.com",
  },
  {
    slug: "notion-business-os",
    title: "Business Operating System Templates",
    category: "Business",
    tagline: "CRM, content calendar and project boards, prebuilt.",
    detail:
      "Free workspace templates covering client CRM, content pipeline, goal tracking and meeting notes. Duplicate one and your solo business has a system on day one instead of month six.",
    format: "Workspace templates",
    license: FREE,
    tags: ["templates", "crm", "operations"],
    url: "https://www.notion.com/templates",
  },
  {
    slug: "cold-email-frameworks",
    title: "Cold Outreach Framework Pack",
    category: "Business",
    tagline: "Message structures that get replies, not spam reports.",
    detail:
      "Short, specific outreach structures — trigger, relevance, single ask — plus deliverability basics like SPF, DKIM and sending volume. Written for freelancers and agencies starting from zero.",
    format: "Guide + templates",
    license: CCBY,
    tags: ["sales", "email", "freelance"],
    url: "https://www.gmass.co/blog/cold-email-templates",
  },

  /* -------------------------------------------------------------- Learning */
  {
    slug: "freecodecamp-curriculum",
    title: "freeCodeCamp Full Curriculum",
    category: "Learning",
    tagline: "Thousands of hours of coding lessons and certifications.",
    detail:
      "A complete, project-based curriculum from HTML to data structures, machine learning and interview prep, with free certifications at the end of each track. No upsell, no card.",
    format: "Interactive course",
    license: "BSD / open",
    tags: ["coding", "certification", "beginner"],
    url: "https://www.freecodecamp.org/learn",
    featured: true,
  },
  {
    slug: "cs50-harvard",
    title: "CS50 — Harvard Computer Science",
    category: "Learning",
    tagline: "The best introduction to computer science, free to audit.",
    detail:
      "Harvard's flagship CS course with lectures, problem sets and a final project. Hard but transformative: it teaches how computers work, not just how to write a framework.",
    format: "Video course",
    license: CCBY,
    tags: ["computer-science", "harvard", "fundamentals"],
    url: "https://cs50.harvard.edu/x",
  },
  {
    slug: "khan-academy",
    title: "Khan Academy",
    category: "Learning",
    tagline: "Maths, science and economics from basics to advanced.",
    detail:
      "Structured lessons with practice and mastery tracking, from arithmetic through calculus, statistics and economics. The statistics track pairs well with the datasets in the Data section.",
    format: "Course platform",
    license: FREE,
    tags: ["math", "science", "study"],
    url: "https://www.khanacademy.org",
  },
  {
    slug: "mit-opencourseware",
    title: "MIT OpenCourseWare",
    category: "Learning",
    tagline: "Real MIT course materials, openly published.",
    detail:
      "Lecture notes, assignments and exams from thousands of MIT courses, including psychology, linear algebra and machine learning. Use the syllabi to build a self-study plan with real rigour.",
    format: "Course materials",
    license: CCBY,
    tags: ["university", "self-study", "engineering"],
    url: "https://ocw.mit.edu",
  },
  {
    slug: "psychology-research-methods",
    title: "Research Methods in Psychology",
    category: "Learning",
    tagline: "How valid tests are actually built and validated.",
    detail:
      "An open textbook on measurement, reliability, validity and experimental design. Read it and you will be able to tell a serious psychometric instrument from a quiz written for clicks.",
    format: "Open textbook",
    license: CCBY,
    tags: ["psychology", "methods", "validity"],
    url: "https://opentextbc.ca/researchmethods",
  },
  {
    slug: "language-learning-open",
    title: "Open Language Learning Pack",
    category: "Learning",
    tagline: "Free courses, frequency lists and spaced repetition.",
    detail:
      "Spaced-repetition software plus shared decks for the most common vocabulary in dozens of languages. Learning the top 1,000 words first is the difference between months and years.",
    format: "App + decks",
    license: "AGPL / open source",
    tags: ["language", "anki", "memory"],
    url: "https://apps.ankiweb.net",
  },
  {
    slug: "typing-speed-trainer",
    title: "Typing Speed Trainer",
    category: "Learning",
    tagline: "Measurable typing improvement in minutes a day.",
    detail:
      "A minimal, ad-free typing test with detailed accuracy and consistency stats. Going from 45 to 90 words per minute compounds across every hour you spend at a keyboard.",
    format: "Web app",
    license: "GPL / open source",
    tags: ["typing", "productivity", "practice"],
    url: "https://monkeytype.com",
  },
  {
    slug: "study-technique-guide",
    title: "Evidence-Based Study Techniques",
    category: "Learning",
    tagline: "Spaced repetition, retrieval practice, interleaving.",
    detail:
      "A summary of the learning techniques with the strongest research support — and the popular ones (rereading, highlighting) that research shows barely work. Short, practical, cited.",
    format: "Guide",
    license: CCBY,
    tags: ["learning", "memory", "science"],
    url: "https://www.learningscientists.org/downloadable-materials",
  },
];

export const VAULT_COUNT = VAULT_ITEMS.length;

export function vaultBySlug(slug: string): VaultItem | undefined {
  return VAULT_ITEMS.find((item) => item.slug === slug);
}

export function vaultByCategory(category: VaultCategory | "All"): VaultItem[] {
  return category === "All"
    ? VAULT_ITEMS
    : VAULT_ITEMS.filter((item) => item.category === category);
}

export function vaultFeatured(): VaultItem[] {
  return VAULT_ITEMS.filter((item) => item.featured);
}

/** Same category first, then anything sharing a tag. */
export function vaultRelated(item: VaultItem, limit = 6): VaultItem[] {
  const sameCategory = VAULT_ITEMS.filter(
    (other) => other.slug !== item.slug && other.category === item.category,
  );
  const sharedTag = VAULT_ITEMS.filter(
    (other) =>
      other.slug !== item.slug &&
      other.category !== item.category &&
      other.tags.some((tag) => item.tags.includes(tag)),
  );
  return [...sameCategory, ...sharedTag].slice(0, limit);
}

export function vaultCategoryCounts(): Array<{ category: VaultCategory; count: number }> {
  return VAULT_CATEGORIES.map((category) => ({
    category,
    count: VAULT_ITEMS.filter((item) => item.category === category).length,
  }));
}

export const VAULT_PATHS = VAULT_ITEMS.map((item) => `/vault/${item.slug}`);
