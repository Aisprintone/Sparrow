/**
 * Auto-generated TypeScript types from OpenAPI specification
 * DO NOT EDIT MANUALLY - Types are generated from openapi-spec.ts
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthRequest {
  profileId: 'millennial' | 'professional' | 'genz';
  password?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileType: UserProfileType;
  preferences?: UserPreferences;
}

export type UserProfileType = 'millennial' | 'professional' | 'genz';

export interface UserPreferences {
  theme?: string;
  notifications?: boolean;
  currency?: string;
}

export interface UserProfile extends User {
  financialSummary: FinancialSummary;
}

export interface FinancialSummary {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  creditScore: number;
}

// ============================================================================
// Account Types
// ============================================================================

export interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accounts: Account[];
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution?: string;
  balance: number;
  currency?: string;
  lastSynced?: string;
}

export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'credit' 
  | 'investment' 
  | 'loan' 
  | 'mortgage';

// ============================================================================
// Transaction Types
// ============================================================================

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency?: string;
  date: string;
  description: string;
  category?: string;
  subcategory?: string;
  merchant?: string;
  pending?: boolean;
  recurring?: boolean;
  tags?: string[];
  notes?: string;
  location?: LocationInfo;
}

export interface LocationInfo {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lon?: number;
}

export interface TransactionFilter {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// Spending Analysis Types
// ============================================================================

export interface SpendingAnalysis {
  period: SpendingPeriod;
  totalSpent: number;
  categories: SpendingCategory[];
  insights: string[];
}

export type SpendingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  trend: SpendingTrend;
}

export type SpendingTrend = 'up' | 'down' | 'stable';

// ============================================================================
// Goal Types
// ============================================================================

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  current: number;
  deadline?: string;
  monthlyContribution?: number;
  milestones?: GoalMilestone[];
}

export type GoalType = 'safety' | 'home' | 'experience' | 'retirement' | 'debt';

export interface GoalMilestone {
  name: string;
  target: number;
  completed?: boolean;
}

export interface GoalInput {
  title: string;
  type: GoalType;
  target: number;
  deadline?: string;
  monthlyContribution?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: number;
  version: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface BalanceUpdateEvent {
  type: 'account.balance.updated';
  accountId: string;
  previousBalance: number;
  currentBalance: number;
  timestamp: number;
}

export interface TransactionEvent {
  type: 'transaction.new' | 'transaction.updated';
  transaction: Transaction;
  category: string;
  isRecurring: boolean;
}

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Business logic errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  SYNC_FAILED = 'SYNC_FAILED',
}

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'message' in error &&
    'timestamp' in error &&
    'requestId' in error
  );
}

export function isAuthResponse(response: unknown): response is AuthResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'user' in response &&
    'tokens' in response
  );
}

export function isPaginatedResponse<T>(
  response: unknown
): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'items' in response &&
    'total' in response &&
    'limit' in response &&
    'offset' in response
  );
}