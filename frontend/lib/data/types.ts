// DATA INTEGRATION TYPES - SURGICAL PRECISION TYPE DEFINITIONS
// Performance-critical type definitions for sub-10ms operations

// ============================================================================
// CORE DATA MODELS
// ============================================================================

export interface Customer {
  customer_id: number
  location: string
  age: number
}

export interface Account {
  account_id: number
  customer_id: number
  institution_name: string
  account_number: string
  account_type: 'checking' | 'savings' | 'credit_card' | 'mortgage' | 'investment' | 'student_loan' | 'auto_loan'
  balance: number
  created_at: string
  credit_limit?: number
}

export interface Transaction {
  transaction_id: number
  account_id: number
  timestamp: string
  amount: number
  description: string
  category_id: number
  is_debit: boolean
  is_bill: boolean
  is_subscription: boolean
  due_date?: string
  account_type: string
}

export interface Goal {
  goal_id: number
  customer_id: number
  name: string
  description: string
  target_amount: number
  target_date: string
}

export interface Category {
  category_id: number
  name: string
}

// ============================================================================
// AGGREGATED PROFILE DATA
// ============================================================================

export interface ProfileData {
  customer: Customer
  accounts: Account[]
  transactions: Transaction[]
  goals: Goal[]
  categories: Map<number, Category>
  
  // Computed metrics (cached for performance)
  metrics: ProfileMetrics
  
  // Metadata for cache management
  metadata: ProfileMetadata
}

export interface ProfileMetrics {
  netWorth: number
  liquidAssets: number
  totalDebt: number
  monthlyIncome: number
  monthlySpending: SpendingAnalysis
  creditUtilization: number
  savingsRate: number
  debtToIncomeRatio: number
  emergencyFundMonths: number
  
  // Time-series data for charts
  netWorthHistory: TimeSeriesData[]
  spendingTrends: TimeSeriesData[]
  incomeTrends: TimeSeriesData[]
}

export interface SpendingAnalysis {
  total: number
  average: number
  median: number
  byCategory: Map<string, CategorySpending>
  byMerchant: Map<string, number>
  recurringExpenses: RecurringExpense[]
  anomalies: SpendingAnomaly[]
  topCategories: { name: string; amount: number; percentage: number }[]
}

export interface CategorySpending {
  categoryId: number
  categoryName: string
  amount: number
  transactionCount: number
  percentage: number
  trend: 'increasing' | 'decreasing' | 'stable'
  monthOverMonthChange: number
}

export interface RecurringExpense {
  name: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  nextDue: string
  category: string
  isSubscription: boolean
}

export interface SpendingAnomaly {
  transactionId: number
  description: string
  amount: number
  deviation: number // Standard deviations from mean
  category: string
  severity: 'low' | 'medium' | 'high'
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface ProfileMetadata {
  profileId: number
  lastUpdated: number // Unix timestamp
  cacheKey: string
  version: string
  dataQuality: DataQuality
}

export interface DataQuality {
  completeness: number // 0-100
  accuracy: number // 0-100
  consistency: number // 0-100
  issues: DataIssue[]
}

export interface DataIssue {
  type: 'missing_data' | 'invalid_format' | 'referential_integrity' | 'business_rule_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  field: string
  message: string
  affected_records: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T> {
  success: boolean
  data: T
  meta: ResponseMetadata
  profile: ProfileInfo
  performance: PerformanceMetrics
}

export interface ResponseMetadata {
  timestamp: number
  version: string
  cached: boolean
  cacheAge?: number // milliseconds
  computeTime: number // milliseconds
  dataSource: 'cache' | 'computed' | 'mixed'
}

export interface ProfileInfo {
  id: number
  name: string
  lastUpdated: string
  dataQuality: number // 0-100
}

export interface PerformanceMetrics {
  totalTime: number
  parseTime: number
  computeTime: number
  cacheHits: number
  cacheMisses: number
  memoryUsed: number // bytes
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
  size: number // bytes
  checksum: string
}

export interface CacheStats {
  totalSize: number
  entryCount: number
  hitRate: number
  missRate: number
  evictionCount: number
  avgResponseTime: number
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface DataError {
  code: string
  type: ErrorType
  message: string
  field?: string
  value?: any
  context?: Record<string, any>
  recoverable: boolean
  fallback?: any
}

export type ErrorType = 
  | 'MISSING_DATA'
  | 'INVALID_FORMAT'
  | 'REFERENCE_ERROR'
  | 'CALCULATION_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'INTEGRITY_ERROR'

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface DataIntegrationConfig {
  cache: CacheConfig
  performance: PerformanceConfig
  validation: ValidationConfig
  fallback: FallbackConfig
}

export interface CacheConfig {
  enabled: boolean
  maxSize: number // bytes
  ttl: number // seconds
  strategy: 'LRU' | 'LFU' | 'TTL'
  compressionEnabled: boolean
}

export interface PerformanceConfig {
  maxResponseTime: number // milliseconds
  maxMemoryUsage: number // bytes
  maxConcurrentRequests: number
  enableIndexing: boolean
  enablePrecomputation: boolean
}

export interface ValidationConfig {
  strict: boolean
  autoCorrect: boolean
  reportIssues: boolean
  failOnCritical: boolean
}

export interface FallbackConfig {
  enableFallbacks: boolean
  defaultValues: Record<string, any>
  retryAttempts: number
  retryDelay: number
}

// ============================================================================
// INDEX TYPES
// ============================================================================

export interface IndexDefinition {
  name: string
  type: 'btree' | 'hash' | 'bitmap' | 'timeseries'
  fields: string[]
  unique: boolean
  sparse: boolean
}

export interface QueryPlan {
  operation: string
  index: string | null
  estimatedCost: number
  estimatedRows: number
  actualCost?: number
  actualRows?: number
}

// ============================================================================
// TRANSFORMATION TYPES
// ============================================================================

export interface TransformationRule {
  field: string
  transform: (value: any, row?: any) => any
  validate?: (value: any) => boolean
  fallback?: any
}

export interface TransformationPipeline {
  name: string
  stages: TransformationStage[]
  errorHandler?: (error: DataError) => any
}

export interface TransformationStage {
  name: string
  execute: (data: any) => Promise<any>
  rollback?: (data: any) => Promise<any>
}

// ============================================================================
// REAL-TIME UPDATE TYPES
// ============================================================================

export interface DataEvent {
  type: 'create' | 'update' | 'delete'
  entity: 'account' | 'transaction' | 'goal'
  profileId: number
  data: any
  timestamp: number
}

export interface StreamUpdate {
  event: DataEvent
  delta: MetricsDelta
  affectedMetrics: string[]
}

export interface MetricsDelta {
  netWorth?: number
  monthlySpending?: number
  creditUtilization?: number
  [key: string]: number | undefined
}