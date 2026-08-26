# Complete UI redesign — editorial bento void

পুরো সাইটের ভিজ্যুয়াল ভাষা নতুন করে বসবে। লজিক, স্কোরিং, প্রশ্ন ব্যাংক, পেমেন্ট,
ads, রাউটিং, ডেটাবেস — কিছুই ছোঁয়া হবে না। শুধু দেখতে ও অনুভবে সম্পূর্ণ নতুন লেভেল।

## আপনার পছন্দ (locked)

- Palette: Void Emerald — `#020205` / `#0B1018` base, emerald `#10B981`, violet `#7C3AED`
- Typography: **Instrument Serif** (headings) + **Work Sans** (body), JetBrains Mono শুধু ডেটা লেবেলে
- Layout: **Bento grid**

## নতুন ডিজাইন ভাষা

এখনকার লুক = সব কার্ড একই ওজন, সব কিছু সমান glow, টাইপ সব sans। ফলে "প্রিমিয়াম"
লাগলেও generic AI-dark লাগে। নতুন দিক:

- **Editorial contrast**: বড় Instrument Serif হেডলাইন (light italic accent সহ) বনাম
  ছোট uppercase mono লেবেল — দুই স্তরের টাইপ কনট্রাস্টই মূল "wow"।
- **Bento composition**: সমান গ্রিডের বদলে অসম টাইল — signature টেস্ট 2×2, লাইভ প্রশ্ন
  প্যানেল tall, রেজাল্ট প্রিভিউ wide, stats ছোট square tiles।
- **Light discipline**: glow সব জায়গায় নয়। প্রতি স্ক্রিনে একটাই আলোর উৎস (hero-র
  উপরে emerald, footer-এ violet)। বাকি কার্ড শুধু hairline + grain।
- **Motion**: scroll-reveal stagger, bento টাইলে magnetic hover, নাম্বার count-up,
  reduced-motion সম্পূর্ণ সম্মানিত।

## স্ক্রিন-বাই-স্ক্রিন

```text
Home
  [ hero band ]  serif headline + mono kicker, একটাই aurora উৎস
  [ bento 1 ]    live question panel (tall) | signature test (2x2) | streak (small)
  [ bento 2 ]    result preview (wide, মোবাইলেও) | 3টা stat tile
  [ suite ]      বাকি টুল compact rows, goal chips সহ
  [ proof+faq ]  merged band, serif question টাইপ
  [ close ]      free-forever + quiet VIP line

Tool pages   ToolShell নতুন হেডার: serif টুল নাম, mono meta strip, accent hairline
Quiz         বড় serif প্রশ্ন, উত্তর অপশন hover-এ fill sweep, segmented rail পাতলা
Result       cinematic reveal — archetype নাম full-bleed serif, radar বড়, dossier
             কার্ড editorial two-column
Vault / VIP / Admin  একই টোকেন ও কার্ড ভাষায় align
```

## যা অপরিবর্তিত

স্কোরিং ইঞ্জিন, randomization, entitlement/paywall, signed PDF token, Whop/Solana
checkout, ad slot সংখ্যা ও ad-policy, Safe/Lean Mode, `?t=<slug>` redirect, hero
A/B copy arms, analytics ইভেন্ট, রাউট, DB — সব একই থাকবে। ad ইনভেন্টরি এক-এক
করে নতুন লেআউটে ম্যাপ হবে যেন RPM না কমে।

## টেকনিক্যাল

- `src/routes/__root.tsx` — Google Fonts link-এ Instrument Serif + Work Sans যোগ
  (Space Grotesk/Inter সরবে), preconnect রাখা হবে।
- `src/styles.css` — `--font-display`/`--font-sans` আপডেট; নতুন utility:
  `bento`, `tile-span-*`, `edge-hairline`, `serif-accent`, `count-up`;
  glow ব্যবহার কমাতে `panel`/`lift` টিউন। রঙের টোকেন অপরিবর্তিত।
- নতুন: `src/components/home/BentoGrid.tsx` (লেআউট প্রিমিটিভ),
  `src/components/ui/Reveal.tsx` (IntersectionObserver stagger)।
- আপডেট (presentation only): `index.tsx`, `LiveEntry`, `SignatureCard`,
  `ProofBand`, `SampleResult`, `HomeFaq`, `StreakChallenge`, `ToolCard`,
  `ToolRow`, `ToolShell`, `QuizRunner`, `ShadowDossier`, `Header`,
  `MobileTabBar`, `Footer`, `LockedReport`, `VipModal`, vault/vip/tools রুট।
- ভেরিফিকেশন: ৬৬টি Vitest suite পাস, build clean, Playwright-এ mobile+desktop
  স্ক্রিনশট এবং quiz→result ফ্লো চেক।
