const { chromium } = require('playwright');

async function testAllSimulations() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Track test results
  const results = {
    goalsSimulation: { status: 'pending', details: '' },
    mainSimulation: { status: 'pending', details: '' },
    apiCalls: []
  };

  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]:', text);
    } else if (text.includes('SIMULATION') || text.includes('simulation')) {
      console.log(`[BROWSER]:`, text);
    }
  });

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('/api/simulation/')) {
      const requestData = {
        url: request.url(),
        method: request.method(),
        body: request.postDataJSON()
      };
      results.apiCalls.push(requestData);
      console.log('[API REQUEST]:', requestData);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/simulation/')) {
      console.log('[API RESPONSE]:', response.status(), response.url());
      if (response.ok()) {
        try {
          const data = await response.json();
          console.log('[RESPONSE SUCCESS]:', data.success ? 'TRUE' : 'FALSE');
        } catch (e) {}
      }
    }
  });

  try {
    // 1. Navigate and login
    console.log('\n=== PHASE 1: SETUP ===');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    const loginButton = await page.$('button:has-text("Login")');
    if (loginButton) {
      await loginButton.click();
      await page.waitForTimeout(2000);
    }

    // Select profile
    const profileCards = await page.$$('[class*="cursor-pointer"]');
    if (profileCards.length > 0) {
      await profileCards[0].click();
      await page.waitForTimeout(2000);
    }

    // 2. Test simulation from Goals screen
    console.log('\n=== PHASE 2: GOALS SCREEN SIMULATION ===');
    const goalsNav = await page.$('text=Goals');
    if (goalsNav) {
      await goalsNav.click();
      await page.waitForTimeout(2000);
      
      // Look for play buttons
      const playButtons = await page.$$('button[aria-label*="Run simulation"], button[title*="Run simulation"]');
      console.log(`Found ${playButtons.length} simulation buttons on goals`);
      
      if (playButtons.length > 0) {
        console.log('Clicking first simulation button...');
        await playButtons[0].click();
        await page.waitForTimeout(2000);
        
        // Check if we're on setup screen
        const setupScreen = await page.$('text=Run with Current Profile');
        if (setupScreen) {
          console.log('✅ Successfully navigated to simulation setup screen from goals!');
          results.goalsSimulation.status = 'success';
          results.goalsSimulation.details = 'Navigation to setup screen works';
          
          // Run the simulation
          await setupScreen.click();
          await page.waitForTimeout(5000);
          
          // Check for results
          const resultsTitle = await page.$('text=Simulation Results');
          if (resultsTitle) {
            console.log('✅ Simulation completed and results displayed!');
            results.goalsSimulation.details += ', Results displayed successfully';
          } else {
            console.log('⚠️ Results screen not reached');
            results.goalsSimulation.details += ', Results screen not displayed';
          }
        } else {
          console.log('❌ Setup screen not reached from goals');
          results.goalsSimulation.status = 'failed';
          results.goalsSimulation.details = 'Setup screen not displayed';
        }
      } else {
        console.log('❌ No simulation buttons found on goals');
        results.goalsSimulation.status = 'failed';
        results.goalsSimulation.details = 'No simulation buttons on goals';
      }
    }

    // 3. Test simulation from main Simulations screen
    console.log('\n=== PHASE 3: MAIN SIMULATIONS SCREEN ===');
    const simulationsNav = await page.$('text=Simulations');
    if (simulationsNav) {
      await simulationsNav.click();
      await page.waitForTimeout(2000);
      
      // Click first simulation card
      const simulationCards = await page.$$('[class*="cursor-pointer"][class*="card"], [class*="GlassCard"]');
      console.log(`Found ${simulationCards.length} simulation cards`);
      
      if (simulationCards.length > 0) {
        console.log('Clicking first simulation card...');
        await simulationCards[0].click();
        await page.waitForTimeout(2000);
        
        // Check if we're on setup screen
        const setupScreen = await page.$('text=Run with Current Profile');
        if (setupScreen) {
          console.log('✅ Successfully navigated to simulation setup from main screen!');
          results.mainSimulation.status = 'success';
          results.mainSimulation.details = 'Navigation works from main simulations';
          
          // Try parameter-based simulation
          const paramButton = await page.$('button:has-text("Run Simulation")');
          if (paramButton) {
            await paramButton.click();
            await page.waitForTimeout(5000);
            
            const resultsTitle = await page.$('text=Simulation Results');
            if (resultsTitle) {
              console.log('✅ Parameter-based simulation completed!');
              results.mainSimulation.details += ', Parameter simulation works';
            }
          }
        } else {
          console.log('❌ Setup screen not reached from main simulations');
          results.mainSimulation.status = 'failed';
          results.mainSimulation.details = 'Setup screen not displayed';
        }
      }
    }

    // 4. Generate report
    console.log('\n=== FINAL REPORT ===');
    console.log('Goals Screen Simulation:', results.goalsSimulation);
    console.log('Main Screen Simulation:', results.mainSimulation);
    console.log(`API Calls Made: ${results.apiCalls.length}`);
    
    if (results.apiCalls.length > 0) {
      console.log('API Endpoints Hit:');
      results.apiCalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url}`);
      });
    }

    // Take final screenshot
    await page.screenshot({ path: 'simulation-test-complete.png' });

  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'simulation-test-error.png' });
  } finally {
    await browser.close();
  }
}

testAllSimulations().catch(console.error);