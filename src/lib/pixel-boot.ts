/**
 * Static Meta Pixel bootstrap.
 *
 * Meta's "Pixel not connected / not detected" warning comes from their crawler
 * looking for the official base code inside the served HTML. Our runtime loader
 * injects the pixel from JavaScript, which real browsers run but their
 * auto-detect crawler does not — so the base code is also rendered statically
 * in <head> here.
 *
 * Privacy: the snippet starts with `fbq('consent', 'revoke')`, so no cookies
 * and no events are sent until the app grants consent (see `setPixelsAllowed`
 * in `src/lib/pixels.ts`). The visitor-facing behaviour therefore stays exactly
 * the same as before — only the detectability changes.
 */

export const BOOT_META_PIXEL_ID =
  (import.meta.env["VITE_META_PIXEL_ID"] as string | undefined)?.trim() || "";

export function metaBootSnippet(id: string, consentRequired = true): string {
  // Outside the consent-regulated regions the server already knows tracking is
  // allowed, so consent is granted and the first PageView fires straight from
  // the HTML — that is what Meta's auto-detection crawler checks for.
  const consent = consentRequired
    ? `fbq('consent','revoke');fbq('init','${id}');`
    : `fbq('consent','grant');fbq('init','${id}');fbq('track','PageView');window.__sovMetaPV=1;`;
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
${consent}window.__sovMetaBooted='${id}';`;
}

