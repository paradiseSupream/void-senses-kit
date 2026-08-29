import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Download, FileText, Globe2, Info } from "lucide-react";

import { adminGeoRoi } from "@/lib/ads-intel.functions";
import type { GeoReport } from "@/lib/ads-intel.types";
import { downloadCsv, toCsv } from "@/lib/csv";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const usd = (value: number) => `$${value.toFixed(2)}`;

type Props = { token: string | null; days: number };

/**
 * Country ROI / CPA planner: measured funnel per country, a spend split the
 * operator types in (US kept separate), performance-weighted creative budget
 * balancing, alerts and CSV / PDF export.
 */
export function GeoRoiCard({ token, days }: Props) {
  const load = useServerFn(adminGeoRoi);
  const [budget, setBudget] = useState(100);
  const [usSeparate, setUsSeparate] = useState(true);
  const [usShare, setUsShare] = useState(30);
  const [spend, setSpend] = useState<Record<string, number>>({});

  const query = useQuery<GeoReport>({
    queryKey: ["admin-geo-roi", token, days],
    queryFn: () => load({ data: { token: token!, days } }),
    enabled: Boolean(token),
  });
  const data = query.data;

  const plan = useMemo(() => {
    if (!data) return [];
    const rows = data.rows.filter((r) => r.funnel.sessions > 0 || ["AE", "SA", "QA", "KW", "US"].includes(r.country));
    const gulf = rows.filter((r) => r.country !== "US");
    const gulfBudget = usSeparate ? budget * (1 - usShare / 100) : budget;
    const usBudget = usSeparate ? budget * (usShare / 100) : 0;
    const weight = gulf.reduce((sum, r) => sum + Math.max(r.epcCents * r.funnel.sessions, 1), 0);

    return rows.map((row) => {
      const suggested =
        row.country === "US"
          ? usSeparate
            ? usBudget
            : (budget * Math.max(row.epcCents * row.funnel.sessions, 1)) / (weight || 1)
          : (gulfBudget * Math.max(row.epcCents * row.funnel.sessions, 1)) / (weight || 1);
      const actual = spend[row.country] ?? suggested;
      const cpa = row.funnel.purchase > 0 ? actual / row.funnel.purchase : null;
      const roas = actual > 0 ? row.revenueCents / 100 / actual : null;
      return { row, suggested, actual, cpa, roas };
    });
  }, [data, budget, usSeparate, usShare, spend]);

  const csvRows = () =>
    plan.map((p) => [
      p.row.country,
      p.row.label,
      p.row.funnel.sessions,
      p.row.funnel.resultView,
      p.row.funnel.gateShown,
      p.row.funnel.purchase,
      p.row.conversionRate.toFixed(2),
      (p.row.revenueCents / 100).toFixed(2),
      (p.row.epcCents / 100).toFixed(2),
      p.actual.toFixed(2),
      p.cpa == null ? "" : p.cpa.toFixed(2),
      p.roas == null ? "" : p.roas.toFixed(2),
    ]);

  const HEAD = [
    "Country",
    "Name",
    "Sessions",
    "Results",
    "Gate",
    "Purchases",
    "Conv %",
    "Revenue $",
    "Rev/session $",
    "Spend $",
    "CPA $",
    "ROAS",
  ];

  const exportCsv = () => {
    downloadCsv(`geo-roi-${days}d.csv`, toCsv(HEAD, csvRows()));
  };

  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 48;
    doc.setFontSize(16);
    doc.text(`Country ROI report — last ${days} days`, 40, y);
    y += 20;
    doc.setFontSize(9);
    doc.text(
      `Budget ${usd(budget)}/day · US ad set ${usSeparate ? `separate (${usShare}%)` : "merged"} · Revenue ${money(data?.revenueCents ?? 0)}`,
      40,
      y,
    );
    y += 22;
    doc.setFontSize(8);
    const widths = [40, 46, 40, 46, 44, 52, 46, 46, 40];
    const head = ["Country", "Sessions", "Sales", "Conv %", "Revenue", "Rev/sess", "Spend", "CPA", "ROAS"];
    const draw = (cells: string[]) => {
      let x = 40;
      cells.forEach((cell, i) => {
        doc.text(cell, x, y);
        x += widths[i] ?? 44;
      });
      y += 14;
    };
    draw(head);
    for (const p of plan) {
      if (y > 780) {
        doc.addPage();
        y = 48;
      }
      draw([
        p.row.country,
        String(p.row.funnel.sessions),
        String(p.row.funnel.purchase),
        `${p.row.conversionRate.toFixed(1)}%`,
        (p.row.revenueCents / 100).toFixed(2),
        (p.row.epcCents / 100).toFixed(2),
        p.actual.toFixed(2),
        p.cpa == null ? "—" : p.cpa.toFixed(2),
        p.roas == null ? "—" : `${p.roas.toFixed(2)}x`,
      ]);
    }
    if (data?.alerts.length) {
      y += 10;
      doc.setFontSize(11);
      doc.text("Recommendations", 40, y);
      y += 16;
      doc.setFontSize(8);
      for (const alert of data.alerts) {
        if (y > 770) {
          doc.addPage();
          y = 48;
        }
        doc.text(`• ${alert.title}`, 40, y);
        y += 12;
        doc.text(doc.splitTextToSize(alert.action, 500) as string[], 50, y);
        y += 20;
      }
    }
    doc.save(`geo-roi-${days}d.pdf`);
  };

  if (!token) return null;

  return (
    <section className="panel mt-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label-mono inline-flex items-center gap-1.5">
          <Globe2 className="size-3.5 text-primary" aria-hidden="true" /> Country ROI, CPA &amp; budget plan
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="size-3.5" aria-hidden="true" /> CSV
          </button>
          <button
            type="button"
            onClick={() => void exportPdf()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <FileText className="size-3.5" aria-hidden="true" /> PDF
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-muted-foreground">
          Daily budget ($)
          <input
            type="number"
            min={1}
            max={100000}
            value={budget}
            onChange={(e) => setBudget(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex items-end gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={usSeparate}
            onChange={(e) => setUsSeparate(e.target.checked)}
            className="mb-2 size-4 accent-[var(--primary)]"
          />
          Separate US ad set &amp; budget
        </label>
        <label className="text-xs text-muted-foreground">
          US budget share (%)
          <input
            type="number"
            min={0}
            max={100}
            value={usShare}
            disabled={!usSeparate}
            onChange={(e) => setUsShare(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className="mt-1 w-full rounded-lg border border-hairline bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
          />
        </label>
        <p className="self-end text-xs text-muted-foreground">
          Spend is not tracked automatically — type each country&apos;s real spend to get its true CPA
          and ROAS.
        </p>
      </div>

      {data?.alerts.length ? (
        <ul className="mt-4 space-y-2">
          {data.alerts.map((alert) => (
            <li
              key={alert.title}
              className={`rounded-lg border p-3 text-xs ${
                alert.level === "warn"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-hairline bg-surface"
              }`}
            >
              <p className="flex items-center gap-1.5 text-sm font-medium">
                {alert.level === "warn" ? (
                  <AlertTriangle className="size-3.5 text-destructive" aria-hidden="true" />
                ) : (
                  <Info className="size-3.5 text-primary" aria-hidden="true" />
                )}
                {alert.title}
              </p>
              <p className="mt-1 text-muted-foreground">{alert.detail}</p>
              <p className="mt-1">{alert.action}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-hairline">
              {["Country", "Sessions", "Sales", "Conv %", "Revenue", "Rev/session", "Suggested", "Spend", "CPA", "ROAS"].map(
                (head) => (
                  <th key={head} className="px-3 py-2 text-xs font-medium tracking-wide uppercase">
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {plan.map((p) => (
              <tr key={p.row.country} className="border-b border-hairline/60">
                <td className="px-3 py-2 font-medium">
                  {p.row.country}
                  <span className="ml-1 text-xs text-muted-foreground">{p.row.label}</span>
                </td>
                <td className="px-3 py-2 font-mono">{p.row.funnel.sessions}</td>
                <td className="px-3 py-2 font-mono">{p.row.funnel.purchase}</td>
                <td className="px-3 py-2 font-mono">{p.row.conversionRate.toFixed(2)}%</td>
                <td className="px-3 py-2 font-mono">{money(p.row.revenueCents)}</td>
                <td className="px-3 py-2 font-mono">{money(p.row.epcCents)}</td>
                <td className="px-3 py-2 font-mono text-primary">{usd(p.suggested)}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    value={spend[p.row.country] ?? Number(p.suggested.toFixed(2))}
                    onChange={(e) =>
                      setSpend({ ...spend, [p.row.country]: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-20 rounded border border-hairline bg-surface px-1.5 py-1 text-xs font-mono text-foreground"
                  />
                </td>
                <td className="px-3 py-2 font-mono">{p.cpa == null ? "—" : usd(p.cpa)}</td>
                <td
                  className={`px-3 py-2 font-mono ${
                    p.roas != null && p.roas >= 1 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {p.roas == null ? "—" : `${p.roas.toFixed(2)}x`}
                </td>
              </tr>
            ))}
            {plan.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                  No country data in this window.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {data?.creatives.length ? (
        <div className="mt-5">
          <span className="label-mono">Creative budget balancing (performance weighted)</span>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b border-hairline">
                  {["Creative", "Country", "Sessions", "Sales", "Conv %", "Rev/session", "Budget share", "Daily $"].map(
                    (head) => (
                      <th key={head} className="px-3 py-2 text-xs font-medium tracking-wide uppercase">
                        {head}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.creatives.slice(0, 12).map((c) => (
                  <tr key={`${c.country}-${c.creative}`} className="border-b border-hairline/60">
                    <td className="px-3 py-2 font-medium">
                      {c.creative}
                      {c.winner ? (
                        <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                          winner
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{c.country}</td>
                    <td className="px-3 py-2 font-mono">{c.sessions}</td>
                    <td className="px-3 py-2 font-mono">{c.purchases}</td>
                    <td className="px-3 py-2 font-mono">{c.convRate.toFixed(2)}%</td>
                    <td className="px-3 py-2 font-mono">{money(c.epcCents)}</td>
                    <td className="px-3 py-2 font-mono">{c.budgetSharePct.toFixed(1)}%</td>
                    <td className="px-3 py-2 font-mono text-primary">
                      {usd((budget * c.budgetSharePct) / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Share is weighted by revenue per session and traffic volume; creatives with under 5
            sessions stay at 0% until they have data. Pause anything at 0% with spend behind it.
          </p>
        </div>
      ) : null}

      {query.error ? (
        <p className="mt-3 text-sm text-destructive">{(query.error as Error).message}</p>
      ) : null}
    </section>
  );
}
