// TEST SPENDING API - VALIDATE CSV INTEGRATION AND PERFORMANCE
// Run with: node test-spending-api.js

const API_BASE = 'http://localhost:3001/api/spending';

// Performance target: < 10ms for cached requests
const PERFORMANCE_TARGET = 10; // milliseconds

async function testSpendingAPI() {
  console.log('='.repeat(60));
  console.log('SPENDING API PERFORMANCE TEST - SURGICAL PRECISION VALIDATION');
  console.log('='.repeat(60));
  
  const testCases = [
    { customerId: 1, year: 2025, month: 8, label: 'Millennial - August 2025' },
    { customerId: 2, year: 2025, month: 8, label: 'Mid-career - August 2025' },
    { customerId: 3, year: 2025, month: 8, label: 'Gen Z - August 2025' },
    { customerId: 1, year: 2025, month: undefined, label: 'Millennial - Full Year 2025' },
    { customerId: 3, year: 2024, month: 12, label: 'Gen Z - December 2024' },
  ];
  
  for (const testCase of testCases) {
    console.log(`\n[TEST] ${testCase.label}`);
    console.log('-'.repeat(40));
    
    // Build query params
    const params = new URLSearchParams({
      customerId: testCase.customerId.toString(),
      year: testCase.year.toString(),
      ...(testCase.month && { month: testCase.month.toString() })
    });
    
    try {
      // First request (cache miss expected)
      const start1 = performance.now();
      const response1 = await fetch(`${API_BASE}?${params}`);
      const data1 = await response1.json();
      const time1 = performance.now() - start1;
      
      if (!data1.success) {
        console.error(`❌ API Error: ${data1.error}`);
        continue;
      }
      
      console.log(`✓ First request: ${time1.toFixed(2)}ms (${response1.headers.get('X-Cache')})`);
      console.log(`  Total spending: $${data1.data.total.toLocaleString()}`);
      console.log(`  Categories: ${data1.data.categories.length}`);
      console.log(`  Insights: ${data1.data.insights.length}`);
      
      // Second request (cache hit expected - MUST be < 10ms)
      const start2 = performance.now();
      const response2 = await fetch(`${API_BASE}?${params}`);
      const data2 = await response2.json();
      const time2 = performance.now() - start2;
      
      console.log(`✓ Second request: ${time2.toFixed(2)}ms (${response2.headers.get('X-Cache')})`);
      
      // Performance validation
      if (time2 < PERFORMANCE_TARGET) {
        console.log(`⚡ PERFORMANCE SUCCESS: ${time2.toFixed(2)}ms < ${PERFORMANCE_TARGET}ms target`);
      } else {
        console.warn(`⚠️  PERFORMANCE WARNING: ${time2.toFixed(2)}ms > ${PERFORMANCE_TARGET}ms target`);
      }
      
      // Data validation
      if (data2.data.total > 0 && data2.data.categories.length > 0) {
        console.log('✓ Data validation passed');
        
        // Show top 3 categories
        const topCategories = data2.data.categories.slice(0, 3);
        console.log('\n  Top spending categories:');
        topCategories.forEach(cat => {
          const status = cat.isOverBudget ? '🔴' : '🟢';
          console.log(`    ${status} ${cat.icon} ${cat.name}: $${cat.spent} / $${cat.budget} (${cat.percentage.toFixed(0)}%)`);
        });
      }
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
  
  // Test cache clear
  console.log('\n[TEST] Cache Clear');
  console.log('-'.repeat(40));
  try {
    const response = await fetch(API_BASE, { method: 'DELETE' });
    const data = await response.json();
    console.log(`✓ Cache cleared: ${data.message}`);
  } catch (error) {
    console.error(`❌ Cache clear failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

// Run tests
testSpendingAPI().catch(console.error);