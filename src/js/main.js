document.addEventListener('DOMContentLoaded', () => {
  const els = {
    resume: document.getElementById('resumeBox'),
    job: document.getElementById('jobBox'),
    btn: document.getElementById('analyzeBtn'),
    status: document.getElementById('status'),
    results: document.getElementById('results'),
    scoreArc: document.getElementById('scoreArc'),
    scoreNum: document.getElementById('scoreNum'),
    summaryText: document.getElementById('summaryText'),
    matchedChips: document.getElementById('matchedChips'),
    missingChips: document.getElementById('missingChips'),
    strengthsList: document.getElementById('strengthsList'),
    suggestionsList: document.getElementById('suggestionsList'),
    sectionScores: document.getElementById('sectionScores'),
    bulletChecklist: document.getElementById('bulletChecklist'),
    rewriteBtn: document.getElementById('rewriteBtn'),
    rewriteResults: document.getElementById('rewriteResults'),
    rewriteStatus: document.getElementById('rewriteStatus'),
  };

  let extractedBullets = [];

  function setStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.classList.toggle('error', !!isError);
  }

  // NEW — strips literal markdown bold (**text**) from pasted resume text
  // so it never leaks into the UI, the LLM prompts, or the bullet checklist.
  function stripMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  }

  async function runAnalysis() {
    // NEW — clean the resume text right at the source, before anything uses it
    const resume = stripMarkdown(els.resume.value.trim());
    const job = els.job.value.trim();
    if (!resume || !job) {
      setStatus('Paste both your resume and a job description first.', true);
      return;
    }

    els.btn.disabled = true;
    setStatus('Analyzing… this takes a few seconds.');
    els.results.classList.remove('visible');

    try {
      // Run both calls in parallel — independent requests, no need to wait on each other.
      const [mainResult, sectionsResult] = await Promise.allSettled([
        window.api.analyze(resume, job),
        window.api.analyzeSections(resume, job),
      ]);

      if (mainResult.status === 'fulfilled') {
        window.render.renderMainScore(els, mainResult.value);
      } else {
        setStatus(mainResult.reason.message, true);
      }

      if (sectionsResult.status === 'fulfilled') {
        window.render.renderSectionScores(els.sectionScores, sectionsResult.value);
      } else {
        // Section scoring is a bonus feature — don't block the whole UI if it fails.
        els.sectionScores.innerHTML = '<span class="empty-note">Section scoring unavailable right now</span>';
        console.error(sectionsResult.reason);
      }

      if (mainResult.status === 'fulfilled') {
        setStatus('');
        els.results.classList.add('visible');

        // extract bullets from the (already markdown-stripped) resume and render the checklist
        extractedBullets = window.bullets.extractBullets(resume);
        window.render.renderBulletChecklist(els.bulletChecklist, extractedBullets);
      }
    } catch (err) {
      console.error(err);
      setStatus('Network error — check your connection and try again.', true);
    } finally {
      els.btn.disabled = false;
    }
  }

  async function runBulletRewrite() {
    const checked = [...els.bulletChecklist.querySelectorAll('.bullet-check:checked')];
    const selectedBullets = checked.map(cb => extractedBullets[Number(cb.dataset.bulletIndex)]);

    if (!selectedBullets.length) {
      els.rewriteStatus.textContent = 'Select at least one bullet to rewrite.';
      return;
    }

    els.rewriteBtn.disabled = true;
    els.rewriteStatus.textContent = 'Rewriting…';

    try {
      const job = els.job.value.trim();
      const data = await window.api.rewriteBullets(selectedBullets, job);
      window.render.renderRewriteResults(els.rewriteResults, data);
      els.rewriteStatus.textContent = '';
    } catch (err) {
      els.rewriteStatus.textContent = err.message;
      console.error(err);
    } finally {
      els.rewriteBtn.disabled = false;
    }
  }

  els.btn.addEventListener('click', runAnalysis);
  els.rewriteBtn.addEventListener('click', runBulletRewrite);
});