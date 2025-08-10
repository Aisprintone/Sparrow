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
    
    // Step 1: Click Continue with FaceID
    const faceIdButton = await page.$('button:has-text("Continue with FaceID")');
    if (faceIdButton) {
      await faceIdButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 2: Click on profile
    const profileCard = await page.$('.cursor-pointer');
    if (profileCard) {
      await profileCard.click();
      await page.waitForTimeout(4000);
    }

    console.log('Reached dashboard, looking for Goals navigation...');

    // Wait for any overlays to disappear
    await page.waitForTimeout(2000);

    // Method 1: Try clicking on Goals in the bottom navigation using text
    try {
      await page.click('text=Goals', { timeout: 5000 });
      console.log('Clicked Goals via text - success!');
    } catch (e) {
      console.log('Method 1 failed, trying method 2...');
      
      // Method 2: Try using the navigation by coordinates
      const navArea = await page.$('nav, [class*="bottom"], [class*="nav"]');
      if (navArea) {
        const box = await navArea.boundingBox();
        // Click in the second position (Goals is typically second after Home)
        const goalsX = box.x + (box.width / 5) * 1.5; // Second button position
        const goalsY = box.y + box.height / 2;
        
        await page.click(goalsX + "," + goalsY);
        console.log('Clicked Goals via coordinates - success!');
      }
    }

    await page.waitForTimeout(3000);

    // Take screenshot of Goals screen
    await page.screenshot({ 
      path: 'goals-screen-final.png',
      fullPage: true 
    });
    console.log('Screenshot saved: goals-screen-final.png');

    // Analyze the layout issues on the Goals page
    console.log('Analyzing Goals page layout issues...');

    const layoutAnalysis = await page.evaluate(() => {
      const results = {
        layoutIssues: [],
        cacheBreakingElements: [],
        responsiveIssues: [],
        cardLayoutInfo: []
      };

      // 1. Check for horizontal overflow
      if (document.body.scrollWidth > document.body.clientWidth) {
        results.layoutIssues.push({
          type: 'horizontal_overflow',
          details: `Body width: ${document.body.scrollWidth}px vs Viewport: ${document.body.clientWidth}px`
        });
      }

      // 2. Find elements with cache-breaking inline styles
      const elementsWithInlineStyles = document.querySelectorAll('[style]');
      elementsWithInlineStyles.forEach((el, index) => {
        const style = el.getAttribute('style');
        if (style && (
          style.includes('position:') || 
          style.includes('display:') || 
          style.includes('flex') ||
          style.includes('gap:') ||
          style.includes('margin') ||
          style.includes('padding') ||
          style.includes('height:') ||
          style.includes('width:')
        )) {
          results.cacheBreakingElements.push({
            index,
            tagName: el.tagName,
            className: el.className,
            style: style.slice(0, 200), // Truncate long styles
            text: (el.textContent || '').slice(0, 50)
          });
        }
      });

      // 3. Analyze goal cards layout specifically
      const goalCards = document.querySelectorAll('.grid > div, [class*="goal"], [class*="card"]');
      goalCards.forEach((card, index) => {
        if (index < 5) { // Limit to first 5 cards
          const styles = getComputedStyle(card);
          const rect = card.getBoundingClientRect();
          
          results.cardLayoutInfo.push({
            index,
            className: card.className,
            computedStyles: {
              display: styles.display,
              flexDirection: styles.flexDirection,
              gap: styles.gap,
              height: styles.height,
              width: styles.width,
              padding: styles.padding,
              margin: styles.margin,
              position: styles.position
            },
            inlineStyles: card.getAttribute('style') || 'none',
            bounds: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            potentialIssues: []
          });

          // Check for potential layout issues
          if (rect.width > window.innerWidth) {
            results.cardLayoutInfo[index].potentialIssues.push('Card wider than viewport');
          }
          
          if (styles.position === 'fixed' && rect.bottom > window.innerHeight) {
            results.cardLayoutInfo[index].potentialIssues.push('Fixed element extends beyond viewport');
          }

          if (card.getAttribute('style')?.includes('height: 100%')) {
            results.cardLayoutInfo[index].potentialIssues.push('Uses inline height: 100% (cache-breaking)');
          }
        }
      });

      // 4. Check for responsive design issues
      const gridContainers = document.querySelectorAll('[class*="grid"]');
      gridContainers.forEach((container, index) => {
        const styles = getComputedStyle(container);
        const rect = container.getBoundingClientRect();
        
        if (styles.gap && styles.gap.includes('px') && parseFloat(styles.gap) > 20) {
          results.responsiveIssues.push({
            type: 'large_gap',
            element: `Grid ${index}`,
            gap: styles.gap,
            recommendation: 'Consider using rem or responsive gap values'
          });
        }
        
        if (rect.width > window.innerWidth * 1.1) {
          results.responsiveIssues.push({
            type: 'wide_container',
            element: `Grid ${index}`,
            width: rect.width,
            recommendation: 'Container exceeds viewport width'
          });
        }
      });

      return results;
    });

    console.log('=== LAYOUT ANALYSIS RESULTS ===');
    console.log(JSON.stringify(layoutAnalysis, null, 2));

    // Test different viewport sizes to identify responsive issues
    const viewports = [
      { width: 375, height: 812, name: 'iphone-x' },
      { width: 390, height: 844, name: 'iphone-12' },
      { width:414, height: 896, name: 'iphone-plus' },
      { width: 360, height: 740, name: 'android-small' }
    ];

    console.log('Testing responsive behavior across different viewport sizes...');
    
    for (const viewport of viewports) {
      console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      await context.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check for overflow after resize
      const overflowTest = await page.evaluate(() => {
        return {
          hasHorizontalOverflow: document.body.scrollWidth > document.body.clientWidth,
          bodyWidth: document.body.scrollWidth,
          viewportWidth: document.body.clientWidth
        };
      });
      
      console.log(`${viewport.name} overflow test:`, overflowTest);
      
      await page.screenshot({ 
        path: `goals-screen-${viewport.name}-${viewport.width}x${viewport.height}.png`,
        fullPage: true 
      });
    }

    // Test cache-breaking behavior by clearing styles and reloading
    console.log('Testing cache behavior...');
    await page.reload();
    await page.waitForTimeout(5000);
    await page.screenshot({ 
      path: 'goals-screen-after-cache-clear.png',
      fullPage: true 
    });

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'goals-access-error.png', fullPage: true });
  }

  await browser.close();
})();