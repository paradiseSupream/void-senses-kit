# Meta ট্র্যাকিং সম্পূর্ণ করা: Pixel + CAPI + দেশভিত্তিক ফানেল

লক্ষ্য: Meta-র detection ও diagnostics পাস করা, Purchase ইভেন্ট নির্ভরযোগ্যভাবে (webhook থেকে) পাঠানো, দেশভিত্তিক ফানেল দেখা, এবং Gulf চেকআউটে ড্রপ-অফ কমানো।

## এখনকার অবস্থা (কোড পড়ে যাচাই করা)

- `<head>`-এ static Meta base code আছে (`src/lib/pixel-boot.ts` + `__root.tsx`), তবে সেটি শুধু `VITE_META_PIXEL_ID` env থেকে আসে — অ্যাডমিন প্যানেলে সেভ করা pixel id ব্যবহার হয় না।
- Purchase ইভেন্ট শুধু `vip.success` পেজে ব্রাউজার থেকে ফায়ার হয়। ইউজার Whop পেমেন্টের পর সাইটে ফেরত না এলে Meta কোনো Purchase পায় না।
- Whop webhook (`api/public/whop-webhook.ts`) VIP grant করে, কিন্তু কোনো CAPI Purchase পাঠায় না।
- `vip_orders`-এ country/session আছে, কিন্তু `fbp` / `fbc` / `event_id` সংরক্ষিত নয় — তাই সার্ভার Purchase-এর attribution ও dedup দুর্বল হবে।
- অ্যাডমিনে country ROI কার্ড আছে, কিন্তু PageView→ViewContent→AddToCart→Checkout→Purchase এই ধাপগুলোর দেশভিত্তিক ফানেল ভিউ নেই।

## যা করা হবে

### ১. Pixel detection নিশ্চিত করা
- সার্ভার-সাইডে pixel id resolve করা হবে: অ্যাডমিন সেটিংস → env fallback, যাতে static base code সবসময় সঠিক id নিয়ে HTML-এ থাকে।
- Base code `consent: revoke` দিয়েই শুরু থাকবে (কনসেন্ট নীতি অপরিবর্তিত), শুধু detectability বাড়বে।

### ২. Purchase: webhook-ভিত্তিক, ডিডুপ্লিকেটেড
- অর্ডার তৈরির সময় `vip_orders`-এ সংরক্ষণ: স্থিতিশীল `event_id` (purchase:orderId), ব্রাউজারের `fbp`/`fbc`, country, user agent।
- Whop webhook পেমেন্ট সফল হলে সরাসরি Meta CAPI-তে Purchase পাঠাবে (value, currency, hashed email/country, fbp/fbc সহ) এবং `tracking_events`-এ লগ করবে।
- `vip.success` পেজের ব্রাউজার Purchase একই `event_id` ব্যবহার করবে → Meta দুটোকে এক conversion হিসেবে মিলিয়ে নেবে; বিদ্যমান `claimServerEvent` ডুপ্লিকেট সার্ভার পোস্ট আটকাবে।
- Checkout ধাপ পরিষ্কার করা: `InitiateCheckout` শুধু আসল চেকআউট শুরুতে, `AddToCart` গেট দেখানোর সময় — প্রতিটি সেশনে একবার।

### ৩. দেশভিত্তিক ফানেল ড্যাশবোর্ড
- Admin → Attribution-এ নতুন কার্ড: সারি = UAE, SA, QA, KW, US (+ Others), কলাম = PageView, ViewContent, AddToCart, Checkout, Purchase, সাথে প্রতি ধাপের ড্রপ-অফ %।
- ডেটা আসবে `tracking_events` (country সহ, ইতিমধ্যেই লগ হয়) থেকে; কোনো নতুন টেবিল লাগবে না।

### ৪. Gulf চেকআউট ড্রপ-অফ কমানো
- চেকআউট এম্বেড লোড না হলে/ব্যর্থ হলে এক-ক্লিক "Retry / Open secure checkout" ফলব্যাক লিংক, এবং টাইমআউটে অটো-ফলব্যাক।
- ওয়ালেট-ফার্স্ট বার্তা (Apple Pay / card) ও পেন্ডিং অর্ডারে ফিরে আসার সহজ পথ — অতিরিক্ত ফর্ম ফিল্ড নয়।

### ৫. End-to-end যাচাই
- Playwright দিয়ে: হোম → কুইজ → রেজাল্ট → VIP গেট → চেকআউট শুরু, প্রতিটি ধাপে `fbq` কল ও `/api/public/capi` রিকোয়েস্ট নিশ্চিত করা।
- Whop webhook-এ স্বাক্ষরযুক্ত টেস্ট পেলোড দিয়ে Purchase পাথ যাচাই (test event code সাময়িকভাবে চালু করে Meta Test Events-এ দেখা, পরে বন্ধ)।
- `tracking_events` লগে duplicate/failed এন্ট্রি না থাকা পর্যন্ত ঠিক করা হবে।

## টেকনিক্যাল নোট

- ফাইল: `src/lib/pixel-boot.ts`, `src/routes/__root.tsx`, `src/lib/vip.functions.ts`, `src/routes/api/public/whop-webhook.ts`, নতুন `src/lib/meta-capi.server.ts` (শেয়ার্ড CAPI sender), `src/lib/ads-intel.server.ts`, নতুন `src/components/admin/GeoFunnelCard.tsx`, `src/routes/vip.checkout.tsx`, `src/lib/pixels.ts`।
- মাইগ্রেশন: `vip_orders`-এ `fbp`, `fbc`, `event_id`, `user_agent` কলাম যোগ (nullable), গ্রান্ট অপরিবর্তিত থাকবে।
- CSP report-only এবং কনসেন্ট জিও-নীতি অপরিবর্তিত থাকবে।
