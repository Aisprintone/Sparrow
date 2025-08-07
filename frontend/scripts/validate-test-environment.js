#!/usr/bin/env node

/**
 * Environment Validation Script
 * Checks all prerequisites before running AI personalization tests
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

const checks = []

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkItem(name, checkFn) {
  process.stdout.write(`Checking ${name}...`)
  try {
    const result = await checkFn()
    if (result.success) {
      log(` ✅ ${result.message || 'OK'}`, 'green')
      checks.push({ name, passed: true, message: result.message })
    } else {
      log(` ❌ ${result.message || 'Failed'}`, 'red')
      checks.push({ name, passed: false, message: result.message, solution: result.solution })
    }
  } catch (error) {
    log(` ❌ Error: ${error.message}`, 'red')
    checks.push({ name, passed: false, message: error.message })
  }
}

async function checkNodeVersion() {
  return new Promise((resolve) => {
    exec('node --version', (error, stdout) => {
      if (error) {
        resolve({ success: false, message: 'Node.js not found', solution: 'Install Node.js 18+ from nodejs.org' })
      } else {
        const version = stdout.trim()
        const major = parseInt(version.split('.')[0].substring(1))
        if (major >= 18) {
          resolve({ success: true, message: version })
        } else {
          resolve({ success: false, message: `Node ${version} (need 18+)`, solution: 'Update Node.js to version 18 or later' })
        }
      }
    })
  })
}

async function checkNpmPackages() {
  return new Promise((resolve) => {
    const packagePath = path.join(__dirname, '..', 'package.json')
    if (!fs.existsSync(packagePath)) {
      resolve({ success: false, message: 'package.json not found', solution: 'Run npm install in frontend directory' })
      return
    }

    const nodeModulesPath = path.join(__dirname, '..', 'node_modules')
    if (!fs.existsSync(nodeModulesPath)) {
      resolve({ success: false, message: 'node_modules not found', solution: 'Run npm install in frontend directory' })
      return
    }

    // Check for key packages
    const requiredPackages = ['@playwright/test', 'next', 'react']
    const missingPackages = []
    
    for (const pkg of requiredPackages) {
      const pkgPath = path.join(nodeModulesPath, pkg)
      if (!fs.existsSync(pkgPath)) {
        missingPackages.push(pkg)
      }
    }

    if (missingPackages.length > 0) {
      resolve({ 
        success: false, 
        message: `Missing packages: ${missingPackages.join(', ')}`,
        solution: 'Run npm install in frontend directory'
      })
    } else {
      resolve({ success: true, message: 'All packages installed' })
    }
  })
}

async function checkPlaywright() {
  return new Promise((resolve) => {
    exec('npx playwright --version', (error, stdout) => {
      if (error) {
        resolve({ 
          success: false, 
          message: 'Playwright not found',
          solution: 'Run: npm install -D @playwright/test'
        })
      } else {
        resolve({ success: true, message: stdout.trim() })
      }
    })
  })
}

async function checkPlaywrightBrowsers() {
  return new Promise((resolve) => {
    const browsersPath = path.join(process.env.HOME, '.cache', 'ms-playwright')
    if (!fs.existsSync(browsersPath)) {
      resolve({ 
        success: false, 
        message: 'Playwright browsers not installed',
        solution: 'Run: npx playwright install chromium'
      })
      return
    }

    const browsers = fs.readdirSync(browsersPath)
    const hasChromium = browsers.some(b => b.includes('chromium'))
    
    if (hasChromium) {
      resolve({ success: true, message: 'Chromium installed' })
    } else {
      resolve({ 
        success: false, 
        message: 'Chromium browser not found',
        solution: 'Run: npx playwright install chromium'
      })
    }
  })
}

async function checkPython() {
  return new Promise((resolve) => {
    exec('python3 --version', (error, stdout) => {
      if (error) {
        exec('python --version', (error2, stdout2) => {
          if (error2) {
            resolve({ 
              success: false, 
              message: 'Python not found',
              solution: 'Install Python 3.8+ from python.org'
            })
          } else {
            const version = stdout2.trim()
            resolve({ success: true, message: version })
          }
        })
      } else {
        const version = stdout.trim()
        resolve({ success: true, message: version })
      }
    })
  })
}

async function checkBackendPort() {
  return new Promise((resolve) => {
    exec('lsof -i:8000', (error) => {
      if (error) {
        resolve({ 
          success: false, 
          message: 'Backend not running on port 8000',
          solution: 'Start backend: cd backend/python_engine && python run_server.py'
        })
      } else {
        resolve({ success: true, message: 'Backend running on port 8000' })
      }
    })
  })
}

async function checkFrontendPort() {
  return new Promise((resolve) => {
    exec('lsof -i:3000', (error) => {
      if (error) {
        resolve({ 
          success: false, 
          message: 'Frontend not running on port 3000',
          solution: 'Start frontend: cd frontend && npm run dev'
        })
      } else {
        resolve({ success: true, message: 'Frontend running on port 3000' })
      }
    })
  })
}

async function checkTestFiles() {
  return new Promise((resolve) => {
    const testFile = path.join(__dirname, '..', 'e2e', 'millennial-ai-personalization.spec.ts')
    const configFile = path.join(__dirname, '..', 'playwright.config.ts')
    
    const missing = []
    if (!fs.existsSync(testFile)) missing.push('test file')
    if (!fs.existsSync(configFile)) missing.push('playwright config')
    
    if (missing.length > 0) {
      resolve({ 
        success: false, 
        message: `Missing: ${missing.join(', ')}`,
        solution: 'Ensure test files are properly created'
      })
    } else {
      resolve({ success: true, message: 'Test files present' })
    }
  })
}

async function runValidation() {
  console.log('\n' + '='.repeat(60))
  log('🔍 ENVIRONMENT VALIDATION FOR AI PERSONALIZATION TESTS', 'cyan')
  console.log('='.repeat(60) + '\n')

  // Run all checks
  await checkItem('Node.js version', checkNodeVersion)
  await checkItem('NPM packages', checkNpmPackages)
  await checkItem('Playwright', checkPlaywright)
  await checkItem('Playwright browsers', checkPlaywrightBrowsers)
  await checkItem('Python', checkPython)
  await checkItem('Test files', checkTestFiles)
  await checkItem('Backend server', checkBackendPort)
  await checkItem('Frontend server', checkFrontendPort)

  // Summary
  console.log('\n' + '='.repeat(60))
  log('📊 VALIDATION SUMMARY', 'cyan')
  console.log('='.repeat(60) + '\n')

  const passed = checks.filter(c => c.passed).length
  const failed = checks.filter(c => !c.passed).length

  if (failed === 0) {
    log(`✅ ALL CHECKS PASSED (${passed}/${checks.length})`, 'green')
    log('\n🚀 Environment is ready for testing!', 'green')
    log('\nRun tests with:', 'cyan')
    log('  npm run test:ai-personalization', 'cyan')
    log('  OR', 'cyan')
    log('  npm run test:millennial', 'cyan')
  } else {
    log(`⚠️  SOME CHECKS FAILED (${failed}/${checks.length})`, 'yellow')
    log('\n📋 Failed checks:', 'red')
    
    checks.filter(c => !c.passed).forEach(check => {
      log(`\n  ❌ ${check.name}`, 'red')
      log(`     Problem: ${check.message}`, 'yellow')
      if (check.solution) {
        log(`     Solution: ${check.solution}`, 'cyan')
      }
    })
    
    log('\n⚠️  Fix the issues above before running tests', 'yellow')
  }

  process.exit(failed > 0 ? 1 : 0)
}

// Run validation
runValidation().catch(error => {
  log(`\n💥 Validation error: ${error.message}`, 'red')
  process.exit(1)
})