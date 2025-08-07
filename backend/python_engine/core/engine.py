"""
Core Monte Carlo simulation engine.
Implements SOLID principles with clean architecture.
"""

import time
from typing import Dict, Any, Optional, Protocol
from abc import ABC, abstractmethod
import numpy as np
from scipy import stats

from .config import SimulationConfig
from .models import ProfileData, ScenarioResult


class RandomGenerator(Protocol):
    """Protocol for random number generation (Dependency Inversion)."""
    def normal(self, mean: float, std: float, size: int) -> np.ndarray: ...
    def uniform(self, low: float, high: float, size: int) -> np.ndarray: ...
    def exponential(self, scale: float, size: int) -> np.ndarray: ...
    def poisson(self, lam: float, size: int) -> np.ndarray: ...


class NumpyRandomGenerator:
    """Concrete implementation of RandomGenerator using NumPy."""
    
    def __init__(self, seed: Optional[int] = None):
        """Initialize with optional seed for reproducibility."""
        if seed is not None:
            np.random.seed(seed)
        self.rng = np.random.default_rng(seed)
    
    def normal(self, mean: float, std: float, size: int) -> np.ndarray:
        return self.rng.normal(mean, std, size)
    
    def uniform(self, low: float, high: float, size: int) -> np.ndarray:
        return self.rng.uniform(low, high, size)
    
    def exponential(self, scale: float, size: int) -> np.ndarray:
        return self.rng.exponential(scale, size)
    
    def poisson(self, lam: float, size: int) -> np.ndarray:
        return self.rng.poisson(lam, size)


class BaseScenario(ABC):
    """Abstract base class for all simulation scenarios (Open/Closed Principle)."""
    
    @abstractmethod
    def calculate_outcome(
        self, 
        profile: ProfileData, 
        random_factors: Dict[str, np.ndarray]
    ) -> np.ndarray:
        """
        Calculate outcomes for all Monte Carlo iterations.
        
        Args:
            profile: User profile data
            random_factors: Pre-generated random variables for all iterations
            
        Returns:
            Array of outcomes for each iteration
        """
        pass
    
    @abstractmethod
    def get_required_data_fields(self) -> list[str]:
        """
        Return list of required ProfileData fields.
        
        Returns:
            List of field names that must be present in ProfileData
        """
        pass
    
    @abstractmethod
    def get_success_criteria(self) -> callable:
        """
        Return function to determine success for each outcome.
        
        Returns:
            Function that takes outcome array and returns boolean array
        """
        pass
    
    def validate_profile_data(self, profile: ProfileData) -> bool:
        """
        Validate that profile has all required data.
        
        Args:
            profile: User profile to validate
            
        Returns:
            True if all required fields are present and valid
        """
        required_fields = self.get_required_data_fields()
        for field in required_fields:
            if not hasattr(profile, field):
                return False
            value = getattr(profile, field)
            if value is None or (isinstance(value, (list, dict)) and len(value) == 0):
                return False
        return True


