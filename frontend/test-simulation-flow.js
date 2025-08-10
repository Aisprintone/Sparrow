const { chromium } = require('playwright');

async function testSimulationFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error('[BROWSER ERROR]:', text);
    } else if (text.includes('SIMULATION') || text.includes('error') || text.includes('Error')) {
      console.log(`[BROWSER ${type.toUpperCase()}]:`, text);
    }
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('/simulation/')) {
      console.log('[NETWORK REQUEST]:', request.method(), request.url());
      console.log('[REQUEST BODY]:', request.postDataJSON());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/simulation/')) {
      console.log('[NETWORK RESPONSE]:', response.status(), response.url());
      response.json().then(data => {
        console.log('[RESPONSE DATA]:', JSON.stringify(data, null, 2));
      }).catch(() => {});
    }
  });

  try {
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // Check current screen
    const loginButton = await page.$('button:has-text("Login")');
    if (loginButton) {
      console.log('2. On login screen, clicking login...');
      await loginButton.click();
      await page.waitForTimeout(2000);
    }

    // Check if we're on profile selection
    const profileCards = await page.$$('[class*="cursor-pointer"]');
    if (profileCards.length > 0) {
      console.log('3. On profile selection, clicking first profile...');
      await profileCards[0].click();
      await page.waitForTimeout(2000);
    }

    // Navigate to goals screen using navigation
    console.log('4. Looking for Goals navigation...');
    const goalsNav = await page.$('text=Goals');
    if (goalsNav) {
      console.log('5. Clicking Goals navigation...');
      await goalsNav.click();
      await page.waitForTimeout(2000);
    }

    // Look for simulation play buttons on goals
    console.log('6. Looking for simulation play buttons on goals...');
    const playButtons = await page.$$('button[aria-label*="Run simulation"]');
    console.log(`   Found ${playButtons.length} play buttons`);
    
    if (playButtons.length > 0) {
      console.log('7. Clicking first play button...');
      await playButtons[0].click();
      await page.waitForTimeout(3000);
      
      // Check if we're on simulation setup screen
      const runWithCurrentProfile = await page.$('button:has-text("Run with Current Profile")');
      const runWithParameters = await page.$('button:has-text("Run Simulation")');
      
      if (runWithCurrentProfile) {
        console.log('8. On simulation setup screen, clicking "Run with Current Profile"...');
        await runWithCurrentProfile.click();
        await page.waitForTimeout(5000);
        
        // Check if we reached results
        const resultsScreen = await page.$('text=Simulation Results');
        if (resultsScreen) {
          console.log('✅ SUCCESS: Simulation completed and results displayed!');
        } else {
          console.log('❌ ERROR: Results screen not displayed after simulation');
          await page.screenshot({ path: 'simulation-error.png' });
        }
      } else if (runWithParameters) {
        console.log('8. On simulation setup screen, clicking "Run Simulation"...');
        await runWithParameters.click();
        await page.waitForTimeout(5000);
      } else {
        console.log('❌ ERROR: Simulation setup screen not found');
        await page.screenshot({ path: 'setup-error.png' });
      }
    } else {
      console.log('❌ ERROR: No simulation play buttons found on goals');
      
      // Alternative: Try main simulations screen
      console.log('7b. Trying main simulations screen...');
      const simulationsNav = await page.$('text=Simulations');
      if (simulationsNav) {
        await simulationsNav.click();
        await page.waitForTimeout(2000);
        
        // Click on first simulation card
        const simulationCards = await page.$$('[class*="cursor-pointer"]');
        if (simulationCards.length > 0) {
          console.log('8b. Clicking first simulation card...');
          await simulationCards[0].click();
          await page.waitForTimeout(2000);
          
          // Try to run simulation
          const runButton = await page.$('button:has-text("Run")');
          if (runButton) {
            console.log('9b. Clicking run button...');
            await runButton.click();
            await page.waitForTimeout(5000);
          }
        }
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'final-state.png' });
    console.log('Test complete. Check screenshots for visual confirmation.');

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
}

testSimulationFlow().catch(console.error);