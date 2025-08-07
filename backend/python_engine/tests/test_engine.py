"""
Comprehensive test suite for Monte Carlo simulation engine.
Tests all core functionality with realistic financial scenarios.
"""

import os
import sys
import pytest
import numpy as np
from unittest.mock import Mock, patch

# Add the parent directory to the path so we can import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import SimulationConfig
from core.engine import MonteCarloEngine, NumpyRandomGenerator
from core.models import ProfileData, Account, Transaction, AccountType, Demographic
from scenarios.emergency_fund import EmergencyFundScenario
from scenarios.student_loan import StudentLoanPayoffScenario
from data.csv_loader import CSVDataLoader


class TestMonteCarloEngine:
    """Test Monte Carlo engine core functionality."""
    
    @pytest.fixture
    def config(self):
        """Create test configuration."""
        config = SimulationConfig()
        config.RANDOM_SEED = 42
        config.DEFAULT_ITERATIONS = 1000
        return config
    
    @pytest.fixture
    def engine(self, config):
        """Create engine instance."""
        return MonteCarloEngine(config)
    
    @pytest.fixture
    def sample_profile(self):
        """Create sample profile for testing."""
        return ProfileData(
            customer_id=1,
            demographic=Demographic.MILLENNIAL,
            accounts=[
                Account(
                    account_id="1",
                    customer_id=1,
                    institution_name="Test Bank",
                    account_type=AccountType.SAVINGS,
                    account_name="Emergency Fund",
                    balance=15000.0,
                    credit_limit=None,
                    interest_rate=0.045
                ),
                Account(
                    account_id="2",
                    customer_id=1,
                    institution_name="Test Bank",
                    account_type=AccountType.CHECKING,
                    account_name="Checking",
                    balance=5000.0,
                    credit_limit=None,
                    interest_rate=0.001
                )
            ],
            transactions=[],
            monthly_income=5000.0,
            monthly_expenses=3000.0,
            credit_score=750,
            age=32,
            location="San Francisco"
        )
    
    def test_engine_initialization(self, config):
        """Test engine initializes correctly."""
        engine = MonteCarloEngine(config)
        assert engine.config == config
        assert isinstance(engine.random_generator, NumpyRandomGenerator)
    
    def test_random_generator_seed(self):
        """Test random generator produces reproducible results."""
        gen1 = NumpyRandomGenerator(seed=42)
        gen2 = NumpyRandomGenerator(seed=42)
        
        vals1 = gen1.normal(0, 1, 100)
        vals2 = gen2.normal(0, 1, 100)
        
        np.testing.assert_array_equal(vals1, vals2)
    
    def test_run_emergency_fund_scenario(self, engine, sample_profile):
        """Test running emergency fund scenario."""
        scenario = EmergencyFundScenario()
        result = engine.run_scenario(scenario, sample_profile, iterations=1000)
        
        # Validate result structure
        assert result.scenario_name == "EmergencyFundScenario"
        assert result.iterations == 1000
        assert result.percentile_10 < result.percentile_50 < result.percentile_90
        assert 0 <= result.probability_success <= 1
        assert result.processing_time_ms > 0
        
        # Emergency fund of $15k with $3k expenses should provide ~5 months
        assert 3 < result.percentile_50 < 7
    
    def test_statistical_convergence(self, engine, sample_profile):
        """Test that increasing iterations improves convergence."""
        scenario = EmergencyFundScenario()
        
        # Run with different iteration counts
        result_100 = engine.run_scenario(scenario, sample_profile, iterations=100)
        result_10000 = engine.run_scenario(scenario, sample_profile, iterations=10000)
        
        # Higher iterations should have tighter confidence interval
        ci_width_100 = result_100.confidence_interval_95[1] - result_100.confidence_interval_95[0]
        ci_width_10000 = result_10000.confidence_interval_95[1] - result_10000.confidence_interval_95[0]
        
        assert ci_width_10000 < ci_width_100
        assert result_10000.metadata['convergence_achieved'] == True
    
    def test_profile_validation(self, engine):
        """Test profile validation for missing data."""
        # Create profile with missing required data
        incomplete_profile = ProfileData(
            customer_id=1,
            demographic=Demographic.GENZ,
            accounts=[],  # Empty accounts
            transactions=[],
            monthly_income=3000.0,
            monthly_expenses=2000.0,
            credit_score=650,
            age=24,
            location="Austin"
        )
        
        scenario = EmergencyFundScenario()
        
        # Should raise ValueError for insufficient data
        with pytest.raises(ValueError, match="missing required data"):
            engine.run_scenario(scenario, incomplete_profile)


