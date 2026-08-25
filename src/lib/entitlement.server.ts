/**
 * Single source of truth for "has this visitor paid?" — SERVER ONLY.
 *
 * The client may only present proof it could not have invented: an order id
 * issued by our own checkout, or the license key printed on the success page.
 * Both `vip_orders` and `vip_members` are written exclusively by the
 * HMAC-verified Whop webhook (or an admin grant), so a spoofed URL, an edited
 * localStorage flag or a guessed buyer email grants nothing.
 */

export type VipPlanName = "lifetime" | "monthly";

export type Entitlement = {
  vip: boolean;
  matrix: boolean;
  plan: VipPlanName | null;
  expiresAt: string | null;
  email: string | null;
  licenseKey: string | null;
};

export const NO_ENTITLEMENT: Entitlement = {
  vip: false,
  matrix: false,
  plan: null,
  expiresAt: null,
  email: null,
  licenseKey: null,
};

export type EntitlementProof = { orderId?: string | null; licenseKey?: string | null };

export function sanitizeProof(input: EntitlementProof): {
  orderId: string | null;
  licenseKey: string | null;
} {
  const orderId = input?.orderId ? String(input.orderId).slice(0, 80) : null;
  const licenseKey = input?.licenseKey
    ? String(input.licenseKey).trim().toLowerCase().slice(0, 80)
    : null;
  return {
    orderId: orderId && /^[a-z0-9_-]{8,80}$/i.test(orderId) ? orderId : null,
    licenseKey: licenseKey && /^[0-9a-f]{16,64}$/.test(licenseKey) ? licenseKey : null,
  };
}

/** Resolves the authoritative entitlement for a presented proof. */
export async function resolveEntitlement(input: EntitlementProof): Promise<Entitlement> {
  const { orderId, licenseKey } = sanitizeProof(input);
  if (!orderId && !licenseKey) return { ...NO_ENTITLEMENT };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { lookupVip, lookupVipByLicense } = await import("@/lib/vip-fulfil.server");

  // Server-derived only: never seeded from client input.
  let email: string | null = null;
  let vip = false;
  let matrix = false;
  let plan: VipPlanName | null = null;
  let expiresAt: string | null = null;
  let license: string | null = null;

  if (licenseKey) {
    const access = await lookupVipByLicense(licenseKey);
    if (access.active) {
      vip = true;
      plan = access.plan ?? "lifetime";
      expiresAt = access.expiresAt;
      email = access.email;
      license = access.licenseKey;
    }
  }

  if (orderId) {
    const { data: row } = await supabaseAdmin
      .from("vip_orders")
      .select("status,plan,email,order_id,amount_cents")
      .eq("order_id", orderId)
      .maybeSingle();
    if (row?.status === "paid") {
      email = email ?? row.email ?? null;
      if (row.order_id.startsWith("sovm_")) matrix = true;
      else {
        vip = true;
        plan = plan ?? (row.plan as VipPlanName) ?? "lifetime";
      }
    }
  }

  if (email) {
    const access = await lookupVip(email);
    if (access.active) {
      vip = true;
      plan = access.plan ?? plan ?? "lifetime";
      expiresAt = access.expiresAt;
      license = license ?? access.licenseKey;
    }
    // Any paid Shadow Matrix order on this email restores the add-on too.
    const { data: matrixOrders } = await supabaseAdmin
      .from("vip_orders")
      .select("order_id")
      .eq("status", "paid")
      .ilike("email", email)
      .like("order_id", "sovm_%")
      .limit(1);
    if (matrixOrders && matrixOrders.length > 0) matrix = true;
  }

  return { vip, matrix, plan, expiresAt, email, licenseKey: license };
}
