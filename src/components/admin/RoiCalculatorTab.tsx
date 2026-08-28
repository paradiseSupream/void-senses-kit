import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Database, Gauge, RotateCcw, TrendingUp } from "lucide-react";

import { adminRoiDefaults } from "@/lib/ads-intel.functions";
import type { RoiDefaults } from "@/lib/ads-intel.types";

/**
 * FB ads ROI calculator with live defaults, per-field overrides and
 * CPA / VIP-based budget pacing.
 *
 * Benchmarks seed the model, measured numbers from the last N days replace
 * them when available, and any field the operator edits is marked as an
 * override so it is obvious which inputs are real and which are assumptions.
 */

type Inputs = {
  spend: number;
  cpc: number;
  landingRate: number;
  quizRate: number;
  vipRate: number;
  vipPrice: number;
  upsellRate: number;
  upsellPrice: number;
  monthlyRate: number;
  monthlyPrice: number;
  monthlyMonths: number;
  adRpm: number;
  pagesPerSession: number;
  refundRate: number;
  processingPct: number;
};

const BENCHMARKS: Inputs = {
  spend: 200,
  cpc: 0.35,
  landingRate: 85,
  quizRate: 55,
  vipRate: 1.2,
  vipPrice: 19,
  upsellRate: 18,
  upsellPrice: 9,
  monthlyRate: 1.5,
  monthlyPrice: 2.99,
  monthlyMonths: 2.5,
  adRpm: 28,
  pagesPerSession: 3.2,
  refundRate: 3,
  processingPct: 5,
};

const FIELDS: Array<{ key: keyof Inputs; label: string; hint: string; step?: number }> = [
  { key: "spend", label: "Ad spend ($)", hint: "Total budget for this campaign" },
  { key: "cpc", label: "Cost per click ($)", hint: "FB CPC — Tier-1.5 is usually $0.20–$0.60", step: 0.01 },
  { key: "landingRate", label: "Landing rate (%)", hint: "Clicks that actually load the page" },
  { key: "quizRate", label: "Quiz completion (%)", hint: "Visitors who finish a test and see a result" },
  { key: "vipRate", label: "VIP conversion (%)", hint: "Result viewers who buy lifetime VIP", step: 0.1 },
  { key: "vipPrice", label: "VIP price ($)", hint: "Lifetime VIP price" },
  { key: "upsellRate", label: "Upsell take rate (%)", hint: "VIP buyers who add the $9 matrix" },
  { key: "upsellPrice", label: "Upsell price ($)", hint: "Post-purchase upsell" },
  { key: "monthlyRate", label: "Monthly take rate (%)", hint: "Non-buyers who take the $2.99 pass", step: 0.1 },
  { key: "monthlyPrice", label: "Monthly price ($)", hint: "Downsell price", step: 0.01 },
  { key: "monthlyMonths", label: "Avg months retained", hint: "How long a monthly member stays", step: 0.1 },
  { key: "adRpm", label: "Ad RPM ($)", hint: "Revenue per 1,000 pageviews from ads" },
  { key: "pagesPerSession", label: "Pages / session", hint: "Ad impressions depend on this", step: 0.1 },
  { key: "refundRate", label: "Refund rate (%)", hint: "Chargebacks + refunds" },
  { key: "processingPct", label: "Processing fee (%)", hint: "Whop / card fees" },
];

const WINDOWS = [7, 14, 30, 60] as const;