class TestEmergencyFundScenario:
    """Test emergency fund scenario calculations."""
    
    @pytest.fixture
    def scenario(self):
        """Create scenario instance."""
        return EmergencyFundScenario()
    
    def test_required_fields(self, scenario):
        """Test required data fields."""
        fields = scenario.get_required_data_fields()
        assert 'accounts' in fields
        assert 'monthly_expenses' in fields
        assert 'demographic' in fields
    
    def test_success_criteria(self, scenario):
        """Test success criteria function."""
        criteria = scenario.get_success_criteria()
        
        # Test with various outcomes
        outcomes = np.array([1.0, 2.9, 3.0, 5.0, 10.0])
        success = criteria(outcomes)
        
        expected = np.array([False, False, True, True, True])
        np.testing.assert_array_equal(success, expected)
    
    def test_calculate_outcome_vectorized(self, scenario):
        """Test vectorized outcome calculation."""
        profile = ProfileData(
            customer_id=1,
            demographic=Demographic.MILLENNIAL,
            accounts=[
                Account(
                    account_id="1",
                    customer_id=1,
                    institution_name="Bank",
                    account_type=AccountType.SAVINGS,
                    account_name="Emergency",
                    balance=10000.0
                )
            ],
            transactions=[],
            monthly_income=5000.0,
            monthly_expenses=3000.0,
            credit_score=720,
            age=35
        )
        
        # Create mock random factors
        iterations = 1000
        random_factors = {
            'market_returns': np.random.normal(0.007, 0.015, iterations),
            'inflation_rates': np.random.normal(0.003, 0.002, iterations),
            'emergency_expenses': np.random.exponential(0.1, iterations),
            'expense_multiplier': np.random.normal(1.0, 0.05, iterations)
        }
        
        outcomes = scenario.calculate_outcome(profile, random_factors)
        
        # Validate outcomes
        assert len(outcomes) == iterations
        assert np.all(outcomes >= 0)  # No negative runways
        assert np.all(outcomes <= 120)  # Capped at 120 months
        
        # With $10k fund and $3k expenses, median should be around 3-4 months
        median = np.median(outcomes)
        assert 2 < median < 5


class TestStudentLoanScenario:
    """Test student loan payoff scenario."""
    
    @pytest.fixture
    def scenario(self):
        """Create scenario instance."""
        return StudentLoanPayoffScenario()
    
    @pytest.fixture
    def profile_with_loans(self):
        """Create profile with student loans."""
        return ProfileData(
            customer_id=3,
            demographic=Demographic.GENZ,
            accounts=[
                Account(
                    account_id="1",
                    customer_id=3,
                    institution_name="Moov",
                    account_type=AccountType.STUDENT_LOAN,
                    account_name="Student Loan",
                    balance=-25000.0,
                    interest_rate=0.068
                ),
                Account(
                    account_id="2",
                    customer_id=3,
                    institution_name="Bank",
                    account_type=AccountType.CHECKING,
                    account_name="Checking",
                    balance=2000.0
                )
            ],
            transactions=[],
            monthly_income=3200.0,
            monthly_expenses=2100.0,
            credit_score=680,
            age=24
        )
    
    def test_calculate_outcome_with_loans(self, scenario, profile_with_loans):
        """Test loan payoff calculation."""
        iterations = 1000
        random_factors = {
            'income_volatility': np.random.normal(1.0, 0.15, iterations),
            'interest_rate_changes': np.random.normal(0, 0.005, iterations)
        }
        
        outcomes = scenario.calculate_outcome(profile_with_loans, random_factors)
        
        # Validate outcomes
        assert len(outcomes) == iterations
        assert np.all(outcomes > 0)  # All positive payoff times
        assert np.all(outcomes <= 360)  # Capped at 30 years
        
        # $25k loan with available payment capacity should take 50-150 months
        median = np.median(outcomes)
        assert 50 < median < 150
    
    def test_calculate_outcome_no_loans(self, scenario):
        """Test scenario with no student loans."""
        profile = ProfileData(
            customer_id=2,
            demographic=Demographic.MILLENNIAL,
            accounts=[
                Account(
                    account_id="1",
                    customer_id=2,
                    institution_name="Bank",
                    account_type=AccountType.CHECKING,
                    account_name="Checking",
                    balance=10000.0
                )
            ],
            transactions=[],
            monthly_income=8000.0,
            monthly_expenses=4000.0,
            credit_score=805,
            age=38
        )
        
        random_factors = {
            'income_volatility': np.random.normal(1.0, 0.1, 100),
            'interest_rate_changes': np.random.normal(0, 0.005, 100)
        }
        
        outcomes = scenario.calculate_outcome(profile, random_factors)
        
        # Should return zeros for no loans
        assert np.all(outcomes == 0)
    
    def test_advanced_metrics(self, scenario, profile_with_loans):
        """Test advanced metrics calculation."""
        random_factors = {
            'income_volatility': np.random.normal(1.0, 0.15, 1000),
            'interest_rate_changes': np.random.normal(0, 0.005, 1000)
        }
        
        metrics = scenario.calculate_advanced_metrics(profile_with_loans, random_factors)
        
        assert metrics['has_student_loans'] == True
        assert metrics['loan_balance'] == 25000.0
        assert metrics['estimated_monthly_payment'] > 0
        assert metrics['total_interest_paid'] > 0
        assert 0 <= metrics['probability_payoff_5_years'] <= 1
        assert 0 <= metrics['probability_payoff_10_years'] <= 1


