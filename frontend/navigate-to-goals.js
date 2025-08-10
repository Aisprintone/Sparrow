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
    await page.waitForTimeout(3000);
    
    // Take screenshot of login screen
    await page.screenshot({ path: 'step-1-login.png' });
    console.log('Screenshot saved: step-1-login.png');

    // Click "Continue with FaceID" or "Use Passcode" button
    const faceIdButton = await page.$('button:has-text("Continue with FaceID")');
    const passcodeButton = await page.$('button:has-text("Use Passcode")');
    
    if (faceIdButton) {
      console.log('Clicking Continue with FaceID...');
      await faceIdButton.click();
      await page.waitForTimeout(2000);
    } else if (passcodeButton) {
      console.log('Clicking Use Passcode...');
      await passcodeButton.click();
      await page.waitForTimeout(2000);
    }

    // Take screenshot of profile selection
    await page.screenshot({ path: 'step-2-profile-selection.png' });
    console.log('Screenshot saved: step-2-profile-selection.png');

    // Select a profile - look for profile cards
    const profileCard = await page.$('.rounded-2xl, [class*="card"], [class*="profile"]');
    if (profileCard) {
      console.log('Clicking on first profile...');
      await profileCard.click();
      await page.waitForTimeout(3000);
    }

    // Take screenshot after profile selection
    await page.screenshot({ path: 'step-3-after-profile.png' });
    console.log('Screenshot saved: step-3-after-profile.png');

    // Look for navigation or dashboard
    await page.waitForTimeout(2000);
    
    // Check for various ways to navigate to goals
    const goalButton = await page.$('button:has-text("Goals"), a:has-text("Goals"), [data-testid*="goal"], [class*="goal"]');
    const navButton = await page.$('nav button, .bottom-nav button, [role="navigation"] button');
    const menuButton = await page.$('[aria-label="menu"], button[aria-label*="Menu"], .hamburger, [class*="menu"]');

    // Try to find goals navigation
    if (goalButton) {
      console.log('Found Goals button, clicking...');
      await goalButton.click();
      await page.waitForTimeout(2000);
    } else if (navButton) {
      console.log('Found navigation button, clicking...');
      await navButton.click();
      await page.waitForTimeout(1000);
      
      // Look for goals in the nav menu
      const goalNavItem = await page.$('a:has-text("Goals"), button:has-text("Goals")');
      if (goalNavItem) {
        await goalNavItem.click();
        await page.waitForTimeout(2000);
      }
    } else if (menuButton) {
      console.log('Found menu button, clicking...');
      await menuButton.click();
      await page.waitForTimeout(1000);
      
      // Look for goals in the menu
      const goalMenuItem = await page.$('a:has-text("Goals"), button:has-text("Goals")');
      if (goalMenuItem) {
        await goalMenuItem.click();
        await page.waitForTimeout(2000);
      }
    }

    // Try to find any navigation elements
    const allButtons = await page.$$eval('button, a', elements =>
      elements.filter(el => el.offsetParent !== null)
        .map(el => ({
          text: el.textContent?.trim() || '',
          className: el.className,
          href: el.href || '',
          type: el.tagName
        }))
    );
    
    console.log('All visible navigation elements:', allButtons);

    // Look specifically for bottom navigation
    const bottomNavElements = await page.$$eval(
      'nav, [class*="nav"], [class*="bottom"], [class*="tab"]', 
      elements => elements.filter(el => el.offsetParent !== null)
        .map(el => ({
          className: el.className,
          children: Array.from(el.children).map(child => ({
            text: child.textContent?.trim() || '',
            className: child.className
          }))
        }))
    );
    
    console.log('Bottom navigation elements:', bottomNavElements);

    // Take final screenshot
    await page.screenshot({ 
      path: 'step-4-navigation-attempt.png',
      fullPage: true
    });
    console.log('Screenshot saved: step-4-navigation-attempt.png');

    // Check if we found any goals-related content
    const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
    console.log('Page contains "goal":', bodyText.includes('goal'));
    console.log('Page contains "financial":', bodyText.includes('financial'));
    
    // Get page URL to see current location
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

  } catch (error) {
    console.error('Error during navigation:', error);
    await page.screenshot({ path: 'error-navigation.png' });
  }

  await browser.close();
})();