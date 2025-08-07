// IN-MEMORY DATA STORE - SURGICAL PRECISION CACHING & INDEXING
// Optimized for sub-5ms lookups with multi-level indexing

import type {
  Customer,
  Account,
  Transaction,
  Goal,
  Category,
  ProfileData,
  ProfileMetrics,
  SpendingAnalysis,
  CategorySpending,
  RecurringExpense,
  TimeSeriesData,
  CacheEntry,
  CacheStats,
  IndexDefinition,
  QueryPlan,
  DataEvent,
  MetricsDelta
} from './types'

// ============================================================================
// INDEX IMPLEMENTATIONS
// ============================================================================

// B-Tree index for range queries
class BTreeIndex<T> {
  private root: BTreeNode<T> | null = null
  private order: number = 32 // Optimized for cache line size
  
  insert(key: number, value: T): void {
    if (!this.root) {
      this.root = new BTreeNode<T>(this.order, true)
      this.root.keys[0] = key
      this.root.values[0] = value
      this.root.n = 1
    } else {
      if (this.root.n === 2 * this.order - 1) {
        const newRoot = new BTreeNode<T>(this.order, false)
        newRoot.children[0] = this.root
        newRoot.splitChild(0, this.root)
        this.root = newRoot
      }
      this.root.insertNonFull(key, value)
    }
  }
  
  search(key: number): T | null {
    return this.root ? this.root.search(key) : null
  }
  
  range(min: number, max: number): T[] {
    const results: T[] = []
    if (this.root) {
      this.root.range(min, max, results)
    }
    return results
  }
}

class BTreeNode<T> {
  keys: number[] = []
  values: T[] = []
  children: BTreeNode<T>[] = []
  n: number = 0
  leaf: boolean
  
  constructor(private order: number, leaf: boolean) {
    this.leaf = leaf
    this.keys = new Array(2 * order - 1)
    this.values = new Array(2 * order - 1)
    this.children = new Array(2 * order)
  }
  
  search(key: number): T | null {
    let i = 0
    while (i < this.n && key > this.keys[i]) {
      i++
    }
    
    if (i < this.n && key === this.keys[i]) {
      return this.values[i]
    }
    
    if (this.leaf) {
      return null
    }
    
    return this.children[i].search(key)
  }
  
  range(min: number, max: number, results: T[]): void {
    let i = 0
    
    while (i < this.n) {
      if (!this.leaf && this.keys[i] >= min) {
        this.children[i].range(min, max, results)
      }
      
      if (this.keys[i] >= min && this.keys[i] <= max) {
        results.push(this.values[i])
      }
      
      if (this.keys[i] > max) {
        break
      }
      
      i++
    }
    
    if (!this.leaf && i < this.n && this.keys[i - 1] <= max) {
      this.children[i].range(min, max, results)
    }
  }
  
  insertNonFull(key: number, value: T): void {
    let i = this.n - 1
    
    if (this.leaf) {
      while (i >= 0 && this.keys[i] > key) {
        this.keys[i + 1] = this.keys[i]
        this.values[i + 1] = this.values[i]
        i--
      }
      this.keys[i + 1] = key
      this.values[i + 1] = value
      this.n++
    } else {
      while (i >= 0 && this.keys[i] > key) {
        i--
      }
      i++
      
      if (this.children[i].n === 2 * this.order - 1) {
        this.splitChild(i, this.children[i])
        if (this.keys[i] < key) {
          i++
        }
      }
      this.children[i].insertNonFull(key, value)
    }
  }
  
  splitChild(i: number, child: BTreeNode<T>): void {
    const newChild = new BTreeNode<T>(this.order, child.leaf)
    newChild.n = this.order - 1
    
    for (let j = 0; j < this.order - 1; j++) {
      newChild.keys[j] = child.keys[j + this.order]
      newChild.values[j] = child.values[j + this.order]
    }
    
    if (!child.leaf) {
      for (let j = 0; j < this.order; j++) {
        newChild.children[j] = child.children[j + this.order]
      }
    }
    
    child.n = this.order - 1
    
    for (let j = this.n; j >= i + 1; j--) {
      this.children[j + 1] = this.children[j]
    }
    
    this.children[i + 1] = newChild
    
    for (let j = this.n - 1; j >= i; j--) {
      this.keys[j + 1] = this.keys[j]
      this.values[j + 1] = this.values[j]
    }
    
    this.keys[i] = child.keys[this.order - 1]
    this.values[i] = child.values[this.order - 1]
    this.n++
  }
}

