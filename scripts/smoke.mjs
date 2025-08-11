#!/usr/bin/env node

/**
 * FinanceAI Smoke Test
 * Tests that both backend and frontend services are running and reachable
 */

import http from 'http';

// ANSI color codes
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',  
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

/**
 * Test an HTTP endpoint
 */
function testEndpoint(host, port, path, expectedContent = null, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port, 
            path: path,
            method: 'GET',
            timeout: timeout
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    if (expectedContent && !data.includes(expectedContent)) {
                        reject(new Error(`Content check failed - expected "${expectedContent}" not found in response`));
                    } else {
                        resolve({
                            status: res.statusCode,
                            data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
                            size: data.length
                        });
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
            });
        });
        
        req.on('error', (err) => {
            reject(new Error(`Network error: ${err.message}`));
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timeout after ${timeout}ms`));
        });
        
        req.setTimeout(timeout);
        req.end();
    });
}

/**
 * Find the frontend port from common locations
 */
function findFrontendPort() {
    // Check environment variable first
    if (process.env.FRONTEND_PORT) {
        return parseInt(process.env.FRONTEND_PORT);
    }
    
    // Default to 3003 based on current running service
    return 3003;
}

/**
 * Run all smoke tests
 */
async function runSmokeTest() {
    console.log(`${colors.blue}🧪 FinanceAI Smoke Test${colors.reset}`);
    console.log('=========================');
    
    const frontendPort = findFrontendPort();
    
    const tests = [
        {
            name: 'Backend Health Check',
            host: 'localhost',
            port: 8000,
            path: '/health',
            description: 'Verify backend API is responding'
        },
        {
            name: 'Frontend App Load',
            host: 'localhost', 
            port: frontendPort,
            path: '/',
            expectedContent: 'FinanceAI',
            description: 'Verify frontend app loads with expected content'
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    console.log(`Testing ${tests.length} endpoints...\n`);
    
    for (const test of tests) {
        const url = `http://${test.host}:${test.port}${test.path}`;
        process.stdout.write(`${test.name}: ${url} ... `);
        
        try {
            const result = await testEndpoint(
                test.host, 
                test.port, 
                test.path, 
                test.expectedContent,
                10000 // 10 second timeout
            );
            
            console.log(`${colors.green}✅ PASS${colors.reset}`);
            console.log(`   Status: ${result.status}, Size: ${result.size} bytes`);
            if (test.expectedContent) {
                console.log(`   ✓ Content check passed: "${test.expectedContent}" found`);
            }
            passed++;
            
        } catch (error) {
            console.log(`${colors.red}❌ FAIL${colors.reset}`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
        
        console.log(); // blank line
    }
    
    // Summary
    console.log('=========================');
    console.log(`Results: ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.green}${failed} failed${colors.reset}`);
    
    if (failed === 0) {
        console.log(`${colors.green}✅ All smoke tests passed!${colors.reset}`);
        console.log(`🚀 Backend ready at: http://localhost:8000`);  
        console.log(`🎯 Frontend ready at: http://localhost:${frontendPort}`);
        console.log('\n📱 You can now open your browser and start testing!');
        process.exit(0);
    } else {
        console.log(`${colors.red}❌ ${failed} test(s) failed${colors.reset}`);
        console.log('\nTroubleshooting:');
        console.log('- Check that both services are running');
        console.log('- Verify ports 8000 (backend) and 3000-3003 (frontend) are available');
        console.log('- Check service logs for errors');
        process.exit(1);
    }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    console.error(`${colors.red}Unhandled promise rejection:${colors.reset}`, reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error(`${colors.red}Uncaught exception:${colors.reset}`, error);
    process.exit(1);
});

// Run the smoke test
if (import.meta.url === `file://${process.argv[1]}`) {
    runSmokeTest().catch(error => {
        console.error(`${colors.red}Smoke test failed:${colors.reset}`, error);
        process.exit(1);
    });
}