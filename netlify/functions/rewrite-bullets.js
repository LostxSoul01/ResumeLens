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

    const normalize = s => (s || '').toLowerCase().trim();
    const inputSet = bullets.map(normalize);

    const matched = (result.rewrites || []).filter(r =>
      inputSet.some(b => b === normalize(r.original))
    );

    const mergedByOriginal = new Map();
    matched.forEach(r => {
      const key = normalize(r.original);
      if (!mergedByOriginal.has(key)) {
        mergedByOriginal.set(key, { original: r.original, options: [] });
      }
      const entry = mergedByOriginal.get(key);
      (r.options || []).forEach(opt => {
        if (!entry.options.some(existing => normalize(existing) === normalize(opt))) {
          entry.options.push(opt);
        }
      });
    });

    result.rewrites = Array.from(mergedByOriginal.values()).map(entry => ({
      original: entry.original,
      options: entry.options.slice(0, 4),
    }));

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Something went wrong rewriting bullets.' }) };
  }
};