// netlify/functions/analyze.js
// Serverless function: receives resume + job description, calls Groq's LLM API,
// returns a structured match analysis. The API key stays server-side only.

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server is missing GROQ_API_KEY. Set it in Netlify env vars." }) };
  }

  let resumeText, jobText;
  try {
    const body = JSON.parse(event.body);
    resumeText = (body.resume || "").slice(0, 12000);
    jobText = (body.job || "").slice(0, 6000);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!resumeText.trim() || !jobText.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Both resume and job description are required." }) };
  }

  const systemPrompt = `You are an ATS and recruiting expert. Compare a resume against a job description and return ONLY valid JSON (no markdown, no backticks, no preamble) matching this exact shape:
{
  "match_score": <integer 0-100>,
  "summary": "<one sentence overall verdict>",
  "matched_keywords": ["...max 10 items..."],
  "missing_keywords": ["...max 10 items..."],
  "strengths": ["...max 4 short bullet strings..."],
  "suggestions": ["...max 5 short, specific, actionable bullet strings..."]
}
Be honest and specific. Do not invent resume content that isn't there. Do not wrap the JSON in markdown fences.`;

  const userPrompt = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobText}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: "Groq API error", details: errText }) };
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: "Could not parse model output", raw: content }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Unexpected server error", details: String(err) }) };
  }
};
