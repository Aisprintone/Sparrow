#!/usr/bin/env node

/**
 * Test script to verify simulation results show unique cards for each scenario
 * Tests medical_crisis vs home_purchase to ensure differentiation
 */

// Use built-in fetch in Node 18+ or import for older versions
const fetch = global.fetch || require('node-fetch').default;

const API_URL = 'http://localhost:3000/api/simulation';

// Test profiles
const profiles = {
  genz: { id: '1', demographic: 'genz' },
  millennial: { id: '2', demographic: 'millennial' },
  genx: { id: '3', demographic: 'genx' }
};

// Test scenarios
const scenarios = [
  { type: 'medical_crisis', name: 'Medical Crisis' },
  { type: 'home_purchase', name: 'Home Purchase' },
  { type: 'emergency_fund', name: 'Emergency Fund' }
];

async function runSimulation(scenarioType, profileId) {
  console.log(`\n🚀 Running ${scenarioType} simulation for profile ${profileId}...`);
  
  const requestBody = {
    profile_id: profileId,
    scenario_type: scenarioType,
    use_current_profile: true,
    parameters: {},
    original_simulation_id: scenarioType
  };
  
  try {
    const response = await fetch(`${API_URL}/${scenarioType}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error(`❌ Simulation failed with status ${response.status}`);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return null;
    }
    
    const result = await response.json();
    
    if (result.success && result.data && result.data.ai_explanations) {
      console.log(`✅ Success! Got ${result.data.ai_explanations.length} AI explanation cards`);
      
      // Extract key info from each card
      const cardSummaries = result.data.ai_explanations.map(card => ({
        title: card.title,
        tag: card.tag || card.category,
        savings: card.potential_saving || card.potentialSaving,
        category: card.category,
        firstStep: card.steps ? card.steps[0] : 'No steps'
      }));
      
      return cardSummaries;
    } else {
      console.error('❌ No AI explanations in response');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error running simulation:', error.message);
    return null;
  }
}

async function compareSimulations() {
  console.log('🧪 SIMULATION DIFFERENTIATION TEST');
  console.log('==================================');
  
  const profileId = profiles.millennial.id;
  console.log(`Using profile: ${profileId} (Millennial)`);
  
  const results = {};
  
  // Run each simulation
  for (const scenario of scenarios) {
    const cards = await runSimulation(scenario.type, profileId);
    if (cards) {
      results[scenario.type] = cards;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Compare results
  console.log('\n📊 COMPARISON RESULTS');
  console.log('=====================');
  
  for (const scenario of scenarios) {
    const cards = results[scenario.type];
    if (cards) {
      console.log(`\n${scenario.name}:`);
      cards.forEach((card, index) => {
        console.log(`  Card ${index + 1}:`);
        console.log(`    Title: ${card.title}`);
        console.log(`    Tag: ${card.tag}`);
        console.log(`    Savings: $${card.savings}`);
        console.log(`    Category: ${card.category}`);
        console.log(`    First Step: ${card.firstStep}`);
      });
    }
  }
  
  // Check for uniqueness
  console.log('\n🔍 UNIQUENESS CHECK');
  console.log('===================');
  
  if (results.medical_crisis && results.home_purchase) {
    const medicalTitles = results.medical_crisis.map(c => c.title).join(', ');
    const homeTitles = results.home_purchase.map(c => c.title).join(', ');
    
    if (medicalTitles === homeTitles) {
      console.error('❌ FAIL: Medical crisis and home purchase have identical titles!');
      console.error('   Medical:', medicalTitles);
      console.error('   Home:', homeTitles);
    } else {
      console.log('✅ PASS: Medical crisis and home purchase have different titles');
      console.log('   Medical:', medicalTitles);
      console.log('   Home:', homeTitles);
    }
    
    // Check categories
    const medicalCategories = results.medical_crisis.map(c => c.category).filter(Boolean);
    const homeCategories = results.home_purchase.map(c => c.category).filter(Boolean);
    
    if (medicalCategories.length > 0 && homeCategories.length > 0) {
      const medicalHasHealth = medicalCategories.some(c => c.toLowerCase().includes('health') || c.toLowerCase().includes('medical'));
      const homeHasHome = homeCategories.some(c => c.toLowerCase().includes('home') || c.toLowerCase().includes('purchase'));
      
      if (medicalHasHealth && homeHasHome) {
        console.log('✅ PASS: Scenarios have appropriate category-specific cards');
      } else {
        console.log('⚠️  WARNING: Categories may not be scenario-specific');
      }
    }
  }
  
  console.log('\n✨ Test complete!');
}

// Run the test
compareSimulations().catch(console.error);