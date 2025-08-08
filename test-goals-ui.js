import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // iPhone size as specified in HTML
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of login screen
    await page.screenshot({ 
      path: 'login-screen.png',
      fullPage: true
    });
    console.log('Screenshot saved: login-screen.png');

    // Look for navigation elements or ways to get to goals
    console.log('Checking page content...');
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page contains "goal" text:', bodyText.toLowerCase().includes('goal'));
    
    // Try to find navigation or buttons that might lead to goals
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim() || '',
        className: btn.className,
        visible: btn.offsetParent !== null
      }))
    );
    
    console.log('Found buttons:', buttons);
    
    // Check if there are any navigation links
    const links = await page.$$eval('a', links =>
      links.map(link => ({
        text: link.textContent?.trim() || '',
        href: link.href,
        visible: link.offsetParent !== null
      }))
    );
    
    console.log('Found links:', links);
    
    // Try clicking continue or login buttons if they exist
    const continueButton = await page.$('button:has-text("Continue")');
    const faceIdButton = await page.$('button:has-text("Continue with FaceID")');
    const passcodeButton = await page.$('button:has-text("Use Passcode")');
    
    if (continueButton) {
      console.log('Clicking Continue button...');
      await continueButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'after-continue.png' });
    } else if (faceIdButton) {
      console.log('Clicking Continue with FaceID button...');
      await faceIdButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'after-faceid.png' });
    } else if (passcodeButton) {
      console.log('Clicking Use Passcode button...');
      await passcodeButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'after-passcode.png' });
    }
    
    // Check for navigation after login
    await page.waitForTimeout(1000);
    const newPageContent = await page.evaluate(() => document.body.innerText);
    console.log('Page after interaction contains "goal":', newPageContent.toLowerCase().includes('goal'));
    
    // Look for bottom navigation
    const bottomNav = await page.$('nav');
    if (bottomNav) {
      console.log('Found navigation element');
      const navButtons = await page.$$eval('nav button, nav a', elements =>
        elements.map(el => ({
          text: el.textContent?.trim() || '',
          visible: el.offsetParent !== null
        }))
      );
      console.log('Navigation buttons:', navButtons);
    }
    
    // Try to find goals-related elements
    const goalElements = await page.$$eval('*', elements =>
      elements.filter(el => 
        el.textContent?.toLowerCase().includes('goal') && 
        el.offsetParent !== null
      ).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 100),
        className: el.className
      }))
    );
    
    console.log('Found goal-related elements:', goalElements);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'current-screen.png',
      fullPage: true
    });
    console.log('Screenshot saved: current-screen.png');

  } catch (error) {
    console.error('Error during navigation:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }

  await browser.close();
})();