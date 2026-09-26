import { RawMarketingRow, CalculatedPayload, MetricSummary } from "./types";

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function buildMetricSummary(current: number, previous: number): MetricSummary {
  return {
    current: Number(current.toFixed(2)),
    previous: Number(previous.toFixed(2)),
    changePercent: calculateChange(current, previous),
  };
}

export function processMarketingCSV(rows: RawMarketingRow[]): CalculatedPayload {
  const issues: string[] = [];
  
  // Clean and parse rows
  const cleanRows = rows
    .filter((r) => r.Date && r.Campaign)
    .map((r, index) => {
      const spend = parseFloat(String(r.Spend || 0));
      const revenue = parseFloat(String(r.Revenue || 0));
      const leads = parseFloat(String(r.Leads || 0));
      const clicks = parseFloat(String(r.Clicks || 0));

      if (isNaN(spend) || isNaN(revenue)) {
        issues.push(`Row ${index + 1}: Non-numeric financial values found.`);
      }

      return {
        date: r.Date.trim(),
        campaign: r.Campaign.trim(),
        spend: isNaN(spend) ? 0 : spend,
        revenue: isNaN(revenue) ? 0 : revenue,
        leads: isNaN(leads) ? 0 : leads,
        clicks: isNaN(clicks) ? 0 : clicks,
      };
    });

  // Split into two halves to compute period-over-period change
  const mid = Math.floor(cleanRows.length / 2);
  const previousSlice = cleanRows.slice(0, mid);
  const currentSlice = cleanRows.slice(mid);

  const sum = (arr: typeof cleanRows, key: "spend" | "revenue" | "leads" | "clicks") =>
    arr.reduce((acc, row) => acc + row[key], 0);

  const curSpend = sum(currentSlice, "spend");
  const prevSpend = sum(previousSlice, "spend");

  const curRev = sum(currentSlice, "revenue");
  const prevRev = sum(previousSlice, "revenue");

  const curLeads = sum(currentSlice, "leads");
  const prevLeads = sum(previousSlice, "leads");

  const curClicks = sum(currentSlice, "clicks");
  const prevClicks = sum(previousSlice, "clicks");

  const curCPL = curLeads > 0 ? curSpend / curLeads : 0;
  const prevCPL = prevLeads > 0 ? prevSpend / prevLeads : 0;

  const curROAS = curSpend > 0 ? curRev / curSpend : 0;
  const prevROAS = prevSpend > 0 ? prevRev / prevSpend : 0;

  // Aggregate by campaign
  const campaignMap: Record<string, { spend: number; revenue: number; leads: number }> = {};
  cleanRows.forEach((r) => {
    if (!campaignMap[r.campaign]) {
      campaignMap[r.campaign] = { spend: 0, revenue: 0, leads: 0 };
    }
    campaignMap[r.campaign].spend += r.spend;
    campaignMap[r.campaign].revenue += r.revenue;
    campaignMap[r.campaign].leads += r.leads;
  });

  const campaignBreakdown = Object.entries(campaignMap).map(([name, data]) => ({
    name,
    spend: Number(data.spend.toFixed(2)),
    revenue: Number(data.revenue.toFixed(2)),
    leads: data.leads,
    roas: data.spend > 0 ? Number((data.revenue / data.spend).toFixed(2)) : 0,
  }));

  // Aggregate daily trends
  const dailyTrends = cleanRows.map((r) => ({
    date: r.date,
    spend: r.spend,
    revenue: r.revenue,
    leads: r.leads,
  }));

  return {
    period: "Current Week vs Previous Week",
    totals: {
      spend: buildMetricSummary(curSpend, prevSpend),
      clicks: buildMetricSummary(curClicks, prevClicks),
      leads: buildMetricSummary(curLeads, prevLeads),
      revenue: buildMetricSummary(curRev, prevRev),
      cpl: buildMetricSummary(curCPL, prevCPL),
      roas: buildMetricSummary(curROAS, prevROAS),
    },
    campaignBreakdown,
    dailyTrends,
    dataQualityIssues: Array.from(new Set(issues)),
  };
}