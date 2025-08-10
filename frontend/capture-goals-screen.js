import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
  });
  const page = await context.newPage();

  try {
    // Navigate and get to dashboard
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(2000);
    
    // Login flow
    const faceIdButton = await page.$('button:has-text("Continue with FaceID")');
    if (faceIdButton) await faceIdButton.click();
    await page.waitForTimeout(2000);

    const profileCard = await page.$('.cursor-pointer');
    if (profileCard) await profileCard.click();
    await page.waitForTimeout(4000);

    console.log('On dashboard, trying to access Goals...');

    // Try multiple methods to click Goals
    let goalsClicked = false;
    
    // Method 1: Direct text click
    try {
      await page.waitForSelector('text=Goals', { timeout: 5000 });
      await page.click('text=Goals');
      goalsClicked = true;
      console.log('✅ Clicked Goals via text');
    } catch (e) {
      console.log('❌ Text method failed');
    }

    if (!goalsClicked) {
      // Method 2: Click on the bottom nav area where Goals should be
      try {
        // Find the navigation container
        const nav = await page.$('.sticky.bottom-0, nav, [class*="bottom"]');
        if (nav) {
          const box = await nav.boundingBox();
          // Goals is usually the second button (after Home)
          const x = box.x + (box.width / 5) * 1.5;
          const y = box.y + box.height / 2;
          
          await page.mouse.click(x, y);
          goalsClicked = true;
          console.log('✅ Clicked Goals via coordinates');
        }
      } catch (e) {
        console.log('❌ Coordinate method failed:', e.message);
      }
    }

    if (!goalsClicked) {
      // Method 3: Try finding Target icon (Goals icon)
      try {
        await page.click('[data-lucide="target"], svg[class*="target"]');
        goalsClicked = true;
        console.log('✅ Clicked Goals via icon');
      } catch (e) {
        console.log('❌ Icon method failed');
      }
    }

    await page.waitForTimeout(3000);

    // Take screenshot of what we have
    await page.screenshot({ 
      path: 'current-screen-debug.png',
      fullPage: true 
    });

    // Check if we're on the goals page by looking for goals-specific content
    const pageContent = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasGoalsTitle: text.includes('financial goals') || text.includes('goals'),
        hasCreateGoal: text.includes('add goal') || text.includes('create goal'),
        hasProgressText: text.includes('progress') || text.includes('target'),
        currentUrl: window.location.href,
        pageTitle: document.title,
        mainHeading: document.querySelector('h1, h2')?.textContent || 'No heading found'
      };
    });

    console.log('Page analysis:', pageContent);

    // If we're on the goals page, analyze the layout
    if (pageContent.hasGoalsTitle || pageContent.hasCreateGoal) {
      console.log('🎉 Successfully reached Goals page!');
      
      // Do detailed layout analysis
      const layoutAnalysis = await page.evaluate(() => {
        const issues = {
          cacheBreakingStyles: [],
          layoutProblems: [],
          recommendations: []
        };

        // Find all elements with inline styles that could break caching
        document.querySelectorAll('[style]').forEach((el, i) => {
          const style = el.getAttribute('style');
          if (style && (
            style.includes('height:') ||
            style.includes('width:') ||
            style.includes('display:') ||
            style.includes('flex') ||
            style.includes('gap:') ||
            style.includes('margin') ||
            style.includes('padding')
          )) {
            issues.cacheBreakingStyles.push({
              element: `${el.tagName}.${el.className}`,
              style: style,
              text: (el.textContent || '').slice(0, 30)
            });
          }
        });

        // Check for common layout problems
        const cards = document.querySelectorAll('[class*="card"], [class*="goal"], .grid > div');
        cards.forEach((card, i) => {
          const styles = getComputedStyle(card);
          const rect = card.getBoundingClientRect();
          
          if (rect.width > window.innerWidth) {
            issues.layoutProblems.push({
              type: 'overflow',
              element: `Card ${i}`,
              problem: 'Wider than viewport',
              width: rect.width,
              viewport: window.innerWidth
            });
          }

          if (card.getAttribute('style')?.includes('height: 100%') || 
              card.getAttribute('style')?.includes('display: flex')) {
            issues.layoutProblems.push({
              type: 'cache-breaking',
              element: `Card ${i}`,
              problem: 'Uses inline layout styles',
              style: card.getAttribute('style')
            });
          }
        });

        // Generate recommendations
        if (issues.cacheBreakingStyles.length > 0) {
          issues.recommendations.push(
            'Replace inline styles with CSS classes to improve caching'
          );
        }

        if (issues.layoutProblems.some(p => p.type === 'overflow')) {
          issues.recommendations.push(
            'Use responsive units (%, rem, vw) instead of fixed widths'
          );
        }

        if (document.querySelectorAll('[style*="gap:"]').length > 0) {
          issues.recommendations.push(
            'Move gap styles from inline to CSS classes'
          );
        }

        return issues;
      });

      console.log('🔍 Layout Analysis Results:');
      console.log(JSON.stringify(layoutAnalysis, null, 2));

      // Test multiple viewport sizes
      const testViewports = [
        { width: 375, height: 812 }, // iPhone X
        { width: 390, height: 844 }, // iPhone 12
        { width: 414, height: 896 }, // iPhone Plus
      ];

      for (const vp of testViewports) {
        await page.setViewportSize(vp);
        await page.waitForTimeout(1000);
        await page.screenshot({ 
          path: `goals-${vp.width}x${vp.height}.png`,
          fullPage: true 
        });
      }

    } else {
      console.log('❌ Did not reach Goals page, still on:', pageContent.currentUrl);
      
      // Debug: Show what navigation options are available
      const navInfo = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(btn => ({
          text: btn.textContent?.trim() || 'No text',
          ariaLabel: btn.getAttribute('aria-label') || 'No label',
          className: btn.className,
          visible: btn.offsetParent !== null
        })).filter(b => b.visible);
      });
      
      console.log('Available navigation buttons:', navInfo);
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'capture-error.png' });
  }

  await browser.close();
})();