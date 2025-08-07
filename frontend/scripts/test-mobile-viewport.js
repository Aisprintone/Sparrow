#!/usr/bin/env node

/**
 * Mobile Viewport Test Script
 * 
 * This script helps verify that the mobile viewport improvements are working correctly.
 * Run this after implementing the changes to check for any issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Mobile Viewport Improvements...\n');

// Check for viewport meta tag
const layoutPath = path.join(__dirname, '../app/layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

if (layoutContent.includes('viewport-fit=cover') && layoutContent.includes('width=device-width')) {
  console.log('✅ Viewport meta tag with safe area support found');
} else {
  console.log('❌ Viewport meta tag missing or incorrect');
}

// Check for dynamic viewport height usage
const screensDir = path.join(__dirname, '../components/screens');
const screenFiles = fs.readdirSync(screensDir).filter(file => file.endsWith('.tsx'));

let dynamicVhCount = 0;
let staticVhCount = 0;

screenFiles.forEach(file => {
  const content = fs.readFileSync(path.join(screensDir, file), 'utf8');
  const dynamicVhMatches = content.match(/h-\[100dvh\]/g);
  const staticVhMatches = content.match(/h-screen|min-h-screen/g);
  
  if (dynamicVhMatches) {
    dynamicVhCount += dynamicVhMatches.length;
  }
  if (staticVhMatches) {
    staticVhCount += staticVhMatches.length;
  }
});

console.log(`✅ Found ${dynamicVhCount} instances of dynamic viewport height (100dvh)`);
if (staticVhCount > 0) {
  console.log(`⚠️  Found ${staticVhCount} instances of static viewport height - consider updating`);
} else {
  console.log('✅ No static viewport height instances found');
}

// Check for safe area support in CSS
const globalsPath = path.join(__dirname, '../app/globals.css');
const globalsContent = fs.readFileSync(globalsPath, 'utf8');

if (globalsContent.includes('env(safe-area-inset-bottom)')) {
  console.log('✅ Safe area support found in global CSS');
} else {
  console.log('❌ Safe area support missing from global CSS');
}

// Check for sticky bottom navigation
const bottomNavPath = path.join(__dirname, '../components/nav/bottom-nav.tsx');
const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf8');

if (bottomNavContent.includes('sticky bottom-0') && bottomNavContent.includes('backdrop-blur-xl')) {
  console.log('✅ Sticky bottom navigation with backdrop blur found');
} else {
  console.log('❌ Sticky bottom navigation not properly configured');
}

// Check for proper overflow handling
const pagePath = path.join(__dirname, '../app/page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');

if (pageContent.includes('overflow-x-hidden overflow-y-auto')) {
  console.log('✅ Proper overflow handling for mobile scrolling found');
} else {
  console.log('❌ Mobile overflow handling missing');
}

console.log('\n📱 Mobile Viewport Test Summary:');
console.log('=====================================');
console.log('1. Viewport meta tag with safe area support');
console.log('2. Dynamic viewport height (100dvh) usage');
console.log('3. Safe area inset support in CSS');
console.log('4. Sticky bottom navigation with backdrop blur');
console.log('5. Proper overflow handling for mobile scrolling');
console.log('\n🎯 Next Steps:');
console.log('- Test on actual mobile devices');
console.log('- Verify URL bar behavior on iOS Safari');
console.log('- Check safe area insets on devices with notches');
console.log('- Test scrolling momentum and performance');
