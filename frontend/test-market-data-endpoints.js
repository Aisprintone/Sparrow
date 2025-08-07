// Test script for market data endpoints
const BASE_URL = 'http://localhost:3000'; // Update this to your Netlify URL when testing

async function testMarketDataEndpoints() {
  console.log('Testing market data endpoints...\n');

  try {
    // Test quotes endpoint
    console.log('1. Testing /api/market-data/quotes...');
    const quotesResponse = await fetch(`${BASE_URL}/api/market-data/quotes`);
    const quotesData = await quotesResponse.json();
    
    if (quotesData.success && quotesData.data && quotesData.data.length > 0) {
      console.log('✅ Quotes endpoint working');
      console.log(`   Found ${quotesData.data.length} market quotes`);
      quotesData.data.forEach(quote => {
        console.log(`   - ${quote.name} (${quote.symbol}): $${quote.price.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`);
      });
    } else {
      console.log('❌ Quotes endpoint failed');
      console.log('   Response:', quotesData);
    }

    console.log('\n2. Testing /api/market-data/historical...');
    const historicalResponse = await fetch(`${BASE_URL}/api/market-data/historical`);
    const historicalData = await historicalResponse.json();
    
    if (historicalData.success && historicalData.data) {
      console.log('✅ Historical endpoint working');
      console.log(`   Yesterday data: ${historicalData.data.yesterday?.length || 0} quotes`);
      console.log(`   Week data: ${historicalData.data.week?.length || 0} quotes`);
    } else {
      console.log('❌ Historical endpoint failed');
      console.log('   Response:', historicalData);
    }

    console.log('\n3. Testing market data screen integration...');
    // Simulate the frontend fetch calls
    const screenData = {
      today: quotesData.success ? quotesData.data : [],
      yesterday: historicalData.success ? historicalData.data.yesterday : [],
      week: historicalData.success ? historicalData.data.week : [],
      loading: false
    };

    if (screenData.today.length > 0 && screenData.yesterday.length > 0 && screenData.week.length > 0) {
      console.log('✅ Market data screen integration working');
      console.log(`   Today: ${screenData.today.length} quotes`);
      console.log(`   Yesterday: ${screenData.yesterday.length} quotes`);
      console.log(`   Week: ${screenData.week.length} quotes`);
    } else {
      console.log('❌ Market data screen integration failed');
      console.log('   Screen data:', screenData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testMarketDataEndpoints();
