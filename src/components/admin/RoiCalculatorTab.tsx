import { useMemo, useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";

/**
 * FB ads ROI calculator.
 *
 * Models a paid campaign end to end: ad spend -> clicks -> quiz completion ->
 * VIP purchases + $9 matrix upsell + $2.99 monthly, plus the ad RPM the same
 * traffic earns while it is on site. Everything is a pure client calculation,
 * so an operator can model a budget before spending it.
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

const DEFAULTS: Inputs = {
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

const usd = (value: number) =>
  `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export function RoiCalculatorTab() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);

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
      roas: inputs.spend > 0 ? gross / inputs.spend : 0,
      roi: inputs.spend > 0 ? (net / inputs.spend) * 100 : 0,
      cpa: vipBuyers > 0 ? inputs.spend / vipBuyers : 0,
      breakEvenVipRate:
        results > 0 && inputs.vipPrice > 0 ? (inputs.spend / inputs.vipPrice / results) * 100 : 0,
    };
  }, [inputs]);

  const set = (key: keyof Inputs, value: string) =>
    setInputs((prev) => ({ ...prev, [key]: Number(value) || 0 }));

  const profitable = result.net >= 0;

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Calculator className="size-4 text-primary" aria-hidden="true" />
          FB ads ROI calculator
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Model a campaign before you spend. Every number below is editable — the projection updates
          instantly.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="panel space-y-3 p-4">
          <span className="label-mono">Assumptions</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="label-mono">{field.label}</span>
                <input
                  type="number"
                  min={0}
                  step={field.step ?? 1}
                  value={inputs[field.key]}
                  onChange={(event) => set(field.key, event.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/60"
                />
                <span className="mt-1 block text-xs text-muted-foreground">{field.hint}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setInputs(DEFAULTS)}
            className="rounded-lg border border-hairline px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset to benchmarks
          </button>
        </div>

        <div className="space-y-4">
          <div
            className={`panel p-5 ${profitable ? "border-primary/40" : "border-destructive/40"}`}
          >
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
              ROAS {result.roas.toFixed(2)}× · ROI {result.roi.toFixed(0)}% · CPA{" "}
              {usd(result.cpa)} per VIP
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
    </div>
  );
}
