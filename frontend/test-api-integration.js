#!/usr/bin/env node

/**
 * API Integration Test Script
 * 
 * Tests all API endpoints to ensure proper integration between
 * frontend and backend services with enhanced AI capabilities.
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Each test function has one purpose
 * - Open/Closed: Extensible test suite structure
 * - Dependency Inversion: Tests depend on API contracts, not implementations
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Test Result Reporter - Single Responsibility
 */
class TestReporter {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  addResult(testName, success, message, details = null) {
    this.results.push({
      testName,
      success,
      message,
      details,
      timestamp: Date.now()
    });
    
    const icon = success ? '✅' : '❌';
    const color = success ? colors.green : colors.red;
    console.log(`${color}${icon} ${testName}: ${message}${colors.reset}`);
    
    if (details) {
      console.log(`${colors.cyan}   Details: ${JSON.stringify(details, null, 2)}${colors.reset}`);
    }
  }

  printSummary() {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.bright}Test Summary${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log('='.repeat(50));
    
    if (failed > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.message}`);
        });
    }
    
    return failed === 0;
  }
}

/**
 * API Test Suite - Open/Closed Principle
 */
class APITestSuite {
  constructor(reporter) {
    this.reporter = reporter;
  }

  async testEndpoint(name, url, options = {}) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        this.reporter.addResult(
          name,
          false,
          `HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`,
          data
        );
        return false;
      }
      
      this.reporter.addResult(
        name,
        true,
        `Success (${response.status})`,
        data
      );
      return true;
      
    } catch (error) {
      this.reporter.addResult(
        name,
        false,
        error.message,
        { error: error.toString() }
      );
      return false;
    }
  }

  async runHealthChecks() {
    console.log(`\n${colors.bright}Running Health Checks...${colors.reset}`);
    
    // Test frontend health
    await this.testEndpoint(
      'Frontend Health',
      `${FRONTEND_URL}/api/profiles`
    );
    
    // Test backend health
    await this.testEndpoint(
      'Backend Health',
      `${BACKEND_URL}/health`
    );
    
    // Test database health
    await this.testEndpoint(
      'Database Health',
      `${BACKEND_URL}/db/health`
    );
  }

  async runProfileTests() {
    console.log(`\n${colors.bright}Testing Profile Endpoints...${colors.reset}`);
    
    // Test get all profiles
    await this.testEndpoint(
      'Get All Profiles',
      `${FRONTEND_URL}/api/profiles`
    );
    
    // Test get specific profile
    await this.testEndpoint(
      'Get Profile #1',
      `${FRONTEND_URL}/api/profiles/1`
    );
    
    // Test backend profile endpoint
    await this.testEndpoint(
      'Backend Profile #1',
      `${BACKEND_URL}/profiles/1`
    );
  }

  async runSimulationTests() {
    console.log(`\n${colors.bright}Testing Simulation Endpoints...${colors.reset}`);
    
    const simulationRequest = {
      profile_id: '1',
      use_current_profile: false,
      scenario_type: 'emergency_fund',
      parameters: {
        target_months: 6,
        monthly_contribution: 500,
        risk_tolerance: 'moderate'
      }
    };
    
    // Test frontend simulation endpoint
    const frontendSimSuccess = await this.testEndpoint(
      'Frontend Simulation (emergency_fund)',
      `${FRONTEND_URL}/api/simulation/emergency_fund`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationRequest)
      }
    );
    
    // Verify AI explanations are included
    if (frontendSimSuccess) {
      const response = await fetch(
        `${FRONTEND_URL}/api/simulation/emergency_fund`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simulationRequest)
        }
      );
      const data = await response.json();
      
      this.reporter.addResult(
        'AI Explanations Present',
        data.data?.ai_explanations !== undefined,
        data.data?.ai_explanations ? 'AI explanations included' : 'AI explanations missing',
        { has_explanations: !!data.data?.ai_explanations }
      );
    }
    
    // Test backend simulation endpoint
    await this.testEndpoint(
      'Backend Simulation (emergency_fund)',
      `${BACKEND_URL}/simulation/emergency_fund`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationRequest)
      }
    );
    
    // Test legacy simulation endpoint
    await this.testEndpoint(
      'Legacy Simulation Endpoint',
      `${FRONTEND_URL}/api/simulation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulationRequest)
      }
    );
  }

  async runAITests() {
    console.log(`\n${colors.bright}Testing AI Endpoints...${colors.reset}`);
    
    const chatRequest = {
      messages: [
        { role: 'user', content: 'What is the best emergency fund strategy?' }
      ],
      profileId: '1'
    };
    
    // Test AI chat endpoint
    await this.testEndpoint(
      'AI Chat Endpoint',
      `${FRONTEND_URL}/api/ai/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatRequest)
      }
    );
    
    // Test AI explanations endpoint
    await this.testEndpoint(
      'AI Explanations Generator',
      `${BACKEND_URL}/ai/generate-explanations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulation_result: { success: true },
          profile_data: { profile_id: 1 },
          scenario_type: 'emergency_fund'
        })
      }
    );
  }

  async runCacheTests() {
    console.log(`\n${colors.bright}Testing Cache Endpoints...${colors.reset}`);
    
    const testKey = 'test_integration_key';
    const testData = {
      data: { test: 'value' },
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    };
    
    // Test cache set
    await this.testEndpoint(
      'Cache Set',
      `${FRONTEND_URL}/api/cache/${testKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      }
    );
    
    // Test cache get
    await this.testEndpoint(
      'Cache Get',
      `${FRONTEND_URL}/api/cache/${testKey}`,
      { method: 'GET' }
    );
    
    // Test cache delete
    await this.testEndpoint(
      'Cache Delete',
      `${FRONTEND_URL}/api/cache/${testKey}`,
      { method: 'DELETE' }
    );
    
    // Test cache stats
    await this.testEndpoint(
      'Cache Stats',
      `${BACKEND_URL}/cache/stats`,
      { method: 'GET' }
    );
  }

  async runMarketDataTests() {
    console.log(`\n${colors.bright}Testing Market Data Endpoints...${colors.reset}`);
    
    // Test market data quotes
    await this.testEndpoint(
      'Market Data Quotes',
      `${FRONTEND_URL}/api/market-data/quotes`
    );
    
    // Test market data historical
    await this.testEndpoint(
      'Market Data Historical',
      `${FRONTEND_URL}/api/market-data/historical`
    );
    
    // Test backend market data
    await this.testEndpoint(
      'Backend Market Data',
      `${BACKEND_URL}/api/market-data`
    );
  }

  async runOptimizationTests() {
    console.log(`\n${colors.bright}Testing Optimization Endpoints...${colors.reset}`);
    
    // Test optimization metrics
    await this.testEndpoint(
      'Optimization Metrics',
      `${BACKEND_URL}/api/optimization/metrics`
    );
    
    // Test cache warming
    await this.testEndpoint(
      'Cache Warming',
      `${BACKEND_URL}/api/optimization/warm-cache`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warm_rag: true,
          profile_ids: [1, 2, 3]
        })
      }
    );
  }

  async runRAGTests() {
    console.log(`\n${colors.bright}Testing RAG System Endpoints...${colors.reset}`);
    
    // Test RAG query
    await this.testEndpoint(
      'RAG Query',
      `${BACKEND_URL}/rag/query/1`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'What are my account balances?',
          tool_name: 'query_accounts'
        })
      }
    );
    
    // Test RAG multi-query
    await this.testEndpoint(
      'RAG Multi-Query',
      `${BACKEND_URL}/rag/profiles/1/multi-query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: [
            { query: 'Account balances', tool_name: 'query_accounts' },
            { query: 'Recent transactions', tool_name: 'query_transactions' }
          ]
        })
      }
    );
    
    // Test RAG profile summary
    await this.testEndpoint(
      'RAG Profile Summary',
      `${BACKEND_URL}/rag/profiles/1/summary`
    );
  }

  async runSpendingTests() {
    console.log(`\n${colors.bright}Testing Spending Endpoints...${colors.reset}`);
    
    // Test spending data endpoint
    await this.testEndpoint(
      'Spending Data',
      `${FRONTEND_URL}/api/spending?profile_id=1`
    );
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}API Integration Test Suite${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('='.repeat(50));
  
  const reporter = new TestReporter();
  const testSuite = new APITestSuite(reporter);
  
  // Run all test categories
  await testSuite.runHealthChecks();
  await testSuite.runProfileTests();
  await testSuite.runSimulationTests();
  await testSuite.runAITests();
  await testSuite.runCacheTests();
  await testSuite.runMarketDataTests();
  await testSuite.runOptimizationTests();
  await testSuite.runRAGTests();
  await testSuite.runSpendingTests();
  
  // Print summary
  const allPassed = reporter.printSummary();
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled rejection: ${error}${colors.reset}`);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite failed: ${error}${colors.reset}`);
  process.exit(1);
});