// All prompt templates live here so functions stay clean.

const CRITICAL_SCORING_GUIDANCE = `
You are a skeptical, experienced technical recruiter who has rejected hundreds of resumes. Real ATS systems and human recruiters are harsh — most resumes score 40-65 on a genuine match. Do NOT default to generous scores.

Calibrate strictly using these bands:
- 90-100: Reserved for candidates who explicitly meet nearly every required qualification with clear, specific evidence. Extremely rare.
- 75-89: Strong match — meets most core requirements with solid evidence, but has at least one real gap (missing tool, no quantified impact, or a "nice to have" absent).
- 55-74: Moderate match — meets some requirements but has clear gaps in required skills, experience depth, or quantifiable results.
- 30-54: Weak match — significant missing requirements or the resume relies on vague/generic claims instead of specifics.
- Below 30: Poor match — most core requirements absent.

Penalize for: generic action-verb bullets with no metrics, claimed skills not backed by any project/experience evidence, missing "required" (not just "nice to have") qualifications, and academic-only experience when the role implies production/professional expectations.
Do not give credit for skills merely listed without any supporting bullet or project evidence in the resume.
`;

function buildAnalyzePrompt(resume, job) {
  return `${CRITICAL_SCORING_GUIDANCE}

Compare the resume against the job description below.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "match_score": <number 0-100>,
  "summary": "<one honest, critical sentence verdict>",
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
  return `${CRITICAL_SCORING_GUIDANCE}

Classify the resume text into these sections if present: Summary, Experience, Skills, Education, Projects.
Then score each section using the bands above, with a short, honest, one-sentence rationale that names the specific gap if the score isn't high.

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