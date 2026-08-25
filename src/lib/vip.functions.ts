import { createServerFn } from "@tanstack/react-start";

/**
 * VIP checkout + access server functions.
 *
 * The price is always resolved server-side from the requested plan and offer
 * flag, so the client cannot invent a cheaper amount.
 */

export type VipPlanName = "lifetime" | "monthly";

export type CheckoutStart = {
  ok: boolean;
  reason?: string;
  orderId?: string;
  checkoutId?: string;
  planId?: string;
  amountCents?: number;
};

export type VipAccessResult = {
  active: boolean;
  plan: VipPlanName | null;
  expiresAt: string | null;
  licenseKey: string | null;
};

/** Is card checkout live on this deployment? */
export const vipGatewayStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ card: boolean }> => {
    const { whopConfigured } = await import("@/lib/whop.server");
    return { card: whopConfigured() };
  },
);

export const startVipCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      plan: VipPlanName;
      offer?: boolean;
      email?: string | null;
      sessionId?: string | null;
      toolSlug?: string | null;
      utmSource?: string | null;
    }) => ({
      plan: input?.plan === "monthly" ? ("monthly" as const) : ("lifetime" as const),
      offer: Boolean(input?.offer),
      email: input?.email ? String(input.email).trim().toLowerCase().slice(0, 200) : null,
      sessionId: input?.sessionId ? String(input.sessionId).slice(0, 80) : null,
      toolSlug: input?.toolSlug ? String(input.toolSlug).slice(0, 60) : null,
      utmSource: input?.utmSource ? String(input.utmSource).slice(0, 80) : null,
    }),
  )
  .handler(async ({ data }): Promise<CheckoutStart> => {
    const PRICES: Record<VipPlanName, { full: number; offer: number }> = {
      lifetime: { full: 1900, offer: 900 },
      monthly: { full: 499, offer: 299 },
    };
    const { createWhopCheckout, isWhopPrice, whopConfigured } = await import("@/lib/whop.server");
    if (!whopConfigured()) {
      return { ok: false, reason: "Card checkout is not connected yet." };
    }

    const price = PRICES[data.plan];
    const amountCents = data.offer ? price.offer : price.full;
    if (!isWhopPrice(amountCents)) return { ok: false, reason: "Unsupported price." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const country = getRequestHeader("cf-ipcountry") ?? null;
    const orderId = `sov_${crypto.randomUUID()}`;

    let checkout;
    try {
      checkout = await createWhopCheckout({
        amountCents,
        orderId,
        email: data.email,
        sessionId: data.sessionId,
        toolSlug: data.toolSlug,
      });
    } catch (error) {
      console.error("[vip] whop checkout failed", error);
      return { ok: false, reason: "Could not open checkout — please try again." };
    }

    await supabaseAdmin.from("vip_orders").insert({
      order_id: orderId,
      email: data.email,
      plan: data.plan,
      amount_cents: amountCents,
      status: "pending",
      provider: "whop",
      checkout_id: checkout.checkoutId,
      whop_plan_id: checkout.planId,
      session_id: data.sessionId,
      utm_source: data.utmSource,
      country,
    });

    return {
      ok: true,
      orderId,
      checkoutId: checkout.checkoutId,
      planId: checkout.planId,
      amountCents,
    };
  });

/** Polled by the success page until the webhook marks the order paid. */
export const vipOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) => ({
    orderId: String(input?.orderId ?? "").slice(0, 80),
  }))
  .handler(
    async ({
      data,
    }): Promise<{
      status: "pending" | "paid" | "unknown";
      plan: VipPlanName | null;
      email: string | null;
      licenseKey: string | null;
      expiresAt: string | null;
    }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("vip_orders")
        .select("status,plan,email")
        .eq("order_id", data.orderId)
        .maybeSingle();

      if (!row)
        return { status: "unknown", plan: null, email: null, licenseKey: null, expiresAt: null };
      const plan = (row.plan as VipPlanName) ?? "lifetime";
      if (row.status !== "paid") {
        return {
          status: "pending",
          plan,
          email: row.email ?? null,
          licenseKey: null,
          expiresAt: null,
        };
      }

      const { lookupVip } = await import("@/lib/vip-fulfil.server");
      const access = row.email ? await lookupVip(row.email) : null;
      return {
        status: "paid",
        plan,
        email: row.email ?? null,
        licenseKey: access?.licenseKey ?? null,
        expiresAt: access?.expiresAt ?? null,
      };
    },
  );

