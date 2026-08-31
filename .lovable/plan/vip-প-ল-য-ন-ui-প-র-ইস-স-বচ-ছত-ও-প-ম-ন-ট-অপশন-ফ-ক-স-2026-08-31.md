# VIP প্ল্যান UI, প্রাইসিং স্বচ্ছতা ও পেমেন্ট অপশন ফিক্স

## ১. VIP active স্ক্রিন প্রফেশনাল করা
আজকের অবস্থা: VIP হলে শুধু "Monthly VIP" কনফার্মেশন দেখায় — কত দিন বাকি নেই, lifetime-এ যাওয়ার কোনো পথ নেই।

- মান্থলি VIP-এর জন্য "Renews 30 Sep · 29 days left" ধরনের রিমেইনিং-ডে লাইন + সরু প্রোগ্রেস বার।
- একটি শান্ত "Upgrade to Lifetime — $19 one payment, never renews" আপগ্রেড রো (কোনো discount/countdown নয়)। লাইফটাইম VIP-দের এটা দেখাবে না।
- প্ল্যান UI সাধারণ SaaS প্যাটার্নে: প্ল্যান নাম, স্ট্যাটাস ব্যাজ, বিলিং লাইন, entitlement লিস্ট, একটি প্রাইমারি অ্যাকশন — একই কম্পোনেন্ট offer card ও VIP modal দুই জায়গায়।

## ২. অফার প্রাইস বনাম রেগুলার প্রাইস (সত্যিকারের one-time offer)
আজকের অবস্থা: ডিসকাউন্ট ফ্ল্যাগ `sessionStorage`-এ থাকে, তাই নতুন সেশনে আবার $1.99/$9 ফিরে আসে — "one-time" দাবি মিথ্যা হয়ে যায়।

- ফ্ল্যাগ persistent স্টোরেজে নেওয়া হবে, সাথে `granted`/`used` স্টেট: অফার একবারই দেখানো হবে; চেকআউট শুরু বা অফার এক্সপায়ার হলে ভিজিটর স্থায়ীভাবে রেগুলার প্রাইসে ফিরবে।
- সব সেলিং সারফেসে একই ফরম্যাট: রেগুলার প্রাইস strike-through + অফার প্রাইস + "one-time offer, won't return" লাইন। অফার না থাকলে শুধু রেগুলার প্রাইস, কোনো ফেক অ্যাংকর নয়।
- সার্ভার-সাইড দামের তালিকা অপরিবর্তিত থাকবে (ক্লায়েন্ট সস্তা দাম কিনতে পারবে না)।

## ৩. $1.99 দিয়েছেন, Whop-এ $1.51 — এটা চার্জ ভুল নয়
ডেটাবেজে ওই অর্ডার `amount_cents = 199`, status paid — অর্থাৎ কার্ডে $1.99-ই কাটা হয়েছে। Whop-এ দেখানো $1.51 হলো প্রসেসিং ফি বাদ দেওয়ার পর **নেট পেআউট** (~$0.48 fee)।

- Admin → Orders-এ প্রতিটি অর্ডারের পাশে "gross $1.99 · est. fee · net" কলাম যোগ করা হবে, যাতে ভবিষ্যতে বিভ্রান্তি না হয়।
- ছোট টিকিটে ফি অনুপাত বেশি ($1.99-এ ~24%)। তাই সুপারিশ: এন্ট্রি প্রাইস রেগুলার $2.99 রাখুন, $1.99 শুধু one-time exit offer হিসেবে — উপরের ২ নম্বর কাজটাই সেটা নিশ্চিত করে।

## ৪. চেকআউটে Card/ACH ছাড়া অন্য অপশন ফিরিয়ে আনা
কারণ: monthly প্ল্যান Whop-এ `plan_type: renewal` — সাবস্ক্রিপশনে Whop শুধু Card ও ACH দেয়। লাইফটাইম (`one_time`) প্ল্যানে Apple Pay / Google Pay / crypto আসে।

- চেকআউট পেজে প্ল্যান-সচেতন লাইন: monthly হলে "Apple Pay, Google Pay ও crypto লাইফটাইম প্ল্যানে পাওয়া যায়" + এক ট্যাপে লাইফটাইম চেকআউটে সুইচ করার বাটন।
- লাইফটাইম সেশনে wallet/crypto সাপোর্ট স্পষ্ট আইকন-রো দিয়ে দেখানো হবে; crypto (SOL/USDC) বাটন আগের মতোই থাকবে।
- অফার কার্ড ও মডালের কপি ঠিক করা হবে যাতে কোন প্ল্যানে কোন পেমেন্ট মেথড চলে সেটা কেনার আগেই বোঝা যায়।

## টেকনিক্যাল নোট
- `src/lib/vip-offer.ts`: sessionStorage → localStorage + `used` স্টেট, নতুন `useVipOffer()` রিটার্ন শেপ।
- `src/lib/vip-pricing.ts`: `regular*` বনাম `offer*` ফিল্ড আলাদা করে এক্সপোজ।
- `src/components/monetization/VipStatusCard.tsx`: days-left, progress, lifetime upgrade CTA।
- `src/components/monetization/VipModal.tsx`, `VipOfferCard.tsx`, `LockedReport.tsx`, `ExitIntentOffer.tsx`: এক ফরম্যাটে প্রাইস প্রেজেন্টেশন।
- `src/routes/vip.checkout.tsx`: plan-aware payment-method ব্যাখ্যা ও lifetime সুইচ।
- `src/routes/admin.orders.tsx`: gross/fee/net কলাম (ডিসপ্লে-অনলি হিসাব)।
- Whop প্ল্যান শেপ, webhook, Pixel/CAPI dedupe, A/B আর্ম — কিছুই বদলাবে না।
