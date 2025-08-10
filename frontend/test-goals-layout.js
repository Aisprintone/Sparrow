import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // iPhone size
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Step 1: Click "Continue with FaceID" to get past login
    const faceIdButton = await page.$('button:has-text("Continue with FaceID")');
    if (faceIdButton) {
      console.log('Step 1: Clicking Continue with FaceID...');
      await faceIdButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 2: Select a profile (click on the first profile card)
    const profileCards = await page.$$('.rounded-2xl');
    if (profileCards.length > 0) {
      console.log('Step 2: Selecting first profile...');
      await profileCards[0].click();
      await page.waitForTimeout(3000);
    }

    // Take screenshot of dashboard/current screen
    await page.screenshot({ path: 'dashboard-screen.png' });
    console.log('Screenshot saved: dashboard-screen.png');

    // Step 3: Look for bottom navigation and click Goals
    await page.waitForTimeout(1000);
    
    // Try to find the Goals navigation button
    const goalsNavButton = await page.$('button[aria-label="Goals"], button:has-text("Goals")');
    if (goalsNavButton) {
      console.log('Step 3: Found Goals navigation button, clicking...');
      await goalsNavButton.click();
      await page.waitForTimeout(3000);
      
      // Take screenshot of goals screen
      await page.screenshot({ 
        path: 'goals-screen-initial.png',
        fullPage: true 
      });
      console.log('Screenshot saved: goals-screen-initial.png');

      // Test scrolling to see layout behavior
      console.log('Testing scroll behavior...');
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'goals-screen-scrolled.png',
        fullPage: true 
      });

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);

      // Test clicking "Add Goal" if present
      const addGoalButton = await page.$('button:has-text("Add Goal"), button:has-text("Create")');
      if (addGoalButton) {
        console.log('Testing Add Goal button...');
        await addGoalButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ 
          path: 'create-goal-screen.png',
          fullPage: true 
        });
        
        // Navigate back to goals
        const backButton = await page.$('button[aria-label="Back"], button:has-text("Back")');
        if (backButton) {
          await backButton.click();
          await page.waitForTimeout(2000);
        } else {
          // Use navigation
          const goalsNavBtn = await page.$('button[aria-label="Goals"]');
          if (goalsNavBtn) {
            await goalsNavBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }

      // Test responsive behavior
      console.log('Testing responsive behavior...');
      await context.setViewportSize({ width: 375, height: 812 }); // iPhone X size
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'goals-screen-iphone-x.png',
        fullPage: true 
      });

      await context.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13 size
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: 'goals-screen-iphone-12.png',
        fullPage: true 
      });

      // Check for any layout overflow or issues
      const layoutIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check for horizontal overflow
        const body = document.body;
        if (body.scrollWidth > body.clientWidth) {
          issues.push('Horizontal overflow detected');
        }
        
        // Check for fixed positioning issues
        const fixedElements = document.querySelectorAll('[style*="position: fixed"], .fixed');
        fixedElements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
            issues.push(`Fixed element ${index} extends beyond viewport`);
          }
        });
        
        // Check for elements with very large widths
        const wideElements = document.querySelectorAll('*');
        wideElements.forEach((el, index) => {
          const styles = window.getComputedStyle(el);
          if (styles.width && parseInt(styles.width) > window.innerWidth * 1.5) {
            issues.push(`Element ${index} (${el.className}) has excessive width: ${styles.width}`);
          }
        });
        
        return issues;
      });

      console.log('Layout issues detected:', layoutIssues);

      // Get computed styles for key elements
      const styles = await page.evaluate(() => {
        const goalCards = document.querySelectorAll('[class*="goal"], .grid > div, [class*="card"]');
        return Array.from(goalCards).slice(0, 3).map((card, index) => {
          const styles = window.getComputedStyle(card);
          return {
            index,
            className: card.className,
            width: styles.width,
            height: styles.height,
            display: styles.display,
            flexDirection: styles.flexDirection,
            gap: styles.gap,
            padding: styles.padding,
            margin: styles.margin
          };
        });
      });

      console.log('Key element styles:', JSON.stringify(styles, null, 2));

    } else {
      console.log('Goals navigation button not found, checking available buttons...');
      
      // List all available buttons
      const allButtons = await page.$$eval('button', buttons =>
        buttons.filter(btn => btn.offsetParent !== null)
          .map(btn => ({
            text: btn.textContent?.trim() || '',
            ariaLabel: btn.getAttribute('aria-label') || '',
            className: btn.className
          }))
      );
      console.log('Available buttons:', allButtons);

      await page.screenshot({ 
        path: 'no-goals-nav-found.png',
        fullPage: true 
      });
    }

  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'layout-test-error.png', fullPage: true });
  }

  await browser.close();
})();