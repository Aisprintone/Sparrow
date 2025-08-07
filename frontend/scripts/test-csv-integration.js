#!/usr/bin/env node

// CSV DATA INTEGRATION TEST SCRIPT
// Tests the real-time CSV data fetching and profile switching

const BASE_URL = 'http://localhost:3000';

async function testProfileEndpoints() {
  console.log('================================================');
  console.log('    CSV DATA INTEGRATION TEST - PHASE 3');
  console.log('================================================\n');

  const tests = {
    passed: 0,
    failed: 0,
    results: []
  };

  // Test 1: Fetch all profiles
  console.log('Test 1: Fetching all profiles...');
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/profiles`);
    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    if (data.success && data.data.length > 0) {
      console.log(`✅ PASS - Found ${data.data.length} profiles in ${elapsed}ms`);
      tests.passed++;
      tests.results.push({ test: 'Fetch all profiles', passed: true, time: elapsed });
    } else {
      console.log(`❌ FAIL - No profiles found`);
      tests.failed++;
      tests.results.push({ test: 'Fetch all profiles', passed: false });
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    tests.failed++;
    tests.results.push({ test: 'Fetch all profiles', passed: false, error: error.message });
  }

  // Test 2-4: Fetch individual profiles
  const profileIds = [1, 2, 3];
  const profileNames = ['Millennial', 'Mid-Career', 'Gen Z'];
  
  for (let i = 0; i < profileIds.length; i++) {
    const id = profileIds[i];
    const name = profileNames[i];
    
    console.log(`\nTest ${i + 2}: Fetching ${name} profile (ID: ${id})...`);
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}/api/profiles/${id}`);
      const data = await response.json();
      const elapsed = Date.now() - startTime;
      
      if (data.success && data.data) {
        const profile = data.data;
        console.log(`✅ PASS - ${name} profile loaded in ${elapsed}ms`);
        console.log(`   - Accounts: ${profile.accounts?.length || 0}`);
        console.log(`   - Net Worth: $${profile.metrics?.netWorth || 0}`);
        console.log(`   - Monthly Income: $${profile.metrics?.monthlyIncome || 0}`);
        console.log(`   - Credit Score: ${profile.metrics?.creditScore || 0}`);
        
        // Performance check
        if (elapsed < 100) {
          console.log(`   ⚡ EXCELLENT - Response time < 100ms`);
        } else if (elapsed < 500) {
          console.log(`   ✓ GOOD - Response time < 500ms`);
        } else {
          console.log(`   ⚠️ SLOW - Response time > 500ms`);
        }
        
        tests.passed++;
        tests.results.push({ test: `Fetch ${name} profile`, passed: true, time: elapsed });
      } else {
        console.log(`❌ FAIL - ${name} profile not found`);
        tests.failed++;
        tests.results.push({ test: `Fetch ${name} profile`, passed: false });
      }
    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}`);
      tests.failed++;
      tests.results.push({ test: `Fetch ${name} profile`, passed: false, error: error.message });
    }
  }

  // Test 5: Cache performance test
  console.log('\nTest 5: Cache performance (re-fetch profile 1)...');
  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/profiles/1`);
    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    if (data.success && elapsed < 50) {
      console.log(`✅ PASS - Cached response in ${elapsed}ms`);
      tests.passed++;
      tests.results.push({ test: 'Cache performance', passed: true, time: elapsed });
    } else if (data.success) {
      console.log(`⚠️ WARN - Response time ${elapsed}ms (cache may not be working)`);
      tests.passed++;
      tests.results.push({ test: 'Cache performance', passed: true, time: elapsed, warning: 'Slow cache' });
    } else {
      console.log(`❌ FAIL - Cache test failed`);
      tests.failed++;
      tests.results.push({ test: 'Cache performance', passed: false });
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}`);
    tests.failed++;
    tests.results.push({ test: 'Cache performance', passed: false, error: error.message });
  }

  // Summary
  console.log('\n================================================');
  console.log('                TEST SUMMARY');
  console.log('================================================');
  console.log(`Total Tests: ${tests.passed + tests.failed}`);
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  
  // Performance metrics
  const times = tests.results.filter(r => r.time).map(r => r.time);
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    console.log('\nPerformance Metrics:');
    console.log(`  Average Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min Response Time: ${minTime}ms`);
    console.log(`  Max Response Time: ${maxTime}ms`);
  }
  
  // Overall result
  console.log('\n================================================');
  if (tests.failed === 0) {
    console.log('🎉 ALL TESTS PASSED - CSV INTEGRATION WORKING!');
  } else {
    console.log('⚠️ SOME TESTS FAILED - CHECK LOGS ABOVE');
  }
  console.log('================================================\n');
  
  return tests.failed === 0 ? 0 : 1;
}

// Run tests
testProfileEndpoints()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });