const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'optivian-features-report.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  const pdfPath = path.resolve(__dirname, 'OptivianAI_Complete_Feature_Catalog.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:9px;color:#9ca3af;text-align:center;width:100%;padding:5px 40px 0;">OptivianAI — Complete Feature Catalog</div>',
    footerTemplate: '<div style="font-size:9px;color:#9ca3af;text-align:center;width:100%;padding:0 40px 5px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`\n✅ PDF generated successfully!`);
  console.log(`   Location: ${pdfPath}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Pages: A4 format`);
})();
