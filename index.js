const express = require('express');
const { chromium } = require('playwright');
const app = express();

app.get('/get-bill', async (req, res) => {
  const ref = req.query.ref;
  if (!ref) return res.status(400).send('Reference number missing');
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://bill.pitc.com.pk/lescobill');
    await page.fill('input[name="refno"]', ref);
    await page.click('input[type="submit"]');
    await page.waitForSelector('#billTable');

    const billHtml = await page.$eval('#billTable', el => el.outerHTML);
    await browser.close();

    res.send(`
      <div>
        ${billHtml}
        <div style="margin-top:10px;">
          <button onclick="window.print()">🖨️ Print</button>
          <button onclick="downloadPDF()">⬇️ Download PDF</button>
        </div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js"></script>
        <script>
          function downloadPDF() {
            const opt = { margin: 0.5, filename: 'lesco-bill.pdf', html2canvas: {}, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
            html2pdf().from(document.querySelector('#billTable')).set(opt).save();
          }
        </script>
      </div>
    `);
  } catch (err) {
    res.status(500).send('Error fetching bill.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("LESCO bill API running"));
