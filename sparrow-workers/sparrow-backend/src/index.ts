/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  SPARROW_CACHE: KVNamespace;
  ENVIRONMENT: string;
}

interface ProfileData {
  id: number;
  name: string;
  age: number;
  location: string;
  netWorth: number;
  monthlyIncome: number;
  monthlySpending: number;
  creditScore: number;
  accounts: Account[];
  spendingCategories: SpendingCategory[];
  recentTransactions: Transaction[];
}

interface Account {
  id: number;
  name: string;
  institution: string;
  balance: number;
  type: 'asset' | 'liability';
}

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const startTime = performance.now();

    // CORS headers for multiple domains
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://sparrow-finance-app.netlify.app',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling for sub-10ms performance
      if (url.pathname.startsWith('/api/profiles')) {
        return await handleProfiles(request, env, corsHeaders, startTime);
      }

      if (url.pathname.startsWith('/api/metrics')) {
        return await handleMetrics(request, env, corsHeaders, startTime);
      }

      if (url.pathname.startsWith('/api/ai')) {
        return await handleAI(request, env, corsHeaders, startTime);
      }

      if (url.pathname.startsWith('/api/simulation')) {
        return await handleSimulation(request, env, corsHeaders, startTime);
      }

      if (url.pathname.startsWith('/api/market-data')) {
        return await handleMarketData(request, env, corsHeaders, startTime);
      }

      // Default response
      return new Response(JSON.stringify({ 
        message: 'Sparrow.io API', 
        version: '1.0.0',
        performance: `${(performance.now() - startTime).toFixed(2)}ms`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        performance: `${(performance.now() - startTime).toFixed(2)}ms`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Optimized profile switching with KV cache-first strategy
async function handleProfiles(request: Request, env: Env, corsHeaders: Record<string, string>, startTime: number): Promise<Response> {
  const url = new URL(request.url);
  const profileId = url.pathname.split('/').pop();

  if (!profileId) {
    // Return all profiles (cached)
    const cacheKey = 'profiles:list';
    let profiles = await env.SPARROW_CACHE.get(cacheKey, 'json');
    
    if (!profiles) {
      // Cache miss - query D1
      const result = await env.DB.prepare(`
        SELECT id, name, age, location, net_worth, monthly_income, monthly_spending, credit_score 
        FROM profiles 
        ORDER BY id
      `).all();
      
      profiles = result.results;
      
      // Cache for 1 hour
      await env.SPARROW_CACHE.put(cacheKey, JSON.stringify(profiles), { expirationTtl: 3600 });
    }

    return new Response(JSON.stringify({ 
      profiles,
      performance: `${(performance.now() - startTime).toFixed(2)}ms`,
      cache: profiles ? 'hit' : 'miss'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get specific profile with full data
  const cacheKey = `profile:${profileId}:full`;
  let profileData = await env.SPARROW_CACHE.get(cacheKey, 'json');

  if (!profileData) {
    // Cache miss - query D1 with optimized joins
    const profile = await env.DB.prepare(`
      SELECT id, name, age, location, net_worth, monthly_income, monthly_spending, credit_score 
      FROM profiles WHERE id = ?
    `).bind(profileId).first();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get accounts
    const accounts = await env.DB.prepare(`
      SELECT id, name, institution, balance, type 
      FROM accounts WHERE profile_id = ?
    `).bind(profileId).all();

    // Get spending categories (pre-computed)
    const spendingCategories = await env.DB.prepare(`
      SELECT name, amount, percentage 
      FROM spending_categories WHERE profile_id = ?
    `).bind(profileId).all();

    // Get recent transactions (limited to 50 for performance)
    const recentTransactions = await env.DB.prepare(`
      SELECT id, description, amount, category, date 
      FROM transactions 
      WHERE profile_id = ? 
      ORDER BY date DESC 
      LIMIT 50
    `).bind(profileId).all();

    profileData = {
      ...profile,
      accounts: accounts.results,
      spendingCategories: spendingCategories.results,
      recentTransactions: recentTransactions.results
    };

    // Cache for 1 hour
    await env.SPARROW_CACHE.put(cacheKey, JSON.stringify(profileData), { expirationTtl: 3600 });
  }

  return new Response(JSON.stringify({ 
    profile: profileData,
    performance: `${(performance.now() - startTime).toFixed(2)}ms`,
    cache: profileData ? 'hit' : 'miss'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Optimized metrics endpoint
async function handleMetrics(request: Request, env: Env, corsHeaders: Record<string, string>, startTime: number): Promise<Response> {
  const url = new URL(request.url);
  const profileId = url.pathname.split('/')[3]; // /api/metrics/{profileId}

  const cacheKey = `metrics:${profileId}`;
  let metrics = await env.SPARROW_CACHE.get(cacheKey, 'json');

  if (!metrics) {
    // Pre-computed metrics from D1
    const result = await env.DB.prepare(`
      SELECT 
        net_worth,
        monthly_income,
        monthly_spending,
        credit_score,
        (SELECT SUM(balance) FROM accounts WHERE profile_id = ? AND type = 'asset') as total_assets,
        (SELECT SUM(balance) FROM accounts WHERE profile_id = ? AND type = 'liability') as total_liabilities
      FROM profiles WHERE id = ?
    `).bind(profileId, profileId, profileId).first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    metrics = {
      ...result,
      savingsRate: ((result.monthly_income - result.monthly_spending) / result.monthly_income * 100).toFixed(1),
      debtToIncome: (result.total_liabilities / result.monthly_income * 100).toFixed(1)
    };

    // Cache for 30 minutes
    await env.SPARROW_CACHE.put(cacheKey, JSON.stringify(metrics), { expirationTtl: 1800 });
  }

  return new Response(JSON.stringify({ 
    metrics,
    performance: `${(performance.now() - startTime).toFixed(2)}ms`,
    cache: metrics ? 'hit' : 'miss'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// AI integration endpoint
async function handleAI(request: Request, env: Env, corsHeaders: Record<string, string>, startTime: number): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/ai/chat')) {
    // External AI API call with caching
    const cacheKey = `ai:chat:${await request.text()}`;
    let aiResponse = await env.SPARROW_CACHE.get(cacheKey);

    if (!aiResponse) {
      // Call external AI API (OpenAI/Anthropic)
      // This would be implemented based on your AI provider
      aiResponse = JSON.stringify({ 
        message: "AI response placeholder",
        timestamp: new Date().toISOString()
      });

      // Cache AI responses for 1 hour
      await env.SPARROW_CACHE.put(cacheKey, aiResponse, { expirationTtl: 3600 });
    }

    return new Response(aiResponse, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ error: 'AI endpoint not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Simulation endpoint handler
async function handleSimulation(request: Request, env: Env, corsHeaders: Record<string, string>, startTime: number): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const scenarioType = pathParts[pathParts.length - 1]; // Get the scenario type from URL

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { profile_id, scenario_type, iterations = 1000, include_advanced_metrics = true, generate_explanations = true } = body;

    // Get profile data
    const profile = await env.DB.prepare(`
      SELECT id, name, age, location, net_worth, monthly_income, monthly_spending, credit_score 
      FROM profiles WHERE id = ?
    `).bind(profile_id).first();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate simulation results based on scenario type
    const simulationResults = generateSimulationResults(profile, scenario_type, iterations);
    
    // Generate AI explanations if requested
    let aiExplanations = [];
    if (generate_explanations) {
      aiExplanations = generateAIExplanations(profile, scenario_type, simulationResults);
    }

    return new Response(JSON.stringify({
      data: {
        simulation_results: simulationResults,
        ai_explanations: aiExplanations,
        profile: profile,
        scenario_type: scenario_type
      },
      performance: `${(performance.now() - startTime).toFixed(2)}ms`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simulation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Simulation failed',
      performance: `${(performance.now() - startTime).toFixed(2)}ms`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to generate simulation results
function generateSimulationResults(profile: any, scenarioType: string, iterations: number) {
  const baseIncome = profile.monthly_income;
  const baseSpending = profile.monthly_spending;
  const netWorth = profile.net_worth;

  let results = {
    scenario: scenarioType,
    iterations: iterations,
    base_metrics: {
      monthly_income: baseIncome,
      monthly_spending: baseSpending,
      net_worth: netWorth,
      savings_rate: ((baseIncome - baseSpending) / baseIncome * 100).toFixed(1)
    },
    simulation_metrics: {},
    risk_analysis: {},
    recommendations: []
  };

  switch (scenarioType) {
    case 'emergency_fund':
      results.simulation_metrics = {
        emergency_fund_needed: baseSpending * 6,
        current_savings: netWorth * 0.1,
        months_to_target: Math.max(1, Math.ceil((baseSpending * 6 - netWorth * 0.1) / (baseIncome - baseSpending)))
      };
      results.risk_analysis = {
        risk_level: netWorth < baseSpending * 3 ? 'high' : netWorth < baseSpending * 6 ? 'medium' : 'low',
        vulnerability_score: Math.max(0, 100 - (netWorth / baseSpending) * 10)
      };
      break;

    case 'student_loan':
      const studentLoanBalance = 25000; // Example balance
      results.simulation_metrics = {
        total_loan_balance: studentLoanBalance,
        monthly_payment: studentLoanBalance * 0.01, // 1% monthly payment
        payoff_months: Math.ceil(studentLoanBalance / (studentLoanBalance * 0.01)),
        interest_savings: studentLoanBalance * 0.2 // 20% interest savings
      };
      break;

    case 'market_crash':
      const portfolioValue = netWorth * 0.7; // Assume 70% in investments
      results.simulation_metrics = {
        portfolio_value: portfolioValue,
        potential_loss: portfolioValue * 0.3, // 30% potential loss
        recovery_months: 24,
        diversification_score: 65
      };
      break;

    default:
      results.simulation_metrics = {
        scenario_specific_metric: 'Default simulation result'
      };
  }

  return results;
}

// Helper function to generate AI explanations
function generateAIExplanations(profile: any, scenarioType: string, simulationResults: any) {
  const explanations = [];

  switch (scenarioType) {
    case 'emergency_fund':
      explanations.push({
        id: "emergency-fund-strategy",
        title: "Emergency Fund Strategy",
        description: "Build a 6-month emergency fund to protect against unexpected expenses",
        tag: "3-6 months",
        tagColor: "bg-blue-500/20 text-blue-300",
        potentialSaving: "$" + (profile.monthly_spending * 6).toLocaleString(),
        rationale: "An emergency fund provides financial security and prevents debt accumulation during crises",
        steps: [
          "Set aside 10% of monthly income",
          "Automate transfers to savings",
          "Keep funds in high-yield account",
          "Replenish after emergencies"
        ]
      });
      break;

    case 'student_loan':
      explanations.push({
        id: "avalanche-method",
        title: "Avalanche Method",
        description: "Focus on paying off your highest interest rate debt first",
        tag: "6-12 months",
        tagColor: "bg-green-500/20 text-green-300",
        potentialSaving: "$2,450",
        rationale: "This method minimizes total interest paid over time",
        steps: [
          "List all debts by interest rate",
          "Pay minimums on all",
          "Extra payments to highest rate",
          "Track progress monthly"
        ]
      });
      break;

    default:
      explanations.push({
        id: "general-strategy",
        title: "General Financial Strategy",
        description: "Improve your overall financial health",
        tag: "Ongoing",
        tagColor: "bg-purple-500/20 text-purple-300",
        potentialSaving: "$1,200",
        rationale: "Consistent financial planning leads to long-term success",
        steps: [
          "Track all expenses",
          "Set clear financial goals",
          "Automate savings",
          "Review progress monthly"
        ]
      });
  }

  return explanations;
}

// Market data handler with real-time fallback data
async function handleMarketData(request: Request, env: Env, corsHeaders: Record<string, string>, startTime: number): Promise<Response> {
  const url = new URL(request.url);
  
  // Generate realistic market data
  const marketData = {
    "^GSPC": {
      price: 4500.0 + (Math.random() - 0.5) * 50,
      change: (Math.random() - 0.5) * 30,
      changePercent: (Math.random() - 0.5) * 2,
      volume: 2500000000 + Math.random() * 500000000,
      high: 4510.0 + Math.random() * 20,
      low: 4485.0 - Math.random() * 20,
      open: 4490.0 + (Math.random() - 0.5) * 10
    },
    "^DJI": {
      price: 35000.0 + (Math.random() - 0.5) * 200,
      change: (Math.random() - 0.5) * 150,
      changePercent: (Math.random() - 0.5) * 1.5,
      volume: 350000000 + Math.random() * 100000000,
      high: 35100.0 + Math.random() * 100,
      low: 34900.0 - Math.random() * 100,
      open: 34950.0 + (Math.random() - 0.5) * 50
    },
    "^IXIC": {
      price: 14025.5 + (Math.random() - 0.5) * 100,
      change: (Math.random() - 0.5) * 80,
      changePercent: (Math.random() - 0.5) * 2.5,
      volume: 1800000000 + Math.random() * 400000000,
      high: 14050.0 + Math.random() * 50,
      low: 13980.0 - Math.random() * 50,
      open: 13990.0 + (Math.random() - 0.5) * 20
    },
    "^RUT": {
      price: 1850.75 + (Math.random() - 0.5) * 30,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 1.8,
      volume: 450000000 + Math.random() * 100000000,
      high: 1860.0 + Math.random() * 15,
      low: 1845.0 - Math.random() * 15,
      open: 1855.0 + (Math.random() - 0.5) * 10
    },
    "^VIX": {
      price: 15.25 + (Math.random() - 0.5) * 3,
      change: (Math.random() - 0.5) * 2,
      changePercent: (Math.random() - 0.5) * 15,
      volume: 85000000 + Math.random() * 20000000,
      high: 16.0 + Math.random() * 2,
      low: 15.0 - Math.random() * 2,
      open: 16.0 + (Math.random() - 0.5) * 1
    }
  };

  return new Response(JSON.stringify({
    success: true,
    data: marketData,
    message: "Market data retrieved successfully",
    meta: {
      timestamp: new Date().toISOString(),
      dataSource: "simulated",
      performance: `${(performance.now() - startTime).toFixed(2)}ms`
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
} 