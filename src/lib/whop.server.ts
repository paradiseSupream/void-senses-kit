/**
 * Whop payment gateway (server only).
 *
 * Whop is the card / international checkout for VIP. Every plan the app sells
 * ($19 lifetime, $9 exit-offer lifetime, $2.99 monthly, $1.99 monthly offer)
 * is created as an inline Whop plan on a fresh checkout configuration, so no
 * plan IDs have to be maintained by hand and the price is always decided on the
 * server — a tampered client can never buy VIP cheaper than the real offer.
 */

import { createHmac, timingSafeEqual } from "crypto";

const API_BASE = "https://api.whop.com/api/v1";

/** Prices the server accepts, mapped to their Whop plan shape. */
export const WHOP_PRICES = {
  1900: { plan: "lifetime", type: "one_time" },
  900: { plan: "lifetime", type: "one_time" },
  199: { plan: "monthly", type: "renewal" },
  299: { plan: "monthly", type: "renewal" },
} as const;

export type WhopPriceCents = keyof typeof WHOP_PRICES;

export function isWhopPrice(cents: number): cents is WhopPriceCents {
  return Object.prototype.hasOwnProperty.call(WHOP_PRICES, String(cents));
}

export function whopEnv() {
  return {
    apiKey: process.env["WHOP_API_KEY"] ?? "",
    accountId: process.env["WHOP_ACCOUNT_ID"] ?? "",
    webhookSecret: process.env["WHOP_WEBHOOK_SECRET"] ?? "",
  };
}

/** True when card checkout can actually be created. */
export function whopConfigured(): boolean {
  const env = whopEnv();
  return Boolean(env.apiKey && env.accountId);
}

export type WhopCheckout = { checkoutId: string; planId: string };

/**
 * Creates a checkout configuration (a one-shot checkout session) for one order.
 * The returned ids feed Whop's embedded checkout on our own /vip/checkout page.
 */
