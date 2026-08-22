# Senses of Void — v2: "দেখলেই বোঝা যায়" + র‍্যান্ডম প্রশ্ন ব্যাংক + $100k-লেভেল UI

লক্ষ্য: প্রথম ৫ সেকেন্ডে ইউজার বুঝবে সাইটটা কী, প্রতিটা টুল আলাদা পরিচয় পাবে, প্রতিবার টেস্ট আলাদা প্রশ্ন দেবে (স্ক্রিনশট/AI দিয়ে চিট করা যাবে না), রেজাল্ট অনেক বেশি গভীর ও শেয়ারযোগ্য হবে — যাতে paid ads (FB/TikTok/IG) থেকে ROI পজিটিভ হয় এবং সাবস্ক্রিপশন ছাড়াই ads + VIP থেকে রেভিনিউ আসে।

## ১. প্রথম দর্শনেই বোঝা (clarity layer)

- হিরো: এক লাইনের বড় প্রতিশ্রুতি + এক লাইনের ব্যাখ্যা + দুটি বড় CTA (`Take a free test`, `See all 7 tools`), নিচে trust strip ("No signup · Result in 3 min · Free PDF").
- হিরোর ঠিক নিচে **"How it works" ৩ ধাপ** (Pick a test → Answer → Get your visual report) — আইকন + এক লাইন করে।
- **Tool Finder**: "What do you want to find out?" — ৪টা বড় ট্যাপ চিপ (Myself · My past · My relationship · Just for fun) → ফিল্টার করা টুল গ্রিড। ইউজারকে ভাবতে হবে না।
- প্রতিটি ToolCard-এ: কভার ইমেজ, নাম, এক লাইনের প্রতিশ্রুতি, প্রশ্ন সংখ্যা + সময় ব্যাজ, আউটপুট ব্যাজ (PDF/PNG), sample result thumbnail, এবং "Start" বাটন।
- প্রতিটি টুল পেজের শুরুতে **Intro card**: কী পাবেন (রেজাল্টের ছোট প্রিভিউ), কয়টা প্রশ্ন, কত সময়, আউটপুট, তারপর বড় "Begin"।
- মোবাইলে fixed bottom nav (Home · Tools · Vault · VIP), সব ট্যাপ টার্গেট ≥44px।

## ২. প্রশ্ন ব্যাংক + র‍্যান্ডমাইজেশন (সবচেয়ে বড় কাজ)

প্রতিটি টেস্টের প্রশ্ন এখনকার হার্ডকোড অ্যারে থেকে সরিয়ে **ক্যাটাগরি-ভিত্তিক ব্যাংকে** নেওয়া হবে:

| টুল | ব্যাংক সাইজ | প্রতি সেশনে | নিয়ম |
|---|---|---|---|
| IQ Test | ৬০+ আইটেম (Pattern / Number / Logic / Verbal / Spatial), ৩টি ডিফিকাল্টি টিয়ার | ২০ | প্রতি ক্যাটাগরি থেকে সমান, easy→hard র‍্যাম্প |
| Child Trauma | ৫০+ সিনারিও, ৬ অক্ষে ট্যাগ করা | ১৮ | প্রতি অক্ষে ন্যূনতম ৩টি |
| Dark Personality | ৫৪ আইটেম (৬ ট্রেইট) | ২৪ | প্রতি ট্রেইটে ৪টি, reverse-scored মেশানো |
| Love & Vibe | ৪৫ আইটেম (৫ ডাইমেনশন) | ২০ | প্রতি ডাইমেনশনে ৪টি |

- প্রতি সেশনে seed-ভিত্তিক shuffle: প্রশ্নের ক্রম + অপশনের ক্রম দুটোই বদলাবে, তাই একই স্ক্রিনশট পরের ইউজারের কাজে লাগবে না।
- IQ-তে অ্যান্টি-চিট: প্রতি আইটেমে টাইমার, tab-switch হলে ওই আইটেম বাদ, প্রশ্ন ইমেজ নয় বরং রেন্ডার করা গ্লিফ/সিকোয়েন্স যাতে টেক্সট কপি কঠিন হয়।
- সব ব্যাংক `src/lib/banks/*.ts`-এ টাইপ-সেফ ডেটা, scoring লজিক আলাদা pure ফাংশনে — ইউনিট টেস্ট সহ।

## ৩. রেজাল্ট কোয়ালিটি (যেটা শেয়ার হয়)

- **স্কোরিং**: raw score → normalized percentile (নরম কার্ভ), প্রতি অক্ষে ব্যান্ড (Low/Moderate/High) + প্রতিটি ব্যান্ডের জন্য লেখা ব্যাখ্যা (২–৩ বাক্য), শক্তি/ঝুঁকি/পরবর্তী ধাপ।
- **ভিজুয়াল**: radar chart (trauma/love), trait bar spectrum (dark), score dial + per-category breakdown (IQ) — সবই SVG, হালকা ও রেটিনা-শার্প।
- **আর্কিটাইপ নাম** (যেমন "The Vigilant Builder") + এক লাইনের পাঞ্চ — এটাই শেয়ার হওয়ার আসল কারণ।
- **Share pack**: 1080×1920 story কার্ড + 1200×630 og কার্ড + "Copy link" + Facebook/X/WhatsApp/TikTok-friendly ডাউনলোড; শেয়ার লিংকে রেজাল্ট আর্কিটাইপ ওপেন-গ্রাফে বসবে ("Are you also The Vigilant Builder?")।
- রেজাল্টের নিচে **Next recommended tool** (২টি) → সেশন চেইন, টাইম-অন-সাইট বাড়ে।
- **Compare / Challenge**: "Send this test to a friend" লিংক — ফ্রেন্ডের রেজাল্ট এলে দুইজনের match% দেখায় (Love & Vibe-এ সবচেয়ে ভাইরাল)।