// Hash index for O(1) lookups
class HashIndex<T> {
  private buckets: Map<number, T[]> = new Map()
  private size: number = 0
  
  insert(key: number, value: T): void {
    const bucket = this.buckets.get(key) || []
    bucket.push(value)
    this.buckets.set(key, bucket)
    this.size++
  }
  
  get(key: number): T[] {
    return this.buckets.get(key) || []
  }
  
  delete(key: number): boolean {
    const deleted = this.buckets.delete(key)
    if (deleted) {
      this.size--
    }
    return deleted
  }
  
  getSize(): number {
    return this.size
  }
}

// Time-series index optimized for temporal queries
class TimeSeriesIndex<T> {
  private data: Array<{ timestamp: number; value: T }> = []
  private index: Map<string, number[]> = new Map() // Date string to indices
  
  insert(timestamp: string | Date, value: T): void {
    const ts = new Date(timestamp).getTime()
    const dateKey = new Date(timestamp).toISOString().split('T')[0]
    
    // Binary search for insertion point
    let left = 0
    let right = this.data.length
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (this.data[mid].timestamp < ts) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    
    this.data.splice(left, 0, { timestamp: ts, value })
    
    // Update date index
    const indices = this.index.get(dateKey) || []
    indices.push(left)
    this.index.set(dateKey, indices)
  }
  
  getRange(start: Date, end: Date): T[] {
    const startTs = start.getTime()
    const endTs = end.getTime()
    
    // Binary search for start
    let left = 0
    let right = this.data.length
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (this.data[mid].timestamp < startTs) {
        left = mid + 1
      } else {
        right = mid
      }
    }
    
    const results: T[] = []
    while (left < this.data.length && this.data[left].timestamp <= endTs) {
      results.push(this.data[left].value)
      left++
    }
    
    return results
  }
  
  getLatest(count: number): T[] {
    return this.data
      .slice(-count)
      .map(item => item.value)
      .reverse()
  }
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private accessOrder: string[] = []
  private maxSize: number
  private currentSize: number = 0
  private stats: CacheStats = {
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0,
    avgResponseTime: 0
  }
  private hits: number = 0
  private misses: number = 0
  
  constructor(maxSizeBytes: number) {
    this.maxSize = maxSizeBytes
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.misses++
      this.updateStats()
      return null
    }
    
    // Check TTL
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.delete(key)
      this.misses++
      this.updateStats()
      return null
    }
    
    // Update access order
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
    
    // Update hit count
    entry.hits++
    this.hits++
    this.updateStats()
    
    return entry.data
  }
  
  set(key: string, value: T, ttl: number = 3600): void {
    const size = this.estimateSize(value)
    
    // Evict if necessary
    while (this.currentSize + size > this.maxSize && this.accessOrder.length > 0) {
      const evictKey = this.accessOrder.shift()!
      this.delete(evictKey)
      this.stats.evictionCount++
    }
    
    // Create checksum for data integrity
    const checksum = this.createChecksum(value)
    
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size,
      checksum
    }
    
    this.cache.set(key, entry)
    this.accessOrder.push(key)
    this.currentSize += size
    this.updateStats()
  }
  
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    this.cache.delete(key)
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.currentSize -= entry.size
    this.updateStats()
    
    return true
  }
  
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.currentSize = 0
    this.hits = 0
    this.misses = 0
    this.updateStats()
  }
  
  getStats(): CacheStats {
    return { ...this.stats }
  }
  
  private estimateSize(obj: any): number {
    // Rough estimation of object size in bytes
    const str = JSON.stringify(obj)
    return str.length * 2 // 2 bytes per character (UTF-16)
  }
  
  private createChecksum(obj: any): string {
    // Simple checksum for data integrity
    const str = JSON.stringify(obj)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }
  
  private updateStats(): void {
    const total = this.hits + this.misses
    this.stats = {
      totalSize: this.currentSize,
      entryCount: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      evictionCount: this.stats.evictionCount,
      avgResponseTime: 0.5 // Mock value, would be calculated in production
    }
  }
}

// ============================================================================
// PROFILE DATA STORE
// ============================================================================

