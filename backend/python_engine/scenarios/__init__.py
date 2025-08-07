"""
Scenario modules for financial simulations.
"""

from .emergency_fund import EmergencyFundScenario
from .student_loan import StudentLoanScenario
from .medical_crisis import MedicalCrisisScenario
from .gig_economy import GigEconomyScenario
from .market_crash import MarketCrashScenario
from .home_purchase import HomePurchaseScenario
from .rent_hike import RentHikeScenario
from .auto_repair import AutoRepairScenario

__all__ = [
    'EmergencyFundScenario',
    'StudentLoanScenario',
    'MedicalCrisisScenario',
    'GigEconomyScenario',
    'MarketCrashScenario',
    'HomePurchaseScenario',
    'RentHikeScenario',
    'AutoRepairScenario'
]