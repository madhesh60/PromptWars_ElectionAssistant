const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Load the local HTML file
  await page.goto(`file://${__dirname}/../frontend/index.html`);
  
  const results = await new AxePuppeteer(page).analyze();
  
  console.log(`Found ${results.violations.length} accessibility violations`);
  
  if (results.violations.length > 0) {
    results.violations.forEach(v => {
      console.log(`\nViolation: ${v.id} - ${v.description}`);
      console.log(`Impact: ${v.impact}`);
      console.log(`Help: ${v.help} (${v.helpUrl})`);
      console.log('Nodes:');
      v.nodes.forEach(n => {
        console.log(` - ${n.html}`);
        console.log(`   Failure Summary: ${n.failureSummary}`);
      });
    });
  }
  
  await browser.close();
})();
