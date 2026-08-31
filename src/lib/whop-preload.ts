/**
 * Warms up the hosted checkout before the buyer asks for it.
 *
 * The checkout iframe is the biggest drop-off point on slow Gulf mobile
 * networks: the loader script is only fetched once the buyer is already on
 * /vip/checkout, so they stare at a spinner while it downloads. Pulling the
 * script (and a DNS/TLS handshake to the provider) as soon as the VIP offer is
 * on screen removes that wait almost entirely, and costs nothing for the
 * visitors who never click.
 */

let warmed = false;

export function preloadWhopCheckout() {
  if (typeof document === "undefined" || warmed) return;
  warmed = true;

  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = "https://js.whop.com";
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);

  if (document.getElementById("whop-checkout-loader")) return;
  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "script";
  preload.href = "https://js.whop.com/static/checkout/loader.js";
  document.head.appendChild(preload);
}
