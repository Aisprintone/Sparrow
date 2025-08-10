async function testSimulationAPI() {
  console.log('=== SIMULATION API TEST ===\n');
  
  const scenarios = [
    'emergency_fund',
    'job_loss', 
    'medical_crisis',
    'market_crash',
    'home_purchase',
    'student_loan',
    'gig_economy',
    'rent_hike',
    'auto_repair'
  ];
  
  const profiles = ['1', '2', '3']; // Gen Z, Millennial, Gen X
  
  console.log('Testing simulation endpoints...\n');
  
  for (const scenario of scenarios) {
    console.log(`Testing ${scenario}...`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/simulation/${scenario}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: '1',
          scenario_type: scenario,
          use_current_profile: true,
          parameters: {}
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ ${scenario}: SUCCESS`);
        
        // Check for key response fields
        if (data.data?.simulation_result) {
          console.log(`   - Has simulation_result`);
        }
        if (data.data?.ai_explanations) {
          console.log(`   - Has AI explanations`);
        }
        if (data.data?.action_cards) {
          console.log(`   - Has ${data.data.action_cards.length} action cards`);
        }
      } else {
        console.log(`❌ ${scenario}: FAILED - ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${scenario}: ERROR - ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('=== TEST COMPLETE ===');
}

testSimulationAPI().catch(console.error);