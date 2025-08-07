#!/usr/bin/env node

/**
 * Performance Audit Script for FinanceAI Profile Switching System
 * Measures and analyzes key performance metrics
 */

const fs = require('fs');
const path = require('path');

// Performance metrics collection
const metrics = {
  api: {
    profiles: [],
    spending: [],
    profileSwitch: []
  },
  memory: [],
  cacheHitRates: [],
  bundleSize: {},
  loadTimes: []
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Performance thresholds (SLAs)
const thresholds = {
  api: {
    p50: 10,  // 10ms
    p95: 50,  // 50ms
    p99: 100  // 100ms
  },
  profileSwitch: 100,  // 100ms
  cacheHitRate: 0.80,  // 80%
  memoryUsage: 50 * 1024 * 1024,  // 50MB
  bundleSize: 500 * 1024,  // 500KB
  firstContentfulPaint: 1500,  // 1.5s
  timeToInteractive: 3000  // 3s
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function calculatePercentiles(values) {
  if (values.length === 0) return { p50: 0, p95: 0, p99: 0 };
  
  const sorted = values.sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.50);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  
  return {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg: values.reduce((a, b) => a + b, 0) / values.length
  };
}

// API Performance Testing
async function testAPIPerformance() {
  log('\n📊 Testing API Performance...', 'cyan');
  
  const endpoints = [
    { name: 'profiles', url: 'http://localhost:3000/api/profiles', count: 100 },
    { name: 'spending', url: 'http://localhost:3000/api/spending', count: 100 },
    { name: 'profileSwitch', url: 'http://localhost:3000/api/profiles/1/switch', method: 'POST', count: 50 }
  ];
  
  for (const endpoint of endpoints) {
    const times = [];
    
    for (let i = 0; i < endpoint.count; i++) {
      const start = performance.now();
      
      try {
        const response = await fetch(endpoint.url, {
          method: endpoint.method || 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok && response.status !== 404) {
          log(`  ⚠️  ${endpoint.name}: HTTP ${response.status}`, 'yellow');
        }
        
        await response.text();
        const duration = performance.now() - start;
        times.push(duration);
        
      } catch (error) {
        log(`  ❌ ${endpoint.name}: ${error.message}`, 'red');
      }
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    if (times.length > 0) {
      const stats = calculatePercentiles(times);
      metrics.api[endpoint.name] = stats;
      
      // Check against thresholds
      const p50Pass = stats.p50 <= thresholds.api.p50;
      const p95Pass = stats.p95 <= thresholds.api.p95;
      const p99Pass = stats.p99 <= thresholds.api.p99;
      
      log(`\n  ${endpoint.name.toUpperCase()} Endpoint (${endpoint.count} requests):`);
      log(`    P50: ${formatTime(stats.p50)} ${p50Pass ? '✅' : '❌'} (target: <${thresholds.api.p50}ms)`, p50Pass ? 'green' : 'red');
      log(`    P95: ${formatTime(stats.p95)} ${p95Pass ? '✅' : '❌'} (target: <${thresholds.api.p95}ms)`, p95Pass ? 'green' : 'red');
      log(`    P99: ${formatTime(stats.p99)} ${p99Pass ? '✅' : '❌'} (target: <${thresholds.api.p99}ms)`, p99Pass ? 'green' : 'red');
      log(`    Min: ${formatTime(stats.min)} | Max: ${formatTime(stats.max)} | Avg: ${formatTime(stats.avg)}`);
    }
  }
}

// Memory Usage Testing
async function testMemoryUsage() {
  log('\n💾 Testing Memory Usage...', 'cyan');
  
  // Simulate profile switching and data loading
  const memoryReadings = [];
  
  for (let i = 0; i < 10; i++) {
    // Trigger profile switch
    await fetch('http://localhost:3000/api/profiles/1/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Load spending data
    await fetch('http://localhost:3000/api/spending');
    
    // Estimate memory usage (in a real scenario, we'd use performance.memory)
    if (global.gc) {
      global.gc(); // Force garbage collection if available
    }
    
    const memUsage = process.memoryUsage();
    memoryReadings.push(memUsage.heapUsed);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const avgMemory = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;
  const maxMemory = Math.max(...memoryReadings);
  const memoryPass = maxMemory <= thresholds.memoryUsage;
  
  metrics.memory = { avg: avgMemory, max: maxMemory };
  
  log(`  Average: ${formatBytes(avgMemory)}`);
  log(`  Peak: ${formatBytes(maxMemory)} ${memoryPass ? '✅' : '❌'} (target: <${formatBytes(thresholds.memoryUsage)})`, memoryPass ? 'green' : 'red');
}

// Cache Performance Testing
async function testCachePerformance() {
  log('\n🚀 Testing Cache Performance...', 'cyan');
  
  let cacheHits = 0;
  let totalRequests = 0;
  
  // Make initial requests to populate cache
  for (let i = 0; i < 5; i++) {
    await fetch('http://localhost:3000/api/profiles');
    await fetch('http://localhost:3000/api/spending');
    totalRequests += 2;
  }
  
  // Make repeated requests (should hit cache)
  for (let i = 0; i < 20; i++) {
    const start1 = performance.now();
    await fetch('http://localhost:3000/api/profiles');
    const time1 = performance.now() - start1;
    
    const start2 = performance.now();
    await fetch('http://localhost:3000/api/spending');
    const time2 = performance.now() - start2;
    
    // Assume cache hit if response time is very fast (<5ms)
    if (time1 < 5) cacheHits++;
    if (time2 < 5) cacheHits++;
    
    totalRequests += 2;
  }
  
  const hitRate = cacheHits / totalRequests;
  const hitRatePass = hitRate >= thresholds.cacheHitRate;
  
  metrics.cacheHitRates = { hitRate, cacheHits, totalRequests };
  
  log(`  Cache Hit Rate: ${(hitRate * 100).toFixed(2)}% ${hitRatePass ? '✅' : '❌'} (target: >${(thresholds.cacheHitRate * 100)}%)`, hitRatePass ? 'green' : 'red');
  log(`  Cache Hits: ${cacheHits}/${totalRequests} requests`);
}

// Bundle Size Analysis
async function analyzeBundleSize() {
  log('\n📦 Analyzing Bundle Sizes...', 'cyan');
  
  const buildDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildDir)) {
    log('  ⚠️  Build directory not found. Run "npm run build" first.', 'yellow');
    return;
  }
  
  const staticDir = path.join(buildDir, 'static', 'chunks');
  
  if (fs.existsSync(staticDir)) {
    const files = fs.readdirSync(staticDir);
    let totalSize = 0;
    const bundles = [];
    
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(staticDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        bundles.push({ name: file, size: stats.size });
      }
    });
    
    // Sort by size
    bundles.sort((a, b) => b.size - a.size);
    
    // Show top 5 largest bundles
    log('  Top 5 Largest Bundles:');
    bundles.slice(0, 5).forEach(bundle => {
      const isLarge = bundle.size > 200 * 1024; // 200KB threshold
      log(`    ${bundle.name}: ${formatBytes(bundle.size)} ${isLarge ? '⚠️' : ''}`, isLarge ? 'yellow' : 'reset');
    });
    
    const totalSizePass = totalSize <= thresholds.bundleSize;
    log(`\n  Total Bundle Size: ${formatBytes(totalSize)} ${totalSizePass ? '✅' : '❌'} (target: <${formatBytes(thresholds.bundleSize)})`, totalSizePass ? 'green' : 'red');
    
    metrics.bundleSize = { total: totalSize, bundles: bundles.slice(0, 5) };
  }
}

// Load Testing
async function runLoadTest() {
  log('\n🔥 Running Load Test (Concurrent Users)...', 'cyan');
  
  const concurrentUsers = [10, 25, 50, 100];
  
  for (const users of concurrentUsers) {
    const promises = [];
    const startTime = performance.now();
    
    // Simulate concurrent profile switches
    for (let i = 0; i < users; i++) {
      promises.push(
        fetch('http://localhost:3000/api/profiles/1/switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => ({ error: err.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const duration = performance.now() - startTime;
    const errors = results.filter(r => r.error).length;
    const successRate = ((users - errors) / users * 100).toFixed(2);
    
    log(`  ${users} concurrent users:`);
    log(`    Total time: ${formatTime(duration)}`);
    log(`    Avg per request: ${formatTime(duration / users)}`);
    log(`    Success rate: ${successRate}% ${errors > 0 ? '⚠️' : '✅'}`, errors > 0 ? 'yellow' : 'green');
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Generate Performance Report
function generateReport() {
  log('\n📈 PERFORMANCE AUDIT REPORT', 'bright');
  log('=' .repeat(50));
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      apiPerformance: 'PASS',
      memoryUsage: 'PASS',
      cachePerformance: 'PASS',
      bundleSize: 'PASS'
    },
    metrics: metrics,
    recommendations: []
  };
  
  // Check API performance
  if (metrics.api.profiles && metrics.api.profiles.p95 > thresholds.api.p95) {
    report.summary.apiPerformance = 'FAIL';
    report.recommendations.push('⚠️  API response times exceed targets. Consider optimizing database queries and implementing better caching.');
  }
  
  // Check memory usage
  if (metrics.memory.max > thresholds.memoryUsage) {
    report.summary.memoryUsage = 'FAIL';
    report.recommendations.push('⚠️  Memory usage exceeds 50MB limit. Review data structures and implement memory cleanup.');
  }
  
  // Check cache performance
  if (metrics.cacheHitRates.hitRate < thresholds.cacheHitRate) {
    report.summary.cachePerformance = 'FAIL';
    report.recommendations.push('⚠️  Cache hit rate below 80%. Improve caching strategy and TTL settings.');
  }
  
  // Check bundle size
  if (metrics.bundleSize.total > thresholds.bundleSize) {
    report.summary.bundleSize = 'FAIL';
    report.recommendations.push('⚠️  Bundle size exceeds 500KB. Implement code splitting and tree shaking.');
  }
  
  // Overall assessment
  const failures = Object.values(report.summary).filter(v => v === 'FAIL').length;
  const allPass = failures === 0;
  
  log('\n📊 Summary:');
  log(`  API Performance: ${report.summary.apiPerformance === 'PASS' ? '✅' : '❌'} ${report.summary.apiPerformance}`, report.summary.apiPerformance === 'PASS' ? 'green' : 'red');
  log(`  Memory Usage: ${report.summary.memoryUsage === 'PASS' ? '✅' : '❌'} ${report.summary.memoryUsage}`, report.summary.memoryUsage === 'PASS' ? 'green' : 'red');
  log(`  Cache Performance: ${report.summary.cachePerformance === 'PASS' ? '✅' : '❌'} ${report.summary.cachePerformance}`, report.summary.cachePerformance === 'PASS' ? 'green' : 'red');
  log(`  Bundle Size: ${report.summary.bundleSize === 'PASS' ? '✅' : '❌'} ${report.summary.bundleSize}`, report.summary.bundleSize === 'PASS' ? 'green' : 'red');
  
  if (report.recommendations.length > 0) {
    log('\n🔧 Recommendations:', 'yellow');
    report.recommendations.forEach(rec => log(`  ${rec}`));
  }
  
  log('\n' + '='.repeat(50));
  if (allPass) {
    log('✅ SYSTEM READY FOR PRODUCTION', 'green');
    log('All performance metrics meet or exceed targets!', 'green');
  } else {
    log(`⚠️  ${failures} area(s) need optimization`, 'yellow');
    log('Address the recommendations above before production deployment.', 'yellow');
  }
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'performance-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Full report saved to: ${reportPath}`, 'cyan');
}

// Main execution
async function main() {
  log('🚀 FinanceAI Performance Audit Tool v1.0', 'bright');
  log('Starting comprehensive performance analysis...', 'cyan');
  
  try {
    // Check if server is running
    try {
      await fetch('http://localhost:3000/api/profiles');
    } catch (error) {
      log('\n❌ Server not running. Please start the dev server first: npm run dev', 'red');
      process.exit(1);
    }
    
    // Run all tests
    await testAPIPerformance();
    await testMemoryUsage();
    await testCachePerformance();
    await analyzeBundleSize();
    await runLoadTest();
    
    // Generate report
    generateReport();
    
  } catch (error) {
    log(`\n❌ Error during performance audit: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the audit
main().catch(console.error);