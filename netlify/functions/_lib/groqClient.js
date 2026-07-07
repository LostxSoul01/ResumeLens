// Single place that talks to Groq. Handles the request, strips markdown fences,
// parses JSON, and surfaces clean errors to callers.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

async function callGroq(prompt, { temperature = 0.3 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  return parseJsonResponse(raw);
}

function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse Groq response as JSON: ${err.message}`);
  }
}

module.exports = { callGroq };