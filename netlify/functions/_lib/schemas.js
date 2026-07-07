const analyzeSchema = {
  match_score: 'number',
  summary: 'string',
  matched_keywords: 'array',
  missing_keywords: 'array',
  strengths: 'array',
  suggestions: 'array',
};

const sectionsSchema = {
  sections: 'array',
};

const rewriteSchema = {
  rewrites: 'array',
};

function validate(obj, schema) {
  const errors = [];
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in obj)) {
      errors.push(`Missing key: ${key}`);
      continue;
    }
    const actualType = Array.isArray(obj[key]) ? 'array' : typeof obj[key];
    if (actualType !== type) {
      errors.push(`Key "${key}" expected ${type}, got ${actualType}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { analyzeSchema, sectionsSchema, rewriteSchema, validate };