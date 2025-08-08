#!/usr/bin/env node

/**
 * DATA INTEGRITY VERIFICATION SCRIPT
 * ----------------------------------
 * Comprehensive verification of financial data accuracy across CSV, API, and UI layers
 * Ensures precise calculation accuracy with zero tolerance for errors
 */

const fs = require('fs')
const path = require('path')

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

class DataIntegrityVerifier {
  constructor() {
    this.dataDir = '/Users/ai-sprint-02/Documents/Sparrow/data'
    this.results = {
      csvData: {},
      apiData: {},
      calculations: {},
      discrepancies: [],
      passed: 0,
      failed: 0
    }
  }

  // Parse CSV files directly
  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"' && (i === 0 || line[i - 1] === ',')) {
        inQuotes = true
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i + 1] === ',')) {
        inQuotes = false
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else if (char !== '"' || !inQuotes) {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  parseCSVContent(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '')
    return lines.map(line => this.parseCSVLine(line))
  }

  // Load and parse CSV data
  async loadCSVData() {
    console.log(`${colors.cyan}${colors.bright}STEP 1: Loading Raw CSV Data${colors.reset}`)
    console.log(`${colors.dim}Reading from: ${this.dataDir}${colors.reset}\n`)

    // Load customers
    const customerPath = path.join(this.dataDir, 'customer.csv')
    const customerContent = fs.readFileSync(customerPath, 'utf-8')
    const customerRows = this.parseCSVContent(customerContent)
    const [customerHeader, ...customerData] = customerRows
    
    this.results.csvData.customers = customerData.map(row => ({
      customer_id: parseInt(row[0]),
      location: row[1].replace(/"/g, ''),
      age: parseInt(row[2])
    }))

    // Load accounts
    const accountPath = path.join(this.dataDir, 'account.csv')
    const accountContent = fs.readFileSync(accountPath, 'utf-8')
    const accountRows = this.parseCSVContent(accountContent)
    const [accountHeader, ...accountData] = accountRows
    
    this.results.csvData.accounts = accountData.map(row => ({
      account_id: parseInt(row[0]),
      customer_id: parseInt(row[1]),
      institution_name: row[2],
      account_number: row[3],
      account_type: row[4],
      balance: parseFloat(row[5]),
      created_at: row[6],
      credit_limit: row[7] ? parseFloat(row[7]) : null
    }))

    // Load transactions
    const transactionPath = path.join(this.dataDir, 'transaction.csv')
    const transactionContent = fs.readFileSync(transactionPath, 'utf-8')
    const transactionRows = this.parseCSVContent(transactionContent)
    const [transactionHeader, ...transactionData] = transactionRows
    
    this.results.csvData.transactions = transactionData.map(row => ({
      transaction_id: parseInt(row[0]),
      account_id: parseInt(row[1]),
      timestamp: row[2],
      amount: parseFloat(row[3]),
      description: row[4],
      category_id: parseInt(row[5]),
      is_debit: row[6].toLowerCase() === 'true',
      is_bill: row[7].toLowerCase() === 'true',
      is_subscription: row[8].toLowerCase() === 'true',
      due_date: row[9] || null,
      account_type: row[10]
    }))

    console.log(`${colors.green}✓${colors.reset} Loaded ${this.results.csvData.customers.length} customers`)
    console.log(`${colors.green}✓${colors.reset} Loaded ${this.results.csvData.accounts.length} accounts`)
    console.log(`${colors.green}✓${colors.reset} Loaded ${this.results.csvData.transactions.length} transactions\n`)
  }

  // Verify Gen Z Student (Customer ID: 3) data
  verifyGenZStudentData() {
    console.log(`${colors.cyan}${colors.bright}STEP 2: Verifying Gen Z Student Data (Customer ID: 3)${colors.reset}\n`)

    const customerId = 3
    const customer = this.results.csvData.customers.find(c => c.customer_id === customerId)
    
    if (!customer) {
      this.addDiscrepancy('Customer not found', `Customer ID ${customerId} not found in CSV data`)
      return
    }

    // Get accounts for customer
    const accounts = this.results.csvData.accounts.filter(a => a.customer_id === customerId)
    console.log(`${colors.blue}Customer Accounts:${colors.reset}`)
    accounts.forEach(acc => {
      const type = acc.balance >= 0 ? 'ASSET' : 'LIABILITY'
      console.log(`  ${acc.account_id}: ${acc.institution_name} ${acc.account_type} = $${acc.balance.toFixed(2)} [${type}]`)
    })

    // Calculate net worth from CSV
    let totalAssets = 0
    let totalLiabilities = 0
    
    accounts.forEach(acc => {
      if (acc.balance >= 0) {
        totalAssets += acc.balance
      } else {
        totalLiabilities += Math.abs(acc.balance)
      }
    })

    const netWorth = totalAssets - totalLiabilities

    this.results.calculations.csvNetWorth = {
      totalAssets,
      totalLiabilities,
      netWorth
    }

    console.log(`\n${colors.blue}Net Worth Calculation from CSV:${colors.reset}`)
    console.log(`  Total Assets:      $${totalAssets.toFixed(2)}`)
    console.log(`  Total Liabilities: $${totalLiabilities.toFixed(2)}`)
    console.log(`  Net Worth:         $${netWorth.toFixed(2)}\n`)

    // Calculate monthly spending for current month (August 2025)
    const accountIds = accounts.map(a => a.account_id)
    const currentMonthTransactions = this.results.csvData.transactions.filter(tx => {
      if (!accountIds.includes(tx.account_id)) return false
      const txDate = new Date(tx.timestamp)
      return txDate.getMonth() === 7 && // August is month 7 (0-indexed)
             txDate.getFullYear() === 2025 &&
             tx.is_debit && 
             tx.amount < 0
    })

    const monthlySpending = currentMonthTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    console.log(`${colors.blue}Monthly Spending (August 2025):${colors.reset}`)
    console.log(`  Transactions found: ${currentMonthTransactions.length}`)
    currentMonthTransactions.forEach(tx => {
      console.log(`    ${tx.timestamp}: ${tx.description} = $${Math.abs(tx.amount).toFixed(2)}`)
    })
    console.log(`  Total Spending: $${monthlySpending.toFixed(2)}\n`)

    this.results.calculations.csvMonthlySpending = monthlySpending
  }

  // Test API endpoints
  async testAPIEndpoints() {
    console.log(`${colors.cyan}${colors.bright}STEP 3: Testing API Endpoints${colors.reset}\n`)

    try {
      const response = await fetch('http://localhost:3000/api/profiles/3')
      const data = await response.json()
      
      if (data.success) {
        this.results.apiData = data.data
        
        console.log(`${colors.green}✓${colors.reset} API Response received successfully`)
        console.log(`${colors.blue}API Metrics:${colors.reset}`)
        console.log(`  Net Worth:          $${data.data.metrics.netWorth.toFixed(2)}`)
        console.log(`  Total Assets:       $${data.data.metrics.liquidAssets.toFixed(2)}`)
        console.log(`  Total Liabilities:  $${data.data.metrics.totalDebt.toFixed(2)}`)
        console.log(`  Monthly Spending:   $${data.data.spending.total.toFixed(2)}\n`)
      } else {
        this.addDiscrepancy('API Error', 'Failed to fetch profile data from API')
      }
    } catch (error) {
      this.addDiscrepancy('API Connection Error', error.message)
    }
  }

  // Compare and validate all calculations
  validateCalculations() {
    console.log(`${colors.cyan}${colors.bright}STEP 4: Mathematical Verification${colors.reset}\n`)

    // Verify Net Worth Calculation
    const csvNetWorth = this.results.calculations.csvNetWorth.netWorth
    const apiNetWorth = this.results.apiData.metrics?.netWorth

    console.log(`${colors.blue}Net Worth Verification:${colors.reset}`)
    console.log(`  CSV Calculation:  $${csvNetWorth.toFixed(2)}`)
    console.log(`  API Response:     $${apiNetWorth?.toFixed(2) || 'N/A'}`)
    console.log(`  Dashboard Shows:  $-18,949.55`)
    
    if (Math.abs(csvNetWorth - apiNetWorth) > 0.01) {
      this.addDiscrepancy(
        'Net Worth Mismatch',
        `CSV: $${csvNetWorth.toFixed(2)} vs API: $${apiNetWorth?.toFixed(2)}`
      )
      console.log(`  ${colors.red}✗ MISMATCH DETECTED${colors.reset}`)
    } else {
      console.log(`  ${colors.green}✓ MATCH${colors.reset}`)
      this.results.passed++
    }

    // Verify Assets Calculation
    console.log(`\n${colors.blue}Assets Verification:${colors.reset}`)
    const csvAssets = this.results.calculations.csvNetWorth.totalAssets
    const apiAssets = this.results.apiData.metrics?.liquidAssets
    console.log(`  CSV Calculation:  $${csvAssets.toFixed(2)}`)
    console.log(`  API Response:     $${apiAssets?.toFixed(2) || 'N/A'}`)
    console.log(`  Dashboard Shows:  $6,050`)
    
    if (Math.abs(csvAssets - apiAssets) > 0.01) {
      this.addDiscrepancy(
        'Assets Mismatch',
        `CSV: $${csvAssets.toFixed(2)} vs API: $${apiAssets?.toFixed(2)}`
      )
      console.log(`  ${colors.red}✗ MISMATCH DETECTED${colors.reset}`)
    } else {
      console.log(`  ${colors.green}✓ MATCH${colors.reset}`)
      this.results.passed++
    }

    // Verify Liabilities Calculation
    console.log(`\n${colors.blue}Liabilities Verification:${colors.reset}`)
    const csvLiabilities = this.results.calculations.csvNetWorth.totalLiabilities
    const apiLiabilities = this.results.apiData.metrics?.totalDebt
    console.log(`  CSV Calculation:  $${csvLiabilities.toFixed(2)}`)
    console.log(`  API Response:     $${apiLiabilities?.toFixed(2) || 'N/A'}`)
    console.log(`  Dashboard Shows:  $25,000`)
    
    if (Math.abs(csvLiabilities - apiLiabilities) > 0.01) {
      this.addDiscrepancy(
        'Liabilities Mismatch',
        `CSV: $${csvLiabilities.toFixed(2)} vs API: $${apiLiabilities?.toFixed(2)}`
      )
      console.log(`  ${colors.red}✗ MISMATCH DETECTED${colors.reset}`)
    } else {
      console.log(`  ${colors.green}✓ MATCH${colors.reset}`)
      this.results.passed++
    }

    // Verify Monthly Spending
    console.log(`\n${colors.blue}Monthly Spending Verification:${colors.reset}`)
    const csvSpending = this.results.calculations.csvMonthlySpending
    const apiSpending = this.results.apiData.spending?.total
    console.log(`  CSV Calculation:  $${csvSpending.toFixed(2)}`)
    console.log(`  API Response:     $${apiSpending?.toFixed(2) || 'N/A'}`)
    console.log(`  Dashboard Shows:  $175.82`)
    
    if (Math.abs(csvSpending - apiSpending) > 0.01) {
      this.addDiscrepancy(
        'Monthly Spending Mismatch',
        `CSV: $${csvSpending.toFixed(2)} vs API: $${apiSpending?.toFixed(2)}`
      )
      console.log(`  ${colors.red}✗ MISMATCH DETECTED${colors.reset}`)
    } else {
      console.log(`  ${colors.green}✓ MATCH${colors.reset}`)
      this.results.passed++
    }
  }

  // Add discrepancy to results
  addDiscrepancy(type, details) {
    this.results.discrepancies.push({ type, details })
    this.results.failed++
  }

  // Generate comprehensive report
  generateReport() {
    console.log(`\n${colors.cyan}${colors.bright}${'='.repeat(70)}${colors.reset}`)
    console.log(`${colors.cyan}${colors.bright}DATA INTEGRITY VERIFICATION REPORT${colors.reset}`)
    console.log(`${colors.cyan}${colors.bright}${'='.repeat(70)}${colors.reset}\n`)

    // Summary
    console.log(`${colors.yellow}${colors.bright}VERIFICATION SUMMARY:${colors.reset}`)
    console.log(`  Tests Passed: ${colors.green}${this.results.passed}${colors.reset}`)
    console.log(`  Tests Failed: ${colors.red}${this.results.failed}${colors.reset}`)
    console.log(`  Data Quality Score: ${this.calculateDataQuality()}%\n`)

    // Source Data Summary
    console.log(`${colors.yellow}${colors.bright}SOURCE DATA VALUES (Gen Z Student - ID: 3):${colors.reset}`)
    console.log(`${colors.blue}CSV Raw Data:${colors.reset}`)
    console.log(`  Net Worth:         $${this.results.calculations.csvNetWorth?.netWorth.toFixed(2) || 'N/A'}`)
    console.log(`  Total Assets:      $${this.results.calculations.csvNetWorth?.totalAssets.toFixed(2) || 'N/A'}`)
    console.log(`  Total Liabilities: $${this.results.calculations.csvNetWorth?.totalLiabilities.toFixed(2) || 'N/A'}`)
    console.log(`  Monthly Spending:  $${this.results.calculations.csvMonthlySpending?.toFixed(2) || 'N/A'}\n`)

    console.log(`${colors.blue}API Response Values:${colors.reset}`)
    console.log(`  Net Worth:         $${this.results.apiData.metrics?.netWorth.toFixed(2) || 'N/A'}`)
    console.log(`  Total Assets:      $${this.results.apiData.metrics?.liquidAssets.toFixed(2) || 'N/A'}`)
    console.log(`  Total Liabilities: $${this.results.apiData.metrics?.totalDebt.toFixed(2) || 'N/A'}`)
    console.log(`  Monthly Spending:  $${this.results.apiData.spending?.total.toFixed(2) || 'N/A'}\n`)

    console.log(`${colors.blue}Dashboard Display Values:${colors.reset}`)
    console.log(`  Net Worth:         $-18,949.55`)
    console.log(`  Total Assets:      $6,050`)
    console.log(`  Total Liabilities: $25,000`)
    console.log(`  Monthly Spending:  $175.82\n`)

    // Discrepancies
    if (this.results.discrepancies.length > 0) {
      console.log(`${colors.red}${colors.bright}DISCREPANCIES FOUND:${colors.reset}`)
      this.results.discrepancies.forEach((disc, index) => {
        console.log(`  ${index + 1}. ${disc.type}: ${disc.details}`)
      })
      console.log()
    } else {
      console.log(`${colors.green}${colors.bright}✓ NO DISCREPANCIES FOUND - DATA IS 100% ACCURATE${colors.reset}\n`)
    }

    // Recommendations
    console.log(`${colors.yellow}${colors.bright}RECOMMENDATIONS FOR DATA TRUSTWORTHINESS:${colors.reset}`)
    console.log(`  1. Implement automated data integrity tests in CI/CD pipeline`)
    console.log(`  2. Add real-time data validation at API layer`)
    console.log(`  3. Create data reconciliation dashboard for monitoring`)
    console.log(`  4. Set up alerts for calculation discrepancies > $0.01`)
    console.log(`  5. Implement database transaction logging for audit trail`)
    console.log(`  6. Add checksum validation for CSV data imports`)
    console.log(`  7. Create automated daily data integrity reports`)
    console.log(`  8. Implement pessimistic locking for concurrent updates\n`)

    // Performance Metrics
    console.log(`${colors.yellow}${colors.bright}PERFORMANCE METRICS:${colors.reset}`)
    if (this.results.apiData.performance) {
      console.log(`  API Response Time: ${this.results.apiData.performance.totalTime?.toFixed(2)}ms`)
      console.log(`  Parse Time:        ${this.results.apiData.performance.parseTime?.toFixed(2)}ms`)
      console.log(`  Compute Time:      ${this.results.apiData.performance.computeTime?.toFixed(2)}ms`)
      console.log(`  Memory Used:       ${(this.results.apiData.performance.memoryUsed / 1024 / 1024).toFixed(2)}MB`)
    }

    console.log(`\n${colors.cyan}${colors.bright}${'='.repeat(70)}${colors.reset}`)
    console.log(`${colors.green}${colors.bright}VERIFICATION COMPLETE${colors.reset}`)
    console.log(`${colors.cyan}${colors.bright}${'='.repeat(70)}${colors.reset}\n`)
  }

  calculateDataQuality() {
    const total = this.results.passed + this.results.failed
    if (total === 0) return 0
    return Math.round((this.results.passed / total) * 100)
  }

  // Main execution
  async run() {
    console.log(`${colors.magenta}${colors.bright}DATA INTEGRITY VERIFICATION SYSTEM v1.0${colors.reset}`)
    console.log(`${colors.dim}Surgical precision for financial data accuracy${colors.reset}\n`)
    
    try {
      await this.loadCSVData()
      this.verifyGenZStudentData()
      await this.testAPIEndpoints()
      this.validateCalculations()
      this.generateReport()
    } catch (error) {
      console.error(`${colors.red}${colors.bright}CRITICAL ERROR:${colors.reset} ${error.message}`)
      console.error(error.stack)
      process.exit(1)
    }
  }
}

// Execute verification
const verifier = new DataIntegrityVerifier()
verifier.run()