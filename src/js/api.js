async function analyze(resume, job) {
  const res = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, job }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Analysis failed.');
  return data;
}

async function analyzeSections(resume, job) {
  const res = await fetch('/.netlify/functions/analyze-sections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, job }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Section scoring failed.');
  return data;
}

async function rewriteBullets(bullets, job) {
  const res = await fetch('/.netlify/functions/rewrite-bullets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bullets, job }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Bullet rewrite failed.');
  return data;
}

window.api = { analyze, analyzeSections, rewriteBullets };