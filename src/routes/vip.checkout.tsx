import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/brand/LogoMark";
import { track } from "@/lib/monetization";

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
    // arrive quoted ("299"). Unquoting keeps the displayed price — and the
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
  // The embedded checkout reads its data-attributes when the loader boots, so
  // the mount target is rendered only once the real return URL is known.
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Slow Gulf mobile networks sometimes never finish the embed. After 6s we
  // surface a one-tap hosted-checkout fallback instead of a dead frame.
  const [slow, setSlow] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    if (!origin) return;
    track({ event_type: "impression", slot: "vip_checkout_page", format: "checkout" });
    const mount = document.querySelector("[data-whop-checkout-plan-id]");
    const observeFrame = () => {
      const frame = mount?.querySelector("iframe");
      if (!frame) return false;
      setEmbedded(true);
      track({ event_type: "funnel", slot: "checkout_embed_loaded", format: "whop" });
      return true;
    };
    const observer = new MutationObserver(() => observeFrame());
    if (mount && !observeFrame()) observer.observe(mount, { childList: true, subtree: true });
    const timer = window.setTimeout(() => {
      const frame = document.querySelector("[data-whop-checkout-plan-id] iframe");
      if (!frame) {
        setSlow(true);
        track({ event_type: "funnel", slot: "checkout_embed_timeout", format: "whop" });
      }
    }, 2500);

    if (!document.getElementById("whop-checkout-loader")) {
      const script = document.createElement("script");
      script.id = "whop-checkout-loader";
      script.src = "https://js.whop.com/static/checkout/loader.js";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setSlow(true);
        track({ event_type: "funnel", slot: "checkout_loader_failed", format: "whop" });
      };
      document.body.appendChild(script);
    }
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [origin]);

  // The $9 Shadow Matrix add-on returns straight into the dossier; VIP plans go
  // through /vip/success so the webhook can be polled and a license shown.
  const returnUrl = origin
    ? m === "1"
      ? `${origin}/tools/dark-personality?matrix_order=${encodeURIComponent(order ?? "")}`
      : `${origin}/vip/success?order=${encodeURIComponent(order ?? "")}`
    : "";

  const price = amount ? `$${(Number(amount) / 100).toFixed(2)}` : null;
  const isMonthly = amount === "199" || amount === "299";
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
        {price ? `${price} — ` : ""}card, Apple&nbsp;Pay, Google&nbsp;Pay and local methods in 195
        countries. VIP unlocks the moment the payment clears.
      </p>

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
