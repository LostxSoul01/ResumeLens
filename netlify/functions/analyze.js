const { callGroq } = require('./_lib/groqClient');
const { buildAnalyzePrompt } = require('./_lib/prompts');
const { analyzeSchema, validate } = require('./_lib/schemas');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { resume, job } = JSON.parse(event.body || '{}');
    if (!resume || !job) {
      return { statusCode: 400, body: JSON.stringify({ error: 'resume and job are required' }) };
    }

    const prompt = buildAnalyzePrompt(resume, job);
    const result = await callGroq(prompt);

    const { valid, errors } = validate(result, analyzeSchema);
    if (!valid) {
      console.error('Schema validation failed:', errors);
      return { statusCode: 502, body: JSON.stringify({ error: 'Malformed response from AI model' }) };
    }

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Something went wrong analyzing your resume.' }) };
  }
};