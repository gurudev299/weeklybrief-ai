"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { CalculatedPayload, AIReportResponse } from "@/lib/types";

export default function ReportPage() {
  const router = useRouter();
  const [data, setData] = useState<CalculatedPayload | null>(null);
  const [aiReport, setAiReport] = useState<AIReportResponse | null>(null);

  useEffect(() => {
    // SessionStorage se saved calculation aur AI summary nikalna
    const savedData = sessionStorage.getItem("weekly_calculated");
    const savedAi = sessionStorage.getItem("weekly_ai_report");

    if (!savedData || !savedAi) {
      router.push("/");
      return;
    }

    try {
      setData(JSON.parse(savedData));
      setAiReport(JSON.parse(savedAi));
    } catch (e) {
      console.error("Failed to parse report session data", e);
      router.push("/");
    }
  }, [router]);

  if (!data || !aiReport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <span className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mr-2" />
        Loading your report...
      </div>
    );
  }

  const { totals, dailyTrends, campaignBreakdown } = data;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-600">
              Weekly Performance Brief
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              Marketing Performance Report
            </h1>
            <p className="text-sm text-slate-500">{data.period}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              📄 Print / Save PDF
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Upload New CSV
            </Link>
          </div>
        </div>

        {/* 1. KEY METRICS STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Spend"
            value={`$${totals.spend.current.toLocaleString()}`}
            change={totals.spend.changePercent}
          />
          <MetricCard
            title="Total Revenue"
            value={`$${totals.revenue.current.toLocaleString()}`}
            change={totals.revenue.changePercent}
          />
          <MetricCard
            title="Total Leads"
            value={totals.leads.current.toLocaleString()}
            change={totals.leads.changePercent}
          />
          <MetricCard
            title="Return On Ad Spend (ROAS)"
            value={`${totals.roas.current.toFixed(2)}x`}
            change={totals.roas.changePercent}
          />
        </div>

        {/* 2. EXECUTIVE SUMMARY & AI INSIGHTS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm uppercase tracking-wider font-bold text-slate-400 mb-2">
              Executive Summary
            </h2>
            <p className="text-base text-slate-800 leading-relaxed font-medium">
              {aiReport.executiveSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* What Went Well */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-emerald-600 flex items-center gap-1.5">
                <span>✓</span> What Went Well
              </h3>
              <ul className="space-y-2">
                {aiReport.whatWentWell.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-lg leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What Needs Attention */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-600 flex items-center gap-1.5">
                <span>⚠️</span> What Needs Attention
              </h3>
              <ul className="space-y-2">
                {aiReport.whatNeedsAttention.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 bg-amber-50/60 border border-amber-100 p-2.5 rounded-lg leading-relaxed"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Recommendations */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-indigo-600">
              💡 Actionable Recommendations for Next Week
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {aiReport.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="text-xs text-slate-800 bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2"
                >
                  <span className="font-bold text-indigo-600">{idx + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. CHARTS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Spend vs Revenue Trend */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daily Spend vs Revenue
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Spend ($)"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaign Revenue Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Revenue by Campaign
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

// Sub-component: Stat Card with Delta Indicator
function MetricCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: number;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
        {title}
      </span>
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-extrabold text-slate-900">{value}</span>
        <span
          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            isPositive
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-rose-50 text-rose-600 border border-rose-200"
          }`}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}