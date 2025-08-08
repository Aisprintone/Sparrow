/**
 * Data transformation utilities for CSV integration
 * Converts between CSV data formats and API types
 */

import {
  Account,
  Transaction,
  Goal,
  UserProfile,
  SpendingCategory,
  UserProfileType,
} from './types';

// ============================================================================
// CSV Data Types (from backend)
// ============================================================================

export interface CSVCustomer {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  income: number;
  credit_score: number;
  profile_type: string;
}

export interface CSVAccount {
  account_id: string;
  customer_id: string;
  account_type: string;
  bank_name: string;
  balance: number;
  interest_rate?: number;
  credit_limit?: number;
  created_date: string;
}

export interface CSVTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  transaction_type: string;
  category: string;
  merchant: string;
  date: string;
  description: string;
  is_recurring: boolean;
}

export interface CSVGoal {
  goal_id: string;
  customer_id: string;
  goal_name: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  monthly_contribution: number;
  priority: number;
}

// ============================================================================
// Profile Mapping
// ============================================================================

const PROFILE_MAPPINGS: Record<string, UserProfileType> = {
  'established_millennial': 'millennial',
  'mid_career_professional': 'professional',
  'genz_student': 'genz',
};

// ============================================================================
// Customer/User Transformers
// ============================================================================

export class CustomerTransformer {
  /**
   * Transform CSV customer data to UserProfile
   */
  static toUserProfile(
    customer: CSVCustomer,
    accounts: CSVAccount[] = [],
    transactions: CSVTransaction[] = []
  ): UserProfile {
    // Calculate financial summary from CSV data
    const totalAssets = accounts
      .filter(a => ['checking', 'savings', 'investment'].includes(a.account_type))
      .reduce((sum, a) => sum + a.balance, 0);
    
    const totalLiabilities = accounts
      .filter(a => ['credit', 'loan', 'mortgage'].includes(a.account_type))
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const savingsRate = customer.income > 0 
      ? ((customer.income - monthlyExpenses) / customer.income) * 100 
      : 0;

    return {
      id: customer.customer_id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      profileType: PROFILE_MAPPINGS[customer.profile_type] || 'millennial',
      financialSummary: {
        netWorth: totalAssets - totalLiabilities,
        monthlyIncome: customer.income,
        monthlyExpenses,
        savingsRate,
        creditScore: customer.credit_score,
      },
      preferences: {
        theme: 'light',
        notifications: true,
        currency: 'USD',
      },
    };
  }

  /**
   * Calculate monthly expenses from transactions
   */
  private static calculateMonthlyExpenses(transactions: CSVTransaction[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return txDate >= thirtyDaysAgo && t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
}

// ============================================================================
// Account Transformers
// ============================================================================

export class AccountTransformer {
  /**
   * Transform CSV account data to Account type
   */
  static toAccount(csvAccount: CSVAccount): Account {
    return {
      id: csvAccount.account_id,
      name: `${csvAccount.bank_name} ${this.formatAccountType(csvAccount.account_type)}`,
      type: this.mapAccountType(csvAccount.account_type),
      institution: csvAccount.bank_name,
      balance: csvAccount.balance,
      currency: 'USD',
      lastSynced: new Date().toISOString(),
    };
  }

  /**
   * Transform multiple CSV accounts
   */
  static toAccounts(csvAccounts: CSVAccount[]): Account[] {
    return csvAccounts.map(account => this.toAccount(account));
  }

  /**
   * Map CSV account type to API account type
   */
  private static mapAccountType(csvType: string): Account['type'] {
    const typeMap: Record<string, Account['type']> = {
      'checking': 'checking',
      'savings': 'savings',
      'credit_card': 'credit',
      'investment': 'investment',
      'student_loan': 'loan',
      'auto_loan': 'loan',
      'mortgage': 'mortgage',
    };
    
    return typeMap[csvType.toLowerCase()] || 'checking';
  }

  /**
   * Format account type for display
   */
  private static formatAccountType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// ============================================================================
// Transaction Transformers
// ============================================================================

export class TransactionTransformer {
  /**
   * Transform CSV transaction data to Transaction type
   */
  static toTransaction(csvTransaction: CSVTransaction): Transaction {
    return {
      id: csvTransaction.transaction_id,
      accountId: csvTransaction.account_id,
      amount: csvTransaction.amount,
      currency: 'USD',
      date: csvTransaction.date,
      description: csvTransaction.description,
      category: this.normalizeCategory(csvTransaction.category),
      merchant: csvTransaction.merchant,
      pending: false,
      recurring: csvTransaction.is_recurring,
      tags: this.generateTags(csvTransaction),
    };
  }

  /**
   * Transform multiple CSV transactions
   */
  static toTransactions(csvTransactions: CSVTransaction[]): Transaction[] {
    return csvTransactions.map(tx => this.toTransaction(tx));
  }

  /**
   * Normalize category names
   */
  private static normalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'food_dining': 'Food & Dining',
      'transportation': 'Transportation',
      'shopping': 'Shopping',
      'entertainment': 'Entertainment',
      'bills_utilities': 'Bills & Utilities',
      'healthcare': 'Healthcare',
      'education': 'Education',
      'travel': 'Travel',
      'groceries': 'Groceries',
      'income': 'Income',
      'transfer': 'Transfer',
      'other': 'Other',
    };
    
    return categoryMap[category.toLowerCase()] || category;
  }

  /**
   * Generate tags based on transaction data
   */
  private static generateTags(csvTransaction: CSVTransaction): string[] {
    const tags: string[] = [];
    
    if (csvTransaction.is_recurring) {
      tags.push('recurring');
    }
    
    if (Math.abs(csvTransaction.amount) > 1000) {
      tags.push('large-transaction');
    }
    
    if (csvTransaction.transaction_type === 'debit') {
      tags.push('expense');
    } else if (csvTransaction.transaction_type === 'credit') {
      tags.push('income');
    }
    
    return tags;
  }
}

// ============================================================================
// Goal Transformers
// ============================================================================

export class GoalTransformer {
  /**
   * Transform CSV goal data to Goal type
   */
  static toGoal(csvGoal: CSVGoal): Goal {
    return {
      id: csvGoal.goal_id,
      title: csvGoal.goal_name,
      type: this.mapGoalType(csvGoal.goal_type),
      target: csvGoal.target_amount,
      current: csvGoal.current_amount,
      deadline: csvGoal.target_date,
      monthlyContribution: csvGoal.monthly_contribution,
      milestones: this.generateMilestones(csvGoal),
    };
  }