## ৪. UI/ডিজাইন আপগ্রেড ($100k লেভেল)

- ডার্ক গ্লাসমরফিক ভাষা ধরে রেখে: গভীর depth layer (aurora + noise খুব সূক্ষ্ম), প্রতি টুলের নিজস্ব accent glow, hairline border, বড় টাইপ স্কেল, ৮pt গ্রিড।
- Space Grotesk (হেডিং) / Inter (বডি) / JetBrains Mono (ডেটা) — কনসিস্টেন্ট স্কেল ও লেটার-স্পেসিং।
- মাইক্রো-ইন্টার‍্যাকশন: প্রশ্ন ট্রানজিশন, প্রগ্রেস রেইল, রেজাল্ট রিভিল (কাউন্ট-আপ + চার্ট ড্র), সব CSS-ভিত্তিক ও `prefers-reduced-motion` সম্মত।
- মোবাইল-ফার্স্ট: প্রতিটি স্ক্রিন 393px-এ ডিজাইন করা, শূন্য horizontal overflow, safe-area padding।
- পারফরম্যান্স বাজেট: LCP < 1.8s মোবাইলে, CLS ~0, কভার ইমেজ lazy + width/height সেট।

## ৫. Paid ads ROI (FB / TikTok / IG)

- প্রতিটি টুলের জন্য আলাদা **ল্যান্ডিং ভ্যারিয়েন্ট** (`/t/<slug>?src=fb`) — hero-তে সরাসরি প্রথম প্রশ্ন, শূন্য ঘর্ষণ। ক্লিক→টেস্ট শুরু কনভার্শন সর্বোচ্চ।
- **UTM ক্যাপচার + অ্যাট্রিবিউশন**: utm_source/campaign/adset localStorage-এ, প্রতিটি ad event ও VIP purchase-এ যুক্ত — `/admin`-এ per-campaign RPM ও ROI টেবিল।
- **ফানেল ট্র্যাকিং**: landing → start → 50% → result → export → ad click → VIP; প্রতিটি ধাপ ড্যাশবোর্ডে drop-off সহ।
- Meta/TikTok pixel স্লট (`/admin`-এ ID বসানোর ফিল্ড) + standard events (ViewContent, StartTrial=test start, Purchase=VIP)। consent ছাড়া ফায়ার হবে না।
- রেভিনিউ প্রতি সেশন বাড়াতে: ১ম টেস্ট গেট-ফ্রি, ২য় টেস্টে export gate + smartlink, ৩য়-এ vignette + VIP অফার (আগের সেশন ফ্লো ঠিক রেখে)।

## ৬. Ads (যা আছে, তা অক্ষত + টিউন)

- Monetag in-page push / vignette / popunder, Adsterra Social Bar, smartlink surfaces, sticky mobile, export gate — সব থাকবে; শুধু নতুন লেআউটে সঠিক জায়গায় বসবে যাতে CLS ও bounce না বাড়ে।
- VIP ($19 lifetime, Solana) সব ads + gate সরায়; সাবস্ক্রিপশন যোগ হবে না।
- Lean mode, consent, frequency cap, CI ad-policy টেস্ট — অপরিবর্তিত।

## ৭. SEO ও লং-টার্ম

- প্রতিটি টুলে ইউনিক title/description/og + JSON-LD (Quiz/WebApplication), শেয়ার কার্ডের absolute og:image।
- প্রতিটি টুলের জন্য ছোট "About this test" সেকশন (method, scoring, disclaimer) — Google-এর কাছে thin content নয়।

## টেকনিক্যাল নোট

- নতুন: `src/lib/banks/{iq,trauma,dark,love}.ts`, `src/lib/quiz-engine.ts` (seed shuffle, সিলেকশন, স্কোরিং), `src/lib/attribution.ts`, `src/components/tools/{IntroCard,ProgressRail,ResultReveal,RadarChart,TraitBars,SharePack}.tsx`, `src/components/home/{HowItWorks,ToolFinder}.tsx`, রুট `src/routes/t.$slug.tsx` (ad landing)।
- বিদ্যমান ৪টি quiz রুট নতুন engine-এ রিফ্যাক্টর; roast/prompt-maker/vault শুধু UI পলিশ।
- ইউনিট টেস্ট: র‍্যান্ডম সিলেকশন কভারেজ, স্কোরিং সীমা, ad-policy (আগেরটা অক্ষত)।
- ডেটাবেস: শুধু `ad_events`-এ campaign/utm কলাম + funnel event টাইপ যোগ; বাকি স্কিমা অপরিবর্তিত।

## ডেলিভারি ধাপ

1. ডিজাইন সিস্টেম + হোম clarity layer (How it works, Tool Finder, নতুন ToolCard)
2. Quiz engine + ৪টি প্রশ্ন ব্যাংক + অ্যান্টি-চিট
3. রেজাল্ট ভিজুয়াল + আর্কিটাইপ + share pack + next tools
4. Ad landing রুট + UTM অ্যাট্রিবিউশন + funnel ড্যাশবোর্ড
5. পারফরম্যান্স/SEO পাস + লাইভ টেস্ট
