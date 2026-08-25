/**
 * VIP fulfilment (server only).
 *
 * Single place that turns a paid order into VIP access, so card (Whop), crypto
 * and manual admin grants all end up in the same shape.
 */

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export type VipPlanName = "lifetime" | "monthly";

export type VipGrant = {
  email: string;
  plan: VipPlanName;
  amountCents: number;
  paymentRef: string | null;
  provider: string;
};

export type VipAccess = {
  active: boolean;
  plan: VipPlanName | null;
  expiresAt: string | null;
  licenseKey: string | null;
};

/** Grants (or extends) VIP for an email address. Idempotent per email. */
export async function grantVip(grant: VipGrant): Promise<VipAccess> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = grant.email.trim().toLowerCase();
  const expiresAt = grant.plan === "monthly" ? new Date(Date.now() + MONTH_MS).toISOString() : null;

  const { data: existing } = await supabaseAdmin
    .from("vip_members")
    .select("id,plan,expires_at,license_key")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    // Monthly renewals stack on the remaining time; lifetime never expires.
    const base =
      grant.plan === "monthly" && existing.expires_at && new Date(existing.expires_at).getTime() > Date.now()
        ? new Date(existing.expires_at).getTime()
        : Date.now();
    const nextExpiry =
      existing.plan === "lifetime" || grant.plan === "lifetime"
        ? null
        : new Date(base + MONTH_MS).toISOString();

    const { data: row } = await supabaseAdmin
      .from("vip_members")
      .update({
        active: true,
        plan: existing.plan === "lifetime" ? "lifetime" : grant.plan,
        expires_at: nextExpiry,
        amount_cents: grant.amountCents,
        payment_ref: grant.paymentRef,
        provider: grant.provider,
        source: grant.provider,
      })
      .eq("id", existing.id)
      .select("plan,expires_at,license_key")
      .single();

    return {
      active: true,
      plan: (row?.plan as VipPlanName) ?? grant.plan,
      expiresAt: row?.expires_at ?? null,
      licenseKey: row?.license_key ?? existing.license_key ?? null,
    };
  }

  const { data: row, error } = await supabaseAdmin
    .from("vip_members")
    .insert({
      email,
      plan: grant.plan,
      active: true,
      expires_at: expiresAt,
      amount_cents: grant.amountCents,
      payment_ref: grant.paymentRef,
      provider: grant.provider,
      source: grant.provider,
    })
    .select("plan,expires_at,license_key")
    .single();
  if (error) throw new Error(error.message);

  return {
    active: true,
    plan: (row?.plan as VipPlanName) ?? grant.plan,
    expiresAt: row?.expires_at ?? null,
    licenseKey: row?.license_key ?? null,
  };
}

/**
 * Cross-device restore proof: the license key is a server-generated secret that
 * only the buyer ever sees, so it — not a typed email — is what authorises a
 * restore. Returns the owning email so callers never trust a client-supplied one.
 */
export async function lookupVipByLicense(
  licenseKey: string,
): Promise<VipAccess & { email: string | null }> {
  const key = licenseKey.trim().toLowerCase();
  const miss = { active: false, plan: null, expiresAt: null, licenseKey: null, email: null };
  if (!/^[0-9a-f]{16,64}$/.test(key)) return miss;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("vip_members")
    .select("email,plan,active,expires_at,license_key")
    .eq("license_key", key)
    .maybeSingle();

  if (!row || !row.active) return miss;
  const expired = Boolean(row.expires_at && new Date(row.expires_at).getTime() < Date.now());
  if (expired) return miss;
  return {
    active: true,
    plan: (row.plan as VipPlanName) ?? "lifetime",
    expiresAt: row.expires_at ?? null,
    licenseKey: row.license_key ?? null,
    email: row.email ?? null,
  };
}

/** Current VIP access for an email (expired monthly passes read as inactive). */
export async function lookupVip(email: string): Promise<VipAccess> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("vip_members")
    .select("plan,active,expires_at,license_key")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle();

  if (!row || !row.active) return { active: false, plan: null, expiresAt: null, licenseKey: null };
  const expired = Boolean(row.expires_at && new Date(row.expires_at).getTime() < Date.now());
  return {
    active: !expired,
    plan: expired ? null : ((row.plan as VipPlanName) ?? "lifetime"),
    expiresAt: row.expires_at ?? null,
    licenseKey: expired ? null : (row.license_key ?? null),
  };
}
