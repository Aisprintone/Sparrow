/**
 * Type-safe API service layer
 * All API calls go through these services for consistency
 */

import { apiClient } from './client';
import {
  AuthRequest,
  AuthResponse,
  UserProfile,
  AccountSummary,
  Account,
  Transaction,
  TransactionFilter,
  SpendingAnalysis,
  SpendingPeriod,
  Goal,
  GoalInput,
  PaginatedResponse,
} from './types';

// ============================================================================
// Authentication Service
// ============================================================================

export class AuthService {
  /**
   * Login with user profile
   */
  static async login(request: AuthRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/profile-login',
      request,
      { skipAuth: true }
    );
    
    // Store tokens in client
    if (response.tokens) {
      apiClient.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
    }
    
    return response;
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Clear tokens regardless of API response
      apiClient.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true }
    );
    
    // Update tokens
    if (response.tokens) {
      apiClient.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
    }
    
    return response;
  }

  /**
   * Get current session info
   */
  static async getSession(): Promise<any> {
    return apiClient.get('/auth/session');
  }
}

// ============================================================================
// User Service
// ============================================================================

export class UserService {
  /**
   * Get current user profile with financial summary
   */
  static async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/profile');
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/users/me', updates);
  }

  /**
   * Switch user profile (for demo mode)
   */
  static async switchProfile(profileId: AuthRequest['profileId']): Promise<AuthResponse> {
    // Logout current user
    await AuthService.logout();
    
    // Login with new profile
    return AuthService.login({ profileId });
  }
}

// ============================================================================
// Market Data Service
// ============================================================================

export interface MarketData {
  market_indices: {
    'S&P 500': number;
    'NASDAQ': number;
    'DOW': number;
    'VIX': number;
  };
  interest_rates: {
    federal_funds_rate: number;
    prime_rate: number;
    mortgage_30yr: number;
    mortgage_15yr: number;
    savings_rate: number;
    cd_1yr: number;
    cd_5yr: number;
  };
  inflation_data: {
    cpi_yoy: number;
    core_cpi_yoy: number;
    pce_yoy: number;
    core_pce_yoy: number;
    gdp_deflator: number;
  };
  economic_indicators: {
    unemployment_rate: number;
    gdp_growth_qoq: number;
    consumer_confidence: number;
    housing_starts: number;
    retail_sales_yoy: number;
    industrial_production: number;
    capacity_utilization: number;
  };
  last_updated: string;
}

export class MarketDataService {
  /**
   * Get current market data for simulations
   */
  static async getMarketData(): Promise<MarketData> {
    return apiClient.get<MarketData>('/api/market-data');
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<any> {
    return apiClient.get('/api/cache-stats');
  }
}

// ============================================================================
// Plaid Account Service
// ============================================================================

export interface PlaidAccount {
  plaid_account_id: string;
  account_id: string;
  customer_id: number;
  institution_name: string;
  account_name: string;
  account_type: string;
  subtype: string;
  balance: number;
  available_balance?: number;
  credit_limit?: number;
  iso_currency_code: string;
  last_updated_datetime: string;
}

export interface PlaidAccountsResponse {
  success: boolean;
  accounts: PlaidAccount[];
  total_accounts: number;
  profile_id: number;
}

export class PlaidAccountService {
  /**
   * Get Plaid-style account data for a profile
   */
  static async getPlaidAccounts(profileId: number): Promise<PlaidAccountsResponse> {
    return apiClient.get<PlaidAccountsResponse>(`/api/plaid-accounts/${profileId}`);
  }

  /**
   * Get account summary with Plaid data
   */
  static async getAccountSummary(profileId: number): Promise<AccountSummary> {
    const plaidResponse = await this.getPlaidAccounts(profileId);
    
    const accounts: Account[] = plaidResponse.accounts.map(plaidAccount => ({
      id: plaidAccount.account_id,
      name: plaidAccount.account_name,
      type: plaidAccount.account_type as any,
      institution: plaidAccount.institution_name,
      balance: plaidAccount.balance,
      currency: plaidAccount.iso_currency_code,
      lastSynced: plaidAccount.last_updated_datetime
    }));

    const totalAssets = accounts
      .filter(acc => acc.balance > 0)
      .reduce((sum, acc) => sum + acc.balance, 0);
    
    const totalLiabilities = accounts
      .filter(acc => acc.balance < 0)
      .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      accounts
    };
  }
}

