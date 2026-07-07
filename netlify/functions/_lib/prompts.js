// All prompt templates live here so functions stay clean.

function buildAnalyzePrompt(resume, job) {
  return `You are an expert technical recruiter and ATS system. Compare the resume against the job description below.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "match_score": <number 0-100>,
  "summary": "<one sentence verdict>",
  "matched_keywords": ["..."],
  "missing_keywords": ["..."],
  "strengths": ["..."],
  "suggestions": ["..."]
}

RESUME:
${resume}

JOB DESCRIPTION:
${job}`;
}

function buildSectionsPrompt(resume, job) {
  return `You are an expert technical recruiter. First, classify the resume text into these sections if present: Summary, Experience, Skills, Education, Projects.
Then score each section 0-100 on how well it aligns with the job description, with a short one-sentence rationale for each.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "sections": [
    { "name": "Experience", "score": <0-100>, "rationale": "<one sentence>" },
    { "name": "Skills", "score": <0-100>, "rationale": "<one sentence>" }
  ]
}

Only include sections that actually appear in the resume. If a section is entirely missing from the resume but expected for this role, include it with a low score and rationale noting the absence.

RESUME:
${resume}

JOB DESCRIPTION:
${job}`;
}

function buildRewritePrompt(bullets, job) {
  return `You are a resume writing expert. For each bullet below, write 2 improved rewrites that use stronger action verbs, add quantifiable impact where plausible, and align with the job description's language — without inventing false facts or numbers not implied by the original.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "rewrites": [
    { "original": "<original bullet>", "options": ["<rewrite 1>", "<rewrite 2>"] }
  ]
}

BULLETS:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

JOB DESCRIPTION:
${job}`;
}

module.exports = { buildAnalyzePrompt, buildSectionsPrompt, buildRewritePrompt };