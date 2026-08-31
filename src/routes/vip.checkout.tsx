import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Bitcoin, Loader2, ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/brand/LogoMark";
import { track } from "@/lib/monetization";
import { useVip } from "@/lib/vip";
import { vipOrderStatus } from "@/lib/vip.functions";
import { useDirectCheckout } from "@/lib/use-direct-checkout";
import { VIP_LIFETIME_CENTS, usd } from "@/lib/vip-pricing";
import { isMonthlyAmount } from "@/lib/vip-prices";
import { markVipOfferUsed } from "@/lib/vip-offer";


type Search = { s?: string; p?: string; order?: string; amount?: string; m?: string };

/**
 * Card checkout page — Whop's embedded checkout mounts here, so the buyer never
 * leaves sensesofvoid.app. Prices and sessions are created server-side.
 */
export const Route = createFileRoute("/vip/checkout")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed: Search = {};
    if (typeof search["s"] === "string") parsed.s = search["s"];
    if (typeof search["p"] === "string") parsed.p = search["p"];
    if (typeof search["order"] === "string") parsed.order = search["order"];
    // The router serialises string search params as JSON, so `amount` can
    // arrive quoted (for example "349"). Unquoting keeps the displayed price — and the
    // monthly-plan copy — from silently falling back to NaN.
    const rawAmount = search["amount"];
    if (typeof rawAmount === "string" || typeof rawAmount === "number") {
      const digits = String(rawAmount).replace(/\D/g, "");
      if (digits) parsed.amount = digits;
    }
    if (typeof search["m"] === "string") parsed.m = search["m"];
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "Secure VIP Checkout — Senses of Void" },
      {
        name: "description",
        content:
          "Complete your Senses of Void VIP purchase with card, Apple Pay, Google Pay or a local payment method — ad-free tools and unlimited exports.",
      },
      { property: "og:title", content: "Secure VIP Checkout — Senses of Void" },
      {
        property: "og:description",
        content: "Ad-free tools, no export gate, high-resolution reports. Pay securely by card.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VipCheckoutPage,
});