/**
 * Restore VIP on a new device.
 *
 * A typed email is NOT proof of purchase (anybody could guess a buyer's
 * address), so the license key issued on the success page is required and must
 * belong to the email supplied. The email is then only used as a second factor.
 */
export const restoreVipAccess = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; licenseKey?: string | null }) => ({
    email: String(input?.email ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 200),
    licenseKey: String(input?.licenseKey ?? "")
      .trim()
      .toLowerCase()
      .slice(0, 80),
  }))
  .handler(async ({ data }): Promise<VipAccessResult & { email: string | null }> => {
    const denied = { active: false, plan: null, expiresAt: null, licenseKey: null, email: null };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return denied;
    if (!data.licenseKey) return denied;

    const { lookupVipByLicense } = await import("@/lib/vip-fulfil.server");
    const access = await lookupVipByLicense(data.licenseKey);
    if (!access.active || (access.email ?? "") !== data.email) return denied;
    return access;
  });

/**
 * $9 Shadow Matrix add-on checkout (one-time). The price is fixed server-side;
 * the client can only ask for it, never name it.
 */
export const startMatrixCheckout = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      email?: string | null;
      sessionId?: string | null;
      toolSlug?: string | null;
      utmSource?: string | null;
    }) => ({
      email: input?.email ? String(input.email).trim().toLowerCase().slice(0, 200) : null,
      sessionId: input?.sessionId ? String(input.sessionId).slice(0, 80) : null,
      toolSlug: input?.toolSlug ? String(input.toolSlug).slice(0, 60) : null,
      utmSource: input?.utmSource ? String(input.utmSource).slice(0, 80) : null,
    }),
  )
  .handler(async ({ data }): Promise<CheckoutStart> => {
    const AMOUNT_CENTS = 900;
    const { createWhopCheckout, whopConfigured } = await import("@/lib/whop.server");
    if (!whopConfigured()) return { ok: false, reason: "Card checkout is not connected yet." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const country = getRequestHeader("cf-ipcountry") ?? null;
    const orderId = `sovm_${crypto.randomUUID()}`;

    let checkout;
    try {
      checkout = await createWhopCheckout({
        amountCents: AMOUNT_CENTS,
        orderId,
        email: data.email,
        sessionId: data.sessionId,
        toolSlug: data.toolSlug,
      });
    } catch (error) {
      console.error("[vip] matrix checkout failed", error);
      return { ok: false, reason: "Could not open checkout — please try again." };
    }

    await supabaseAdmin.from("vip_orders").insert({
      order_id: orderId,
      email: data.email,
      plan: "lifetime",
      amount_cents: AMOUNT_CENTS,
      status: "pending",
      provider: "whop",
      checkout_id: checkout.checkoutId,
      whop_plan_id: checkout.planId,
      session_id: data.sessionId,
      utm_source: data.utmSource,
      country,
    });

    return {
      ok: true,
      orderId,
      checkoutId: checkout.checkoutId,
      planId: checkout.planId,
      amountCents: AMOUNT_CENTS,
    };
  });

/**
 * Server-side entitlement check — the only thing allowed to grant VIP/Matrix.
 *
 * The client may only present proof it could not have invented: an order id
 * issued by our own checkout, or the license key printed on the success page.
 * A browser-typed email is NEVER a proof — the only email used for lookups is
 * the one the server itself resolved from that proof. Both `vip_orders` and
 * `vip_members` are written exclusively by the HMAC-verified Whop webhook, so a
 * spoofed URL (`?vip_success=true`), an edited localStorage flag or a guessed
 * buyer email grants nothing.
 */
export const verifyEntitlement = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { orderId?: string | null; email?: string | null; licenseKey?: string | null }) => ({
      orderId: input?.orderId ? String(input.orderId).slice(0, 80) : null,
      licenseKey: input?.licenseKey
        ? String(input.licenseKey).trim().toLowerCase().slice(0, 80)
        : null,
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      vip: boolean;
      matrix: boolean;
      plan: VipPlanName | null;
      expiresAt: string | null;
      email: string | null;
      licenseKey: string | null;
    }> => {
      const { resolveEntitlement } = await import("@/lib/entitlement.server");
      return resolveEntitlement(data);
    },
  );

