// Lightweight heuristic splitter — used for future features that need to
// isolate bullets by section without another LLM round-trip.

const SECTION_HEADERS = ['summary', 'experience', 'skills', 'education', 'projects'];

function splitIntoSections(resumeText) {
  const lines = resumeText.split('\n');
  const sections = {};
  let current = 'unlabeled';
  sections[current] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase().replace(/[^a-z ]/g, '');
    const matchedHeader = SECTION_HEADERS.find(h => lower === h || lower.startsWith(h + ' '));
    if (matchedHeader && trimmed.length < 40) {
      current = matchedHeader;
      sections[current] = sections[current] || [];
      continue;
    }
    if (trimmed) sections[current].push(trimmed);
  }
  return sections;
}

module.exports = { splitIntoSections };