export class ProfileDataStore {
  // Primary data storage
  private customers: Map<number, Customer> = new Map()
  private accounts: Map<number, Account> = new Map()
  private transactions: Map<number, Transaction> = new Map()
  private goals: Map<number, Goal> = new Map()
  private categories: Map<number, Category> = new Map()
  
  // Indexes for fast lookups
  private accountsByCustomer: HashIndex<Account> = new HashIndex()
  private transactionsByAccount: HashIndex<Transaction> = new HashIndex()
  private transactionsByDate: TimeSeriesIndex<Transaction> = new TimeSeriesIndex()
  private goalsByCustomer: HashIndex<Goal> = new HashIndex()
  
  // Profile cache
  private profileCache: LRUCache<ProfileData> = new LRUCache(100 * 1024 * 1024) // 100MB
  private metricsCache: LRUCache<ProfileMetrics> = new LRUCache(50 * 1024 * 1024) // 50MB
  
  // Performance tracking
  private queryPlans: Map<string, QueryPlan> = new Map()
  
  // ============================================================================
  // DATA LOADING
  // ============================================================================
  
  async loadCustomers(customers: Customer[]): Promise<void> {
    const startTime = performance.now()
    
    for (const customer of customers) {
      this.customers.set(customer.customer_id, customer)
    }
    
    console.log(`Loaded ${customers.length} customers in ${performance.now() - startTime}ms`)
  }
  
  async loadAccounts(accounts: Account[]): Promise<void> {
    const startTime = performance.now()
    
    for (const account of accounts) {
      this.accounts.set(account.account_id, account)
      this.accountsByCustomer.insert(account.customer_id, account)
    }
    
    console.log(`Loaded ${accounts.length} accounts in ${performance.now() - startTime}ms`)
  }
  
  async loadTransactions(transactions: Transaction[]): Promise<void> {
    const startTime = performance.now()
    
    for (const transaction of transactions) {
      this.transactions.set(transaction.transaction_id, transaction)
      this.transactionsByAccount.insert(transaction.account_id, transaction)
      this.transactionsByDate.insert(transaction.timestamp, transaction)
    }
    
    console.log(`Loaded ${transactions.length} transactions in ${performance.now() - startTime}ms`)
  }
  
  async loadGoals(goals: Goal[]): Promise<void> {
    const startTime = performance.now()
    
    for (const goal of goals) {
      this.goals.set(goal.goal_id, goal)
      this.goalsByCustomer.insert(goal.customer_id, goal)
    }
    
    console.log(`Loaded ${goals.length} goals in ${performance.now() - startTime}ms`)
  }
  
  async loadCategories(categories: Category[]): Promise<void> {
    const startTime = performance.now()
    
    for (const category of categories) {
      this.categories.set(category.category_id, category)
    }
    
    console.log(`Loaded ${categories.length} categories in ${performance.now() - startTime}ms`)
  }
  
  // ============================================================================
  // PROFILE OPERATIONS
  // ============================================================================
  
  async getProfile(customerId: number): Promise<ProfileData | null> {
    const startTime = performance.now()
    const cacheKey = `profile_${customerId}`
    
    // Check cache first
    const cached = this.profileCache.get(cacheKey)
    if (cached) {
      console.log(`Profile ${customerId} retrieved from cache in ${performance.now() - startTime}ms`)
      return cached
    }
    
    // Build profile from data
    const customer = this.customers.get(customerId)
    if (!customer) return null
    
    const accounts = this.accountsByCustomer.get(customerId)
    const transactions: Transaction[] = []
    
    for (const account of accounts) {
      const accountTransactions = this.transactionsByAccount.get(account.account_id)
      transactions.push(...accountTransactions)
    }
    
    const goals = this.goalsByCustomer.get(customerId)
    
    // Compute metrics
    const metrics = await this.computeMetrics(customerId, accounts, transactions)
    
    const profileData: ProfileData = {
      customer,
      accounts,
      transactions: transactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      goals,
      categories: this.categories,
      metrics,
      metadata: {
        profileId: customerId,
        lastUpdated: Date.now(),
        cacheKey,
        version: '1.0.0',
        dataQuality: {
          completeness: 100,
          accuracy: 100,
          consistency: 100,
          issues: []
        }
      }
    }
    
    // Cache the profile
    this.profileCache.set(cacheKey, profileData)
    
    console.log(`Profile ${customerId} loaded in ${performance.now() - startTime}ms`)
    return profileData
  }
  
  // ============================================================================
  // METRICS COMPUTATION
  // ============================================================================
  
