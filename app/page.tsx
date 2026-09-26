"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { processMarketingCSV } from "../lib/calculator";
import { RawMarketingRow } from "../lib/types";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileUpload = (file: File) => {
    setError(null);
    setIsProcessing(true);

    Papa.parse<RawMarketingRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (!results.data || results.data.length < 2) {
            throw new Error("CSV contains insufficient rows for week-over-week analysis.");
          }

          // Step 1: Run mathematical calculations locally
          const calculatedPayload = processMarketingCSV(results.data);

          // Step 2: Send structured calculations to the AI Route
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(calculatedPayload),
          });

          if (!response.ok) {
            throw new Error("AI analysis generation failed. Please try again.");
          }

          const aiReport = await response.json();

          // Step 3: Cache analysis and navigate to report preview
          sessionStorage.setItem("weekly_calculated", JSON.stringify(calculatedPayload));
          sessionStorage.setItem("weekly_ai_report", JSON.stringify(aiReport));

          router.push("/report");
        } catch (err: any) {
          setError(err.message || "Failed to process the CSV file.");
          setIsProcessing(false);
        }
      },
      error: () => {
        setError("Error parsing the CSV file. Verify the file format.");
        setIsProcessing(false);
      },
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
          Agency MVP • Version 1.0
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Turn your weekly marketing CSV into an <span className="text-indigo-600">actionable client report</span>.
        </h1>
        
        <p className="text-slate-600 text-base md:text-lg">
          Upload campaign performance data. We process the numbers with exact calculations, run LLM narrative generation, and produce an executive-ready weekly brief.
        </p>

        <div className="bg-white border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors p-8 rounded-2xl shadow-sm space-y-4">
          <input
            type="file"
            accept=".csv"
            id="csv-file-input"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
          <label
            htmlFor="csv-file-input"
            className="cursor-pointer block space-y-3"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl font-bold">
              ↑
            </div>
            <div>
              <p className="font-semibold text-slate-700">Click to upload or drag & drop</p>
              <p className="text-xs text-slate-400 mt-1">Requires: Date, Campaign, Spend, Clicks, Leads, Revenue</p>
            </div>
          </label>
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-indigo-600 text-sm font-medium">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            <span>Calculating metrics and requesting AI insights...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs text-left">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </main>
  );
}