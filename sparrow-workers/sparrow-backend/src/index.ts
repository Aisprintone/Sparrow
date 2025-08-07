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

    // CORS headers for sparrow.io
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://sparrow.io',
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