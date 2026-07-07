function extractBullets(resumeText) {
  const lines = resumeText.split('\n');
  const bulletPattern = /^\s*([-•*]|\d+[.)])\s+(.{15,})/;
  const skillListPattern = /^[A-Za-z &/]+:\s/;
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