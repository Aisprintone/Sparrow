import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(2000);
    
    // Click Continue with FaceID
    const faceIdButton = await page.$('button:has-text("Continue with FaceID")');
    if (faceIdButton) {
      await faceIdButton.click();
      await page.waitForTimeout(2000);
    }

    // Click on the first profile card using the cursor-pointer class
    console.log('Looking for clickable profile cards...');
    const profileCard = await page.$('.cursor-pointer');
    
    if (profileCard) {
      console.log('Found clickable profile card, clicking...');
      await profileCard.click();
      await page.waitForTimeout(4000);
      
      // Take screenshot after click
      await page.screenshot({ path: 'after-profile-selected.png', fullPage: true });
      console.log('Screenshot saved: after-profile-selected.png');
      
      // Check if we have navigation now
      const hasBottomNav = await page.$('.bottom-0, nav, [class*="nav"]');
      if (hasBottomNav) {
        console.log('Bottom navigation found!');
        
        // Look for Goals button
        const goalsButton = await page.$('button[aria-label="Goals"]');
        if (goalsButton) {
          console.log('Found Goals button, clicking...');
          await goalsButton.click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({ 
            path: 'goals-screen-reached.png',
            fullPage: true 
          });
          console.log('Screenshot saved: goals-screen-reached.png');
          
          // Now analyze the goals page layout
          console.log('Analyzing goals page layout...');
          
          const layoutAnalysis = await page.evaluate(() => {
            const issues = [];
            
            // Check for overflow
            if (document.body.scrollWidth > document.body.clientWidth) {
              issues.push('Horizontal overflow detected');
            }
            
            // Check goal cards layout
            const goalCards = document.querySelectorAll('[class*="grid"] > div, [class*="card"]');
            const cardStyles = Array.from(goalCards).slice(0, 5).map((card, i) => {
              const styles = getComputedStyle(card);
              const rect = card.getBoundingClientRect();
              return {
                index: i,
                className: card.className,
                width: styles.width,
                height: styles.height,
                display: styles.display,
                flexDirection: styles.flexDirection,
                padding: styles.padding,
                margin: styles.margin,
                position: styles.position,
                bounds: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                }
              };
            });
            
            // Check for inline styles (cache-breaking styles)
            const inlineStyledElements = document.querySelectorAll('[style]');
            const inlineStyles = Array.from(inlineStyledElements).slice(0, 10).map((el, i) => ({
              index: i,
              className: el.className,
              style: el.getAttribute('style'),
              tagName: el.tagName
            }));
            
            return {
              issues,
              cardStyles,
              inlineStyles,
              totalInlineElements: inlineStyledElements.length,
              bodyWidth: document.body.scrollWidth,
              viewportWidth: window.innerWidth
            };
          });
          
          console.log('Layout Analysis:', JSON.stringify(layoutAnalysis, null, 2));
          
          // Test scrolling behavior
          console.log('Testing scroll behavior...');
          await page.evaluate(() => window.scrollTo(0, 300));
          await page.waitForTimeout(1000);
          await page.screenshot({ 
            path: 'goals-screen-scrolled.png',
            fullPage: true 
          });
          
          // Test different viewport sizes to check responsive behavior
          const viewports = [
            { width: 375, height: 812, name: 'iphone-x' },
            { width: 390, height: 844, name: 'iphone-12' },
            { width: 414, height: 896, name: 'iphone-plus' }
          ];
          
          for (const viewport of viewports) {
            await context.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.waitForTimeout(1000);
            await page.screenshot({ 
              path: `goals-screen-${viewport.name}.png`,
              fullPage: true 
            });
          }
          
        } else {
          console.log('Goals button not found in navigation');
          const navButtons = await page.$$eval('button[aria-label], nav button', buttons =>
            buttons.map(btn => ({
              ariaLabel: btn.getAttribute('aria-label'),
              text: btn.textContent?.trim()
            }))
          );
          console.log('Available nav buttons:', navButtons);
        }
      } else {
        console.log('No bottom navigation found after profile selection');
        const pageContent = await page.evaluate(() => document.body.innerText);
        console.log('Page content includes:', pageContent.slice(0, 200));
      }
      
    } else {
      console.log('No clickable profile card found');
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'click-profile-error.png' });
  }

  await browser.close();
})();