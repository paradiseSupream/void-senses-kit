/**
 * Real social proof for the VIP offer.
 *
 * Everything here is counted from the live `ad_events` table — no invented
 * numbers. The card hides a line entirely when its count is too small to be
 * persuasive, which keeps the proof honest and still lets it do its job.
 */

import { createServerFn } from "@tanstack/react-start";

export type SocialProof = {
  /** Result screens opened in the last 24h (site-wide). */
  reportsToday: number;
  /** Result screens opened in the last 24h in the visitor's country. */
  reportsTodayLocal: number;
  /** Visitors who reached checkout in the last 24h. */
  checkoutsToday: number;
  /** ISO country code the counts were localised to, if any. */
  country: string | null;
};

const EMPTY: SocialProof = {
  reportsToday: 0,
  reportsTodayLocal: 0,
  checkoutsToday: 0,
  country: null,
};

export const getSocialProof = createServerFn({ method: "GET" })
  .inputValidator((data: { country?: string | null } | undefined) => ({
    country: (data?.country ?? "").toUpperCase().slice(0, 2) || null,
  }))
  .handler(async ({ data }): Promise<SocialProof> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const since = new Date(Date.now() - 86_400_000).toISOString();

      const count = async (build: (q: any) => any) => {
        const { count: n } = await build(
          supabaseAdmin
            .from("ad_events")
            .select("id", { count: "exact", head: true })
            .gte("created_at", since),
        );
        return typeof n === "number" ? n : 0;
      };

      const [reportsToday, reportsTodayLocal, checkoutsToday] = await Promise.all([
        count((q) => q.eq("slot", "vip_offer_card").eq("event_type", "impression")),
        data.country
          ? count((q) =>
              q
                .eq("slot", "vip_offer_card")
                .eq("event_type", "impression")
                .eq("country", data.country),
            )
          : Promise.resolve(0),
        count((q) => q.eq("event_type", "checkout_start")),
      ]);

      return { reportsToday, reportsTodayLocal, checkoutsToday, country: data.country };
    } catch {
      return EMPTY;
    }
  });