function VipCheckoutPage() {
  const { s, p, order, amount, m } = Route.useSearch();
  const { openVipModal } = useVip();
  const navigate = useNavigate();
  const checkOrder = useServerFn(vipOrderStatus);
  const { busy: busyLifetime, go: goLifetime } = useDirectCheckout();

  // Whop's embed sometimes paints its success tick without ever firing the
  // return-url redirect (in-app browsers block the top-level navigation). We
  // poll the order ourselves so a paid buyer flips to VIP within seconds.
  useEffect(() => {
    if (!order || m === "1") return;
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      try {
        const result = await checkOrder({ data: { orderId: order } });
        if (cancelled) return;
        if (result.status === "paid") {
          // Burn the one-time discount only once money actually cleared.
          markVipOfferUsed();
          track({ event_type: "funnel", slot: "checkout_autoswitch", format: "poll" });
          void navigate({ to: "/vip/success", search: { order } });
          return;
        }
      } catch {
        /* keep polling */
      }
      if (!cancelled && attempts < 90) window.setTimeout(tick, 2500);
    };
    const first = window.setTimeout(tick, 4000);
    // Whop posts a completion message from the iframe — jump immediately on it.
    const onMessage = (event: MessageEvent) => {
      if (typeof event.origin === "string" && !event.origin.includes("whop.com")) return;
      const raw = typeof event.data === "string" ? event.data : JSON.stringify(event.data ?? "");
      if (/complete|success|succeeded|paid/i.test(raw)) void tick();
    };
    window.addEventListener("message", onMessage);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.removeEventListener("message", onMessage);
    };
  }, [order, m, checkOrder, navigate]);

  // The embedded checkout reads its data-attributes when the loader boots, so
  // the mount target is rendered only once the real return URL is known.
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Slow Gulf mobile networks routinely need 4-8s for the embed's own bundle
  // plus its first paint. The old 2.5s cut-off reported a "timeout" for frames
  // that were still perfectly on their way, which is why 42% of checkouts
  // looked broken while the buyer actually saw a form. We now wait 9s before
  // declaring failure, still record a soft "slow" mark at 3s for diagnostics,
  // and recover automatically if the frame lands late.
  const [slow, setSlow] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    if (!origin) return;
    track({ event_type: "impression", slot: "vip_checkout_page", format: "checkout" });
    const startedAt = performance.now();
    let loaded = false;
    let timedOut = false;
    const mount = document.querySelector("[data-whop-checkout-plan-id]");
    const observeFrame = () => {
      const frame = mount?.querySelector("iframe");
      if (!frame || loaded) return Boolean(frame);
      loaded = true;
      setEmbedded(true);
      track({
        event_type: "funnel",
        slot: timedOut ? "checkout_embed_recovered" : "checkout_embed_loaded",
        format: "whop",
        // Real mount latency, so the timeout budget can be tuned from data
        // instead of guesswork.
        metric_value: Math.round(performance.now() - startedAt),
      });
      return true;
    };
    const observer = new MutationObserver(() => observeFrame());
    if (mount && !observeFrame()) observer.observe(mount, { childList: true, subtree: true });
    const softTimer = window.setTimeout(() => {
      if (!loaded) track({ event_type: "funnel", slot: "checkout_embed_slow", format: "whop" });
    }, 3000);
    const timer = window.setTimeout(() => {
      if (observeFrame()) return;
      timedOut = true;
      setSlow(true);
      track({ event_type: "funnel", slot: "checkout_embed_timeout", format: "whop" });
    }, 9000);

    // Whop's loader boots exactly once: it guards on `window.wco` and its
    // checkout bundle only scans the DOM it saw at boot. After any client-side
    // navigation (offer → checkout, "Retry in-page form", back-and-forth) the
    // bundle is already loaded, so the freshly rendered mount node is never
    // picked up and the frame can never appear — the single biggest source of
    // "checkout_embed_timeout". Tearing the loader state down and re-injecting
    // it forces a full re-initialisation for every checkout page view.
    const w = window as unknown as { wco?: unknown };
    if (w.wco) {
      delete w.wco;
      document
        .querySelectorAll('script[src*="js.whop.com/static/checkout"]')
        .forEach((node) => node.remove());
      track({ event_type: "funnel", slot: "checkout_embed_reinit", format: "whop" });
    }
    document.getElementById("whop-checkout-loader")?.remove();
    const script = document.createElement("script");
    script.id = "whop-checkout-loader";
    // Cache-busted per mount so the browser re-executes the loader instead of
    // treating the identical URL as an already-evaluated module.
    script.src = `https://js.whop.com/static/checkout/loader.js?v=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
      setSlow(true);
      track({ event_type: "funnel", slot: "checkout_loader_failed", format: "whop" });
    };
    document.body.appendChild(script);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(softTimer);
    };
  }, [origin]);

  // The Shadow Matrix add-on returns straight into the dossier; VIP plans go
  // through /vip/success so the webhook can be polled and a license shown.
  const returnUrl = origin
    ? m === "1"
      ? `${origin}/tools/dark-personality?matrix_order=${encodeURIComponent(order ?? "")}`
      : `${origin}/vip/success?order=${encodeURIComponent(order ?? "")}`
    : "";

  const price = amount ? `$${(Number(amount) / 100).toFixed(2)}` : null;
  const isMonthly = isMonthlyAmount(amount);
  const hostedCheckoutUrl = s && p
    ? `https://whop.com/checkout/${encodeURIComponent(p)}?session=${encodeURIComponent(s)}`
    : null;

  // When the embed never paints we must not leave a 560px black hole on the
  // screen — collapse it and lead with the hosted-checkout button instead.
  const embedFailed = slow && !embedded;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 pb-32">
      <Link to="/" className="inline-flex items-center gap-2">
        <LogoMark className="size-7" />
        <span className="font-display text-sm font-semibold">Senses of Void</span>
      </Link>

      <h1 className="mt-6 font-display text-2xl font-bold">Secure checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {price ? `${price} — ` : ""}card, Apple&nbsp;Pay, Google&nbsp;Pay and bank (ACH) in 195
        countries, or pay in crypto below. VIP unlocks the moment the payment clears.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        The displayed total already includes estimated payment processing — no extra app fee is
        added at checkout.
      </p>
      {isMonthly ? (
        <div className="glass mt-4 rounded-2xl border border-primary/25 p-3">
          <p className="text-xs text-muted-foreground">
            Monthly passes are billed as a subscription, so Whop shows card and bank (ACH) only.
            Apple&nbsp;Pay, Google&nbsp;Pay and crypto are available on the one-payment Lifetime
            plan.
          </p>
          <button
            type="button"
            disabled={busyLifetime}
            onClick={() => {
              track({ event_type: "click", slot: "vip_checkout_switch_lifetime", format: "lifetime" });
              void goLifetime("lifetime");
            }}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-60"
          >
            {busyLifetime ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Switch to Lifetime VIP · {usd(VIP_LIFETIME_CENTS)} one payment
          </button>
        </div>
      ) : null}


      {/* What the buyer is paying for, restated at the moment of payment —
          the cheapest anti-drop-off move on a hosted checkout page. */}
      <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
        {[
          "Every ad and export gate removed instantly",
          isMonthly ? "Monthly access — cancel anytime" : "One payment — lifetime access",
          "Access restores on any device with your purchase email",
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      {hostedCheckoutUrl && embedFailed ? (
        <div className="glass mt-6 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            Your secure payment page is ready. Tap below to pay {price ?? ""} — your order stays
            the same.
          </p>
          <a
            href={hostedCheckoutUrl}
            onClick={() =>
              track({ event_type: "click", slot: "vip_checkout_fallback", format: "hosted" })
            }
            className="mt-3 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Pay securely {price ? `— ${price}` : ""}
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 block w-full rounded-xl border border-hairline px-4 py-2 text-center text-sm font-medium"
          >
            Retry in-page form
          </button>
        </div>
      ) : null}

      {s && p ? (
        <div
          className={
            embedFailed ? "hidden" : "glass mt-6 overflow-hidden rounded-2xl p-2"
          }
        >
          {origin ? (
            <div
              data-whop-checkout-plan-id={p}
              data-whop-checkout-session={s}
              data-whop-checkout-return-url={returnUrl}
              data-whop-checkout-theme="dark"
              className="min-h-[560px] w-full"
            />
          ) : (
            <div className="grid min-h-[240px] w-full place-items-center text-sm text-muted-foreground">
              Loading secure checkout…
            </div>
          )}
        </div>
      ) : (
        <div className="glass mt-6 rounded-2xl p-6 text-sm text-muted-foreground">
          This checkout link has expired. Open the VIP panel again to start a fresh secure checkout.
        </div>
      )}

      {hostedCheckoutUrl && !embedFailed ? (
        <a
          href={hostedCheckoutUrl}
          onClick={() => track({ event_type: "click", slot: "vip_checkout_hosted", format: embedded ? "embed_ready" : "embed_loading" })}
          className="mt-3 block text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Payment form not opening? Use secure hosted checkout
        </a>
      ) : null}

      {/* Card not an option for everyone in the Gulf/South Asia — crypto stays
          one tap away instead of only living inside the VIP modal. */}
      <button
        type="button"
        onClick={() => {
          track({ event_type: "click", slot: "vip_checkout_crypto", format: "crypto" });
          openVipModal("monthly");
          window.setTimeout(() => window.dispatchEvent(new Event("sov:vip-crypto")), 0);
        }}
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        <Bitcoin className="size-3.5" aria-hidden="true" /> Pay with crypto instead (SOL / USDC)
      </button>




      <p className="mt-4 text-xs text-muted-foreground">
        Payments are processed by Whop. We never see or store your card details.{" "}
        <Link to="/terms" className="underline underline-offset-4">
          Terms
        </Link>{" "}
        ·{" "}
        <Link to="/privacy" className="underline underline-offset-4">
          Privacy
        </Link>
      </p>
    </main>
  );
}
