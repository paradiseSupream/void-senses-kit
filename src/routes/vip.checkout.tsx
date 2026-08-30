import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { LogoMark } from "@/components/brand/LogoMark";

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
    if (typeof search["amount"] === "string") parsed.amount = search["amount"];
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

  useEffect(() => {
    if (!origin) return;
    const timer = window.setTimeout(() => {
      const frame = document.querySelector("[data-whop-checkout-plan-id] iframe");
      if (!frame) setSlow(true);
    }, 6000);
    if (!document.getElementById("whop-checkout-loader")) {
      const script = document.createElement("script");
      script.id = "whop-checkout-loader";
      script.src = "https://js.whop.com/static/checkout/loader.js";
      script.async = true;
      script.defer = true;
      script.onerror = () => setSlow(true);
      document.body.appendChild(script);
    }
    return () => window.clearTimeout(timer);
  }, [origin]);

  // The $9 Shadow Matrix add-on returns straight into the dossier; VIP plans go
  // through /vip/success so the webhook can be polled and a license shown.
  const returnUrl = origin
    ? m === "1"
      ? `${origin}/tools/dark-personality?matrix_order=${encodeURIComponent(order ?? "")}`
      : `${origin}/vip/success?order=${encodeURIComponent(order ?? "")}`
    : "";

  const price = amount ? `$${(Number(amount) / 100).toFixed(2)}` : null;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2">
        <LogoMark className="size-7" />
        <span className="font-display text-sm font-semibold">Senses of Void</span>
      </Link>

      <h1 className="mt-6 font-display text-2xl font-bold">Secure checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {price ? `${price} — ` : ""}card, Apple&nbsp;Pay, Google&nbsp;Pay and local methods in 195
        countries. VIP unlocks the moment the payment clears.
      </p>

      {s && p ? (
        <div className="glass mt-6 overflow-hidden rounded-2xl p-2">
          {origin ? (
            <div
              data-whop-checkout-plan-id={p}
              data-whop-checkout-session={s}
              data-whop-checkout-return-url={returnUrl}
              data-whop-checkout-theme="dark"
              className="min-h-[560px] w-full"
            />
          ) : (
            <div className="grid min-h-[560px] w-full place-items-center text-sm text-muted-foreground">
              Loading secure checkout…
            </div>
          )}
        </div>
      ) : (
        <div className="glass mt-6 rounded-2xl p-6 text-sm text-muted-foreground">
          This checkout link has expired. Open the VIP panel again to start a fresh secure checkout.
        </div>
      )}

      {s && p && slow ? (
        <div className="glass mt-4 rounded-2xl p-4 text-sm">
          <p className="text-muted-foreground">
            Taking too long on your network? Open the same secure payment page directly — your
            order stays the same.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://whop.com/checkout/${encodeURIComponent(p)}?session=${encodeURIComponent(s)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Open secure checkout
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
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
