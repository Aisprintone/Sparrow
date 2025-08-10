const { chromium } = require('playwright');

async function manualSimulationTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  const page = await browser.newPage();

  console.log('=== SIMULATION FLOW TEST ===\n');
  console.log('1. Navigate to http://localhost:3000');
  console.log('2. Click "Continue with FaceID" or "Use Passcode"');
  console.log('3. Select a profile (Gen Z, Millennial, or Gen X)');
  console.log('4. Navigate to Goals screen');
  console.log('5. Click the Play button on any goal');
  console.log('6. Observe if simulation setup screen appears');
  console.log('7. Click "Run with Current Profile"');
  console.log('8. Check if results are displayed\n');

  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('SIMULATION') || text.includes('simulation')) {
      console.log(`[CONSOLE]:`, text);
    }
  });

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('/api/simulation/')) {
      console.log('[API CALL]:', request.method(), request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/simulation/')) {
      console.log('[API RESPONSE]:', response.status(), response.statusText());
    }
  });

  await page.goto('http://localhost:3000');
  
  console.log('\nBrowser opened. Please manually test the simulation flow.');
  console.log('The console will log any simulation-related activity.');
  console.log('Press Ctrl+C to exit when done.\n');

  // Keep browser open
  await new Promise(() => {});
}

manualSimulationTest().catch(console.error);