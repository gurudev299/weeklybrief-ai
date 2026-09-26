import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing in .env.local");
      return NextResponse.json(
        { error: "API Key configure nahi hai" },
        { status: 500 }
      );
    }

    const promptText = `You are an elite marketing agency analyst. Analyze the following deterministic performance data for a client weekly report. Be sharp, direct, professional, and actionable.

Data Totals:
${JSON.stringify(payload.totals, null, 2)}

Campaigns:
${JSON.stringify(payload.campaignBreakdown, null, 2)}

Respond ONLY with a valid JSON object matching this exact structure:
{
  "executiveSummary": "brief summary string",
  "whatWentWell": ["point 1", "point 2"],
  "whatNeedsAttention": ["point 1", "point 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    // Direct Google Gemini REST API call (No NPM SDK required)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("❌ Gemini HTTP Error from Google:", errBody);
      throw new Error(`Google API responded with status ${response.status}`);
    }

    const data = await response.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      throw new Error("Gemini returned empty response");
    }

    const aiReport = JSON.parse(textOutput);

    console.log("🔥 REAL GEMINI RESPONSE SUCCESSFUL:", aiReport);

    return NextResponse.json(aiReport);
  } catch (error: any) {
    console.error("❌ Server Error:", error.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}