export interface RawMarketingRow {
  Date: string;
  Campaign: string;
  Spend: string | number;
  Clicks: string | number;
  Leads: string | number;
  Revenue: string | number;
}

export interface MetricSummary {
  current: number;
  previous: number;
  changePercent: number;
}

export interface CalculatedPayload {
  period: string;
  totals: {
    spend: MetricSummary;
    clicks: MetricSummary;
    leads: MetricSummary;
    revenue: MetricSummary;
    cpl: MetricSummary;      // Cost Per Lead
    roas: MetricSummary;     // Return on Ad Spend
  };
  campaignBreakdown: {
    name: string;
    spend: number;
    revenue: number;
    leads: number;
    roas: number;
  }[];
  dailyTrends: {
    date: string;
    spend: number;
    revenue: number;
    leads: number;
  }[];
  dataQualityIssues: string[];
}

export interface AIReportResponse {
  executiveSummary: string;
  whatWentWell: string[];
  whatNeedsAttention: string[];
  recommendations: string[];
}