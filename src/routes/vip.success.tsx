import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { vipOrderStatus } from "@/lib/vip.functions";
import { useVip } from "@/lib/vip";
import { rememberLicense, rememberOrder } from "@/lib/vip-unlock";
import { trackFunnel } from "@/lib/funnel";

type Search = { order?: string; status?: string };

/** Post-payment page: polls the order until the Whop webhook confirms it. */
export const Route = createFileRoute("/vip/success")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const parsed: Search = {};
    if (typeof search["order"] === "string") parsed.order = search["order"];
    if (typeof search["status"] === "string") parsed.status = search["status"];
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "VIP Activated — Senses of Void" },
      {
        name: "description",
        content:
          "Your Senses of Void VIP access is active: ad-free tools, no export gate and full high-resolution reports on every device.",
      },
      { property: "og:title", content: "VIP Activated — Senses of Void" },
      {
        property: "og:description",
        content: "Ad-free tools, no export gate, every future tool included.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VipSuccessPage,
});

function VipSuccessPage() {
  const { order, status } = Route.useSearch();
  const checkOrder = useServerFn(vipOrderStatus);
  const { setVip } = useVip();
  const [state, setState] = useState<"waiting" | "done" | "failed">(
    status === "error" ? "failed" : "waiting",
  );
  const [licenseKey, setLicenseKey] = useState<string | null>(null);

  useEffect(() => {
    if (!order || state === "failed") return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const result = await checkOrder({ data: { orderId: order } });
        if (cancelled) return;
        if (result.status === "paid") {
          rememberOrder(order, result.email);
          rememberLicense(result.licenseKey);
          setVip(true, result.plan ?? "lifetime");
          setLicenseKey(result.licenseKey);
          setState("done");
          trackFunnel("vip_purchase");
          toast.success("VIP is active — ads and export gates are off.");
          return;
        }
      } catch {
        /* keep polling */
      }
      if (!cancelled && attempts < 20) window.setTimeout(poll, 3000);
      else if (!cancelled) setState("failed");
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [order, checkOrder, setVip, state]);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 text-center">
      {state === "done" ? (
        <>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-hairline bg-surface-2">
            <CheckCircle2 className="size-7 text-primary" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">VIP is active</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ads, interstitials and export gates are off on this device. Use the same email under
            &ldquo;Restore VIP&rdquo; on any other device.
          </p>
          {licenseKey ? (
            <p className="mt-4 rounded-xl border border-hairline bg-surface-2 px-3 py-2 font-mono text-xs">
              License: {licenseKey}
            </p>
          ) : null}
          <Link
            to="/tools/dark-personality"
            search={{ vip_order: order ?? "" }}
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Open my VIP dossier
          </Link>
          <Link
            to="/tools"
            className="mt-3 block text-sm font-medium text-muted-foreground underline underline-offset-4"
          >
            Browse all tools
          </Link>
        </>
      ) : state === "waiting" ? (
        <>
          <Loader2 className="mx-auto size-8 animate-spin text-primary" aria-hidden="true" />
          <h1 className="mt-5 font-display text-xl font-bold">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This usually takes a few seconds. Keep this tab open.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-xl font-bold">We couldn&rsquo;t confirm the payment</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If you were charged, VIP activates automatically within a minute — reload this page, or
            restore it with your purchase email from the VIP panel.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl border border-hairline px-5 py-3 text-sm font-semibold"
          >
            Back to the tools
          </Link>
        </>
      )}
    </main>
  );
}
