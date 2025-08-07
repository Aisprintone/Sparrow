"""
FinanceAI Monte Carlo Simulation Engine.
Production-grade financial simulations with statistical rigor.
"""

__version__ = "1.0.0"

from .core.engine import MonteCarloEngine
from .core.config import SimulationConfig
from .core.models import ProfileData, ScenarioResult
from .scenarios.emergency_fund import EmergencyFundScenario
from .scenarios.student_loan import StudentLoanScenario
from .data.csv_loader import CSVDataLoader

__all__ = [
    'MonteCarloEngine',
    'SimulationConfig',
    'ProfileData',
    'ScenarioResult',
    'EmergencyFundScenario',
    'StudentLoanScenario',
    'CSVDataLoader'
]