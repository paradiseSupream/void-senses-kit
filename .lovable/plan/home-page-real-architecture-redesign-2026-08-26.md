# Home page — real architecture redesign

আগের কাজটা মূলত surface-level ছিল (গাঢ় রঙ, নতুন কার্ড, টাইপোগ্রাফি)। কিন্তু পেজের
কাঠামো একই ছিল: hero → stats → tool grid → how it works → streak → pillars → FAQ → CTA।
এই প্ল্যান কাঠামোটাই বদলায় — কী দেখানো হয়, কোন ক্রমে, আর ভিজিটর কীভাবে ঢোকে।

## এখনকার সমস্যা

- Hero একটা পোস্টার — কিছু করার নেই, স্ক্রল করা ছাড়া। মোবাইলে টেস্ট শুরু করতে ২টা ট্যাপ লাগে।
- ৭টা টুল সমান ওজনের গ্রিড — কোনটা আগে নেব, ভিজিটর বুঝতে পারে না।
- "How it works", "Pillars", "FAQ" — তিনটা আলাদা ব্লক একই কথা বলে, শুধু scroll বাড়ায়।
- Sample report ডেস্কটপে দেখা যায়, মোবাইলে (মূল ট্রাফিক) লুকানো।

## নতুন কাঠামো

```text
1  Live entry panel      hero + প্রথম প্রশ্ন একসাথে, পেজেই উত্তর শুরু
2  Signature test        Dark Personality — একটাই বড় ফোকাস কার্ড
3  Result preview strip  আসল রাডার + আর্কিটাইপ কার্ড, মোবাইলেও দেখা যাবে
4  Rest of the suite     ২ কলামের compact list, goal ফিল্টারসহ
5  Proof + FAQ           merged: এক ব্যান্ডে সংখ্যা, ট্রাস্ট লাইন, ৪টা প্রশ্ন
6  Quiet close           free-forever + optional VIP
```

### 1. Live entry panel (সবচেয়ে বড় পরিবর্তন)

Hero-র ভেতরেই signature টেস্টের **প্রথম প্রশ্নটা** বসবে। ভিজিটর হোম পেজেই উত্তর
দেবে, উত্তর দিলে সে সরাসরি ওই টুলের পেজে চলে যাবে আর উত্তরটা carry হবে — মাঝপথে
হারাবে না। এটা "শুরু করার ট্যাপ" শূন্যে নামায়, bounce কমায়, dwell time বাড়ায়।

### 2. Signature test first, suite after

সাতটা সমান কার্ডের বদলে একটাই বড় কার্ড (Dark Personality — সবচেয়ে বেশি শেয়ার হয়),
তারপর বাকিগুলো ছোট rows। Goal chips থেকেই রইবে, কিন্তু ফিল্টার বাকি suite-এ কাজ করবে।

### 3. Result preview মোবাইলেও

`SampleResult` এখন `hidden lg:block`. নতুন কাঠামোয় এটা মোবাইলে একটা horizontal
snap strip হবে: রাডার → আর্কিটাইপ নাম → শেয়ার কার্ড — payoff আগে দেখানো।

### 4. তিনটা ব্লক এক করা

"How it works" + "Pillars" + stats → একটাই proof band (৩টা স্টেপ, ৪টা সংখ্যা)।
FAQ থাকবে কিন্তু ৪টা প্রশ্নে নামবে। এতে পেজের উচ্চতা ~35% কমবে।

## যা ছোঁয়া হবে না

স্কোরিং ইঞ্জিন, প্রশ্ন ব্যাংক/randomization, পেমেন্ট ও paywall, ads ও Safe Mode
লজিক, `?t=<slug>` ad-landing redirect, hero A/B copy arms, analytics/funnel
ইভেন্ট, রাউটিং, ডেটাবেস — সব অপরিবর্তিত। শুধু হোম পেজের কম্পোজিশন বদলাবে।

## টেকনিক্যাল

- `src/routes/index.tsx` — সেকশন ক্রম পুনর্গঠন; `HERO_COPY`/`FOCUS`/`trackExperiment`
  কল অপরিবর্তিত রেখে নতুন কম্পোনেন্ট বসানো।
- নতুন: `src/components/home/LiveEntry.tsx` (প্রথম প্রশ্ন + carry-over via
  `sessionStorage` + বিদ্যমান `autostart` হুক), `src/components/home/SignatureCard.tsx`,
  `src/components/home/ProofBand.tsx`।
- `SampleResult.tsx` — মোবাইল snap strip ভ্যারিয়েন্ট যোগ (লজিক নেই, শুধু লেআউট)।
- `StreakChallenge`, `HomeFaq`, `NativeAdCard` স্লট একই জায়গায় থাকবে যেন ad
  ইনভেন্টরি ও RPM না কমে।
- Ad গণনা: গ্রিডে যত native slot ছিল, নতুন লিস্টেও ততগুলোই থাকবে।
