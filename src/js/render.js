// All DOM rendering lives here — main.js just calls these with data.

const CIRC = 2 * Math.PI * 44; // matches the SVG radius in index.html

function renderMainScore(els, data) {
  const score = Math.max(0, Math.min(100, Number(data.match_score) || 0));
  const offset = CIRC - (CIRC * score) / 100;
  els.scoreArc.style.strokeDashoffset = offset;
  els.scoreNum.textContent = score;
  els.summaryText.textContent = data.summary || '—';

  renderChips(els.matchedChips, data.matched_keywords, 'matched');
  renderChips(els.missingChips, data.missing_keywords, 'missing');
  renderList(els.strengthsList, data.strengths);
  renderList(els.suggestionsList, data.suggestions);
}

function renderChips(container, items, cls) {
  container.innerHTML = '';
  (items || []).forEach(t => {
    const span = document.createElement('span');
    span.className = `chip ${cls}`;
    span.textContent = t;
    container.appendChild(span);
  });
  if (!items || !items.length) {
    container.innerHTML = '<span class="empty-note">None found</span>';
  }
}

function renderList(container, items) {
  container.innerHTML = '';
  (items || []).forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    container.appendChild(li);
  });
}

function scoreColor(score) {
  if (score >= 75) return 'var(--good)';
  if (score >= 45) return 'var(--amber)';
  return 'var(--bad)';
}

function renderSectionScores(container, data) {
  container.innerHTML = '';
  const sections = data.sections || [];

  if (!sections.length) {
    container.innerHTML = '<span class="empty-note">No sections detected</span>';
    return;
  }

  sections.forEach(sec => {
    const score = Math.max(0, Math.min(100, Number(sec.score) || 0));
    const row = document.createElement('div');
    row.className = 'section-row';
    row.innerHTML = `
      <div class="section-row-top">
        <span class="section-name">${sec.name}</span>
        <span class="section-score" style="color:${scoreColor(score)}">${score}</span>
      </div>
      <div class="section-bar-track">
        <div class="section-bar-fill" style="width:${score}%; background:${scoreColor(score)}"></div>
      </div>
      <p class="section-rationale">${sec.rationale || ''}</p>
    `;
    container.appendChild(row);
  });
}

function renderBulletChecklist(container, bullets) {
  container.innerHTML = '';
  if (!bullets.length) {
    container.innerHTML = '<span class="empty-note">No bullet points detected — make sure your resume uses "-" or "•" for bullets.</span>';
    return;
  }

  bullets.forEach((text, i) => {
    const row = document.createElement('label');
    row.className = 'bullet-check-row';
    row.innerHTML = `
      <input type="checkbox" class="bullet-check" data-bullet-index="${i}">
      <span>${text}</span>
    `;
    container.appendChild(row);
  });
}

function renderRewriteResults(container, data) {
  container.innerHTML = '';
  const rewrites = data.rewrites || [];

  rewrites.forEach(item => {
    const card = document.createElement('div');
    card.className = 'rewrite-card';

    const originalP = document.createElement('p');
    originalP.className = 'rewrite-original';
    originalP.textContent = `"${item.original}"`;
    card.appendChild(originalP);

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'rewrite-options';

    item.options.forEach(opt => {
      const optionRow = document.createElement('div');
      optionRow.className = 'rewrite-option';

      const p = document.createElement('p');
      p.textContent = opt;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'use-btn';
      btn.textContent = 'Use';
      // Store as JS properties, not HTML attributes — avoids escaping issues with quotes/special chars
      btn._original = item.original;
      btn._rewrite = opt;

      optionRow.appendChild(p);
      optionRow.appendChild(btn);
      optionsWrap.appendChild(optionRow);
    });

    card.appendChild(optionsWrap);
    container.appendChild(card);
  });
}

// Shows the "Updated Resume Preview" card and populates it with the
// latest text after a rewrite has been accepted via a "Use" click.
function renderUpdatedResumePreview(container, previewEl, fullText, changedLine) {
  container.style.display = 'block';

  const lines = fullText.split('\n');
  previewEl.innerHTML = lines.map(line => {
    if (changedLine && line.trim() === changedLine.trim()) {
      return `<span class="changed-line">${line}</span>`;
    }
    return line;
  }).join('\n');
}

window.render = {
  renderMainScore,
  renderSectionScores,
  renderBulletChecklist,
  renderRewriteResults,
  renderUpdatedResumePreview,
};