# ResumeLens

An AI-powered resume-vs-job-description match analyzer. Paste your resume and a job posting, and get back a match score, matched/missing keywords, strengths, and specific suggestions — the same kind of feedback an ATS or recruiter's first pass gives, generated in seconds.

**Live demo:** https://jawad-resumelens.netlify.app/

---

## Why I built this

While applying for entry-level Software Engineer roles, I found myself manually iterating on my resume against ATS checkers, tweaking wording and keywords with no real feedback loop. I built ResumeLens to automate that process with a real LLM integration — and to have a concrete, deployed example of working with AI APIs in a production-style app, not just a notebook experiment.

The project has since grown beyond the initial app into a full CI/CD exercise: containerizing the backend, automating builds with GitHub Actions, and deploying to a second hosting platform (Railway) alongside the original Netlify deployment.

---

## Features

- Paste a resume and job description, get an instant match score (0–100)
- Matched and missing keyword extraction
- Section-by-section scoring (Summary, Experience, Skills, Education, Projects)
- AI-rewritten bullet point suggestions tailored to the target job
- Animated match-score dial on the frontend
- No resume data stored — every request is processed and discarded

---

## How it works

1. User pastes resume text + job description in the browser
2. The frontend calls a backend API route for analysis, section scoring, or bullet rewriting
3. The backend calls the Groq API with a structured prompt, requesting a strict JSON response (score, keywords, strengths, suggestions)
4. The frontend renders the result, including the animated match-score dial

The AI API key is never exposed client-side — it lives only in server-side environment variables, injected at runtime.

---

## Architecture

ResumeLens ships two ways:

**Serverless (original / production frontend)**
```
Browser → Netlify Functions (Node.js) → Groq API
```

**Containerized (CI/CD track)**
```
Browser → Express server (wraps the same function handlers)
        → Docker container
        → built + pushed by GitHub Actions on every push to main
        → GitHub Container Registry (GHCR)
        → deployed on Railway
```

Both share the same core analysis logic — the Express layer wraps the existing serverless handlers rather than duplicating them, so there's a single source of truth for the AI logic.

---

## Tech stack

- **Frontend:** Vanilla HTML/CSS/JS — no framework, no build step
- **Backend:** Node.js — Netlify serverless functions, wrapped in an Express server for the containerized deployment
- **AI:** Groq API running Llama 3.1 (8B, instant) for fast inference
- **Containerization:** Docker
- **CI/CD:** GitHub Actions — builds and pushes a Docker image to GHCR on every push to `main`
- **Hosting:** Netlify (serverless) and Railway (containerized)

---

## Project structure

```
ResumeLens/
├── netlify/
│   └── functions/
│       ├── _lib/
│       │   ├── groqClient.js      # Groq API client wrapper
│       │   ├── parseResume.js     # resume text parsing helpers
│       │   ├── prompts.js         # LLM prompt templates
│       │   └── schemas.js         # response validation schemas
│       ├── analyze.js             # match score + keywords
│       ├── analyze-sections.js    # per-section scoring
│       └── rewrite-bullets.js     # bullet point rewriting
├── src/
│   ├── css/
│   ├── js/
│   └── index.html
├── server.js                      # Express wrapper for containerized deployment
├── Dockerfile
├── .dockerignore
├── .github/
│   └── workflows/
│       └── docker-build.yml       # CI: build + push image to GHCR
├── netlify.toml
└── package.json
```

---

## API endpoints

All endpoints accept `POST` with a JSON body and return JSON.

| Endpoint | Body | Returns |
|---|---|---|
| `/api/analyze` | `{ resume, job }` | Match score, summary, matched/missing keywords, strengths, suggestions |
| `/api/analyze-sections` | `{ resume, job }` | Per-section scores and rationale |
| `/api/rewrite-bullets` | `{ bullets: string[], job }` | Rewritten bullet point options tailored to the job |

---

## Running locally (serverless mode)

```bash
npm install -g netlify-cli
netlify dev
```

Set your Groq API key as an environment variable before running (e.g. in a local `.env` file, which is git-ignored — never commit real keys):

```
GROQ_API_KEY=your_key_here
```

---

## Running locally (containerized mode)

```bash
npm install
node server.js
```

Or with Docker:

```bash
docker build -t resumelens .
docker run -p 3000:3000 -e GROQ_API_KEY=your_key_here resumelens
```

Test it:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"resume": "your resume text", "job": "target job description"}'
```

---

## CI/CD pipeline

On every push to `main`, GitHub Actions:

1. Checks out the repo
2. Logs in to GitHub Container Registry
3. Builds the Docker image
4. Pushes it to `ghcr.io/<owner>/resumelens:latest`

From there, Railway pulls the latest image and deploys it automatically.

Workflow file: `.github/workflows/docker-build.yml`

---

## Environment variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key used for all LLM calls. Required in both serverless and containerized modes. Never committed — set via `.env` locally (git-ignored) or the hosting platform's environment/secrets settings in production. |
| `PORT` | (Optional, containerized mode only) Port the Express server listens on. Defaults to `3000`; Railway injects this automatically. |

---

## Roadmap

- [ ] Resume file upload (PDF) instead of paste-only
- [ ] Export analysis results as a downloadable report
- [ ] Support for additional LLM providers

---

## License

ISC

## Author

**Jawad Ali Raza (JD)**
