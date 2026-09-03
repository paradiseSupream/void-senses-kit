# Vault Revenue Engine — ৫টা কাজ + Monetag স্টাইল স্কেল মেকানিজম

লক্ষ্য: একই $100 অ্যাড খরচ থেকে ২-৩x রেভিনিউ। কৌশলটা এক ভিজিটরকে ১টা পেজ নয়, ৫-৮টা পেজ দেখানো, প্রতিটা স্টেপে smartlink + ad impression, আর ওই ভিজিটরকে ফ্রিতে বারবার ফিরিয়ে আনা (push + email)। Monetag কেস স্টাডিগুলোর মূল অঙ্কও এটাই — কম CPC ট্রাফিক × বেশি pageview/visit × recurring free return traffic।

## ১. Related packs লুপ (pages per visit বাড়ানো)
- ভল্ট ডিটেইল পেজে "More free {category}" এখন ৩টা — বাড়িয়ে ৬টা, প্লাস আলাদা "People also grabbed" সারি (ভিন্ন ক্যাটাগরি থেকে) যাতে লুপ কখনো শেষ না হয়।
- প্রতিটা কার্ডে ফরম্যাট/লাইসেন্স চিপ + "Unlock free" বাটন, যাতে কার্ড থেকেই gate ট্রিগার হয়।
- পেজের শেষে "Next pack →" স্টিকি স্ট্রিপ (মোবাইলে) — এক ট্যাপে পরের আইটেম।

## ২. Ad density (পলিসি-সেফ)
- ডিটেইল পেজে ইনলাইন স্লট: intro-এর পর, "What you get"-এর পর, related সারির মাঝে (৩ কার্ড পর), ফুটারে — বিদ্যমান `AdSlot` + `NativeAdCard` দিয়েই।
- সব স্লট বিদ্যমান frequency cap ও `lean_mode`/campaign-safe নিয়মের ভেতরে থাকবে; মোবাইল সেশন লিমিট অপরিবর্তিত।

## ৩. Ads সরাসরি pack পেজে (হোমপেজে নয়)
- প্রতিটা vault আইটেমের জন্য UTM-সহ ল্যান্ডিং URL জেনারেটর + অ্যাডমিনে কপি-বাটন (top-20 আইটেমের রেডি লিংক লিস্ট)।
- `/vault` ইনডেক্সে ক্যাটাগরি হাব পেজ (`/vault/c/$category`) — ads-এর জন্য চওড়া ল্যান্ডিং, প্রতিটা indexable, sitemap-এ যুক্ত।

## ৪. Return traffic ফ্রি (আসল 3x)
- Monetag in-page push subscribe prompt ভল্ট পেজে soft-trigger (প্রথম unlock-এর পর, একবার/সেশন) — subscriber = পরের ভিজিট $0 cost।
- Email capture ভল্টে: "নতুন pack এলে পাঠাই" — বিদ্যমান `EmailCapture` reuse, unlock-এর পরে দেখাবে।
- ফিরে আসা ভিজিটরের জন্য `/vault?new=1` — নতুন/আন-ভিজিটেড packs আগে, localStorage-এ দেখা slug মনে রেখে।

## ৫. VIP আপসেল ভল্টে
- ৩য় unlock-এর পর ভল্ট-স্পেসিফিক VIP নাজ: "ad-free + instant unlock, no gate" — বিদ্যমান দাম ($4.99 / $20.49) ও A/B আর্ম অপরিবর্তিত।
- VIP ইউজারের জন্য gate skip আগের মতোই।

## Monetag-স্টাইল স্কেল মেকানিজম (কীভাবে $60 → বড় হয়)
- **Multi-step unlock**: এক ক্লিকে ফাইল নয় — Step 1 (gate) → Step 2 (mirror/instructions পেজ) → Step 3 (open)। এতে প্রতি ডাউনলোডে ২-৩ smartlink/impression, পলিসি ভাঙা ছাড়াই।
- **Bundle পেজ**: "Top 25 free UI kits" টাইপ collection পেজ — এক ভিজিটে ২৫টা unlock সুযোগ, ads-এর সবচেয়ে সস্তা ল্যান্ডিং।
- **Loop measurement**: প্রতি ভিজিটে pages/visit, unlock/visit, RPM ট্র্যাক করে অ্যাডমিন কার্ডে — কোন pack লাভজনক তা দেখে ad budget ওখানে।

## অতিরিক্ত ফিচার সাজেশন (চাইলে পরে)
- Vault search + filter (bounce কমায়), "Pack of the day" (daily return hook), user-submitted pack (free content growth), archetype→pack recommendation (কুইজ থেকে ভল্টে ট্রাফিক ব্রিজ)।

## টেকনিক্যাল
- ফাইল: `src/routes/vault.$slug.tsx`, `src/routes/vault.index.tsx`, নতুন `src/routes/vault.c.$category.tsx`, `src/lib/vault-catalog.ts` (related/collection হেল্পার), `src/lib/sitemap-routes.ts`, `src/components/monetization/*` reuse।
- কোনো pricing/Whop/Pixel-CAPI/A-B/tracking লজিক বদলাবে না; শুধু নতুন ইভেন্ট (`vault_unlock`, `vault_loop`) যোগ হবে।
- সব নতুন রুটে unique head() + JSON-LD; বিদ্যমান ৯১ টেস্ট পাস রাখা হবে।
