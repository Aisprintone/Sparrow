"""
Behavioral Economics Module for FinanceAI Monte Carlo Engine.

This module implements realistic behavioral finance models that account for
how people actually make financial decisions under stress, uncertainty, and
cognitive biases.
"""

from .emergency_behavior import (
    EmergencyBehaviorModel,
    StressResponseCurve,
    ExpenseReductionPattern,
    SocialSafetyNet,
    BehavioralPersonality
)

from .student_loan_behavior import (
    StudentLoanBehaviorModel,
    RepaymentPsychology,
    ForbearanceDecisionTree,
    RefinancingBehavior,
    ForgivenessCommitment
)

from .cognitive_biases import (
    CognitiveBiasModel,
    LossAversionCalculator,
    PresentBiasAdjuster,
    MentalAccountingModel,
    OptimismBiasCorrector,
    AnchoringEffect,
    FramingEffectModel
)

from .decision_framework import (
    BehavioralDecisionFramework,
    FinancialStressScore,
    DecisionContext,
    BehavioralProfile,
    AdaptiveBehaviorModel
)

from .social_cultural import (
    SocialCulturalFactors,
    FamilySupportModel,
    PeerInfluenceCalculator,
    CulturalDebtAttitude,
    GenerationalBehavior
)

__all__ = [
    # Emergency Behavior
    'EmergencyBehaviorModel',
    'StressResponseCurve',
    'ExpenseReductionPattern',
    'SocialSafetyNet',
    'BehavioralPersonality',
    
    # Student Loan Behavior
    'StudentLoanBehaviorModel',
    'RepaymentPsychology',
    'ForbearanceDecisionTree',
    'RefinancingBehavior',
    'ForgivenessCommitment',
    
    # Cognitive Biases
    'CognitiveBiasModel',
    'LossAversionCalculator',
    'PresentBiasAdjuster',
    'MentalAccountingModel',
    'OptimismBiasCorrector',
    'AnchoringEffect',
    'FramingEffectModel',
    
    # Decision Framework
    'BehavioralDecisionFramework',
    'FinancialStressScore',
    'DecisionContext',
    'BehavioralProfile',
    'AdaptiveBehaviorModel',
    
    # Social and Cultural
    'SocialCulturalFactors',
    'FamilySupportModel',
    'PeerInfluenceCalculator',
    'CulturalDebtAttitude',
    'GenerationalBehavior'
]