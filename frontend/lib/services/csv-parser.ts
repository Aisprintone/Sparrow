import { promises as fs } from 'fs'
import path from 'path'
import type { Customer, Account, Transaction, Category, Goal } from '@/lib/types/csv-data'

export class CSVParser {
  private dataDir: string
  private cache: Map<string, any[]> = new Map()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  constructor(dataDir: string = '/Users/ai-sprint-02/Documents/Sparrow/data') {
    this.dataDir = dataDir
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
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

  private parseCSVContent(content: string): string[][] {
    const lines = content.split('\n').filter(line => line.trim() !== '')
    return lines.map(line => this.parseCSVLine(line))
  }

  private parseBooleanValue(value: string): boolean {
    return value.toLowerCase() === 'true'
  }

  private parseNumberValue(value: string): number {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  private async readAndParseCSV(filename: string, parser: (rows: string[][]) => any[]): Promise<any[]> {
    const cacheKey = `${filename}-${Date.now()}` // Simple cache invalidation
    const cached = this.cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const filePath = path.join(this.dataDir, filename)
      const content = await fs.readFile(filePath, 'utf-8')
      const rows = this.parseCSVContent(content)
      const [header, ...dataRows] = rows
      
      const result = parser(dataRows)
      this.cache.set(cacheKey, result)
      
      return result
    } catch (error) {
      console.error(`Error parsing ${filename}:`, error)
      throw new Error(`Failed to parse ${filename}`)
    }
  }

  async parseCustomers(): Promise<Customer[]> {
    return this.readAndParseCSV('customer.csv', (dataRows) => 
      dataRows.map(row => ({
        customer_id: parseInt(row[0]),
        location: row[1].replace(/"/g, ''),
        age: parseInt(row[2])
      })).filter(customer => !isNaN(customer.customer_id))
    )
  }

  async parseAccounts(): Promise<Account[]> {
    return this.readAndParseCSV('account.csv', (dataRows) => 
      dataRows.map(row => ({
        account_id: parseInt(row[0]),
        customer_id: parseInt(row[1]),
        institution_name: row[2],
        account_number: row[3],
        account_type: row[4] as any,
        balance: this.parseNumberValue(row[5]),
        created_at: row[6],
        credit_limit: row[7] ? this.parseNumberValue(row[7]) : undefined
      })).filter(account => !isNaN(account.account_id))
    )
  }

  async parseTransactions(): Promise<Transaction[]> {
    return this.readAndParseCSV('transaction.csv', (dataRows) => 
      dataRows.map(row => ({
        transaction_id: parseInt(row[0]),
        account_id: parseInt(row[1]),
        timestamp: row[2],
        amount: this.parseNumberValue(row[3]),
        description: row[4],
        category_id: parseInt(row[5]),
        is_debit: this.parseBooleanValue(row[6]),
        is_bill: this.parseBooleanValue(row[7]),
        is_subscription: this.parseBooleanValue(row[8]),
        due_date: row[9] || null,
        account_type: row[10] || null
      })).filter(transaction => !isNaN(transaction.transaction_id))
    )
  }

  async parseCategories(): Promise<Category[]> {
    try {
      const filePath = path.join(this.dataDir, 'category.csv')
      const content = await fs.readFile(filePath, 'utf-8')
      const rows = this.parseCSVContent(content)
      const [header, ...dataRows] = rows

      return dataRows.map(row => ({
        category_id: parseInt(row[0]),
        name: row[1]
      })).filter(category => !isNaN(category.category_id))
    } catch (error) {
      console.error('Error parsing categories CSV:', error)
      throw new Error('Failed to parse categories data')
    }
  }

  async parseGoals(): Promise<Goal[]> {
    try {
      const filePath = path.join(this.dataDir, 'goal.csv')
      const content = await fs.readFile(filePath, 'utf-8')
      const rows = this.parseCSVContent(content)
      const [header, ...dataRows] = rows

      return dataRows.map(row => ({
        goal_id: parseInt(row[0]),
        customer_id: parseInt(row[1]),
        name: row[2],
        description: row[3],
        target_amount: this.parseNumberValue(row[4]),
        target_date: row[5]
      })).filter(goal => !isNaN(goal.goal_id))
    } catch (error) {
      console.error('Error parsing goals CSV:', error)
      throw new Error('Failed to parse goals data')
    }
  }

  async parseAllData() {
    const [customers, accounts, transactions, categories, goals] = await Promise.all([
      this.parseCustomers(),
      this.parseAccounts(),
      this.parseTransactions(),
      this.parseCategories(),
      this.parseGoals()
    ])

    return {
      customers,
      accounts,
      transactions,
      categories,
      goals
    }
  }
}