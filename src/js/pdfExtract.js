pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct real lines using each fragment's Y position —
    // pdf.js gives flat text fragments with no inherent line breaks.
    let lines = [];
    let currentLine = '';
    let lastY = null;

    textContent.items.forEach(item => {
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
      currentLine += item.str + ' ';
      lastY = y;
    });
    if (currentLine.trim()) lines.push(currentLine.trim());

    fullText += lines.join('\n') + '\n\n';
  }

  // Safety net: if a bullet character still ends up mid-line
  // (some PDF layouts merge fragments unpredictably), force a break before it.
  fullText = fullText.replace(/\s+•\s*/g, '\n• ');

  return fullText.trim();
}

window.pdfExtract = { extractTextFromPdf };