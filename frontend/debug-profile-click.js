import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false }); // Run with visible browser
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

    // Debug profile cards - get more specific selectors
    const profileInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('div');
      const profileCards = [];
      
      cards.forEach((card, index) => {
        const text = card.textContent || '';
        if (text.includes('Gen Z Student') || text.includes('Established Millennial')) {
          const rect = card.getBoundingClientRect();
          profileCards.push({
            index,
            text: text.slice(0, 100),
            className: card.className,
            clickable: card.style.cursor === 'pointer' || card.className.includes('cursor-pointer'),
            hasClickHandler: card.onclick !== null,
            bounds: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            }
          });
        }
      });
      
      return profileCards;
    });

    console.log('Profile card info:', JSON.stringify(profileInfo, null, 2));

    // Try clicking on specific coordinates of the first profile
    if (profileInfo.length > 0) {
      const firstProfile = profileInfo[0];
      const centerX = firstProfile.bounds.x + firstProfile.bounds.width / 2;
      const centerY = firstProfile.bounds.y + firstProfile.bounds.height / 2;
      
      console.log(`Clicking at coordinates: ${centerX}, ${centerY}`);
      await page.click(`xpath=//div[contains(text(), "Gen Z Student")]`, { timeout: 5000 });
      await page.waitForTimeout(3000);
      
      // Check if screen changed
      const currentUrl = page.url();
      console.log('Current URL after click:', currentUrl);
      
      const newPageContent = await page.evaluate(() => {
        return {
          title: document.title,
          hasGoals: document.body.textContent.toLowerCase().includes('goal'),
          hasNavigation: !!document.querySelector('nav'),
          hasBottomNav: !!document.querySelector('[class*="bottom"]')
        };
      });
      
      console.log('Page state after profile click:', newPageContent);
      
      // Take screenshot
      await page.screenshot({ path: 'after-profile-click-debug.png', fullPage: true });
    }

    // Wait a bit to see what happens
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'debug-error.png' });
  }

  await browser.close();
})();