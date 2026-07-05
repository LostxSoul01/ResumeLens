# ResumeLens

An AI-powered resume-vs-job-description match analyzer. Paste your resume and a job posting, and get back a match score, matched/missing keywords, strengths, and specific suggestions — the same kind of feedback an ATS or recruiter's first pass gives, generated in seconds.

## Why I built this
While applying for entry-level Software Engineer roles, I was manually iterating on my resume against ATS checkers. I built ResumeLens to automate that process using a real LLM integration, and to have a concrete, deployed example of working with AI APIs in a production-style app (not just a notebook).

## Stack
- **Frontend:** Vanilla HTML/CSS/JS (no framework, no build step)
- **Backend:** Netlify serverless function (Node.js)
- **AI:** Groq API running Llama 3.1 (8B, instant) for fast, free-tier inference
- **Hosting:** Netlify

## How it works
1. User pastes resume text + job description in the browser
2. Frontend calls a Netlify serverless function (`/netlify/functions/analyze.js`)
3. The function calls Groq's chat completions API with a structured prompt, asking for a strict JSON response (score, keywords, strengths, suggestions)
4. The frontend renders the result, including an animated match-score dial

The API key is never exposed client-side — it lives only in the serverless function's environment variables.

## Run locally
```bash
npm install -g netlify-cli
netlify dev
```
Set your `GROQ_API_KEY` in a `.env` file or via `netlify env:set GROQ_API_KEY your_key_here`.

## Live demo
[Add your deployed URL here once live]

## Author
Jawad Ali Raza
