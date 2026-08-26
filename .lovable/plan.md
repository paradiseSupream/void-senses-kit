# Mobile redesign — bento যেন ফোনেও দেখা যায়

ঠিক ধরেছেন। এখনকার কোডে bento কম্পোজিশন শুধু `lg:` breakpoint-এ চালু হয়
(`BentoGrid` → `lg:grid-cols-6`, প্রতিটা টাইলের span `lg:col-span-*`)। ফোনে সব
টাইল একই প্রস্থের একটা করে কার্ড হয়ে স্ট্যাক হয় — তাই মোবাইলে শুধু ফন্ট বদলেছে,
কাঠামো আগের মতোই লাগছে। মোবাইলেই আসল ট্রাফিক, তাই এবার ফোনের জন্য আলাদা করে
কম্পোজিশন বানানো হবে।

## মোবাইলে কী বদলাবে

```text
[ hero ]        ছোট হবে: headline ২ লাইন, sub-copy ২ লাইনে কাটা,
                CTA একটাই full-width, trust চিপ একটা mono স্ট্রিপে
[ live entry ]  ভাঁজের উপরেই — প্রশ্ন কার্ড hero-র সাথে মেশানো,
                অপশন ৫টা বড় tap-target, নিচে hairline progress
[ 2-col bento ] ফোনেই ২ কলাম: signature টেস্ট full-width tall tile,
                পাশে ছোট square tile (stat / streak / payoff)
[ payoff ]      উল্লম্ব স্ট্যাকের বদলে horizontal snap rail —
                radar → archetype → share card, সোয়াইপ করে দেখা
[ suite ]       goal chips এক লাইনের scrollable rail, টুল rows
                ২ কলাম compact grid (এখন ১ কলাম লম্বা লিস্ট)
[ proof/faq ]   accordion আরও টাইট, সংখ্যাগুলো ২×২ grid
[ tab bar ]     শেষ সেকশনে extra bottom padding যাতে native ad
                কার্ড ট্যাব বারের নিচে ঢুকে না যায় (এখন ওভারল্যাপ করছে)
```

## টেকনিক্যাল

- `BentoGrid`/`BentoTile` — মোবাইল-ফার্স্ট করা হবে: বেস `grid-cols-2`,
  নতুন `span` প্রপ যেন প্রতি টাইল মোবাইলে `col-span-2` (full) বা
  `col-span-1` (half) বেছে নিতে পারে, `lg:` span আগের মতোই থাকবে।
- `src/routes/index.tsx` — প্রতিটা `BentoTile`-এ মোবাইল span যোগ; hero-র
  padding/type scale কমানো; payoff সেকশনে snap rail (`snap-x` +
  `overflow-x-auto`, ডেস্কটপে গ্রিডে ফিরে যাবে); suite rows-এ `grid-cols-2`।
- `src/components/home/SampleResult.tsx` — মোবাইলে radar আর bars পাশাপাশি না
  রেখে rail-এর দুটো আলাদা স্লাইড।
- `src/components/tools/ToolRow.tsx` — compact ভ্যারিয়েন্ট (আইকন উপরে, নাম
  নিচে) যাতে ২ কলামে বসে।
- `src/styles.css` — `snap-rail` utility, মোবাইলে `bento` padding কমানো,
  `text-display`-এর মোবাইল clamp টিউন।
- শেষ সেকশনে `pb-[calc(...)+safe-area]` যোগ করে tab bar ওভারল্যাপ ফিক্স।

## যা ছোঁয়া হবে না

স্কোরিং, প্রশ্ন ব্যাংক/randomization, entitlement/paywall, Whop/Solana
checkout, ad slot সংখ্যা ও ad-policy, Safe/Lean Mode, `?t=<slug>` redirect,
hero A/B copy arms, analytics ইভেন্ট, রাউট, DB — সব অপরিবর্তিত। ad ইনভেন্টরি
এক-এক করে নতুন মোবাইল লেআউটে ম্যাপ হবে যেন RPM না কমে।

## ভেরিফিকেশন

৬৬টি Vitest পাস, build clean, Playwright-এ 393px ও 1280px দুই প্রস্থে
স্ক্রিনশট, এবং হোম → কুইজ → রেজাল্ট ফ্লো মোবাইলে চেক।
