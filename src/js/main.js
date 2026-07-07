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
    updatedResumeCard: document.getElementById('updatedResumeCard'),
    updatedResumeBox: document.getElementById('updatedResumeBox'),
    checkUpdatedBtn: document.getElementById('checkUpdatedBtn'),
    updatedStatus: document.getElementById('updatedStatus'),
  };

  let extractedBullets = [];
  let updatedResumeText = null; // null until the first "Use" click

  function setStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.classList.toggle('error', !!isError);
  }

  function stripMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  }

  // Shared core: runs analysis + section scoring + bullet extraction
  // against whichever resume text is passed in (original or updated).
  async function runAnalysisFor(resumeText, job, { statusEl, resultsEl } = {}) {
    const status = statusEl || els.status;
    const showResults = resultsEl || els.results;

    status.textContent = 'Analyzing… this takes a few seconds.';
    status.classList.remove('error');
    showResults.classList.remove('visible');

    try {
      const [mainResult, sectionsResult] = await Promise.allSettled([
        window.api.analyze(resumeText, job),
        window.api.analyzeSections(resumeText, job),
      ]);

      if (mainResult.status === 'fulfilled') {
        window.render.renderMainScore(els, mainResult.value);
      } else {
        status.textContent = mainResult.reason.message;
        status.classList.add('error');
      }

      if (sectionsResult.status === 'fulfilled') {
        window.render.renderSectionScores(els.sectionScores, sectionsResult.value);
      } else {
        els.sectionScores.innerHTML = '<span class="empty-note">Section scoring unavailable right now</span>';
        console.error(sectionsResult.reason);
      }

      if (mainResult.status === 'fulfilled') {
        status.textContent = '';
        showResults.classList.add('visible');

        extractedBullets = window.bullets.extractBullets(resumeText);
        window.render.renderBulletChecklist(els.bulletChecklist, extractedBullets);
      }

      return mainResult.status === 'fulfilled';
    } catch (err) {
      console.error(err);
      status.textContent = err.message || 'Something went wrong analyzing your resume.';
      status.classList.add('error');
      return false;
    }
  }

  async function runAnalysis() {
    const resume = stripMarkdown(els.resume.value.trim());
    const job = els.job.value.trim();
    if (!resume || !job) {
      setStatus('Paste both your resume and a job description first.', true);
      return;
    }

    els.btn.disabled = true;
    try {
      await runAnalysisFor(resume, job);
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

  // "Use" — updates the separate preview only. No auto re-analysis.
  els.rewriteResults.addEventListener('click', (e) => {
    const btn = e.target.closest('.use-btn');
    if (!btn) return;

    const { _original, _rewrite } = btn;
    if (!_original || !_rewrite) return;

    // Seed the preview from the currently-analyzed resume the first time.
    if (updatedResumeText === null) {
      updatedResumeText = stripMarkdown(els.resume.value.trim());
    }

    if (!updatedResumeText.includes(_original)) {
      btn.textContent = 'Not found';
      return;
    }

    updatedResumeText = updatedResumeText.replace(_original, _rewrite);
    btn.textContent = 'Used ✓';
    btn.classList.add('used');
    btn.disabled = true;

    window.render.showUpdatedResumeCard(els.updatedResumeCard, updatedResumeText);
  });

  // Explicit re-check button — this is the only thing that triggers
  // a fresh API call for the updated resume. User controls the timing.
  els.checkUpdatedBtn.addEventListener('click', async () => {
    const job = els.job.value.trim();
    if (!job) {
      els.updatedStatus.textContent = 'Job description is required to check the score.';
      els.updatedStatus.classList.add('error');
      return;
    }

    // Let manual edits in the preview box count too.
    updatedResumeText = els.updatedResumeBox.value.trim();

    els.checkUpdatedBtn.disabled = true;
    const ok = await runAnalysisFor(updatedResumeText, job, {
      statusEl: els.updatedStatus,
      resultsEl: els.results,
    });
    els.checkUpdatedBtn.disabled = false;

    if (ok) {
      els.updatedStatus.textContent = 'Updated resume checked — results above reflect this version.';
      els.updatedStatus.classList.remove('error');
    }
  });

  els.btn.addEventListener('click', runAnalysis);
  els.rewriteBtn.addEventListener('click', runBulletRewrite);
});