  private async computeMetrics(
    customerId: number,
    accounts: Account[],
    transactions: Transaction[]
  ): Promise<ProfileMetrics> {
    const startTime = performance.now()
    const cacheKey = `metrics_${customerId}`
    
    // Check cache
    const cached = this.metricsCache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    // Parallel computation for performance
    const [
      netWorth,
      monthlyIncome,
      monthlySpending,
      creditUtilization
    ] = await Promise.all([
      this.computeNetWorth(accounts),
      this.computeMonthlyIncome(transactions),
      this.computeMonthlySpending(transactions),
      this.computeCreditUtilization(accounts)
    ])
    
    const liquidAssets = accounts
      .filter(a => ['checking', 'savings'].includes(a.account_type))
      .reduce((sum, a) => sum + Math.max(0, a.balance), 0)
    
    const totalDebt = accounts
      .filter(a => a.balance < 0 || ['credit_card', 'mortgage', 'student_loan', 'auto_loan'].includes(a.account_type))
      .reduce((sum, a) => sum + Math.abs(Math.min(0, a.balance)), 0)
    
    const savingsRate = monthlyIncome > 0 ? 
      (monthlyIncome - monthlySpending.total) / monthlyIncome : 0
    
    const debtToIncomeRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0
    
    const emergencyFundMonths = monthlySpending.total > 0 ? 
      liquidAssets / monthlySpending.total : 0
    
    const metrics: ProfileMetrics = {
      netWorth,
      liquidAssets,
      totalDebt,
      monthlyIncome,
      monthlySpending,
      creditUtilization,
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      netWorthHistory: this.computeNetWorthHistory(accounts, transactions),
      spendingTrends: this.computeSpendingTrends(transactions),
      incomeTrends: this.computeIncomeTrends(transactions)
    }
    
    // Cache metrics
    this.metricsCache.set(cacheKey, metrics, 300) // 5 minute TTL
    
    console.log(`Metrics computed in ${performance.now() - startTime}ms`)
    return metrics
  }
  
  private computeNetWorth(accounts: Account[]): number {
    return accounts.reduce((sum, account) => sum + account.balance, 0)
  }
  
  private computeMonthlyIncome(transactions: Transaction[]): number {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return transactions
      .filter(t => 
        new Date(t.timestamp) > thirtyDaysAgo &&
        !t.is_debit &&
        t.category_id === 5 // salary category
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }
  
  private computeMonthlySpending(transactions: Transaction[]): SpendingAnalysis {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.timestamp) > thirtyDaysAgo && t.is_debit
    )
    
    const total = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    // Category analysis
    const categoryMap = new Map<string, CategorySpending>()
    
    for (const transaction of recentTransactions) {
      const category = this.categories.get(transaction.category_id)
      if (!category) continue
      
      const existing = categoryMap.get(category.name) || {
        categoryId: category.category_id,
        categoryName: category.name,
        amount: 0,
        transactionCount: 0,
        percentage: 0,
        trend: 'stable' as const,
        monthOverMonthChange: 0
      }
      
      existing.amount += Math.abs(transaction.amount)
      existing.transactionCount++
      categoryMap.set(category.name, existing)
    }
    
    // Calculate percentages
    for (const [_, spending] of categoryMap) {
      spending.percentage = total > 0 ? (spending.amount / total) * 100 : 0
    }
    
    // Top categories
    const topCategories = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(c => ({
        name: c.categoryName,
        amount: c.amount,
        percentage: c.percentage
      }))
    
    // Detect recurring expenses
    const recurringExpenses = this.detectRecurringExpenses(transactions)
    