export async function createWhopCheckout(input: {
  amountCents: WhopPriceCents;
  orderId: string;
  email: string | null;
  sessionId: string | null;
  toolSlug: string | null;
}): Promise<WhopCheckout> {
  const { apiKey, accountId } = whopEnv();
  if (!apiKey || !accountId) throw new Error("Whop is not configured yet.");

  const shape = WHOP_PRICES[input.amountCents];
  const title = shape.plan === "monthly" ? "Senses of Void Monthly VIP" : "Senses of Void Lifetime VIP";
  const body: Record<string, unknown> = {
    company_id: accountId,
    currency: "usd",
    mode: "payment",
    plan: {
      company_id: accountId,
      currency: "usd",
      // Whop treats `initial_price` as a joining fee that is charged ON TOP of
      // the first renewal, so a $1.99 monthly plan with both fields set billed
      // $3.98 today. Recurring plans must therefore charge nothing extra up
      // front — the renewal price alone is the amount due today.
      initial_price: shape.type === "renewal" ? 0 : input.amountCents / 100,
      plan_type: shape.type,
      title,
      product: {
        external_identifier: "senses-of-void-vip",
        title: "Senses of Void VIP",
        headline: "Ad-free tools, full reports and high-resolution exports.",
        description: "VIP access for Senses of Void tools.",
        visibility: "hidden",
      },
      ...(shape.type === "renewal" ? { renewal_price: input.amountCents / 100, billing_period: 30 } : {}),
    },
    metadata: {
      order_id: input.orderId,
      plan: shape.plan,
      email: input.email ?? "",
      session_id: input.sessionId ?? "",
      tool_slug: input.toolSlug ?? "",
    },
  };

  const res = await fetch(`${API_BASE}/checkout_configurations`, {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Whop checkout failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = JSON.parse(text) as { id?: string; plan?: { id?: string } };
  if (!json.id || !json.plan?.id) throw new Error("Whop returned an unexpected checkout payload.");
  return { checkoutId: json.id, planId: json.plan.id };
}

export type WhopPaymentState = {
  /** paid = money actually captured; open = buyer never finished; failed = declined. */
  state: "paid" | "open" | "failed" | "refunded" | "none";
  paymentId: string | null;
  email: string | null;
  amountCents: number | null;
  /** Human readable reason a checkout never completed, when Whop gives one. */
  reason: string | null;
  method: string | null;
  /** Billing detail captured from the provider, for the operator dashboard. */
  currency: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  billingCountry: string | null;
  billingName: string | null;
  receiptUrl: string | null;
  refundedAt: string | null;
};

type WhopCard = {
  brand?: string | null;
  card_brand?: string | null;
  last4?: string | null;
  last_four?: string | null;
  country?: string | null;
  name?: string | null;
};

type WhopPaymentRow = {
  id?: string;
  status?: string;
  substatus?: string;
  refunded_at?: string | null;
  usd_total?: number | null;
  total?: number | null;
  currency?: string | null;
  failure_message?: string | null;
  decline_code?: string | null;
  payment_method_type?: string | null;
  payment_method?: (WhopCard & { type?: string | null; card?: WhopCard | null }) | null;
  card?: WhopCard | null;
  receipt_url?: string | null;
  hosted_invoice_url?: string | null;
  billing_address?: { country?: string | null; name?: string | null } | null;
  billing_country?: string | null;
  metadata?: Record<string, string | undefined> | null;
  user?: { email?: string; name?: string | null; country?: string | null } | null;
};

const PAID_STATUS = new Set(["paid", "succeeded", "completed", "settled"]);

const EMPTY_PAYMENT: WhopPaymentState = {
  state: "none",
  paymentId: null,
  email: null,
  amountCents: null,
  reason: null,
  method: null,
  currency: null,
  cardBrand: null,
  cardLast4: null,
  billingCountry: null,
  billingName: null,
  receiptUrl: null,
  refundedAt: null,
};

/** Pulls the billing fields out of whichever shape Whop returned them in. */
function readBilling(pick: WhopPaymentRow) {
  const card = pick.payment_method?.card ?? pick.card ?? pick.payment_method ?? null;
  const clean = (value: unknown): string | null => {
    const text = value == null ? "" : String(value).trim();
    return text ? text.slice(0, 60) : null;
  };
  return {
    method: clean(pick.payment_method_type ?? pick.payment_method?.type),
    currency: clean(pick.currency)?.toUpperCase() ?? "USD",
    cardBrand: clean(card?.brand ?? card?.card_brand),
    cardLast4: clean(card?.last4 ?? card?.last_four),
    billingCountry:
      clean(pick.billing_address?.country ?? pick.billing_country ?? card?.country ?? pick.user?.country)?.
        toUpperCase()
        .slice(0, 2) ?? null,
    billingName: clean(pick.billing_address?.name ?? card?.name ?? pick.user?.name),
    receiptUrl: clean(pick.receipt_url ?? pick.hosted_invoice_url)
      ? String(pick.receipt_url ?? pick.hosted_invoice_url).slice(0, 400)
      : null,
  };
}

/**
 * Looks the real payment for one of our order ids up on Whop.
 *
 * This is the safety net for the webhook: if a delivery is lost or rejected,
 * the success page and the admin dashboard can still discover that a payment
 * actually cleared (or exactly why it did not) straight from the provider —
 * together with the billing detail needed to audit the first real sales.
 */
export async function fetchWhopPaymentForOrder(orderId: string): Promise<WhopPaymentState> {
  const empty = EMPTY_PAYMENT;
  const { apiKey, accountId } = whopEnv();
  if (!apiKey || !accountId || !orderId) return empty;

  const res = await fetch(
    `${API_BASE}/payments?company_id=${encodeURIComponent(accountId)}&limit=50`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!res.ok) return { ...empty, reason: `Whop lookup failed (${res.status})` };

  const json = (await res.json()) as { data?: WhopPaymentRow[] };
  const rows = (json.data ?? []).filter((row) => row.metadata?.["order_id"] === orderId);
  if (rows.length === 0) return empty;

  const pick =
    rows.find((row) => PAID_STATUS.has(String(row.status).toLowerCase()) && !row.refunded_at) ??
    rows.find((row) => row.refunded_at) ??
    rows[0]!;

  const status = String(pick.status ?? "").toLowerCase();
  const state: WhopPaymentState["state"] = pick.refunded_at
    ? "refunded"
    : PAID_STATUS.has(status)
      ? "paid"
      : status === "failed" || status === "canceled" || status === "voided"
        ? "failed"
        : "open";

  const dollars = pick.usd_total ?? pick.total ?? null;
  const billing = readBilling(pick);
  return {
    ...empty,
    ...billing,
    state,
    paymentId: pick.id ?? null,
    email: pick.metadata?.["email"] || pick.user?.email || null,
    amountCents: typeof dollars === "number" ? Math.round(dollars * 100) : null,
    reason:
      pick.failure_message ||
      pick.decline_code ||
      (state === "open" ? `Checkout started but never completed (${pick.substatus ?? status})` : null),
    refundedAt: pick.refunded_at ?? null,
  };
}

/**
 * Refunds a captured Whop payment. Used only by the admin dashboard, behind the
 * admin token — the app itself never refunds anything automatically.
 */
export async function refundWhopPayment(
  paymentId: string,
): Promise<{ ok: boolean; detail: string }> {
  const { apiKey } = whopEnv();
  if (!apiKey) return { ok: false, detail: "Whop API key is not configured." };
  if (!paymentId) return { ok: false, detail: "This order has no provider payment id yet." };

  const res = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const text = await res.text();
  return { ok: res.ok, detail: res.ok ? "Refund accepted by Whop." : `Whop refused the refund (${res.status}): ${text.slice(0, 200)}` };
}



function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Candidate HMAC keys — Whop hands out a `ws_`/`whsec_` prefixed secret. */
function signingKeys(secret: string): Buffer[] {
  const bare = secret.replace(/^(ws_|whsec_)/, "");
  const keys = [Buffer.from(secret), Buffer.from(bare)];
  try {
    keys.push(Buffer.from(bare, "base64"));
  } catch {
    /* not base64 */
  }
  return keys;
}

/**
 * Verifies a Standard Webhooks signature: HMAC-SHA256 over
 * `{webhook-id}.{webhook-timestamp}.{raw body}`, base64, `v1,<sig>` header,
 * with a 5-minute replay window.
 */
export function verifyWhopWebhook(rawBody: string, headers: Headers): boolean {
  const { webhookSecret } = whopEnv();
  if (!webhookSecret) return false;

  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signature = headers.get("webhook-signature");
  if (!id || !timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const signed = `${id}.${timestamp}.${rawBody}`;
  const provided = signature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.startsWith("v1,") ? part.slice(3) : part));

  for (const key of signingKeys(webhookSecret)) {
    const digest = createHmac("sha256", key).update(signed).digest("base64");
    if (provided.some((candidate) => safeEqual(candidate, digest))) return true;
  }
  return false;
}

export type WhopEvent = {
  type?: string;
  data?: {
    id?: string;
    status?: string;
    user_email?: string;
    email?: string;
    metadata?: Record<string, string | undefined>;
    member?: { id?: string; email?: string };
    user?: { email?: string };
  };
};

/** Pulls the fields we need out of any payment/membership event shape. */
export function readWhopEvent(event: WhopEvent) {
  const data = event.data ?? {};
  const metadata = data.metadata ?? {};
  const email =
    (metadata["email"] || data.user_email || data.email || data.member?.email || data.user?.email || "")
      .toString()
      .trim()
      .toLowerCase() || null;
  return {
    type: event.type ?? "",
    orderId: metadata["order_id"] ?? null,
    plan: metadata["plan"] === "monthly" ? ("monthly" as const) : ("lifetime" as const),
    email,
    paymentId: data.id ?? null,
  };
}
