"""
Behavioral Decision Framework - Integrates all behavioral components into a unified
decision-making model for financial simulations.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass, field
import json


class StressLevel(Enum):
    """Financial stress levels affecting decision quality."""
    MINIMAL = "minimal"  # 0-20% stress
    LOW = "low"  # 20-40% stress  
    MODERATE = "moderate"  # 40-60% stress
    HIGH = "high"  # 60-80% stress
    EXTREME = "extreme"  # 80-100% stress


class DecisionQuality(Enum):
    """Quality of financial decisions under different conditions."""
    OPTIMAL = "optimal"  # Near-rational decisions
    GOOD = "good"  # Minor biases
    SUBOPTIMAL = "suboptimal"  # Significant biases
    POOR = "poor"  # Major mistakes
    PANIC = "panic"  # Emotion-driven errors


@dataclass
class FinancialStressScore:
    """
    Comprehensive financial stress measurement.
    Based on research on financial stress indicators.
    """
    # Component scores (0-1 scale)
    debt_stress: float = 0.0  # Debt-to-income ratio stress
    liquidity_stress: float = 0.0  # Cash flow problems
    uncertainty_stress: float = 0.0  # Income uncertainty
    emergency_stress: float = 0.0  # Lack of emergency fund
    social_stress: float = 0.0  # Peer comparison stress
    
    def calculate_overall_stress(self) -> float:
        """
        Calculate weighted overall stress score.
        
        Weights based on research showing relative impact on decisions.
        """
        weights = {
            'debt': 0.25,
            'liquidity': 0.30,  # Most immediate impact
            'uncertainty': 0.20,
            'emergency': 0.15,
            'social': 0.10
        }
        
        overall = (
            self.debt_stress * weights['debt'] +
            self.liquidity_stress * weights['liquidity'] +
            self.uncertainty_stress * weights['uncertainty'] +
            self.emergency_stress * weights['emergency'] +
            self.social_stress * weights['social']
        )
        
        return min(1.0, overall)
    
    def get_stress_level(self) -> StressLevel:
        """Categorize stress into levels."""
        score = self.calculate_overall_stress()
        
        if score < 0.2:
            return StressLevel.MINIMAL
        elif score < 0.4:
            return StressLevel.LOW
        elif score < 0.6:
            return StressLevel.MODERATE
        elif score < 0.8:
            return StressLevel.HIGH
        else:
            return StressLevel.EXTREME
    
    @classmethod
    def from_financial_metrics(
        cls,
        debt_to_income: float,
        months_emergency_fund: float,
        income_volatility: float,
        expense_coverage_ratio: float
    ) -> 'FinancialStressScore':
        """
        Create stress score from financial metrics.
        """
        # Debt stress increases non-linearly with DTI
        if debt_to_income < 0.3:
            debt_stress = debt_to_income
        elif debt_to_income < 0.5:
            debt_stress = 0.3 + (debt_to_income - 0.3) * 2
        else:
            debt_stress = min(1.0, 0.7 + (debt_to_income - 0.5) * 0.6)
        
        # Liquidity stress from expense coverage
        liquidity_stress = max(0, 1 - expense_coverage_ratio)
        
        # Emergency fund stress
        if months_emergency_fund >= 6:
            emergency_stress = 0.0
        elif months_emergency_fund >= 3:
            emergency_stress = 0.3 * (1 - (months_emergency_fund - 3) / 3)
        else:
            emergency_stress = 0.3 + 0.7 * (1 - months_emergency_fund / 3)
        
        # Income uncertainty stress
        uncertainty_stress = min(1.0, income_volatility * 2)
        
        # Social stress (simplified - could be enhanced with peer data)
        social_stress = 0.3  # Baseline social pressure
        
        return cls(
            debt_stress=debt_stress,
            liquidity_stress=liquidity_stress,
            uncertainty_stress=uncertainty_stress,
            emergency_stress=emergency_stress,
            social_stress=social_stress
        )


@dataclass
class DecisionContext:
    """
    Context in which financial decision is made.
    Affects which biases are most relevant.
    """
    decision_type: str  # 'spending', 'saving', 'investing', 'borrowing'
    time_pressure: float = 0.5  # 0-1, urgency of decision
    information_completeness: float = 0.5  # 0-1, how much info available
    social_influence: float = 0.5  # 0-1, peer pressure level
    emotional_state: str = 'neutral'  # 'positive', 'neutral', 'negative'
    recent_outcomes: List[str] = field(default_factory=list)  # Recent wins/losses
    
    def get_decision_quality_multiplier(self) -> float:
        """
        Calculate how context affects decision quality.
        """
        multiplier = 1.0
        
        # Time pressure degrades decisions
        if self.time_pressure > 0.7:
            multiplier *= 0.7
        elif self.time_pressure > 0.5:
            multiplier *= 0.85
        
        # Information completeness
        if self.information_completeness < 0.3:
            multiplier *= 0.6
        elif self.information_completeness < 0.5:
            multiplier *= 0.8
        
        # Emotional state effects
        emotional_multipliers = {
            'positive': 1.1,  # Slight overconfidence
            'neutral': 1.0,
            'negative': 0.8,  # Poor decisions when sad/angry
            'anxious': 0.7,
            'euphoric': 0.6  # Very poor decisions when overexcited
        }
        multiplier *= emotional_multipliers.get(self.emotional_state, 1.0)
        
        # Recent outcomes create momentum effects
        recent_wins = self.recent_outcomes.count('win')
        recent_losses = self.recent_outcomes.count('loss')
        
        if recent_wins > recent_losses + 2:
            multiplier *= 0.9  # Overconfidence from winning streak
        elif recent_losses > recent_wins + 2:
            multiplier *= 0.85  # Risk aversion from losses
        
        return multiplier


@dataclass
class BehavioralProfile:
    """
    Complete behavioral profile of an individual.
    Combines personality, biases, and decision patterns.
    """
    # Core personality traits
    risk_tolerance: float = 0.5  # 0-1 scale
    financial_literacy: float = 0.5  # 0-1 scale
    self_control: float = 0.5  # 0-1 scale
    future_orientation: float = 0.5  # 0-1 scale
    
    # Cognitive bias susceptibilities
    loss_aversion_strength: float = 2.1  # Typical 2-2.5x
    present_bias_beta: float = 0.7  # Typical 0.6-0.8
    optimism_bias: float = 0.3  # 0-1, tendency to be optimistic
    anchoring_susceptibility: float = 0.5  # 0-1 scale
    
    # Behavioral patterns
    spending_personality: str = 'balanced'  # 'saver', 'spender', 'balanced'
    debt_attitude: str = 'cautious'  # 'comfortable', 'cautious', 'averse'
    investment_style: str = 'moderate'  # 'conservative', 'moderate', 'aggressive'
    
    # Social factors
    peer_influence_susceptibility: float = 0.5  # 0-1 scale
    status_consciousness: float = 0.5  # 0-1 scale
    
    def adjust_for_demographic(self, demographic: str) -> None:
        """
        Adjust profile based on demographic research.
        """
        demographic_adjustments = {
            'genz': {
                'financial_literacy': 0.4,
                'future_orientation': 0.4,
                'present_bias_beta': 0.6,
                'peer_influence_susceptibility': 0.7,
                'investment_style': 'aggressive'
            },
            'millennial': {
                'financial_literacy': 0.5,
                'future_orientation': 0.5,
                'present_bias_beta': 0.7,
                'debt_attitude': 'comfortable',
                'status_consciousness': 0.6
            },
            'midcareer': {
                'financial_literacy': 0.6,
                'future_orientation': 0.6,
                'self_control': 0.6,
                'investment_style': 'moderate',
                'spending_personality': 'balanced'
            },
            'senior': {
                'financial_literacy': 0.7,
                'future_orientation': 0.5,  # Shorter horizon
                'risk_tolerance': 0.3,
                'investment_style': 'conservative',
                'loss_aversion_strength': 2.5
            }
        }
        
        if demographic in demographic_adjustments:
            adjustments = demographic_adjustments[demographic]
            for key, value in adjustments.items():
                if hasattr(self, key):
                    setattr(self, key, value)
    
    def calculate_decision_effectiveness(
        self,
        stress_level: StressLevel,
        decision_context: DecisionContext
    ) -> float:
        """
        Calculate how effectively this profile makes decisions.
        
        Returns:
            Effectiveness score 0-1 (1 = optimal decisions)
        """
        # Base effectiveness from financial literacy and self-control
        base_effectiveness = (self.financial_literacy * 0.4 + 
                            self.self_control * 0.3 +
                            self.future_orientation * 0.3)
        
        # Stress impact
        stress_multipliers = {
            StressLevel.MINIMAL: 1.0,
            StressLevel.LOW: 0.95,
            StressLevel.MODERATE: 0.85,
            StressLevel.HIGH: 0.70,
            StressLevel.EXTREME: 0.50
        }
        
        effectiveness = base_effectiveness * stress_multipliers[stress_level]
        
        # Context adjustment
        effectiveness *= decision_context.get_decision_quality_multiplier()
        
        # Bias impacts
        bias_penalty = (
            (self.loss_aversion_strength - 1) * 0.05 +  # Excess loss aversion
            (1 - self.present_bias_beta) * 0.1 +  # Present bias
            self.optimism_bias * 0.05 +  # Overoptimism
            self.anchoring_susceptibility * 0.05  # Anchoring
        )
        
        effectiveness *= (1 - bias_penalty)
        
        return max(0.1, min(1.0, effectiveness))


class AdaptiveBehaviorModel:
    """
    Models how behavior adapts over time based on experiences.
    People learn from mistakes and successes.
    """
    
    def __init__(self, initial_profile: BehavioralProfile):
        self.profile = initial_profile
        self.experience_history = []
        self.learning_rate = 0.1  # How quickly behavior changes
        
    def record_experience(
        self,
        decision_type: str,
        outcome: str,  # 'positive', 'negative', 'neutral'
        magnitude: float = 1.0  # Impact strength
    ) -> None:
        """
        Record an experience and update behavior.
        """
        self.experience_history.append({
            'type': decision_type,
            'outcome': outcome,
            'magnitude': magnitude
        })
        
        # Update profile based on experience
        self._update_from_experience(decision_type, outcome, magnitude)
    
    def _update_from_experience(
        self,
        decision_type: str,
        outcome: str,
        magnitude: float
    ) -> None:
        """
        Update behavioral profile based on experience.
        """
        adjustment = self.learning_rate * magnitude
        
        if decision_type == 'investment':
            if outcome == 'positive':
                # Success increases risk tolerance
                self.profile.risk_tolerance = min(1.0, 
                    self.profile.risk_tolerance + adjustment * 0.5)
                self.profile.optimism_bias = min(1.0,
                    self.profile.optimism_bias + adjustment * 0.3)
            elif outcome == 'negative':
                # Losses decrease risk tolerance more than gains increase it
                self.profile.risk_tolerance = max(0.0,
                    self.profile.risk_tolerance - adjustment * 0.7)
                self.profile.loss_aversion_strength = min(3.0,
                    self.profile.loss_aversion_strength + adjustment * 0.2)
        
        elif decision_type == 'saving':
            if outcome == 'positive':
                # Successful saving reinforces behavior
                self.profile.self_control = min(1.0,
                    self.profile.self_control + adjustment * 0.3)
                self.profile.future_orientation = min(1.0,
                    self.profile.future_orientation + adjustment * 0.2)
            elif outcome == 'negative':
                # Failed saving attempts may reduce future attempts
                self.profile.present_bias_beta = max(0.4,
                    self.profile.present_bias_beta - adjustment * 0.1)
        
        elif decision_type == 'debt':
            if outcome == 'negative':
                # Bad debt experience increases caution
                if self.profile.debt_attitude == 'comfortable':
                    self.profile.debt_attitude = 'cautious'
                elif self.profile.debt_attitude == 'cautious':
                    self.profile.debt_attitude = 'averse'
                
                self.profile.financial_literacy = min(1.0,
                    self.profile.financial_literacy + adjustment * 0.1)
    
    def predict_behavior_change(
        self,
        months_ahead: int
    ) -> BehavioralProfile:
        """
        Predict how behavior will evolve over time.
        """
        # Clone current profile
        future_profile = BehavioralProfile(
            risk_tolerance=self.profile.risk_tolerance,
            financial_literacy=self.profile.financial_literacy,
            self_control=self.profile.self_control,
            future_orientation=self.profile.future_orientation,
            loss_aversion_strength=self.profile.loss_aversion_strength,
            present_bias_beta=self.profile.present_bias_beta,
            optimism_bias=self.profile.optimism_bias,
            anchoring_susceptibility=self.profile.anchoring_susceptibility
        )
        
        # Financial literacy tends to increase over time
        future_profile.financial_literacy = min(1.0,
            future_profile.financial_literacy + months_ahead * 0.005)
        
        # Self-control may improve with age/experience
        future_profile.self_control = min(1.0,
            future_profile.self_control + months_ahead * 0.003)
        
        # Present bias may decrease (people become more future-oriented)
        future_profile.present_bias_beta = min(0.9,
            future_profile.present_bias_beta + months_ahead * 0.002)
        
        return future_profile


class BehavioralDecisionFramework:
    """
    Main framework integrating all behavioral components for decision-making.
    """
    
    def __init__(
        self,
        demographic: str,
        personality_type: str = 'balanced',
        initial_stress: float = 0.3
    ):
        """
        Initialize behavioral decision framework.
        
        Args:
            demographic: User demographic group
            personality_type: Base personality type
            initial_stress: Starting stress level
        """
        # Create behavioral profile
        self.profile = BehavioralProfile()
        self.profile.adjust_for_demographic(demographic)
        
        # Initialize stress tracking
        self.stress_score = FinancialStressScore()
        self.current_stress_level = StressLevel.LOW
        
        # Adaptive behavior model
        self.adaptive_model = AdaptiveBehaviorModel(self.profile)
        
        # Decision history
        self.decision_history = []
    
    def make_financial_decision(
        self,
        decision_type: str,
        options: List[Dict[str, Any]],
        context: DecisionContext,
        financial_metrics: Dict[str, float]
    ) -> Tuple[Any, Dict[str, Any]]:
        """
        Make a financial decision incorporating all behavioral factors.
        
        Args:
            decision_type: Type of decision being made
            options: Available options to choose from
            context: Current decision context
            financial_metrics: Current financial situation
            
        Returns:
            Tuple of (chosen_option, decision_reasoning)
        """
        # Update stress based on financial metrics
        self.stress_score = FinancialStressScore.from_financial_metrics(
            debt_to_income=financial_metrics.get('debt_to_income', 0),
            months_emergency_fund=financial_metrics.get('emergency_months', 3),
            income_volatility=financial_metrics.get('income_volatility', 0.1),
            expense_coverage_ratio=financial_metrics.get('expense_coverage', 1.0)
        )
        self.current_stress_level = self.stress_score.get_stress_level()
        
        # Calculate decision effectiveness
        effectiveness = self.profile.calculate_decision_effectiveness(
            self.current_stress_level,
            context
        )
        
        # Evaluate options with behavioral adjustments
        option_scores = []
        
        for option in options:
            # Calculate rational score
            rational_score = self._calculate_rational_score(option, financial_metrics)
            
            # Apply behavioral adjustments
            behavioral_score = self._apply_behavioral_adjustments(
                rational_score,
                option,
                decision_type,
                effectiveness
            )
            
            option_scores.append({
                'option': option,
                'rational_score': rational_score,
                'behavioral_score': behavioral_score,
                'final_score': behavioral_score
            })
        
        # Choose option with highest behavioral score (with some randomness)
        # Add noise to represent decision uncertainty
        for score_dict in option_scores:
            score_dict['final_score'] += np.random.normal(0, 0.1 * (1 - effectiveness))
        
        chosen = max(option_scores, key=lambda x: x['final_score'])
        
        # Record decision
        self.decision_history.append({
            'type': decision_type,
            'chosen': chosen['option'],
            'context': context,
            'stress_level': self.current_stress_level.value,
            'effectiveness': effectiveness
        })
        
        # Create decision reasoning
        reasoning = {
            'rational_best': max(option_scores, key=lambda x: x['rational_score'])['option'],
            'behavioral_choice': chosen['option'],
            'stress_impact': self.current_stress_level.value,
            'decision_quality': self._assess_decision_quality(effectiveness),
            'primary_biases': self._identify_active_biases(decision_type),
            'confidence': effectiveness,
            'option_analysis': option_scores
        }
        
        return chosen['option'], reasoning
    
    def _calculate_rational_score(
        self,
        option: Dict[str, Any],
        financial_metrics: Dict[str, float]
    ) -> float:
        """
        Calculate rational/optimal score for an option.
        """
        # Simplified scoring - would be more complex in practice
        score = 0.5  # Base score
        
        # ROI consideration
        if 'expected_return' in option:
            score += option['expected_return'] * 0.3
        
        # Risk consideration
        if 'risk_level' in option:
            risk_penalty = option['risk_level'] * 0.2
            score -= risk_penalty
        
        # Liquidity consideration
        if 'liquidity_impact' in option:
            score += option['liquidity_impact'] * 0.1
        
        # Debt impact
        if 'debt_reduction' in option:
            score += option['debt_reduction'] * 0.2
        
        return max(0, min(1, score))
    
    def _apply_behavioral_adjustments(
        self,
        rational_score: float,
        option: Dict[str, Any],
        decision_type: str,
        effectiveness: float
    ) -> float:
        """
        Apply behavioral biases to adjust rational score.
        """
        behavioral_score = rational_score
        
        # Loss aversion adjustment
        if option.get('potential_loss', 0) > 0:
            loss_impact = option['potential_loss'] * self.profile.loss_aversion_strength
            behavioral_score -= loss_impact * 0.1
        
        # Present bias adjustment
        if option.get('future_benefit', False):
            behavioral_score *= self.profile.present_bias_beta
        
        # Optimism bias adjustment
        if option.get('risk_level', 0) > 0:
            perceived_risk = option['risk_level'] * (1 - self.profile.optimism_bias)
            behavioral_score += (option['risk_level'] - perceived_risk) * 0.1
        
        # Social influence
        if option.get('socially_popular', False):
            behavioral_score += self.profile.peer_influence_susceptibility * 0.1
        
        # Blend rational and behavioral based on effectiveness
        final_score = (rational_score * effectiveness + 
                      behavioral_score * (1 - effectiveness))
        
        return max(0, min(1, final_score))
    
    def _assess_decision_quality(self, effectiveness: float) -> DecisionQuality:
        """
        Assess quality of decision based on effectiveness.
        """
        if effectiveness > 0.8:
            return DecisionQuality.OPTIMAL
        elif effectiveness > 0.6:
            return DecisionQuality.GOOD
        elif effectiveness > 0.4:
            return DecisionQuality.SUBOPTIMAL
        elif effectiveness > 0.2:
            return DecisionQuality.POOR
        else:
            return DecisionQuality.PANIC
    
    def _identify_active_biases(self, decision_type: str) -> List[str]:
        """
        Identify which biases are most active for this decision.
        """
        active_biases = []
        
        # Decision-type specific biases
        if decision_type == 'saving':
            if self.profile.present_bias_beta < 0.8:
                active_biases.append('present_bias')
            if self.profile.optimism_bias > 0.5:
                active_biases.append('optimism_bias')
        
        elif decision_type == 'investing':
            if self.profile.loss_aversion_strength > 2.0:
                active_biases.append('loss_aversion')
            if self.profile.optimism_bias > 0.6:
                active_biases.append('overconfidence')
            if self.profile.anchoring_susceptibility > 0.6:
                active_biases.append('anchoring')
        
        elif decision_type == 'spending':
            if self.profile.present_bias_beta < 0.7:
                active_biases.append('impulse_buying')
            if self.profile.peer_influence_susceptibility > 0.6:
                active_biases.append('social_pressure')
            if self.profile.status_consciousness > 0.6:
                active_biases.append('status_seeking')
        
        # Stress-induced biases
        if self.current_stress_level in [StressLevel.HIGH, StressLevel.EXTREME]:
            active_biases.append('stress_induced_myopia')
            active_biases.append('panic_decisions')
        
        return active_biases
    
    def simulate_behavior_evolution(
        self,
        months: int,
        monthly_experiences: List[Dict[str, Any]]
    ) -> List[BehavioralProfile]:
        """
        Simulate how behavior evolves over time with experiences.
        
        Returns:
            List of behavioral profiles over time
        """
        profile_timeline = [self.profile]
        
        for month in range(months):
            # Apply monthly experience if provided
            if month < len(monthly_experiences):
                exp = monthly_experiences[month]
                self.adaptive_model.record_experience(
                    exp['type'],
                    exp['outcome'],
                    exp.get('magnitude', 1.0)
                )
            
            # Predict next month's profile
            future_profile = self.adaptive_model.predict_behavior_change(1)
            profile_timeline.append(future_profile)
            
            # Update current profile for next iteration
            self.profile = future_profile
            self.adaptive_model.profile = future_profile
        
        return profile_timeline