const usd = (value: number) =>
  `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

/** Which fields the measured window can legitimately replace. */
function measuredInputs(live: RoiDefaults): Partial<Inputs> {
  const patch: Partial<Inputs> = {};
  if (live.sessions > 0) patch.quizRate = Number(live.quizRate.toFixed(1));
  if (live.resultViews > 0) patch.vipRate = Number(live.vipRate.toFixed(2));
  if (live.purchases > 0) patch.vipPrice = Number(live.aov.toFixed(2));
  return patch;
}

export function RoiCalculatorTab({ token }: { token: string }) {
  const load = useServerFn(adminRoiDefaults);
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const [inputs, setInputs] = useState<Inputs>(BENCHMARKS);
  const [overrides, setOverrides] = useState<Partial<Record<keyof Inputs, true>>>({});
  const [useLive, setUseLive] = useState(true);

  // Pacing controls: what the operator is willing to pay for one VIP buyer.
  const [targetCpa, setTargetCpa] = useState(12);
  const [targetRoas, setTargetRoas] = useState(2);
  const [paceDays, setPaceDays] = useState(7);

  const live = useQuery<RoiDefaults>({
    queryKey: ["admin-roi-defaults", token, days],
    queryFn: () => load({ data: { token, days } }),
    enabled: Boolean(token),
  });

  const liveData = live.data;

  // Live measurements seed every field the operator has not overridden.
  useEffect(() => {
    if (!liveData || !useLive) return;
    const patch = measuredInputs(liveData);
    setInputs((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(patch) as Array<[keyof Inputs, number]>) {
        if (!overrides[key] && Number.isFinite(value) && value > 0) next[key] = value;
      }
      return next;
    });
  }, [liveData, useLive, overrides]);

  const result = useMemo(() => {
    const clicks = inputs.cpc > 0 ? inputs.spend / inputs.cpc : 0;
    const visitors = clicks * (inputs.landingRate / 100);
    const results = visitors * (inputs.quizRate / 100);
    const vipBuyers = results * (inputs.vipRate / 100);
    const upsellBuyers = vipBuyers * (inputs.upsellRate / 100);
    const monthlyBuyers = (results - vipBuyers) * (inputs.monthlyRate / 100);

    const vipRevenue = vipBuyers * inputs.vipPrice;
    const upsellRevenue = upsellBuyers * inputs.upsellPrice;
    const monthlyRevenue = monthlyBuyers * inputs.monthlyPrice * inputs.monthlyMonths;
    const adRevenue = (visitors * inputs.pagesPerSession * inputs.adRpm) / 1000;

    const gross = vipRevenue + upsellRevenue + monthlyRevenue + adRevenue;
    const paid = vipRevenue + upsellRevenue + monthlyRevenue;
    const refunds = paid * (inputs.refundRate / 100);
    const fees = (paid - refunds) * (inputs.processingPct / 100);
    const net = gross - refunds - fees - inputs.spend;

    // Value of one VIP buyer including the upsell and the ad revenue their
    // traffic earns — this is what the CPA ceiling is derived from.
    const vipValue =
      inputs.vipPrice * (1 - inputs.refundRate / 100) * (1 - inputs.processingPct / 100) +
      (inputs.upsellRate / 100) * inputs.upsellPrice;
    const grossPerVisitor = vipBuyers > 0 ? gross / vipBuyers : 0;

    return {
      clicks,
      visitors,
      results,
      vipBuyers,
      upsellBuyers,
      monthlyBuyers,
      vipRevenue,
      upsellRevenue,
      monthlyRevenue,
      adRevenue,
      gross,
      refunds,
      fees,
      net,
      vipValue,
      grossPerVisitor,
      roas: inputs.spend > 0 ? gross / inputs.spend : 0,
      roi: inputs.spend > 0 ? (net / inputs.spend) * 100 : 0,
      cpa: vipBuyers > 0 ? inputs.spend / vipBuyers : 0,
      breakEvenVipRate:
        results > 0 && inputs.vipPrice > 0 ? (inputs.spend / inputs.vipPrice / results) * 100 : 0,
    };
  }, [inputs]);

  // Budget pacing derived from the CPA ceiling and the modelled VIP value.
  const pacing = useMemo(() => {
    const maxCpa = targetRoas > 0 ? result.grossPerVisitor / targetRoas : 0;
    const cpa = result.cpa;
    const vipPerDay = paceDays > 0 ? result.vipBuyers / paceDays : 0;
    const dailyAtTarget = targetCpa * vipPerDay;
    const suggestedDaily = paceDays > 0 ? inputs.spend / paceDays : 0;
    // Meta needs ~50 conversions per ad set per week to exit the learning phase.
    const budgetForLearning = targetCpa * 50;
    const headroom = cpa > 0 ? (maxCpa - cpa) / Math.max(0.01, maxCpa) : 0;
    const status: "scale" | "hold" | "cut" =
      cpa === 0 ? "hold" : cpa <= targetCpa ? "scale" : cpa <= maxCpa ? "hold" : "cut";
    return {
      maxCpa,
      cpa,
      vipPerDay,
      dailyAtTarget,
      suggestedDaily,
      budgetForLearning,
      headroom,
      status,
      nextDaily:
        status === "scale"
          ? suggestedDaily * 1.2
          : status === "cut"
            ? suggestedDaily * 0.7
            : suggestedDaily,
    };
  }, [result, targetCpa, targetRoas, paceDays, inputs.spend]);

  const set = (key: keyof Inputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) || 0 }));
    setOverrides((prev) => ({ ...prev, [key]: true }));
  };

  const resetField = (key: keyof Inputs) => {
    const measured = liveData && useLive ? measuredInputs(liveData)[key] : undefined;
    setInputs((prev) => ({ ...prev, [key]: measured ?? BENCHMARKS[key] }));
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const profitable = result.net >= 0;
  const overrideCount = Object.keys(overrides).length;

  const statusTone =
    pacing.status === "scale"
      ? "text-primary"
      : pacing.status === "cut"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Calculator className="size-4 text-primary" aria-hidden="true" />
            FB ads ROI calculator
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Defaults come from your own last {days} days where the data allows it. Edit any field to
            override it — overrides are highlighted and never get overwritten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {WINDOWS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-lg px-3 py-1.5 text-xs ${
                days === value ? "bg-surface text-foreground" : "text-muted-foreground"
              }`}
            >
              {value}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUseLive((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${
              useLive ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            <Database className="size-3.5" aria-hidden="true" />
            {useLive ? "Live defaults" : "Benchmarks"}
          </button>
        </div>
      </div>

      {liveData ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Sessions", liveData.sessions.toLocaleString()],
            ["Results", liveData.resultViews.toLocaleString()],
            ["Purchases", liveData.purchases.toLocaleString()],
            ["Measured VIP %", `${liveData.vipRate.toFixed(2)}%`],
            ["Measured AOV", usd(liveData.aov)],
            ["Revenue / 1k sessions", usd(liveData.rpm)],
          ].map(([label, value]) => (
            <div key={label} className="panel p-3">
              <span className="label-mono">{label}</span>
              <p className="mt-1 font-display text-lg font-semibold">{value}</p>
            </div>
          ))}
          {!liveData.confident ? (
            <p className="col-span-full text-xs text-muted-foreground">
              Small sample ({liveData.purchases} purchases) — measured rates are indicative only.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="label-mono">Assumptions</span>
            <span className="text-xs text-muted-foreground">{overrideCount} overridden</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const overridden = Boolean(overrides[field.key]);
              const measured =
                liveData && useLive ? measuredInputs(liveData)[field.key] : undefined;
              return (
                <label key={field.key} className="block text-sm">
                  <span className="label-mono flex items-center justify-between gap-2">
                    {field.label}
                    {overridden ? (
                      <button
                        type="button"
                        onClick={() => resetField(field.key)}
                        className="flex items-center gap-1 text-[10px] text-primary"
                      >
                        <RotateCcw className="size-3" aria-hidden="true" /> override
                      </button>
                    ) : measured !== undefined ? (
                      <span className="text-[10px] text-primary/80">live</span>
                    ) : null}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={field.step ?? 1}
                    value={inputs[field.key]}
                    onChange={(event) => set(field.key, event.target.value)}
                    className={`mt-1 w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60 ${
                      overridden ? "border-primary/50" : "border-hairline"
                    }`}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {measured !== undefined && !overridden
                      ? `Measured over ${days}d: ${measured}`
                      : field.hint}
                  </span>
                </label>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setOverrides({});
              setInputs(BENCHMARKS);
            }}
            className="rounded-lg border border-hairline px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset everything to benchmarks
          </button>
        </div>

        <div className="space-y-4">
          <div className={`panel p-5 ${profitable ? "border-primary/40" : "border-destructive/40"}`}>
            <span className="label-mono flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-primary" aria-hidden="true" />
              Projected net profit
            </span>
            <p
              className={`mt-2 font-display text-4xl font-bold ${profitable ? "text-primary" : "text-destructive"}`}
            >
              {usd(result.net)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ROAS {result.roas.toFixed(2)}× · ROI {result.roi.toFixed(0)}% · CPA {usd(result.cpa)}{" "}
              per VIP
            </p>
          </div>

          <div className="panel p-4">
            <span className="label-mono flex items-center gap-1.5">
              <Gauge className="size-3.5 text-primary" aria-hidden="true" />
              Budget pacing
            </span>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["Target CPA ($)", targetCpa, setTargetCpa, 0.5],
                ["Target ROAS (×)", targetRoas, setTargetRoas, 0.1],
                ["Pacing window (days)", paceDays, setPaceDays, 1],
              ].map(([label, value, setter, step]) => (
                <label key={label as string} className="block text-sm">
                  <span className="label-mono">{label as string}</span>
                  <input
                    type="number"
                    min={0}
                    step={step as number}
                    value={value as number}
                    onChange={(event) =>
                      (setter as (n: number) => void)(Number(event.target.value) || 0)
                    }
                    className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                </label>
              ))}
            </div>

            <dl className="mt-3 space-y-1.5 text-sm">
              {[
                ["Value of one VIP buyer", usd(result.vipValue)],
                ["Gross revenue per VIP buyer", usd(result.grossPerVisitor)],
                ["Max CPA at target ROAS", usd(pacing.maxCpa)],
                ["Modelled CPA", usd(pacing.cpa)],
                ["VIP buyers / day", pacing.vipPerDay.toFixed(2)],
                ["Current daily spend", usd(pacing.suggestedDaily)],
                ["Daily spend at target CPA", usd(pacing.dailyAtTarget)],
                ["Budget to exit learning (50 conv.)", usd(pacing.budgetForLearning)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono">{value}</dd>
                </div>
              ))}
            </dl>

            <p className={`mt-3 text-sm font-medium ${statusTone}`}>
              {pacing.status === "scale"
                ? `Scale: CPA is under target with ${(pacing.headroom * 100).toFixed(0)}% headroom — step daily budget to ${usd(pacing.nextDaily)}.`
                : pacing.status === "cut"
                  ? `Cut: CPA is above the ${usd(pacing.maxCpa)} ceiling — drop daily budget to ${usd(pacing.nextDaily)} or fix the creative.`
                  : `Hold: CPA sits between target and ceiling — keep daily budget at ${usd(pacing.nextDaily)} and let Meta learn.`}
            </p>
          </div>

          <div className="panel p-4">
            <span className="label-mono">Traffic funnel</span>
            <dl className="mt-2 space-y-1.5 text-sm">
              {[
                ["Clicks bought", Math.round(result.clicks).toLocaleString()],
                ["Landed visitors", Math.round(result.visitors).toLocaleString()],
                ["Results viewed", Math.round(result.results).toLocaleString()],
                ["VIP buyers", result.vipBuyers.toFixed(1)],
                ["Upsell buyers", result.upsellBuyers.toFixed(1)],
                ["Monthly members", result.monthlyBuyers.toFixed(1)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="panel p-4">
            <span className="label-mono">Revenue split</span>
            <dl className="mt-2 space-y-1.5 text-sm">
              {[
                ["Lifetime VIP", result.vipRevenue],
                ["$9 matrix upsell", result.upsellRevenue],
                ["Monthly pass (LTV)", result.monthlyRevenue],
                ["Ad revenue (free users)", result.adRevenue],
                ["Gross revenue", result.gross],
                ["Refunds", -result.refunds],
                ["Processing fees", -result.fees],
                ["Ad spend", -inputs.spend],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-muted-foreground">{label as string}</dt>
                  <dd className="font-mono">{usd(value as number)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Break-even VIP conversion: {result.breakEvenVipRate.toFixed(2)}% of result viewers.
              Anything above that is profit.
            </p>
          </div>
        </div>
      </div>

      {live.error ? (
        <p className="text-sm text-destructive">{(live.error as Error).message}</p>
      ) : null}
    </div>
  );
}