  /**
   * Transform multiple CSV goals
   */
  static toGoals(csvGoals: CSVGoal[]): Goal[] {
    return csvGoals
      .sort((a, b) => a.priority - b.priority)
      .map(goal => this.toGoal(goal));
  }

  /**
   * Map CSV goal type to API goal type
   */
  private static mapGoalType(csvType: string): Goal['type'] {
    const typeMap: Record<string, Goal['type']> = {
      'emergency_fund': 'safety',
      'house_downpayment': 'home',
      'vacation': 'experience',
      'retirement': 'retirement',
      'debt_payoff': 'debt',
      'education': 'experience',
      'wedding': 'experience',
      'car': 'experience',
    };
    
    return typeMap[csvType.toLowerCase()] || 'experience';
  }

  /**
   * Generate milestones based on goal type and amount
   */
  private static generateMilestones(csvGoal: CSVGoal): Goal['milestones'] {
    const progress = (csvGoal.current_amount / csvGoal.target_amount) * 100;
    const milestones: Goal['milestones'] = [];
    
    // Add percentage-based milestones
    [25, 50, 75, 100].forEach(percentage => {
      milestones.push({
        name: `${percentage}% Complete`,
        target: (csvGoal.target_amount * percentage) / 100,
        completed: progress >= percentage,
      });
    });
    
    return milestones;
  }
}

// ============================================================================
// Spending Analysis Transformers
// ============================================================================

export class SpendingTransformer {
  /**
   * Transform transactions to spending categories
   */
  static toSpendingCategories(
    transactions: CSVTransaction[],
    budgets?: Record<string, number>
  ): SpendingCategory[] {
    const categoryMap = new Map<string, number>();
    
    // Aggregate spending by category
    transactions
      .filter(t => t.amount < 0 && this.isCurrentMonth(t.date))
      .forEach(t => {
        const category = TransactionTransformer['normalizeCategory'](t.category);
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + Math.abs(t.amount));
      });
    
    // Convert to SpendingCategory array
    return Array.from(categoryMap.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: 0, // Will be calculated by the API
      trend: this.calculateTrend(transactions, name),
    }));
  }

  /**
   * Check if transaction is in current month
   */
  private static isCurrentMonth(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  /**
   * Calculate spending trend for a category
   */
  private static calculateTrend(
    transactions: CSVTransaction[],
    category: string
  ): 'up' | 'down' | 'stable' {
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const currentMonthSpending = transactions
      .filter(t => 
        t.amount < 0 &&
        TransactionTransformer['normalizeCategory'](t.category) === category &&
        this.isMonth(t.date, currentMonth)
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const lastMonthSpending = transactions
      .filter(t => 
        t.amount < 0 &&
        TransactionTransformer['normalizeCategory'](t.category) === category &&
        this.isMonth(t.date, lastMonth)
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const difference = currentMonthSpending - lastMonthSpending;
    const threshold = lastMonthSpending * 0.1; // 10% threshold
    
    if (difference > threshold) return 'up';
    if (difference < -threshold) return 'down';
    return 'stable';
  }

  /**
   * Check if date is in specific month
   */
  private static isMonth(dateStr: string, targetDate: Date): boolean {
    const date = new Date(dateStr);
    return (
      date.getMonth() === targetDate.getMonth() &&
      date.getFullYear() === targetDate.getFullYear()
    );
  }
}

// ============================================================================
// Batch Transformation Utilities
// ============================================================================

export class DataTransformer {
  /**
   * Transform all CSV data for a user profile
   */
  static transformProfileData(data: {
    customer: CSVCustomer;
    accounts: CSVAccount[];
    transactions: CSVTransaction[];
    goals: CSVGoal[];
  }) {
    return {
      profile: CustomerTransformer.toUserProfile(
        data.customer,
        data.accounts,
        data.transactions
      ),
      accounts: AccountTransformer.toAccounts(data.accounts),
      transactions: TransactionTransformer.toTransactions(data.transactions),
      goals: GoalTransformer.toGoals(data.goals),
      spendingCategories: SpendingTransformer.toSpendingCategories(
        data.transactions
      ),
    };
  }

  /**
   * Validate CSV data before transformation
   */
  static validateCSVData(data: any): boolean {
    // Add validation logic here
    return true;
  }
}