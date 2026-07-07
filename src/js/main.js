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
    updatedResumePreview: document.getElementById('updatedResumePreview'),
    updatedResumeBox: document.getElementById('updatedResumeBox'),
    toggleEditBtn: document.getElementById('toggleEditBtn'),
    checkUpdatedBtn: document.getElementById('checkUpdatedBtn'),
    updatedStatus: document.getElementById('updatedStatus'),
    uploadPdfBtn: document.getElementById('uploadPdfBtn'),
    resumePdfInput: document.getElementById('resumePdfInput'),
    pdfUploadStatus: document.getElementById('pdfUploadStatus'),
  };

  let extractedBullets = [];
  let updatedResumeText = null;
  let isEditingRaw = false;

  function setStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.classList.toggle('error', !!isError);
  }

  function stripMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  }

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

  els.rewriteResults.addEventListener('click', (e) => {
    const btn = e.target.closest('.use-btn');
    if (!btn) return;

    const { _original, _rewrite } = btn;
    if (!_original || !_rewrite) return;

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

    els.updatedResumeBox.value = updatedResumeText;
    window.render.renderUpdatedResumePreview(
      els.updatedResumeCard,
      els.updatedResumePreview,
      updatedResumeText,
      _rewrite
    );
  });

  els.toggleEditBtn.addEventListener('click', () => {
    isEditingRaw = !isEditingRaw;

    if (isEditingRaw) {
      els.updatedResumeBox.value = updatedResumeText || '';
      els.updatedResumeBox.style.display = 'block';
      els.updatedResumePreview.style.display = 'none';
      els.toggleEditBtn.textContent = 'Preview';
    } else {
      updatedResumeText = els.updatedResumeBox.value;
      window.render.renderUpdatedResumePreview(
        els.updatedResumeCard,
        els.updatedResumePreview,
        updatedResumeText,
        null
      );
      els.updatedResumeBox.style.display = 'none';
      els.updatedResumePreview.style.display = 'block';
      els.toggleEditBtn.textContent = 'Edit Manually';
    }
  });

  els.checkUpdatedBtn.addEventListener('click', async () => {
    const job = els.job.value.trim();
    if (!job) {
      els.updatedStatus.textContent = 'Job description is required to check the score.';
      els.updatedStatus.classList.add('error');
      return;
    }

    if (isEditingRaw) {
      updatedResumeText = els.updatedResumeBox.value.trim();
    }

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

  els.uploadPdfBtn.addEventListener('click', () => {
    els.resumePdfInput.click();
  });

  els.resumePdfInput.addEventListener('change', async () => {
    const file = els.resumePdfInput.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      els.pdfUploadStatus.textContent = 'Please select a PDF file.';
      els.pdfUploadStatus.classList.add('error');
      return;
    }

    els.pdfUploadStatus.textContent = 'Extracting text…';
    els.pdfUploadStatus.classList.remove('error', 'success');
    els.uploadPdfBtn.disabled = true;

    try {
      const text = await window.pdfExtract.extractTextFromPdf(file);
      if (!text.trim()) {
        els.pdfUploadStatus.textContent = 'No selectable text found — this PDF may be a scanned image.';
        els.pdfUploadStatus.classList.add('error');
        return;
      }
      els.resume.value = text;
      els.pdfUploadStatus.textContent = `Extracted text from "${file.name}"`;
      els.pdfUploadStatus.classList.add('success');
    } catch (err) {
      console.error(err);
      els.pdfUploadStatus.textContent = 'Failed to read PDF. Try pasting the text manually.';
      els.pdfUploadStatus.classList.add('error');
    } finally {
      els.uploadPdfBtn.disabled = false;
      els.resumePdfInput.value = '';
    }
  });

  els.btn.addEventListener('click', runAnalysis);
  els.rewriteBtn.addEventListener('click', runBulletRewrite);
});