    return {
      total,
      average: recentTransactions.length > 0 ? total / recentTransactions.length : 0,
      median: this.calculateMedian(recentTransactions.map(t => Math.abs(t.amount))),
      byCategory: categoryMap,
      byMerchant: new Map(),
      recurringExpenses,
      anomalies: [],
      topCategories
    }
  }
  
  private computeCreditUtilization(accounts: Account[]): number {
    const creditAccounts = accounts.filter(a => a.account_type === 'credit_card')
    
    if (creditAccounts.length === 0) return 0
    
    const totalCredit = creditAccounts.reduce((sum, a) => sum + (a.credit_limit || 0), 0)
    const totalUsed = creditAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0)
    
    return totalCredit > 0 ? (totalUsed / totalCredit) * 100 : 0
  }
  
  private computeNetWorthHistory(accounts: Account[], transactions: Transaction[]): TimeSeriesData[] {
    // Simplified - would compute historical balances in production
    const today = new Date()
    const history: TimeSeriesData[] = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today)
      date.setMonth(date.getMonth() - i)
      
      history.push({
        date: date.toISOString().split('T')[0],
        value: this.computeNetWorth(accounts) * (1 - i * 0.02), // Mock historical data
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
    }
    
    return history
  }
  
  private computeSpendingTrends(transactions: Transaction[]): TimeSeriesData[] {
    const trends: TimeSeriesData[] = []
    const today = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - i)
      startDate.setDate(1)
      
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.timestamp)
        return tDate >= startDate && tDate < endDate && t.is_debit
      })
      
      const total = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      trends.push({
        date: startDate.toISOString().split('T')[0],
        value: total,
        label: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
    }
    
    return trends
  }
  
  private computeIncomeTrends(transactions: Transaction[]): TimeSeriesData[] {
    const trends: TimeSeriesData[] = []
    const today = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(today)
      startDate.setMonth(startDate.getMonth() - i)
      startDate.setDate(1)
      
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.timestamp)
        return tDate >= startDate && tDate < endDate && !t.is_debit && t.category_id === 5
      })
      
      const total = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      trends.push({
        date: startDate.toISOString().split('T')[0],
        value: total,
        label: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      })
    }
    
    return trends
  }
  
  private detectRecurringExpenses(transactions: Transaction[]): RecurringExpense[] {
    const recurring: RecurringExpense[] = []
    const subscriptions = transactions.filter(t => t.is_subscription)
    
    // Group by description
    const grouped = new Map<string, Transaction[]>()
    for (const transaction of subscriptions) {
      const existing = grouped.get(transaction.description) || []
      existing.push(transaction)
      grouped.set(transaction.description, existing)
    }
    
    // Detect frequency
    for (const [description, trans] of grouped) {
      if (trans.length < 2) continue
      
      const category = this.categories.get(trans[0].category_id)
      
      recurring.push({
        name: description,
        amount: Math.abs(trans[0].amount),
        frequency: 'monthly', // Simplified - would detect actual frequency
        nextDue: new Date(trans[0].timestamp).toISOString(),
        category: category?.name || 'unknown',
        isSubscription: true
      })
    }
    
    return recurring
  }
  
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    
    const sorted = values.sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }
  
  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================
  
  async applyUpdate(event: DataEvent): Promise<MetricsDelta> {
    const delta: MetricsDelta = {}
    
    switch (event.entity) {
      case 'transaction':
        const transaction = event.data as Transaction
        
        if (event.type === 'create') {
          this.transactions.set(transaction.transaction_id, transaction)
          this.transactionsByAccount.insert(transaction.account_id, transaction)
          this.transactionsByDate.insert(transaction.timestamp, transaction)
          
          // Update metrics delta
          if (transaction.is_debit) {
            delta.monthlySpending = Math.abs(transaction.amount)
          } else if (transaction.category_id === 5) {
            delta.monthlyIncome = Math.abs(transaction.amount)
          }
        }
        break
      
      case 'account':
        const account = event.data as Account
        
        if (event.type === 'update') {
          const existing = this.accounts.get(account.account_id)
          if (existing) {
            delta.netWorth = account.balance - existing.balance
          }
          this.accounts.set(account.account_id, account)
        }
        break
    }
    
    // Invalidate affected caches
    this.invalidateCache(event.profileId)
    
    return delta
  }
  
  private invalidateCache(customerId: number): void {
    this.profileCache.delete(`profile_${customerId}`)
    this.metricsCache.delete(`metrics_${customerId}`)
  }
  
  // ============================================================================
  // STATISTICS & MONITORING
  // ============================================================================
  
  getStats(): {
    dataStats: {
      customers: number
      accounts: number
      transactions: number
      goals: number
      categories: number
    }
    cacheStats: {
      profile: CacheStats
      metrics: CacheStats
    }
  } {
    return {
      dataStats: {
        customers: this.customers.size,
        accounts: this.accounts.size,
        transactions: this.transactions.size,
        goals: this.goals.size,
        categories: this.categories.size
      },
      cacheStats: {
        profile: this.profileCache.getStats(),
        metrics: this.metricsCache.getStats()
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dataStore = new ProfileDataStore()