class TestCSVDataLoader:
    """Test CSV data loading with real files."""
    
    @pytest.fixture
    def loader(self):
        """Create data loader instance."""
        return CSVDataLoader()
    
    def test_load_profile_1(self, loader):
        """Test loading profile 1 (Millennial)."""
        profile = loader.load_profile(1)
        
        assert profile.customer_id == 1
        assert profile.demographic == Demographic.MILLENNIAL
        assert len(profile.accounts) > 0
        assert len(profile.transactions) > 0
        assert profile.monthly_income > 0
        assert profile.monthly_expenses > 0
        assert 300 <= profile.credit_score <= 850
    
    def test_load_profile_3_student_loans(self, loader):
        """Test loading profile 3 with student loans."""
        profile = loader.load_profile(3)
        
        assert profile.customer_id == 3
        assert profile.demographic == Demographic.GENZ
        
        # Check for student loans
        student_loan_balance = profile.student_loan_balance
        assert student_loan_balance > 0  # Should have student loans
    
    def test_invalid_profile(self, loader):
        """Test loading non-existent profile."""
        with pytest.raises(ValueError, match="not found"):
            loader.load_profile(999)
    
    def test_get_available_profiles(self, loader):
        """Test getting list of available profiles."""
        profiles = loader.get_available_profiles()
        
        assert isinstance(profiles, list)
        assert len(profiles) >= 3  # At least 3 profiles
        assert 1 in profiles
        assert 2 in profiles
        assert 3 in profiles


class TestIntegration:
    """Integration tests with real data."""
    
    @pytest.fixture
    def setup(self):
        """Set up integration test components."""
        config = SimulationConfig()
        config.RANDOM_SEED = 42
        engine = MonteCarloEngine(config)
        loader = CSVDataLoader()
        return engine, loader
    
    def test_full_simulation_pipeline_profile_1(self, setup):
        """Test complete simulation for Profile 1."""
        engine, loader = setup
        
        # Load real profile
        profile = loader.load_profile(1)
        
        # Run emergency fund simulation
        scenario = EmergencyFundScenario()
        result = engine.run_scenario(scenario, profile, iterations=5000)
        
        # Profile 1 (Millennial) should have good emergency fund
        assert result.percentile_50 > 6  # Should have 6+ months runway
        assert result.probability_success > 0.8  # High probability of success
    
    def test_full_simulation_pipeline_profile_3(self, setup):
        """Test complete simulation for Profile 3."""
        engine, loader = setup
        
        # Load real profile
        profile = loader.load_profile(3)
        
        # Run student loan simulation
        scenario = StudentLoanPayoffScenario()
        result = engine.run_scenario(scenario, profile, iterations=5000)
        
        # Profile 3 (Gen Z) has student loans
        assert result.percentile_50 > 0  # Should calculate payoff time
        assert result.mean > 0
        
        # Get advanced metrics
        random_factors = engine._generate_random_factors(profile, 5000)
        metrics = scenario.calculate_advanced_metrics(profile, random_factors)
        
        assert metrics['has_student_loans'] == True
        assert metrics['loan_balance'] > 0