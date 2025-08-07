"""
Cognitive Biases Model - Systematic deviations from rational financial decision-making.

Implements key cognitive biases from behavioral economics that affect financial decisions:
loss aversion, present bias, mental accounting, optimism bias, and more.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass


class BiasStrength(Enum):
    """Individual susceptibility to cognitive biases."""
    LOW = "low"  # More rational decision-makers
    MODERATE = "moderate"  # Average bias susceptibility
    HIGH = "high"  # Strongly affected by biases


@dataclass
class LossAversionCalculator:
    """
    Implements Kahneman & Tversky's loss aversion principle.
    People feel losses roughly 2x more strongly than equivalent gains.
    """
    loss_multiplier: float = 2.1  # Research shows 2.0-2.5x multiplier
    reference_point: float = 0  # Current wealth/status quo
    
    def calculate_utility(self, outcome: float) -> float:
        """
        Calculate perceived utility using prospect theory.
        
        Args:
            outcome: Financial outcome relative to reference point
            
        Returns:
            Subjective utility value
        """
        if outcome >= self.reference_point:
            # Gains - diminishing marginal utility
            return np.power(outcome - self.reference_point, 0.88)
        else:
            # Losses - amplified negative utility
            return -self.loss_multiplier * np.power(self.reference_point - outcome, 0.88)
    
    def adjust_risk_decision(
        self,
        potential_gain: float,
        potential_loss: float,
        probability_gain: float
    ) -> Dict[str, Any]:
        """
        Adjust risk decision based on loss aversion.
        
        Returns:
            Dictionary with decision metrics
        """
        # Expected value (rational)
        expected_value = (probability_gain * potential_gain + 
                         (1 - probability_gain) * (-potential_loss))
        
        # Subjective expected utility (with loss aversion)
        gain_utility = self.calculate_utility(potential_gain)
        loss_utility = self.calculate_utility(-potential_loss)
        subjective_expected_utility = (probability_gain * gain_utility + 
                                      (1 - probability_gain) * loss_utility)
        
        # Decision threshold shifts due to loss aversion
        # Need higher probability of gain to accept risk
        rational_threshold = 0.5
        loss_averse_threshold = potential_loss / (potential_gain + potential_loss)
        
        # Actual decision
        will_take_risk = probability_gain > loss_averse_threshold
        
        return {
            'expected_value': expected_value,
            'subjective_utility': subjective_expected_utility,
            'rational_decision': expected_value > 0,
            'actual_decision': will_take_risk,
            'required_probability': loss_averse_threshold,
            'decision_bias': loss_averse_threshold - rational_threshold
        }
    
    def emergency_fund_target_adjustment(self, base_target_months: int) -> int:
        """
        Adjust emergency fund target based on loss aversion.
        
        Loss-averse individuals want larger buffers.
        """
        # Loss aversion increases desired safety buffer
        adjustment_factor = 1 + (self.loss_multiplier - 1) * 0.3
        
        return int(base_target_months * adjustment_factor)


@dataclass
class PresentBiasAdjuster:
    """
    Models hyperbolic discounting - overweighting immediate vs future outcomes.
    People discount future exponentially in theory but hyperbolically in practice.
    """
    beta: float = 0.7  # Present bias parameter (0.7 typical from research)
    delta: float = 0.96  # Standard discount factor (monthly)
    
    def calculate_perceived_value(
        self,
        amount: float,
        months_in_future: int
    ) -> float:
        """
        Calculate perceived present value with hyperbolic discounting.
        
        Quasi-hyperbolic: V = β * δ^t * Amount for t > 0
        """
        if months_in_future == 0:
            return amount
        else:
            # Present bias makes first period special
            return self.beta * (self.delta ** months_in_future) * amount
    
    def adjust_savings_decision(
        self,
        monthly_income: float,
        immediate_want_cost: float,
        future_need_cost: float,
        months_until_need: int
    ) -> Dict[str, Any]:
        """
        Model savings vs spending decision with present bias.
        """
        # Rational comparison
        rational_future_value = future_need_cost * (self.delta ** months_until_need)
        rational_choice = 'save' if rational_future_value > immediate_want_cost else 'spend'
        
        # Present-biased comparison
        biased_future_value = self.calculate_perceived_value(future_need_cost, months_until_need)
        biased_choice = 'save' if biased_future_value > immediate_want_cost else 'spend'
        
        # Calculate how much present bias affects decision
        bias_impact = (rational_future_value - biased_future_value) / rational_future_value
        
        # Actual amount saved (reduced by present bias)
        optimal_savings = monthly_income * 0.20  # 20% rule
        actual_savings = optimal_savings * self.beta  # Reduced by present bias
        
        return {
            'rational_choice': rational_choice,
            'actual_choice': biased_choice,
            'optimal_savings_rate': 0.20,
            'actual_savings_rate': actual_savings / monthly_income,
            'present_bias_impact': bias_impact,
            'procrastination_likelihood': 1 - self.beta  # Higher beta = less procrastination
        }
    
    def retirement_contribution_adjustment(
        self,
        suggested_rate: float,
        age: int
    ) -> float:
        """
        Adjust retirement contribution rate based on present bias.
        
        Younger people with present bias save much less.
        """
        # Years to retirement
        years_to_retirement = max(0, 65 - age)
        
        # Present bias stronger for distant future
        if years_to_retirement > 30:
            bias_factor = self.beta * 0.7  # Strong reduction
        elif years_to_retirement > 15:
            bias_factor = self.beta * 0.85
        else:
            bias_factor = self.beta * 1.1  # Panic saving near retirement
        
        return suggested_rate * bias_factor


class MentalAccountingModel:
    """
    People treat money differently based on source and intended use.
    Violates fungibility - a dollar is a dollar regardless of source.
    """
    
    def __init__(self):
        # Different mental accounts and their properties
        self.accounts = {
            'salary': {'spending_propensity': 0.7, 'savings_propensity': 0.3},
            'bonus': {'spending_propensity': 0.9, 'savings_propensity': 0.1},
            'tax_refund': {'spending_propensity': 0.85, 'savings_propensity': 0.15},
            'gift': {'spending_propensity': 0.95, 'savings_propensity': 0.05},
            'investment_gains': {'spending_propensity': 0.4, 'savings_propensity': 0.6},
            'lottery': {'spending_propensity': 0.98, 'savings_propensity': 0.02},
            'side_hustle': {'spending_propensity': 0.6, 'savings_propensity': 0.4},
        }
        
        # Spending categories and mental budgets
        self.spending_buckets = {
            'necessities': {'rigid': True, 'fungible': False},
            'entertainment': {'rigid': False, 'fungible': False},
            'savings': {'rigid': True, 'fungible': False},
            'emergency': {'rigid': True, 'fungible': True},  # Only emergency is fungible
        }
    
    def allocate_windfall(
        self,
        amount: float,
        source: str,
        current_debt: float = 0,
        emergency_fund_gap: float = 0
    ) -> Dict[str, float]:
        """
        Allocate windfall based on mental accounting (not optimal allocation).
        """
        account = self.accounts.get(source, self.accounts['salary'])
        
        # Rational allocation would prioritize high-interest debt
        rational_allocation = {}
        remaining = amount
        
        if current_debt > 0:
            debt_payment = min(remaining, current_debt)
            rational_allocation['debt'] = debt_payment
            remaining -= debt_payment
        
        if emergency_fund_gap > 0 and remaining > 0:
            emergency_payment = min(remaining, emergency_fund_gap)
            rational_allocation['emergency'] = emergency_payment
            remaining -= emergency_payment
        
        rational_allocation['savings'] = remaining * 0.8
        rational_allocation['spending'] = remaining * 0.2
        
        # Mental accounting allocation (behavioral)
        behavioral_allocation = {
            'debt': amount * 0.1,  # People underallocate to debt
            'emergency': amount * 0.05,  # Emergency seems less urgent
            'savings': amount * account['savings_propensity'],
            'spending': amount * account['spending_propensity'],
        }
        
        # Adjust for source-specific behavior
        if source in ['bonus', 'tax_refund', 'lottery']:
            # "Found money" often completely spent
            behavioral_allocation['spending'] = amount * 0.7
            behavioral_allocation['fun_purchases'] = amount * 0.2
            behavioral_allocation['savings'] = amount * 0.1
            behavioral_allocation['debt'] = 0
        
        return {
            'rational': rational_allocation,
            'behavioral': behavioral_allocation,
            'misallocation_cost': self._calculate_misallocation_cost(
                rational_allocation, behavioral_allocation, current_debt
            )
        }
    
    def _calculate_misallocation_cost(
        self,
        rational: Dict[str, float],
        behavioral: Dict[str, float],
        debt_interest_rate: float = 0.18
    ) -> float:
        """Calculate opportunity cost of mental accounting."""
        # Cost of not paying debt
        debt_difference = rational.get('debt', 0) - behavioral.get('debt', 0)
        annual_cost = debt_difference * debt_interest_rate
        
        # Cost of not building emergency fund (estimated)
        emergency_difference = rational.get('emergency', 0) - behavioral.get('emergency', 0)
        emergency_cost = emergency_difference * 0.05  # Opportunity cost
        
        return annual_cost + emergency_cost


class OptimismBiasCorrector:
    """
    People systematically overestimate good outcomes and underestimate bad ones.
    Affects financial planning, insurance decisions, and risk assessment.
    """
    
    def __init__(self, bias_level: BiasStrength = BiasStrength.MODERATE):
        # Bias multipliers based on research
        self.bias_multipliers = {
            BiasStrength.LOW: {'good': 1.1, 'bad': 0.95},
            BiasStrength.MODERATE: {'good': 1.3, 'bad': 0.8},
            BiasStrength.HIGH: {'good': 1.6, 'bad': 0.6},
        }
        self.bias_level = bias_level
    
    def adjust_probability_estimate(
        self,
        true_probability: float,
        outcome_type: str  # 'positive' or 'negative'
    ) -> float:
        """
        Adjust probability estimates based on optimism bias.
        """
        multipliers = self.bias_multipliers[self.bias_level]
        
        if outcome_type == 'positive':
            # Overestimate good outcomes
            perceived = true_probability * multipliers['good']
        else:
            # Underestimate bad outcomes
            perceived = true_probability * multipliers['bad']
        
        # Bound between 0 and 1
        return max(0.0, min(1.0, perceived))
    
    def adjust_financial_projections(
        self,
        income_growth: float,
        expense_growth: float,
        emergency_probability: float,
        investment_return: float
    ) -> Dict[str, float]:
        """
        Adjust financial projections for optimism bias.
        """
        return {
            'perceived_income_growth': self.adjust_probability_estimate(income_growth, 'positive'),
            'perceived_expense_growth': self.adjust_probability_estimate(expense_growth, 'negative'),
            'perceived_emergency_risk': self.adjust_probability_estimate(emergency_probability, 'negative'),
            'perceived_investment_return': investment_return * self.bias_multipliers[self.bias_level]['good'],
            'actual_income_growth': income_growth,
            'actual_expense_growth': expense_growth,
            'actual_emergency_risk': emergency_probability,
            'actual_investment_return': investment_return,
        }
    
    def insurance_purchase_decision(
        self,
        risk_probability: float,
        potential_loss: float,
        insurance_cost: float
    ) -> Tuple[bool, str]:
        """
        Model insurance purchase decision with optimism bias.
        """
        # Rational decision
        expected_loss = risk_probability * potential_loss
        rational_purchase = expected_loss > insurance_cost
        
        # Biased decision
        perceived_risk = self.adjust_probability_estimate(risk_probability, 'negative')
        perceived_loss = expected_loss = perceived_risk * potential_loss
        biased_purchase = perceived_loss > insurance_cost
        
        if biased_purchase:
            reason = "perceived_risk_high_enough"
        else:
            reason = "optimism_bias_reduced_perceived_risk"
        
        return biased_purchase, reason


class AnchoringEffect:
    """
    People rely too heavily on first piece of information (anchor).
    Affects salary negotiations, price perceptions, and financial goals.
    """
    
    def __init__(self, susceptibility: float = 0.5):
        """
        Args:
            susceptibility: 0-1, how much person is affected by anchors
        """
        self.susceptibility = susceptibility
    
    def adjust_estimate(
        self,
        anchor: float,
        true_value: float,
        adjustment_direction: str = 'up'
    ) -> float:
        """
        Calculate adjusted estimate based on anchoring.
        
        People insufficiently adjust from anchors.
        """
        # Calculate ideal adjustment
        ideal_adjustment = true_value - anchor
        
        # Insufficient adjustment based on susceptibility
        # High susceptibility = less adjustment from anchor
        adjustment_factor = 1 - self.susceptibility
        actual_adjustment = ideal_adjustment * adjustment_factor
        
        return anchor + actual_adjustment
    
    def salary_negotiation(
        self,
        initial_offer: float,
        market_rate: float,
        experience_level: str = 'mid'
    ) -> Dict[str, float]:
        """
        Model salary negotiation with anchoring on initial offer.
        """
        # Experience affects ability to overcome anchor
        experience_factors = {
            'entry': 0.7,  # More susceptible
            'mid': 0.5,
            'senior': 0.3,  # Less susceptible
        }
        
        adjusted_susceptibility = self.susceptibility * experience_factors.get(experience_level, 0.5)
        
        # What they should ask for
        optimal_ask = market_rate * 1.1  # Ask 10% above market
        
        # What they actually ask for (anchored to initial offer)
        actual_ask = initial_offer + (optimal_ask - initial_offer) * (1 - adjusted_susceptibility)
        
        # Likelihood of accepting first offer
        acceptance_probability = adjusted_susceptibility
        
        return {
            'initial_offer': initial_offer,
            'market_rate': market_rate,
            'optimal_counteroffer': optimal_ask,
            'actual_counteroffer': actual_ask,
            'money_left_on_table': optimal_ask - actual_ask,
            'accepts_first_offer_probability': acceptance_probability
        }


class FramingEffectModel:
    """
    Decisions change based on how information is presented.
    Same information framed as gain vs loss leads to different choices.
    """
    
    def __init__(self):
        self.gain_frame_preference = 0.7  # Prefer certain gains
        self.loss_frame_risk_seeking = 0.7  # Risk-seeking for losses
    
    def investment_decision(
        self,
        option_a: Dict[str, Any],  # Safe option
        option_b: Dict[str, Any],  # Risky option
        frame: str  # 'gain' or 'loss'
    ) -> str:
        """
        Choose between investment options based on framing.
        
        Example:
        - Gain frame: "70% chance to win $1000" vs "Sure $700"
        - Loss frame: "70% chance to lose nothing" vs "Sure loss of $300"
        """
        if frame == 'gain':
            # Risk-averse for gains - prefer sure thing
            if option_a['guaranteed']:
                choice_probability_a = self.gain_frame_preference
            else:
                choice_probability_a = 1 - self.gain_frame_preference
        else:  # loss frame
            # Risk-seeking for losses - prefer gamble
            if option_a['guaranteed']:
                choice_probability_a = 1 - self.loss_frame_risk_seeking
            else:
                choice_probability_a = self.loss_frame_risk_seeking
        
        return 'option_a' if np.random.random() < choice_probability_a else 'option_b'


class CognitiveBiasModel:
    """
    Integrated model of all cognitive biases affecting financial decisions.
    """
    
    def __init__(
        self,
        loss_aversion_strength: float = 2.1,
        present_bias_beta: float = 0.7,
        optimism_level: BiasStrength = BiasStrength.MODERATE,
        anchoring_susceptibility: float = 0.5
    ):
        """
        Initialize integrated cognitive bias model.
        """
        self.loss_aversion = LossAversionCalculator(loss_multiplier=loss_aversion_strength)
        self.present_bias = PresentBiasAdjuster(beta=present_bias_beta)
        self.mental_accounting = MentalAccountingModel()
        self.optimism_bias = OptimismBiasCorrector(optimism_level)
        self.anchoring = AnchoringEffect(anchoring_susceptibility)
        self.framing = FramingEffectModel()
    
    def apply_all_biases(
        self,
        decision_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Apply all relevant cognitive biases to a financial decision.
        
        Args:
            decision_context: Dictionary with decision parameters
            
        Returns:
            Adjusted decision with all biases applied
        """
        result = {'original': decision_context.copy()}
        
        # Apply loss aversion to risk decisions
        if 'potential_gain' in decision_context and 'potential_loss' in decision_context:
            loss_aversion_adjustment = self.loss_aversion.adjust_risk_decision(
                decision_context['potential_gain'],
                decision_context['potential_loss'],
                decision_context.get('probability_gain', 0.5)
            )
            result['loss_aversion'] = loss_aversion_adjustment
        
        # Apply present bias to savings decisions
        if 'monthly_income' in decision_context:
            present_bias_adjustment = self.present_bias.adjust_savings_decision(
                decision_context['monthly_income'],
                decision_context.get('immediate_want', 100),
                decision_context.get('future_need', 500),
                decision_context.get('months_until_need', 6)
            )
            result['present_bias'] = present_bias_adjustment
        
        # Apply mental accounting to windfalls
        if 'windfall_amount' in decision_context:
            mental_accounting_adjustment = self.mental_accounting.allocate_windfall(
                decision_context['windfall_amount'],
                decision_context.get('windfall_source', 'bonus'),
                decision_context.get('current_debt', 0),
                decision_context.get('emergency_fund_gap', 0)
            )
            result['mental_accounting'] = mental_accounting_adjustment
        
        # Apply optimism bias to projections
        if 'income_growth' in decision_context:
            optimism_adjustment = self.optimism_bias.adjust_financial_projections(
                decision_context.get('income_growth', 0.03),
                decision_context.get('expense_growth', 0.02),
                decision_context.get('emergency_probability', 0.1),
                decision_context.get('investment_return', 0.07)
            )
            result['optimism_bias'] = optimism_adjustment
        
        # Apply anchoring to negotiations
        if 'initial_offer' in decision_context:
            anchoring_adjustment = self.anchoring.salary_negotiation(
                decision_context['initial_offer'],
                decision_context.get('market_rate', decision_context['initial_offer'] * 1.1),
                decision_context.get('experience_level', 'mid')
            )
            result['anchoring'] = anchoring_adjustment
        
        return result
    
    def calculate_behavioral_adjustment_factor(
        self,
        scenario: str,
        demographic: str
    ) -> float:
        """
        Calculate overall behavioral adjustment factor for Monte Carlo simulations.
        
        Returns:
            Multiplier to apply to rational calculations
        """
        # Base adjustments by scenario
        scenario_adjustments = {
            'emergency_fund': 0.85,  # People undersave
            'retirement': 0.70,  # Strong present bias
            'debt_payment': 0.90,  # Some procrastination
            'investment': 1.15,  # Overconfidence
        }
        
        # Demographic adjustments
        demographic_adjustments = {
            'genz': 0.85,  # Less experience, more biases
            'millennial': 0.90,
            'midcareer': 0.95,
            'senior': 1.0,  # More experience, fewer biases
        }
        
        base = scenario_adjustments.get(scenario, 1.0)
        demo_adj = demographic_adjustments.get(demographic, 1.0)
        
        # Combine adjustments
        return base * demo_adj