// ============================================================================
// Account Service
// ============================================================================

export class AccountService {
  /**
   * Get all accounts for current user
   */
  static async getAccounts(): Promise<Account[]> {
    return apiClient.get<Account[]>('/api/accounts');
  }

  /**
   * Get account by ID
   */
  static async getAccount(accountId: string): Promise<Account> {
    return apiClient.get<Account>(`/api/accounts/${accountId}`);
  }

  /**
   * Sync accounts with connected institutions
   */
  static async syncAccounts(): Promise<void> {
    return apiClient.post('/api/accounts/sync');
  }

  /**
   * Get account summary
   */
  static async getAccountSummary(): Promise<AccountSummary> {
    return apiClient.get<AccountSummary>('/api/accounts/summary');
  }
}

// ============================================================================
// Transaction Service
// ============================================================================

export class TransactionService {
  /**
   * Get transactions with optional filters
   */
  static async getTransactions(filters?: TransactionFilter): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return apiClient.get<PaginatedResponse<Transaction>>(`/api/transactions?${params.toString()}`);
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(transactionId: string): Promise<Transaction> {
    return apiClient.get<Transaction>(`/api/transactions/${transactionId}`);
  }

  /**
   * Update transaction
   */
  static async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<Transaction> {
    return apiClient.put<Transaction>(`/api/transactions/${transactionId}`, updates);
  }

  /**
   * Get transaction categories
   */
  static async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/api/transactions/categories');
  }

  /**
   * Get recurring transactions
   */
  static async getRecurringTransactions(): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>('/api/transactions/recurring');
  }
}

// ============================================================================
// Spending Service
// ============================================================================

export class SpendingService {
  /**
   * Get spending analysis
   */
  static async getSpendingAnalysis(period: SpendingPeriod): Promise<SpendingAnalysis> {
    return apiClient.get<SpendingAnalysis>(`/api/spending/analytics?period=${period}`);
  }

  /**
   * Get spending budgets
   */
  static async getBudgets(): Promise<any[]> {
    return apiClient.get<any[]>('/api/spending/budgets');
  }

  /**
   * Create or update budget
   */
  static async updateBudget(budget: any): Promise<any> {
    return apiClient.post<any>('/api/spending/budgets', budget);
  }

  /**
   * Get spending insights
   */
  static async getInsights(): Promise<string[]> {
    return apiClient.get<string[]>('/api/spending/insights');
  }
}

// ============================================================================
// Goal Service
// ============================================================================

export class GoalService {
  /**
   * Get all goals
   */
  static async getGoals(): Promise<Goal[]> {
    return apiClient.get<Goal[]>('/api/goals');
  }

  /**
   * Create new goal
   */
  static async createGoal(goal: GoalInput): Promise<Goal> {
    return apiClient.post<Goal>('/api/goals', goal);
  }

  /**
   * Update goal
   */
  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    return apiClient.put<Goal>(`/api/goals/${goalId}`, updates);
  }

  /**
   * Delete goal
   */
  static async deleteGoal(goalId: string): Promise<void> {
    return apiClient.delete(`/api/goals/${goalId}`);
  }
}

// ============================================================================
// Simulation Service
// ============================================================================

export interface SimulationRequest {
  profile_id: number;
  scenario_type: string;
  iterations?: number;
  include_advanced_metrics?: boolean;
  custom_parameters?: Record<string, any>;
}

export interface SimulationResponse {
  success: boolean;
  result: any;
  profile: any;
  market_context: MarketData;
  simulation_metadata: {
    iterations: number;
    scenario_type: string;
    processing_time_ms: number;
    confidence_level: number;
  };
}

export class SimulationService {
  /**
   * Run financial simulation
   */
  static async runSimulation(request: SimulationRequest): Promise<SimulationResponse> {
    return apiClient.post<SimulationResponse>('/api/simulate', request);
  }

  /**
   * Get available scenarios
   */
  static async getScenarios(): Promise<any[]> {
    return apiClient.get<any[]>('/api/scenarios');
  }
}

// ============================================================================
// WebSocket Service
// ============================================================================

export class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(accessToken: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8787/ws';
    
    this.ws = new WebSocket(`${wsUrl}?token=${accessToken}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(accessToken);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(accessToken: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(accessToken);
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// Global realtime service instance
export const realtimeService = new RealtimeService();