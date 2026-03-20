const puppeteer = require('puppeteer');
const path = require('path');

async function render(inputPath, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(inputPath)}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
}

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node render.js <input.html> <output.pdf>');
  process.exit(1);
}

render(inputPath, outputPath)
  .then(() => process.exit(0))
  .catch((err) => { console.error(err.message); process.exit(1); });
