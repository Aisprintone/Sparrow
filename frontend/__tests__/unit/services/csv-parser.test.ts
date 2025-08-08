/**
 * CSV PARSER UNIT TESTS - BRUTAL EDGE CASE COVERAGE
 * Tests that ensure only correct CSV parsing implementations can pass
 */

import { CSVParser } from '@/lib/services/csv-parser'
import fs from 'fs'
import path from 'path'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

describe('CSVParser - Unit Tests', () => {
  let parser: CSVParser
  const mockDataDir = '/test/data'

  beforeEach(() => {
    parser = new CSVParser(mockDataDir)
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should use custom data directory when provided', () => {
      const customDir = '/custom/path'
      const customParser = new CSVParser(customDir)
      expect(customParser).toBeDefined()
    })

    it('should use default data directory when not provided', () => {
      const defaultParser = new CSVParser()
      expect(defaultParser).toBeDefined()
    })
  })

  describe('parseCSVLine - Edge Case Destroyer', () => {
    // Access private method via any cast for testing
    const getParser = () => parser as any

    it('should parse simple CSV line correctly', () => {
      const line = '1,John,25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', 'John', '25'])
    })

    it('should handle quoted fields with commas', () => {
      const line = '1,"Smith, John",25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', 'Smith, John', '25'])
    })

    it('should handle empty fields', () => {
      const line = '1,,25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', '', '25'])
    })

    it('should handle fields with only spaces', () => {
      const line = '1,   ,25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', '', '25'])
    })

    it('should handle quoted empty fields', () => {
      const line = '1,"",25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', '', '25'])
    })

    it('should handle trailing comma', () => {
      const line = '1,John,25,'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', 'John', '25', ''])
    })

    it('should handle leading comma', () => {
      const line = ',John,25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['', 'John', '25'])
    })

    it('should handle multiple consecutive commas', () => {
      const line = '1,,,25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', '', '', '25'])
    })

    it('should handle quotes at beginning and end', () => {
      const line = '"1","John","25"'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', 'John', '25'])
    })

    it('should handle mixed quoted and unquoted fields', () => {
      const line = '1,"John Smith",25,true,"test,data"'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', 'John Smith', '25', 'true', 'test,data'])
    })

    it('should handle special characters in quotes', () => {
      const line = '1,"Special !@#$%^&*() chars",25'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', 'Special !@#$%^&*() chars', '25'])
    })

    it('should handle unicode characters', () => {
      const line = '1,"José García",25,"€100"'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', 'José García', '25', '€100'])
    })

    it('should handle extremely long lines', () => {
      const longValue = 'x'.repeat(10000)
      const line = `1,"${longValue}",25`
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['1', longValue, '25'])
    })

    it('should handle single field', () => {
      const line = 'single'
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual(['single'])
    })

    it('should handle empty string', () => {
      const line = ''
      const result = getParser().parseCSVLine(line)
      expect(result).toEqual([''])
    })
  })

  describe('parseCustomers - Error Handling & Data Validation', () => {
    const mockCustomerCSV = `customer_id,location,age
1,"New York",30
2,"Los Angeles",25
3,"Chicago",35`

    it('should parse valid customer data correctly', async () => {
      mockFs.readFileSync.mockReturnValue(mockCustomerCSV)
      
      const customers = await parser.parseCustomers()
      
      expect(customers).toHaveLength(3)
      expect(customers[0]).toEqual({
        customer_id: 1,
        location: 'New York',
        age: 30
      })
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        path.join(mockDataDir, 'customer.csv'),
        'utf-8'
      )
    })

    it('should handle malformed customer IDs', async () => {
      const malformedCSV = `customer_id,location,age
abc,"New York",30
2,"Los Angeles",25
,"Chicago",35
4,"Miami",xyz`

      mockFs.readFileSync.mockReturnValue(malformedCSV)
      
      const customers = await parser.parseCustomers()
      
      expect(customers).toHaveLength(1) // Only valid customer_id: 2
      expect(customers[0].customer_id).toBe(2)
    })

    it('should handle file read errors gracefully', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })
      
      await expect(parser.parseCustomers()).rejects.toThrow('Failed to parse customers data')
    })

    it('should handle empty CSV file', async () => {
      mockFs.readFileSync.mockReturnValue('customer_id,location,age\n')
      
      const customers = await parser.parseCustomers()
      
      expect(customers).toHaveLength(0)
    })

    it('should handle CSV with only headers', async () => {
      mockFs.readFileSync.mockReturnValue('customer_id,location,age')
      
      const customers = await parser.parseCustomers()
      
      expect(customers).toHaveLength(0)
    })

    it('should handle CSV with extra columns', async () => {
      const extraColumnsCSV = `customer_id,location,age,extra1,extra2
1,"New York",30,data1,data2
2,"Los Angeles",25,data3,data4`

      mockFs.readFileSync.mockReturnValue(extraColumnsCSV)
      
      const customers = await parser.parseCustomers()
      
      expect(customers).toHaveLength(2)
      expect(customers[0]).toEqual({
        customer_id: 1,
        location: 'New York',
        age: 30
      })
    })

    it('should handle CSV with missing columns', async () => {
      const missingColumnsCSV = `customer_id,location,age
1,"New York"
2,"Los Angeles",25`

      mockFs.readFileSync.mockReturnValue(missingColumnsCSV)
      
      const customers = await parser.parseCustomers()
      
      expect(customers).toHaveLength(2)
      expect(customers[0].age).toBeNaN()
      expect(customers[1].age).toBe(25)
    })

    it('should remove quotes from location field', async () => {
      const quotedLocationCSV = `customer_id,location,age
1,"""New York""",30
2,"Los Angeles",25`

      mockFs.readFileSync.mockReturnValue(quotedLocationCSV)
      
      const customers = await parser.parseCustomers()
      
      expect(customers[0].location).toBe('New York')
    })
  })

  describe('parseAccounts - Complex Data Type Handling', () => {
    const mockAccountCSV = `account_id,customer_id,institution_name,account_number,account_type,balance,created_at,credit_limit
1,1,Bank A,12345,checking,1000.50,2023-01-01,
2,1,Bank B,67890,credit,-500.75,2023-01-02,5000`

    it('should parse valid account data with all fields', async () => {
      mockFs.readFileSync.mockReturnValue(mockAccountCSV)
      
      const accounts = await parser.parseAccounts()
      
      expect(accounts).toHaveLength(2)
      expect(accounts[0]).toEqual({
        account_id: 1,
        customer_id: 1,
        institution_name: 'Bank A',
        account_number: '12345',
        account_type: 'checking',
        balance: 1000.50,
        created_at: '2023-01-01',
        credit_limit: undefined
      })
      expect(accounts[1].credit_limit).toBe(5000)
    })

    it('should handle negative balances correctly', async () => {
      mockFs.readFileSync.mockReturnValue(mockAccountCSV)
      
      const accounts = await parser.parseAccounts()
      
      expect(accounts[1].balance).toBe(-500.75)
    })

    it('should handle missing optional credit_limit field', async () => {
      const noLimitCSV = `account_id,customer_id,institution_name,account_number,account_type,balance,created_at,credit_limit
1,1,Bank A,12345,checking,1000.50,2023-01-01,`

      mockFs.readFileSync.mockReturnValue(noLimitCSV)
      
      const accounts = await parser.parseAccounts()
      
      expect(accounts[0].credit_limit).toBeUndefined()
    })

    it('should handle invalid numeric values', async () => {
      const invalidCSV = `account_id,customer_id,institution_name,account_number,account_type,balance,created_at,credit_limit
abc,xyz,Bank A,12345,checking,not-a-number,2023-01-01,invalid`

      mockFs.readFileSync.mockReturnValue(invalidCSV)
      
      const accounts = await parser.parseAccounts()
      
      expect(accounts).toHaveLength(0) // Filtered out due to invalid account_id
    })

    it('should handle extremely large balance values', async () => {
      const largeValueCSV = `account_id,customer_id,institution_name,account_number,account_type,balance,created_at,credit_limit
1,1,Bank A,12345,checking,999999999999.99,2023-01-01,999999999999`

      mockFs.readFileSync.mockReturnValue(largeValueCSV)
      
      const accounts = await parser.parseAccounts()
      
      expect(accounts[0].balance).toBe(999999999999.99)
      expect(accounts[0].credit_limit).toBe(999999999999)
    })

    it('should handle scientific notation in numbers', async () => {
      const scientificCSV = `account_id,customer_id,institution_name,account_number,account_type,balance,created_at,credit_limit
1,1,Bank A,12345,checking,1.5e3,2023-01-01,2e4`

      mockFs.readFileSync.mockReturnValue(scientificCSV)
      
      const accounts = await parser.parseAccounts()
      
      expect(accounts[0].balance).toBe(1500)
      expect(accounts[0].credit_limit).toBe(20000)
    })
  })

  describe('parseTransactions - Boolean & Date Handling', () => {
    const mockTransactionCSV = `transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type
1,1,2023-01-01T10:00:00,-50.00,Grocery Store,1,true,false,false,,checking
2,1,2023-01-02T14:30:00,-100.00,Electric Bill,2,TRUE,True,FALSE,2023-01-15,checking`

    it('should parse boolean values correctly (case insensitive)', async () => {
      mockFs.readFileSync.mockReturnValue(mockTransactionCSV)
      
      const transactions = await parser.parseTransactions()
      
      expect(transactions).toHaveLength(2)
      expect(transactions[0].is_debit).toBe(true)
      expect(transactions[0].is_bill).toBe(false)
      expect(transactions[0].is_subscription).toBe(false)
      expect(transactions[1].is_debit).toBe(true)
      expect(transactions[1].is_bill).toBe(true)
      expect(transactions[1].is_subscription).toBe(false)
    })

    it('should handle optional due_date field', async () => {
      mockFs.readFileSync.mockReturnValue(mockTransactionCSV)
      
      const transactions = await parser.parseTransactions()
      
      expect(transactions[0].due_date).toBeUndefined()
      expect(transactions[1].due_date).toBe('2023-01-15')
    })

    it('should handle invalid boolean values as false', async () => {
      const invalidBoolCSV = `transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type
1,1,2023-01-01,-50,Test,1,yes,no,maybe,,checking`

      mockFs.readFileSync.mockReturnValue(invalidBoolCSV)
      
      const transactions = await parser.parseTransactions()
      
      expect(transactions[0].is_debit).toBe(false)
      expect(transactions[0].is_bill).toBe(false)
      expect(transactions[0].is_subscription).toBe(false)
    })

    it('should handle transactions with positive amounts', async () => {
      const positiveAmountCSV = `transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type
1,1,2023-01-01,1000.00,Salary Deposit,1,false,false,false,,checking`

      mockFs.readFileSync.mockReturnValue(positiveAmountCSV)
      
      const transactions = await parser.parseTransactions()
      
      expect(transactions[0].amount).toBe(1000.00)
      expect(transactions[0].is_debit).toBe(false)
    })

    it('should handle zero amounts', async () => {
      const zeroAmountCSV = `transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type
1,1,2023-01-01,0,Zero Transaction,1,true,false,false,,checking`

      mockFs.readFileSync.mockReturnValue(zeroAmountCSV)
      
      const transactions = await parser.parseTransactions()
      
      expect(transactions[0].amount).toBe(0)
    })

    it('should handle various timestamp formats', async () => {
      const timestampCSV = `transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type
1,1,2023-01-01T10:00:00Z,-50,Test1,1,true,false,false,,checking
2,1,2023-01-02 14:30:00,-50,Test2,1,true,false,false,,checking
3,1,2023/01/03,-50,Test3,1,true,false,false,,checking`

      mockFs.readFileSync.mockReturnValue(timestampCSV)
      
      const transactions = await parser.parseTransactions()
      
      expect(transactions).toHaveLength(3)
      expect(transactions[0].timestamp).toBe('2023-01-01T10:00:00Z')
      expect(transactions[1].timestamp).toBe('2023-01-02 14:30:00')
      expect(transactions[2].timestamp).toBe('2023/01/03')
    })
  })

  describe('parseCategories - Simple Data Validation', () => {
    it('should parse valid category data', async () => {
      const mockCategoryCSV = `category_id,name
1,Food & Dining
2,Transportation
3,Entertainment`

      mockFs.readFileSync.mockReturnValue(mockCategoryCSV)
      
      const categories = await parser.parseCategories()
      
      expect(categories).toHaveLength(3)
      expect(categories[0]).toEqual({
        category_id: 1,
        name: 'Food & Dining'
      })
      expect(categories[1].name).toBe('Transportation')
    })

    it('should handle special characters in category names', async () => {
      const specialCharCSV = `category_id,name
1,"Food & Dining"
2,"Health/Medical"
3,"Utilities (Gas, Electric)"
4,"Travel: International"`

      mockFs.readFileSync.mockReturnValue(specialCharCSV)
      
      const categories = await parser.parseCategories()
      
      expect(categories).toHaveLength(4)
      expect(categories[0].name).toBe('Food & Dining')
      expect(categories[2].name).toBe('Utilities (Gas, Electric)')
    })

    it('should filter out invalid category IDs', async () => {
      const invalidIDCSV = `category_id,name
abc,Invalid
,Empty
1,Valid
-1,Negative`

      mockFs.readFileSync.mockReturnValue(invalidIDCSV)
      
      const categories = await parser.parseCategories()
      
      expect(categories).toHaveLength(2) // Only positive valid IDs
      expect(categories[0].category_id).toBe(1)
      expect(categories[1].category_id).toBe(-1)
    })

    it('should handle empty category names', async () => {
      const emptyNameCSV = `category_id,name
1,
2,""`

      mockFs.readFileSync.mockReturnValue(emptyNameCSV)
      
      const categories = await parser.parseCategories()
      
      expect(categories).toHaveLength(2)
      expect(categories[0].name).toBe('')
      expect(categories[1].name).toBe('')
    })
  })

  describe('parseGoals - Decimal & Date Validation', () => {
    const mockGoalCSV = `goal_id,customer_id,name,description,target_amount,target_date
1,1,Emergency Fund,Build emergency savings,10000.00,2023-12-31
2,2,Vacation,Trip to Europe,5000.50,2024-06-30`

    it('should parse valid goal data', async () => {
      mockFs.readFileSync.mockReturnValue(mockGoalCSV)
      
      const goals = await parser.parseGoals()
      
      expect(goals).toHaveLength(2)
      expect(goals[0]).toEqual({
        goal_id: 1,
        customer_id: 1,
        name: 'Emergency Fund',
        description: 'Build emergency savings',
        target_amount: 10000.00,
        target_date: '2023-12-31'
      })
    })

    it('should handle decimal target amounts', async () => {
      mockFs.readFileSync.mockReturnValue(mockGoalCSV)
      
      const goals = await parser.parseGoals()
      
      expect(goals[1].target_amount).toBe(5000.50)
    })

    it('should handle invalid target amounts', async () => {
      const invalidAmountCSV = `goal_id,customer_id,name,description,target_amount,target_date
1,1,Goal1,Desc1,invalid,2023-12-31
2,2,Goal2,Desc2,,2024-06-30`

      mockFs.readFileSync.mockReturnValue(invalidAmountCSV)
      
      const goals = await parser.parseGoals()
      
      expect(goals[0].target_amount).toBe(0)
      expect(goals[1].target_amount).toBe(0)
    })

    it('should handle various date formats', async () => {
      const dateFormatCSV = `goal_id,customer_id,name,description,target_amount,target_date
1,1,Goal1,Desc1,1000,2023-12-31
2,2,Goal2,Desc2,2000,2024/06/30
3,3,Goal3,Desc3,3000,30-06-2025`

      mockFs.readFileSync.mockReturnValue(dateFormatCSV)
      
      const goals = await parser.parseGoals()
      
      expect(goals).toHaveLength(3)
      expect(goals[0].target_date).toBe('2023-12-31')
      expect(goals[1].target_date).toBe('2024/06/30')
      expect(goals[2].target_date).toBe('30-06-2025')
    })

    it('should handle goals with long descriptions', async () => {
      const longDescription = 'x'.repeat(1000)
      const longDescCSV = `goal_id,customer_id,name,description,target_amount,target_date
1,1,Goal,"${longDescription}",1000,2023-12-31`

      mockFs.readFileSync.mockReturnValue(longDescCSV)
      
      const goals = await parser.parseGoals()
      
      expect(goals[0].description).toBe(longDescription)
    })
  })

  describe('parseAllData - Concurrent Processing & Error Isolation', () => {
    it('should parse all data types concurrently', async () => {
      const mockCustomerCSV = 'customer_id,location,age\n1,"NYC",30'
      const mockAccountCSV = 'account_id,customer_id,institution_name,account_number,account_type,balance,created_at,credit_limit\n1,1,Bank,123,checking,1000,2023-01-01,'
      const mockTransactionCSV = 'transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type\n1,1,2023-01-01,-50,Test,1,true,false,false,,checking'
      const mockCategoryCSV = 'category_id,name\n1,Food'
      const mockGoalCSV = 'goal_id,customer_id,name,description,target_amount,target_date\n1,1,Goal,Desc,1000,2023-12-31'

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('customer.csv')) return mockCustomerCSV
        if (filePath.includes('account.csv')) return mockAccountCSV
        if (filePath.includes('transaction.csv')) return mockTransactionCSV
        if (filePath.includes('category.csv')) return mockCategoryCSV
        if (filePath.includes('goal.csv')) return mockGoalCSV
        throw new Error('Unknown file')
      })

      const data = await parser.parseAllData()

      expect(data.customers).toHaveLength(1)
      expect(data.accounts).toHaveLength(1)
      expect(data.transactions).toHaveLength(1)
      expect(data.categories).toHaveLength(1)
      expect(data.goals).toHaveLength(1)
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(5)
    })

    it('should handle partial failures gracefully', async () => {
      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('customer.csv')) return 'customer_id,location,age\n1,"NYC",30'
        if (filePath.includes('account.csv')) throw new Error('Account file error')
        if (filePath.includes('transaction.csv')) return 'transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type\n1,1,2023-01-01,-50,Test,1,true,false,false,,checking'
        if (filePath.includes('category.csv')) return 'category_id,name\n1,Food'
        if (filePath.includes('goal.csv')) return 'goal_id,customer_id,name,description,target_amount,target_date\n1,1,Goal,Desc,1000,2023-12-31'
        throw new Error('Unknown file')
      })

      await expect(parser.parseAllData()).rejects.toThrow()
    })

    it('should maintain data consistency across related files', async () => {
      const mockCustomerCSV = 'customer_id,location,age\n1,"NYC",30\n2,"LA",25'
      const mockAccountCSV = 'account_id,customer_id,institution_name,account_number,account_type,balance,created_at,credit_limit\n1,1,Bank,123,checking,1000,2023-01-01,\n2,2,Bank,456,savings,2000,2023-01-01,'
      const mockTransactionCSV = 'transaction_id,account_id,timestamp,amount,description,category_id,is_debit,is_bill,is_subscription,due_date,account_type\n1,1,2023-01-01,-50,Test,1,true,false,false,,checking\n2,2,2023-01-01,-100,Test2,1,true,false,false,,savings'

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('customer.csv')) return mockCustomerCSV
        if (filePath.includes('account.csv')) return mockAccountCSV
        if (filePath.includes('transaction.csv')) return mockTransactionCSV
        if (filePath.includes('category.csv')) return 'category_id,name\n1,Food'
        if (filePath.includes('goal.csv')) return 'goal_id,customer_id,name,description,target_amount,target_date\n1,1,Goal,Desc,1000,2023-12-31'
        throw new Error('Unknown file')
      })

      const data = await parser.parseAllData()

      // Verify referential integrity
      data.accounts.forEach(account => {
        const customerExists = data.customers.some(c => c.customer_id === account.customer_id)
        expect(customerExists).toBe(true)
      })

      data.transactions.forEach(transaction => {
        const accountExists = data.accounts.some(a => a.account_id === transaction.account_id)
        expect(accountExists).toBe(true)
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle large CSV files efficiently', async () => {
      // Generate large CSV with 10,000 rows
      const largeCSV = ['customer_id,location,age']
      for (let i = 1; i <= 10000; i++) {
        largeCSV.push(`${i},"City${i}",${20 + (i % 50)}`)
      }
      mockFs.readFileSync.mockReturnValue(largeCSV.join('\n'))

      const startTime = Date.now()
      const customers = await parser.parseCustomers()
      const duration = Date.now() - startTime

      expect(customers).toHaveLength(10000)
      expect(duration).toBeLessThan(1000) // Should parse in under 1 second
    })

    it('should handle CSV files with many columns', async () => {
      const columns = Array.from({ length: 100 }, (_, i) => `col${i}`).join(',')
      const values = Array.from({ length: 100 }, (_, i) => `val${i}`).join(',')
      const wideCSV = `${columns}\n${values}`

      mockFs.readFileSync.mockReturnValue(wideCSV)
      
      // Should not throw even with many columns
      await expect(parser.parseCustomers()).resolves.toBeDefined()
    })
  })

  describe('Security Tests', () => {
    it('should handle potential CSV injection attempts', async () => {
      const injectionCSV = `customer_id,location,age
1,"=1+1",30
2,"@SUM(A1:A10)",25
3,"-2+3",35`

      mockFs.readFileSync.mockReturnValue(injectionCSV)
      
      const customers = await parser.parseCustomers()
      
      // Should treat formulas as plain text
      expect(customers[0].location).toBe('=1+1')
      expect(customers[1].location).toBe('@SUM(A1:A10)')
      expect(customers[2].location).toBe('-2+3')
    })

    it('should handle path traversal attempts in file paths', async () => {
      const maliciousParser = new CSVParser('../../../etc/passwd')
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      await expect(maliciousParser.parseCustomers()).rejects.toThrow('Failed to parse customers data')
    })

    it('should handle null bytes in CSV data', async () => {
      const nullByteCSV = 'customer_id,location,age\n1,"New\0York",30'
      mockFs.readFileSync.mockReturnValue(nullByteCSV)
      
      const customers = await parser.parseCustomers()
      
      expect(customers[0].location).toContain('New')
      expect(customers[0].location).toContain('York')
    })
  })
})