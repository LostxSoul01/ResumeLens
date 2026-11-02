const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-120b';

async function callGroq(prompt, { temperature = 0.3, retries = 1, model = PRIMARY_MODEL } = {}) {
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
      model,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (res.status === 429 && retries > 0) {
    await new Promise(r => setTimeout(r, 1500));
    return callGroq(prompt, { temperature, retries: retries - 1, model });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // Self-heal: if the model was retired, switch to the fallback once
    if (/model_not_found|model_decommissioned/.test(errText) && model !== FALLBACK_MODEL) {
      console.warn(`Model ${model} unavailable, falling back to ${FALLBACK_MODEL}`);
      return callGroq(prompt, { temperature, retries, model: FALLBACK_MODEL });
    }
    if (res.status === 429) {
      throw new Error('Rate limit reached — please wait a few seconds and try again.');
    }
    throw new Error(`Groq API error (${res.status}): ${errText.slice(0, 200)}`);
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
