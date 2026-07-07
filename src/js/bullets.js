// Extracts bullet-like lines from raw resume text for the rewrite feature.

function extractBullets(resumeText) {
  const lines = resumeText.split('\n');
  const bulletPattern = /^\s*([-•*]|\d+[.)])\s+(.{15,})/; // require some real content, not just headers
  const skillListPattern = /^[A-Za-z &/]+:\s/; // catches "Languages: Python, Java..." style lines
  const bullets = [];

  lines.forEach(line => {
    const match = line.match(bulletPattern);
    if (match && !skillListPattern.test(match[2])) {
      bullets.push(match[2].trim());
    }
  });

  return bullets;
}

window.bullets = { extractBullets };