class MonteCarloEngine:
    """
    Core Monte Carlo simulation engine.
    Single Responsibility: Orchestrate Monte Carlo simulations.
    """
    
    def __init__(
        self,
        config: SimulationConfig,
        random_generator: Optional[RandomGenerator] = None
    ):
        """
        Initialize engine with configuration and dependencies.
        
        Args:
            config: Simulation configuration
            random_generator: Random number generator (Dependency Injection)
        """
        self.config = config
        self.random_generator = random_generator or NumpyRandomGenerator(config.RANDOM_SEED)
    
    def run_scenario(
        self,
        scenario: BaseScenario,
        profile: ProfileData,
        iterations: Optional[int] = None
    ) -> ScenarioResult:
        """
        Run Monte Carlo simulation for a specific scenario.
        
        Args:
            scenario: Scenario to simulate
            profile: User profile data
            iterations: Number of iterations (uses config default if None)
            
        Returns:
            Simulation results with statistics and percentiles
            
        Raises:
            ValueError: If profile data is insufficient for scenario
        """
        start_time = time.time()
        
        # Validate data sufficiency
        if not scenario.validate_profile_data(profile):
            raise ValueError(
                f"Profile missing required data for {scenario.__class__.__name__}. "
                f"Required fields: {scenario.get_required_data_fields()}"
            )
        
        # Set iteration count
        iterations = iterations or self.config.DEFAULT_ITERATIONS
        
        # Generate random factors for all iterations (vectorized for performance)
        random_factors = self._generate_random_factors(profile, iterations)
        
        # Calculate outcomes using scenario logic
        outcomes = scenario.calculate_outcome(profile, random_factors)
        
        # Ensure outcomes is numpy array
        if not isinstance(outcomes, np.ndarray):
            outcomes = np.array(outcomes)
        
        # Calculate success probability
        success_criteria = scenario.get_success_criteria()
        success_array = success_criteria(outcomes)
        probability_success = float(np.mean(success_array))
        
        # Statistical analysis
        processing_time_ms = (time.time() - start_time) * 1000
        
        return self._analyze_results(
            outcomes=outcomes,
            scenario_name=scenario.__class__.__name__,
            iterations=iterations,
            probability_success=probability_success,
            processing_time_ms=processing_time_ms
        )
    
    def _generate_random_factors(
        self, 
        profile: ProfileData, 
        iterations: int
    ) -> Dict[str, np.ndarray]:
        """
        Generate all random variables needed for Monte Carlo simulation.
        
        Args:
            profile: User profile for demographic-specific parameters
            iterations: Number of random samples to generate
            
        Returns:
            Dictionary of random factor arrays
        """
        demographic = profile.demographic
        
        # Market returns (monthly from annual rates)
        monthly_market_return = self.config.MARKET_RETURN_MEAN / 12
        monthly_market_std = self.config.MARKET_RETURN_STD / np.sqrt(12)
        
        # Inflation (monthly from annual rates)
        monthly_inflation = self.config.INFLATION_MEAN / 12
        monthly_inflation_std = self.config.INFLATION_STD / np.sqrt(12)
        
        # Income volatility based on demographic
        income_vol = self.config.INCOME_VOLATILITY.get(demographic, 0.10)
        
        return {
            # Market conditions
            'market_returns': self.random_generator.normal(
                monthly_market_return, monthly_market_std, iterations
            ),
            'inflation_rates': self.random_generator.normal(
                monthly_inflation, monthly_inflation_std, iterations
            ),
            
            # Income variations
            'income_volatility': self.random_generator.normal(
                1.0, income_vol, iterations
            ),
            
            # Emergency expenses (using exponential distribution)
            'emergency_expenses': self.random_generator.exponential(
                0.1, iterations
            ),
            
            # Job market conditions
            'job_search_months': self.random_generator.normal(
                self.config.JOB_SEARCH_DURATION.get(demographic, 4.0),
                1.5,  # Standard deviation of 1.5 months
                iterations
            ),
            
            # Interest rate variations (small changes around current rates)
            'interest_rate_changes': self.random_generator.normal(
                0, 0.005, iterations  # +/- 0.5% changes
            ),
            
            # Expense variations
            'expense_multiplier': self.random_generator.normal(
                1.0, 0.05, iterations  # 5% standard deviation
            )
        }
    
    def _analyze_results(
        self,
        outcomes: np.ndarray,
        scenario_name: str,
        iterations: int,
        probability_success: float,
        processing_time_ms: float
    ) -> ScenarioResult:
        """
        Perform statistical analysis on Monte Carlo results.
        
        Args:
            outcomes: Array of simulation outcomes
            scenario_name: Name of the scenario
            iterations: Number of iterations performed
            probability_success: Probability of success
            processing_time_ms: Processing time in milliseconds
            
        Returns:
            Complete statistical analysis results
        """
        # Calculate percentiles
        percentiles = np.percentile(outcomes, [10, 25, 50, 75, 90])
        
        # Calculate confidence interval (95%) with safety checks
        confidence_level = 0.95
        degrees_freedom = len(outcomes) - 1
        sample_mean = np.mean(outcomes)
        sample_std = np.std(outcomes, ddof=1) if degrees_freedom > 0 else 0
        
        # Handle edge case where all values are identical or no variation
        if len(np.unique(outcomes)) == 1 or sample_std < 1e-10 or degrees_freedom == 0:
            # No variation, confidence interval is just the value
            confidence_interval = (float(sample_mean), float(sample_mean))
        else:
            # Calculate standard error and margin of error
            standard_error = sample_std / np.sqrt(len(outcomes))
            t_value = stats.t.ppf((1 + confidence_level) / 2, degrees_freedom)
            margin_of_error = t_value * standard_error
            
            confidence_interval = (
                float(sample_mean - margin_of_error),
                float(sample_mean + margin_of_error)
            )
        
        # Additional metadata
        metadata = {
            'iterations': iterations,
            'convergence_achieved': self._check_convergence(outcomes),
            'outliers_detected': self._detect_outliers(outcomes),
            'distribution_type': self._identify_distribution(outcomes)
        }
        
        return ScenarioResult(
            scenario_name=scenario_name,
            iterations=iterations,
            percentile_10=float(percentiles[0]),
            percentile_25=float(percentiles[1]),
            percentile_50=float(percentiles[2]),
            percentile_75=float(percentiles[3]),
            percentile_90=float(percentiles[4]),
            mean=float(sample_mean),
            std_dev=float(sample_std),
            min_value=float(np.min(outcomes)),
            max_value=float(np.max(outcomes)),
            probability_success=probability_success,
            confidence_interval_95=confidence_interval,
            metadata=metadata,
            processing_time_ms=processing_time_ms
        )
    
    def _check_convergence(self, outcomes: np.ndarray) -> bool:
        """
        Check if Monte Carlo simulation has converged using multiple criteria.
        
        Args:
            outcomes: Array of simulation outcomes
            
        Returns:
            True if simulation has converged
        """
        # Need sufficient samples for convergence testing
        if len(outcomes) < 1000:
            return False
        
        # Method 1: Split-half comparison
        mid = len(outcomes) // 2
        first_half_mean = np.mean(outcomes[:mid])
        second_half_mean = np.mean(outcomes[mid:])
        
        # Handle edge case where means are zero or very small
        if abs(first_half_mean) < 1e-10 and abs(second_half_mean) < 1e-10:
            return True  # Both halves are essentially zero
        
        # Calculate relative difference
        denominator = max(abs(first_half_mean), abs(second_half_mean), 1e-10)
        relative_diff = abs(first_half_mean - second_half_mean) / denominator
        
        # Method 2: Check standard error stability
        # Divide into 4 quarters and check variance of means
        quarter_size = len(outcomes) // 4
        if quarter_size > 0:
            quarter_means = [
                np.mean(outcomes[i*quarter_size:(i+1)*quarter_size])
                for i in range(4)
            ]
            mean_variance = np.var(quarter_means)
            overall_variance = np.var(outcomes)
            
            # Check if variance between quarters is small relative to overall variance
            if overall_variance > 0:
                variance_ratio = mean_variance / overall_variance
                variance_stable = variance_ratio < 0.01
            else:
                variance_stable = True  # No variance means converged
        else:
            variance_stable = True
        
        # Converged if both criteria are met
        return relative_diff < 0.01 and variance_stable
    
    def _detect_outliers(self, outcomes: np.ndarray) -> int:
        """
        Detect outliers using IQR method.
        
        Args:
            outcomes: Array of simulation outcomes
            
        Returns:
            Number of outliers detected
        """
        q1, q3 = np.percentile(outcomes, [25, 75])
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = np.sum((outcomes < lower_bound) | (outcomes > upper_bound))
        return int(outliers)
    
    def _identify_distribution(self, outcomes: np.ndarray) -> str:
        """
        Identify the type of distribution using statistical tests.
        
        Args:
            outcomes: Array of simulation outcomes
            
        Returns:
            Identified distribution type
        """
        # Handle edge cases
        if len(outcomes) < 10:
            return "insufficient_data"
        
        # Check if all values are identical (degenerate distribution)
        unique_values = np.unique(outcomes)
        if len(unique_values) == 1:
            return "degenerate"
        
        # Check for very low variance
        if np.var(outcomes) < 1e-10:
            return "near_constant"
        
        # Perform normality test (with safety check)
        try:
            _, p_value = stats.normaltest(outcomes)
            
            if p_value > 0.05:
                return "normal"
        except (ValueError, RuntimeWarning):
            pass  # Continue with other tests
        
        # Check skewness
        try:
            skewness = stats.skew(outcomes)
            if abs(skewness) > 1:
                return "skewed"
        except (ValueError, RuntimeWarning):
            pass
        
        # Check for bimodality using KDE (with error handling)
        try:
            # Only attempt KDE if we have sufficient unique values
            if len(unique_values) > 10:
                kde = stats.gaussian_kde(outcomes)
                x = np.linspace(outcomes.min(), outcomes.max(), 100)
                density = kde(x)
                peaks = self._find_peaks(density)
                
                if len(peaks) > 1:
                    return "bimodal"
        except (np.linalg.LinAlgError, ValueError, RuntimeWarning):
            # KDE failed due to singular matrix or other issue
            pass
        
        return "unknown"
    
    def _find_peaks(self, density: np.ndarray) -> list:
        """
        Find peaks in density distribution.
        
        Args:
            density: Density values
            
        Returns:
            List of peak indices
        """
        peaks = []
        for i in range(1, len(density) - 1):
            if density[i] > density[i-1] and density[i] > density[i+1]:
                peaks.append(i)
        return peaks