#!/usr/bin/env node

/**
 * VALIDATOR - Test Execution Script
 * Automated AI Personalization Testing for Established Millennial Profile
 * 
 * This script orchestrates the complete testing flow with proper setup and reporting
 */

const { spawn, exec } = require('child_process')
const path = require('path')
const fs = require('fs')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'bright')
  console.log('='.repeat(60))
}

// Check if a process is running on a port
function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i:${port}`, (error) => {
      resolve(!error)
    })
  })
}

// Start a server process
function startServer(command, cwd, name, port) {
  return new Promise(async (resolve, reject) => {
    // Check if already running
    const isRunning = await checkPort(port)
    if (isRunning) {
      log(`✅ ${name} already running on port ${port}`, 'green')
      resolve(null)
      return
    }

    log(`🚀 Starting ${name}...`, 'yellow')
    
    const [cmd, ...args] = command.split(' ')
    const serverProcess = spawn(cmd, args, {
      cwd,
      stdio: 'pipe',
      shell: true
    })

    let started = false
    const timeout = setTimeout(() => {
      if (!started) {
        serverProcess.kill()
        reject(new Error(`${name} failed to start within timeout`))
      }
    }, 30000)

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString()
      // Check for startup indicators
      if (output.includes('Ready') || 
          output.includes('started') || 
          output.includes('Listening') ||
          output.includes('Local:')) {
        if (!started) {
          started = true
          clearTimeout(timeout)
          log(`✅ ${name} started successfully`, 'green')
          setTimeout(() => resolve(serverProcess), 2000) // Give it a moment to stabilize
        }
      }
    })

    serverProcess.stderr.on('data', (data) => {
      if (data.toString().includes('Error')) {
        console.error(`${name} error:`, data.toString())
      }
    })

    serverProcess.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}

// Main test execution
async function runTests() {
  logSection('🔥 VALIDATOR - AI PERSONALIZATION TEST SUITE')
  
  const frontendDir = path.join(__dirname, '..')
  const backendDir = path.join(__dirname, '../../backend/python_engine')
  const resultsDir = path.join(frontendDir, 'test-results', 'ai-personalization')
  
  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true })
  }

  let frontendProcess = null
  let backendProcess = null
  let testsPassed = false

  try {
    // Step 1: Check and start backend
    logSection('STEP 1: Backend Setup')
    
    const backendRunning = await checkPort(8000)
    if (!backendRunning) {
      log('⚠️  Backend not detected, starting...', 'yellow')
      backendProcess = await startServer(
        'python run_server.py',
        backendDir,
        'Python Backend',
        8000
      )
    } else {
      log('✅ Backend already running', 'green')
    }

    // Step 2: Check and start frontend
    logSection('STEP 2: Frontend Setup')
    
    const frontendRunning = await checkPort(3000)
    if (!frontendRunning) {
      log('⚠️  Frontend not detected, starting...', 'yellow')
      frontendProcess = await startServer(
        'npm run dev',
        frontendDir,
        'Next.js Frontend',
        3000
      )
    } else {
      log('✅ Frontend already running', 'green')
    }

    // Step 3: Install Playwright if needed
    logSection('STEP 3: Playwright Setup')
    
    log('📦 Ensuring Playwright browsers are installed...', 'cyan')
    await new Promise((resolve, reject) => {
      exec('npx playwright install chromium', { cwd: frontendDir }, (error) => {
        if (error) {
          log('⚠️  Could not install Playwright browsers', 'yellow')
        } else {
          log('✅ Playwright browsers ready', 'green')
        }
        resolve()
      })
    })

    // Step 4: Run the tests
    logSection('STEP 4: Executing Tests')
    
    log('🧪 Running AI personalization tests...', 'magenta')
    log('📊 This will validate:', 'cyan')
    log('   • Login flow', 'cyan')
    log('   • Profile selection (Established Millennial)', 'cyan')
    log('   • Medical Crisis simulation', 'cyan')
    log('   • AI personalization response', 'cyan')
    log('   • Dollar amount validation', 'cyan')
    log('   • API call verification', 'cyan')
    
    const testProcess = spawn('npx', [
      'playwright', 
      'test',
      'e2e/millennial-ai-personalization.spec.ts',
      '--project=chromium',
      '--reporter=list',
      '--timeout=120000'
    ], {
      cwd: frontendDir,
      stdio: 'inherit'
    })

    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          testsPassed = true
          resolve()
        } else {
          reject(new Error(`Tests failed with code ${code}`))
        }
      })
    })

  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red')
    testsPassed = false
  } finally {
    // Cleanup
    logSection('CLEANUP')
    
    // Only kill processes we started
    if (frontendProcess) {
      log('🛑 Stopping frontend...', 'yellow')
      frontendProcess.kill()
    }
    
    if (backendProcess) {
      log('🛑 Stopping backend...', 'yellow')
      backendProcess.kill()
    }

    // Report results
    logSection('📊 TEST RESULTS')
    
    if (testsPassed) {
      log('✅ ALL TESTS PASSED!', 'green')
      log(`\n📁 Results saved to: ${resultsDir}`, 'cyan')
      
      // List generated files
      if (fs.existsSync(resultsDir)) {
        const files = fs.readdirSync(resultsDir)
        if (files.length > 0) {
          log('\n📄 Generated files:', 'cyan')
          files.forEach(file => {
            const stats = fs.statSync(path.join(resultsDir, file))
            const size = (stats.size / 1024).toFixed(2)
            log(`   • ${file} (${size} KB)`, 'cyan')
          })
        }
      }
      
      log('\n🎯 VERIFICATION COMPLETE', 'green')
      log('The Established Millennial AI personalization is working correctly!', 'green')
    } else {
      log('❌ TESTS FAILED', 'red')
      log('Please review the error messages above and the test results.', 'yellow')
      
      // Provide troubleshooting tips
      log('\n🔧 Troubleshooting tips:', 'yellow')
      log('   1. Ensure backend is running: cd backend/python_engine && python run_server.py', 'yellow')
      log('   2. Ensure frontend is running: cd frontend && npm run dev', 'yellow')
      log('   3. Check console logs in test-results/ai-personalization/console-logs.txt', 'yellow')
      log('   4. Review screenshots in test-results/ai-personalization/', 'yellow')
    }

    process.exit(testsPassed ? 0 : 1)
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red')
  process.exit(1)
})