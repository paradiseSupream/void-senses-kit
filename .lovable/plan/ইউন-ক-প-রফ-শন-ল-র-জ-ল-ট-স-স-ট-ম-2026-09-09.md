# ইউনিক প্রফেশনাল রেজাল্ট সিস্টেম

## লক্ষ্য
বর্তমান একই ধরনের glass result card বাদ দিয়ে প্রতিটি টুলকে আলাদা, দ্রুত বোঝা যায় এমন এবং ইন্টারঅ্যাকটিভ ফলাফল অভিজ্ঞতা দেওয়া। নির্বাচিত ভিত্তি: **Tactical surveillance report**, near-black neon spectrum, **Sora + Manrope**, mobile-first focused single column।

## যা তৈরি হবে

### ১. ফলাফলের যৌথ কাঠামো, আলাদা পরিচয়
একটি নতুন result presentation system থাকবে, কিন্তু প্রতিটি টুল নিজস্ব ভিজ্যুয়াল ও বিন্যাস পাবে:

- **IQ** — যাচাইযোগ্য assessment certificate, score dial, category matrix
- **Child Trauma** — সংবেদনশীল impact map ও pattern timeline; রোগনির্ণয়ের ভাষা নয়
- **Dark Personality** — archetype sigil ও shadow-axis constellation
- **Love Match** — দুই ব্যক্তির resonance rings ও strongest/weakest bond
- **Red Flag** — tactical alert radar, severity band, action protocol
- **Memory** — memory waveform, span/accuracy/speed/stamina console
- **Logic** — reasoning trace, accuracy-speed quadrant, category grid
- **Friend Quiz** — knowledge fingerprint ও area-by-area match
- **Battle** — split-player comparison ও compatibility field
- **This or That** — choice fingerprint ও decisiveness spectrum
- **Roast / Prompt Maker** — বর্তমান স্বতন্ত্র output বজায় রেখে নতুন ফলাফল-পরিবারের typography, status ও action styling
- অন্যান্য ফলাফলযুক্ত টুলেও তার বিষয় অনুযায়ী স্বতন্ত্র treatment

### ২. ইন্টারঅ্যাকশন
- চার্ট বা অক্ষ চাপলে সেই অক্ষের ব্যাখ্যা খুলবে
- ফলাফল প্রথমে, তারপর confidence/quality, visualization, evidence, করণীয়—এই পরিষ্কার ক্রম
- visualization দ্রুত draw/reveal হবে; reduced-motion চালু থাকলে animation বন্ধ
- ছোট স্ক্রিনে কোনো label কাটা যাবে না; radar-এর দীর্ঘ label-এর জন্য নিরাপদ ভেতরের সীমা

### ৩. ভিজ্যুয়াল সিস্টেম
- global semantic tokens দিয়ে near-black, emerald, violet, coral/red, cyan accent family
- Sora heading ও Manrope body; data label-এ বর্তমান mono font
- nested card কমিয়ে unframed result header, একটিমাত্র visualization stage, expandable evidence rows এবং আলাদা action band
- প্রতিটি টুলের বর্তমান `--tool-accent`, cover এবং data ব্যবহার; নতুন raw hardcoded component color নয়

### ৪. সঠিক টুল সংখ্যা
- Home-এর “7 free tests”, “Browse all 7 tests”, “See all 13 tools” এবং ProofBand-এর স্থির সংখ্যা বাদ যাবে
- সব জায়গায় registry-র প্রকৃত `TOOLS.length` স্বয়ংক্রিয়ভাবে দেখাবে; ভবিষ্যতে টুল বাড়লেও নিজে আপডেট হবে

### ৫. যা অপরিবর্তিত থাকবে
- scoring, norms, percentile, quality checks ও result data
- VIP pricing/exit offer, Whop checkout, premium lock ও server-only premium prose
- Pixel/CAPI, A/B, ads/ad caps, Vault, referral/share, badges, NextTools, Daily Challenge ও Growth Analytics
- `ResultActions`-এর ব্যবসায়িক flow; শুধু তার সঙ্গে নতুন result presentation-এর visual boundary সামঞ্জস্য হবে

## কারিগরি বাস্তবায়ন
- dependency files আগে: reusable result frame, visualization primitives এবং per-tool variant configuration
- route-ভিত্তিক result JSX ছোট করে নতুন primitives-এ data pass করা হবে
- interactive charts semantic button/keyboard support পাবে
- global styles-এ Sora/Manrope loading ও semantic result tokens যোগ হবে
- কোনো medical/clinical accuracy claim যোগ হবে না; বর্তমান research-informed disclaimer থাকবে

## যাচাই
- প্রতিটি result route-এর source audit এবং প্রাসঙ্গিক ফলাফল screen render
- mobile 390px ও desktop 1280px visual QA: overflow, overlap, cut labels, contrast, interaction
- IQ, Trauma, Dark Personality, Love, Red Flag, Memory, Logic, Friend Quiz, Battle ও This or That end-to-end ফলাফল পরীক্ষা
- tool count সব entry point-এ registry count-এর সঙ্গে মেলে কিনা পরীক্ষা
- Vitest, TypeScript, production build এবং বর্তমান observability error logs যাচাই
