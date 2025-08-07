#!/usr/bin/env node
/**
 * Test script to verify simulation data flow
 * Tests all 8 scenarios to ensure AI insights are properly passed
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Each test function has one job
 * - Open/Closed: Easy to add new scenarios without modifying existing code
 * - DRY: Reusable test utilities
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE = 'https://sparrow-backend.aisprintone.workers.dev/api';
const SCENARIOS = [
  'emergency_fund',
  'student_loan',
  'home_purchase',
  'market_crash',
  'medical_crisis',
  'gig_economy',
  'rent_hike',
  'auto_repair'
];

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * DRY Principle: Reusable test function
 */
async function testScenario(scenario, profileId = '1') {
  console.log(`${colors.blue}Testing scenario: ${scenario}${colors.reset}`);
  
  const endpoint = `${API_BASE}/simulation/${scenario}`;
  console.log(`  Endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_id: profileId,
        scenario_type: scenario,
        iterations: 10000,
        include_advanced_metrics: true,
        generate_explanations: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Validate response structure
    const hasData = !!result.data;
    const hasSimulationResult = !!(result.data && result.data.simulation_result);
    const hasAIExplanations = !!(result.data && result.data.ai_explanations);
    const explanationCount = result.data?.ai_explanations?.length || 0;
    
    // Check AI explanation structure
    let validExplanations = 0;
    if (hasAIExplanations) {
      result.data.ai_explanations.forEach((exp, i) => {
        const hasRequiredFields = exp.title && exp.rationale && exp.steps;
        const hasSavingAmount = exp.potentialSaving !== undefined;
        
        if (hasRequiredFields && hasSavingAmount) {
          validExplanations++;
        } else {
          console.log(`${colors.yellow}  ⚠️  Explanation ${i} missing fields:${colors.reset}`);
          if (!exp.title) console.log('     - Missing title');
          if (!exp.rationale) console.log('     - Missing rationale');
          if (!exp.steps) console.log('     - Missing steps');
          if (!hasSavingAmount) console.log('     - Missing potentialSaving');
        }
      });
    }
    
    // Report results
    console.log(`  ${colors.green}✓${colors.reset} Response received`);
    console.log(`  ${hasData ? colors.green + '✓' : colors.red + '✗'} Has data object${colors.reset}`);
    console.log(`  ${hasSimulationResult ? colors.green + '✓' : colors.red + '✗'} Has simulation_result${colors.reset}`);
    console.log(`  ${hasAIExplanations ? colors.green + '✓' : colors.red + '✗'} Has ai_explanations${colors.reset}`);
    console.log(`  ${colors.magenta}📊 AI Explanations: ${explanationCount} total, ${validExplanations} valid${colors.reset}`);
    
    if (explanationCount > 0) {
      console.log(`  ${colors.blue}Sample explanation:${colors.reset}`);
      const sample = result.data.ai_explanations[0];
      console.log(`    Title: ${sample.title}`);
      console.log(`    Saving: ${sample.potentialSaving}`);
      console.log(`    Steps: ${sample.steps?.length || 0} steps`);
    }
    
    return {
      scenario,
      success: hasData && hasSimulationResult && hasAIExplanations && validExplanations > 0,
      explanationCount,
      validExplanations
    };
    
  } catch (error) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return {
      scenario,
      success: false,
      error: error.message
    };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.magenta}========================================`);
  console.log('🧪 Testing Simulation Data Flow');
  console.log(`========================================${colors.reset}\n`);
  
  const results = [];
  
  for (const scenario of SCENARIOS) {
    const result = await testScenario(scenario);
    results.push(result);
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  console.log(`${colors.magenta}========================================`);
  console.log('📊 Test Summary');
  console.log(`========================================${colors.reset}\n`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(r => {
    const icon = r.success ? colors.green + '✓' : colors.red + '✗';
    const status = r.success 
      ? `${r.validExplanations} valid explanations`
      : r.error || 'Missing AI explanations';
    console.log(`  ${icon} ${r.scenario}: ${status}${colors.reset}`);
  });
  
  console.log('');
  console.log(`${colors.blue}Total: ${successful}/${SCENARIOS.length} scenarios working${colors.reset}`);
  
  if (failed > 0) {
    console.log(`${colors.red}⚠️  ${failed} scenarios need attention${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✨ All scenarios are properly returning AI insights!${colors.reset}`);
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});