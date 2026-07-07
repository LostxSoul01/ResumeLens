const { callGroq } = require('./_lib/groqClient');
const { buildRewritePrompt } = require('./_lib/prompts');
const { rewriteSchema, validate } = require('./_lib/schemas');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { bullets, job } = JSON.parse(event.body || '{}');
    if (!Array.isArray(bullets) || !bullets.length || !job) {
      return { statusCode: 400, body: JSON.stringify({ error: 'bullets (array) and job are required' }) };
    }
    if (bullets.length > 10) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Max 10 bullets per request' }) };
    }

    const prompt = buildRewritePrompt(bullets, job);
    const result = await callGroq(prompt, { temperature: 0.5 });

    const { valid, errors } = validate(result, rewriteSchema);
    if (!valid) {
      console.error('Schema validation failed:', errors);
      return { statusCode: 502, body: JSON.stringify({ error: 'Malformed response from AI model' }) };
    }

    // Guard against the model hallucinating extra "rewrites" for things
    // that were never sent (e.g. missing keywords instead of actual bullets).
    // Only keep entries whose "original" text closely matches an input bullet.
    const normalize = s => (s || '').toLowerCase().trim();
    const inputSet = bullets.map(normalize);
    result.rewrites = (result.rewrites || []).filter(r =>
      inputSet.some(b => b === normalize(r.original))
    );

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong rewriting bullets.' }) };
  }
};