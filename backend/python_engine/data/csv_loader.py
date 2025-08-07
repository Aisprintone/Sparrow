"""
CSV data loader for profile data.
Loads and transforms CSV data into ProfileData models.
"""

import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd

# Add the parent directory to the path so we can import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.models import (
    ProfileData, 
    Account, 
    Transaction, 
    AccountType, 
    Demographic
)


class CSVDataLoader:
    """
    Loads profile data from CSV files.
    Single Responsibility: Load and transform CSV data.
    """
    
    def __init__(self, data_dir: str = "/Users/ai-sprint-02/Documents/Sparrow/data"):
        """
        Initialize loader with data directory.
        
        Args:
            data_dir: Directory containing CSV files
        """
        self.data_dir = data_dir
        self._validate_data_directory()
    
    def _validate_data_directory(self):
        """Validate that required CSV files exist."""
        required_files = [
            'customer.csv',
            'account.csv',
            'transaction.csv'
        ]
        
        for file in required_files:
            filepath = os.path.join(self.data_dir, file)
            if not os.path.exists(filepath):
                raise FileNotFoundError(f"Required CSV file not found: {filepath}")
    
    def load_profile(self, customer_id: int) -> ProfileData:
        """
        Load complete profile data for a customer.
        
        Args:
            customer_id: Customer ID to load
            
        Returns:
            Complete ProfileData model
            
        Raises:
            ValueError: If customer not found
        """
        # Load customer data
        customer_df = pd.read_csv(os.path.join(self.data_dir, 'customer.csv'))
        customer = customer_df[customer_df['customer_id'] == customer_id]
        
        if customer.empty:
            raise ValueError(f"Customer {customer_id} not found")
        
        customer_data = customer.iloc[0]
        
        # Load accounts
        accounts = self._load_accounts(customer_id)
        
        # Load transactions
        transactions = self._load_transactions(customer_id, accounts)
        
        # Calculate financial metrics
        monthly_income = self._calculate_monthly_income(transactions)
        monthly_expenses = self._calculate_monthly_expenses(transactions)
        
        # Determine demographic
        demographic = self._determine_demographic(customer_data['age'])
        
        # Estimate credit score based on profile
        credit_score = self._estimate_credit_score(customer_id, accounts)
        
        return ProfileData(
            customer_id=customer_id,
            demographic=demographic,
            accounts=accounts,
            transactions=transactions,
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
            credit_score=credit_score,
            age=int(customer_data['age']),
            location=customer_data.get('location', 'Unknown')
        )
    
    def _load_accounts(self, customer_id: int) -> List[Account]:
        """
        Load accounts for a customer.
        
        Args:
            customer_id: Customer ID
            
        Returns:
            List of Account models
        """
        accounts_df = pd.read_csv(os.path.join(self.data_dir, 'account.csv'))
        customer_accounts = accounts_df[accounts_df['customer_id'] == customer_id]
        
        accounts = []
        for _, row in customer_accounts.iterrows():
            # Map account type
            account_type = self._map_account_type(row['account_type'])
            
            # Determine interest rate based on account type
            interest_rate = self._get_interest_rate(account_type, row)
            
            account = Account(
                account_id=str(row['account_id']),
                customer_id=customer_id,
                institution_name=row['institution_name'],
                account_type=account_type,
                account_name=self._generate_account_name(row),
                balance=float(row['balance']),
                credit_limit=float(row['credit_limit']) if pd.notna(row.get('credit_limit')) else None,
                interest_rate=interest_rate,
                minimum_payment=self._calculate_minimum_payment(row)
            )
            accounts.append(account)
        
        return accounts
    
    def _load_transactions(
        self, 
        customer_id: int, 
        accounts: List[Account]
    ) -> List[Transaction]:
        """
        Load transactions for customer accounts.
        
        Args:
            customer_id: Customer ID
            accounts: List of customer accounts
            
        Returns:
            List of Transaction models
        """
        transactions_df = pd.read_csv(os.path.join(self.data_dir, 'transaction.csv'))
        
        # Get account IDs for this customer
        account_ids = [int(acc.account_id) for acc in accounts]
        
        # Filter transactions
        customer_transactions = transactions_df[
            transactions_df['account_id'].isin(account_ids)
        ]
        
        transactions = []
        for _, row in customer_transactions.iterrows():
            # Parse timestamp
            timestamp = self._parse_timestamp(row['timestamp'])
            
            transaction = Transaction(
                transaction_id=str(row['transaction_id']),
                account_id=str(row['account_id']),
                amount=float(row['amount']),
                description=row.get('description', 'Unknown'),
                category=row.get('category', None),
                timestamp=timestamp,
                is_recurring=bool(row.get('is_recurring', False)),
                is_debit=float(row['amount']) < 0
            )
            transactions.append(transaction)
        
        return transactions
    
    def _map_account_type(self, type_str: str) -> AccountType:
        """
        Map CSV account type to AccountType enum.
        
        Args:
            type_str: Account type string from CSV
            
        Returns:
            AccountType enum value
        """
        type_mapping = {
            'checking': AccountType.CHECKING,
            'savings': AccountType.SAVINGS,
            'credit_card': AccountType.CREDIT,
            'credit': AccountType.CREDIT,
            'loan': AccountType.LOAN,
            'student_loan': AccountType.STUDENT_LOAN,
            'mortgage': AccountType.MORTGAGE,
            'investment': AccountType.INVESTMENT,
            'brokerage': AccountType.INVESTMENT
        }
        
        return type_mapping.get(type_str.lower(), AccountType.OTHER)
    
    def _generate_account_name(self, row: pd.Series) -> str:
        """
        Generate account name if not provided.
        
        Args:
            row: Account data row
            
        Returns:
            Account name
        """
        if pd.notna(row.get('account_name')):
            return row['account_name']
        
        # Generate based on institution and type
        institution = row['institution_name']
        account_type = row['account_type']
        
        # Special cases
        if 'Fidelity' in institution:
            return 'Fidelity 401(k)'
        elif 'Moov' in institution:
            return 'Student Loan'
        elif 'Robinhood' in institution:
            return 'Investment Account'
        elif 'Chase Auto' in institution:
            return 'Auto Loan'
        
        return f"{institution} {account_type.title()}"
    
    def _get_interest_rate(self, account_type: AccountType, row: pd.Series) -> float:
        """
        Get interest rate for account.
        
        Args:
            account_type: Type of account
            row: Account data row
            
        Returns:
            Annual interest rate
        """
        if pd.notna(row.get('interest_rate')):
            return float(row['interest_rate'])
        
        # Default rates by type
        default_rates = {
            AccountType.SAVINGS: 0.045,      # 4.5% high-yield savings
            AccountType.CHECKING: 0.001,     # 0.1% checking
            AccountType.CREDIT: 0.199,       # 19.9% credit card
            AccountType.STUDENT_LOAN: 0.068, # 6.8% student loan
            AccountType.MORTGAGE: 0.065,     # 6.5% mortgage
            AccountType.LOAN: 0.089,         # 8.9% personal loan
            AccountType.INVESTMENT: 0.07     # 7% expected return
        }
        
        return default_rates.get(account_type, 0.0)
    
    def _calculate_minimum_payment(self, row: pd.Series) -> Optional[float]:
        """
        Calculate minimum payment for debt accounts.
        
        Args:
            row: Account data row
            
        Returns:
            Minimum payment amount or None
        """
        if pd.notna(row.get('minimum_payment')):
            return float(row['minimum_payment'])
        
        balance = float(row['balance'])
        if balance >= 0:  # Not a debt account
            return None
        
        account_type = self._map_account_type(row['account_type'])
        
        # Calculate based on account type
        if account_type == AccountType.CREDIT:
            # Credit card: 2% of balance or $25, whichever is greater
            return max(abs(balance) * 0.02, 25)
        elif account_type == AccountType.STUDENT_LOAN:
            # Student loan: Standard 10-year repayment
            return abs(balance) / 120
        elif account_type == AccountType.MORTGAGE:
            # Mortgage: 30-year amortization
            return abs(balance) / 360
        else:
            # Other loans: 5-year repayment
            return abs(balance) / 60
    
    def _calculate_monthly_income(self, transactions: List[Transaction]) -> float:
        """
        Calculate average monthly income from transactions.
        
        Args:
            transactions: List of transactions
            
        Returns:
            Average monthly income
        """
        # Find income transactions (positive amounts, salary/income categories)
        income_keywords = ['salary', 'payroll', 'income', 'bonus', 'commission']
        
        # Filter out transfers and opening balances
        exclude_keywords = ['opening balance', 'transfer', 'credit card payment']
        
        income_transactions = [
            t for t in transactions
            if t.amount > 0 and 
            any(keyword in t.description.lower() for keyword in income_keywords) and
            not any(keyword in t.description.lower() for keyword in exclude_keywords)
        ]
        
        if not income_transactions:
            # Fallback: use all positive transactions except transfers
            income_transactions = [
                t for t in transactions 
                if t.amount > 0 and 
                not any(keyword in t.description.lower() for keyword in exclude_keywords)
            ]
        
        if not income_transactions:
            return 0
        
        # Calculate monthly average
        total_income = sum(t.amount for t in income_transactions)
        
        # Estimate time span of transactions
        if len(transactions) > 1:
            dates = [t.timestamp for t in transactions]
            time_span_days = (max(dates) - min(dates)).days
            months = max(1, time_span_days / 30)
        else:
            months = 1
        
        return total_income / months
    
    def _calculate_monthly_expenses(self, transactions: List[Transaction]) -> float:
        """
        Calculate average monthly expenses from transactions.
        
        Args:
            transactions: List of transactions
            
        Returns:
            Average monthly expenses
        """
        # Filter out non-recurring expenses and transfers
        exclude_keywords = [
            'opening balance', 'transfer', 'credit card payment', 
            'loan payment', 'mortgage payment', 'student loan payment',
            'auto loan payment', 'principal payment'
        ]
        
        recurring_expense_transactions = [
            t for t in transactions 
            if t.amount < 0 and 
            not any(keyword in t.description.lower() for keyword in exclude_keywords)
        ]
        
        if not recurring_expense_transactions:
            return 0
        
        # Calculate monthly average
        total_expenses = abs(sum(t.amount for t in recurring_expense_transactions))
        
        # Estimate time span of transactions
        if len(transactions) > 1:
            dates = [t.timestamp for t in transactions]
            time_span_days = (max(dates) - min(dates)).days
            months = max(1, time_span_days / 30)
        else:
            months = 1
        
        return total_expenses / months
    
    def _determine_demographic(self, age: int) -> Demographic:
        """
        Determine demographic based on age.
        
        Args:
            age: Customer age
            
        Returns:
            Demographic enum value
        """
        if age < 28:
            return Demographic.GENZ
        elif age < 43:
            return Demographic.MILLENNIAL
        elif age < 55:
            return Demographic.MIDCAREER
        elif age < 65:
            return Demographic.SENIOR
        else:
            return Demographic.RETIRED
    
    def _estimate_credit_score(
        self, 
        customer_id: int, 
        accounts: List[Account]
    ) -> int:
        """
        Estimate credit score based on profile.
        
        Args:
            customer_id: Customer ID
            accounts: List of accounts
            
        Returns:
            Estimated credit score
        """
        # Base scores by customer (from domain knowledge)
        base_scores = {
            1: 750,  # Sarah - Good credit
            2: 805,  # Michael - Excellent credit
            3: 680   # Emma - Building credit
        }
        
        base_score = base_scores.get(customer_id, 700)
        
        # Adjust based on debt levels
        total_debt = sum(abs(a.balance) for a in accounts if a.balance < 0)
        if total_debt > 50000:
            base_score -= 20
        elif total_debt > 25000:
            base_score -= 10
        
        # Ensure within valid range
        return max(300, min(850, base_score))
    
    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """
        Parse timestamp string from CSV.
        
        Args:
            timestamp_str: Timestamp string
            
        Returns:
            Datetime object
        """
        try:
            # Try parsing with microseconds
            return datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S.%f')
        except ValueError:
            try:
                # Try without microseconds
                return datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                # Fallback to current time
                return datetime.now()
    
    def get_available_profiles(self) -> List[int]:
        """
        Get list of available customer IDs.
        
        Returns:
            List of customer IDs
        """
        customer_df = pd.read_csv(os.path.join(self.data_dir, 'customer.csv'))
        return customer_df['customer_id'].tolist()