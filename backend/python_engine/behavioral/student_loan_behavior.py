"""
Student Loan Behavioral Model - How people actually manage student loan debt.

Based on behavioral research showing decision patterns around repayment plans,
forbearance usage, refinancing delays, and forgiveness program participation.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass


class RepaymentBehavior(Enum):
    """Common behavioral patterns in loan repayment."""
    MINIMUM_PAYER = "minimum_payer"  # Only pays minimum required
    AGGRESSIVE_PAYER = "aggressive_payer"  # Tries to pay off quickly
    STRATEGIC_FORGIVER = "strategic_forgiver"  # Optimizing for forgiveness
    INCONSISTENT_PAYER = "inconsistent_payer"  # Erratic payment patterns
    AVALANCHE_METHOD = "avalanche_method"  # Pays highest rate first
    SNOWBALL_METHOD = "snowball_method"  # Pays smallest balance first


class CareerImpact(Enum):
    """How student loans impact career decisions."""
    NO_IMPACT = "no_impact"
    DELAYED_ENTREPRENEURSHIP = "delayed_entrepreneurship"
    PUBLIC_SERVICE_CHOICE = "public_service_choice"  # For PSLF
    HIGH_INCOME_PURSUIT = "high_income_pursuit"  # Chasing salary
    GRADUATE_SCHOOL_DELAYED = "graduate_school_delayed"


@dataclass
class RepaymentPsychology:
    """
    Models psychological factors in repayment decisions.
    Based on research on debt psychology and financial behavior.
    """
    debt_shame_level: float = 0.5  # 0-1, affects transparency and help-seeking
    financial_literacy: float = 0.5  # 0-1, understanding of options
    future_orientation: float = 0.5  # 0-1, long-term vs short-term thinking
    risk_tolerance: float = 0.5  # 0-1, willingness to take financial risks
    
    def calculate_plan_preference_score(
        self,
        plan_type: str,
        debt_to_income: float,
        years_since_graduation: int
    ) -> float:
        """
        Calculate preference score for a repayment plan based on psychology.
        
        Returns score 0-1, higher means more likely to choose.
        """
        scores = {}
        
        # Standard repayment
        scores['standard'] = (
            0.5 +  # Base preference
            (self.financial_literacy * 0.2) +  # Understood by literate
            (self.future_orientation * 0.3) -  # Future-oriented like it
            (self.debt_shame_level * 0.1)  # Shame makes people avoid standard
        )
        
        # Income-driven repayment (IBR/PAYE/REPAYE)
        scores['income_driven'] = (
            0.3 +  # Lower base (complexity)
            (debt_to_income * 0.3) +  # More attractive with high DTI
            ((1 - self.future_orientation) * 0.2) +  # Short-term thinkers
            (self.risk_tolerance * 0.2)  # Risk-takers like flexibility
        )
        
        # Aggressive payoff
        scores['aggressive'] = (
            0.2 +  # Low base (requires discipline)
            (self.future_orientation * 0.4) +  # Future-oriented love it
            (self.financial_literacy * 0.3) +  # Literate understand benefits
            ((1 - self.debt_shame_level) * 0.1)  # Less shame = more aggressive
        )
        
        # Refinancing
        scores['refinance'] = (
            0.1 +  # Very low base (requires action)
            (self.financial_literacy * 0.5) +  # Requires understanding
            (self.risk_tolerance * 0.2) +  # Some risk in losing federal benefits
            (max(0, years_since_graduation - 2) * 0.05)  # More likely over time
        )
        
        return min(1.0, max(0.0, scores.get(plan_type, 0.5)))


class ForbearanceDecisionTree:
    """
    Models decision-making around forbearance and deferment.
    Based on research showing when and why borrowers pause payments.
    """
    
    # Triggers for considering forbearance (threshold values)
    FORBEARANCE_TRIGGERS = {
        'income_drop': 0.25,  # 25% income reduction
        'expense_spike': 0.30,  # 30% expense increase
        'emergency_fund_depleted': 0.5,  # Less than 0.5 months expenses
        'stress_level': 0.7,  # High financial stress
        'months_behind': 2,  # Already 2+ months behind
    }
    
    # Behavioral factors affecting forbearance use
    BEHAVIORAL_MODIFIERS = {
        'shame_barrier': 0.3,  # Reduces likelihood due to shame
        'knowledge_gap': 0.4,  # Don't know it's available
        'future_cost_awareness': -0.2,  # Understanding interest capitalization
        'immediate_relief_bias': 0.5,  # Overweight immediate benefit
    }
    
    def __init__(self, borrower_psychology: RepaymentPsychology):
        self.psychology = borrower_psychology
        self.forbearance_months_used = 0
        self.lifetime_limit = 36  # Federal limit
    
    def should_use_forbearance(
        self,
        financial_stress_score: float,
        months_since_graduation: int,
        current_payment: float,
        available_income: float,
        emergency_fund_months: float
    ) -> Tuple[bool, str]:
        """
        Determine if borrower will use forbearance.
        
        Returns:
            Tuple of (should_forbear, reason)
        """
        # Check if already at limit
        if self.forbearance_months_used >= self.lifetime_limit:
            return False, "lifetime_limit_reached"
        
        # Calculate trigger scores
        triggers = {
            'payment_burden': current_payment / available_income if available_income > 0 else 2.0,
            'emergency_depletion': emergency_fund_months < 1.0,
            'high_stress': financial_stress_score > 0.7,
            'recent_graduate': months_since_graduation < 12,
        }
        
        # Base probability from triggers
        base_probability = 0.0
        
        if triggers['payment_burden'] > 0.3:
            base_probability += 0.4
        if triggers['emergency_depletion']:
            base_probability += 0.3
        if triggers['high_stress']:
            base_probability += 0.2
        if triggers['recent_graduate']:
            base_probability += 0.1
        
        # Apply behavioral modifiers
        
        # Shame reduces forbearance use
        base_probability *= (1 - self.psychology.debt_shame_level * 0.3)
        
        # Financial literacy affects awareness and use
        if self.psychology.financial_literacy < 0.3:
            base_probability *= 0.5  # Don't know about option
        elif self.psychology.financial_literacy > 0.7:
            base_probability *= 0.8  # Understand long-term costs
        
        # Present bias increases forbearance use
        present_bias_factor = 1 - self.psychology.future_orientation
        base_probability *= (1 + present_bias_factor * 0.5)
        
        # Random decision with behavioral probability
        if np.random.random() < base_probability:
            # Determine primary reason
            if triggers['payment_burden'] > 0.5:
                reason = "payment_burden_too_high"
            elif triggers['emergency_depletion']:
                reason = "emergency_fund_depleted"
            elif triggers['high_stress']:
                reason = "financial_stress"
            else:
                reason = "temporary_hardship"
            
            return True, reason
        
        return False, "chose_to_continue_payments"
    
    def calculate_forbearance_duration(
        self,
        reason: str,
        financial_situation: Dict[str, float]
    ) -> int:
        """
        Determine how long borrower will stay in forbearance.
        
        Behavioral research shows most use 6-12 month periods.
        """
        base_durations = {
            'payment_burden_too_high': 9,
            'emergency_fund_depleted': 6,
            'financial_stress': 12,
            'temporary_hardship': 3,
        }
        
        base = base_durations.get(reason, 6)
        
        # Adjust based on psychology
        if self.psychology.future_orientation > 0.7:
            # Future-oriented use shorter periods
            duration = int(base * 0.7)
        elif self.psychology.future_orientation < 0.3:
            # Present-focused use maximum allowed
            duration = min(12, int(base * 1.5))
        else:
            duration = base
        
        # Cap at remaining allowance
        duration = min(duration, self.lifetime_limit - self.forbearance_months_used)
        
        return duration


class RefinancingBehavior:
    """
    Models refinancing decision procrastination and barriers.
    Research shows significant delays despite financial benefits.
    """
    
    # Barriers to refinancing (behavioral, not financial)
    REFINANCING_BARRIERS = {
        'inertia': 0.6,  # Status quo bias
        'complexity_aversion': 0.4,  # Avoiding complex decisions
        'federal_benefit_fear': 0.5,  # Overestimate value of federal protections
        'credit_score_shame': 0.3,  # Assume won't qualify
        'information_overload': 0.4,  # Too many options
    }
    
    def __init__(self, psychology: RepaymentPsychology):
        self.psychology = psychology
        self.times_considered = 0
        self.times_applied = 0
    
    def will_refinance(
        self,
        current_rate: float,
        market_rate: float,
        credit_score: int,
        years_since_graduation: int,
        federal_loan: bool = True
    ) -> Tuple[bool, str]:
        """
        Determine if borrower will actually refinance.
        
        Even with clear financial benefit, behavioral factors create delays.
        """
        # Calculate objective benefit
        rate_savings = current_rate - market_rate
        
        # Need significant savings to overcome inertia
        if rate_savings < 0.01:  # Less than 1% savings
            return False, "insufficient_benefit"
        
        # Credit score threshold (with behavioral twist)
        perceived_minimum = 700  # People think they need higher than reality
        actual_minimum = 650
        
        if credit_score < actual_minimum:
            return False, "credit_score_too_low"
        
        # Base probability from objective factors
        base_probability = min(0.8, rate_savings * 10)  # Max 80% even with great rates
        
        # Apply behavioral barriers
        
        # Inertia - gets stronger over time paradoxically
        if years_since_graduation < 2:
            inertia_factor = 0.3  # New grads don't think about it
        elif years_since_graduation < 5:
            inertia_factor = 0.5  # Peak refinancing window
        else:
            inertia_factor = 0.7  # Settled into routine
        
        base_probability *= (1 - inertia_factor)
        
        # Financial literacy strongly affects refinancing
        if self.psychology.financial_literacy < 0.4:
            base_probability *= 0.3  # Don't understand benefits
        elif self.psychology.financial_literacy > 0.7:
            base_probability *= 1.5  # Actively seek opportunities
        
        # Federal loan protection bias
        if federal_loan:
            protection_bias = 0.5 * (1 - self.psychology.risk_tolerance)
            base_probability *= (1 - protection_bias)
        
        # Credit score confidence
        if credit_score < perceived_minimum:
            shame_factor = self.psychology.debt_shame_level * 0.5
            base_probability *= (1 - shame_factor)
        
        # Complexity aversion
        complexity_penalty = 0.3 * (1 - self.psychology.financial_literacy)
        base_probability *= (1 - complexity_penalty)
        
        # Increase probability each time considered (momentum)
        base_probability *= (1 + self.times_considered * 0.1)
        
        # Make decision
        if np.random.random() < base_probability:
            self.times_applied += 1
            return True, "refinanced_for_better_rate"
        else:
            self.times_considered += 1
            # Determine primary barrier
            if inertia_factor > 0.5:
                reason = "procrastination"
            elif federal_loan and not self.psychology.risk_tolerance > 0.6:
                reason = "keeping_federal_protections"
            elif self.psychology.financial_literacy < 0.4:
                reason = "too_complex"
            else:
                reason = "waiting_for_better_rates"
            
            return False, reason


class ForgivenessCommitment:
    """
    Models Public Service Loan Forgiveness (PSLF) and other forgiveness programs.
    Career decisions and 10-year commitment psychology.
    """
    
    def __init__(self, psychology: RepaymentPsychology):
        self.psychology = psychology
        self.years_in_program = 0
        self.commitment_strength = 0.5
        self.career_satisfaction = 0.5
    
    def will_pursue_pslf(
        self,
        loan_balance: float,
        annual_income: float,
        career_type: str,
        age: int
    ) -> Tuple[bool, float]:
        """
        Determine if borrower will pursue and stick with PSLF.
        
        Returns:
            Tuple of (will_pursue, commitment_probability)
        """
        # Calculate financial benefit
        debt_to_income = loan_balance / annual_income if annual_income > 0 else 10
        
        # PSLF most attractive when DTI > 1.5
        if debt_to_income < 1.0:
            financial_motivation = 0.2
        elif debt_to_income < 1.5:
            financial_motivation = 0.5
        else:
            financial_motivation = 0.8
        
        # Career alignment
        career_alignment = {
            'public': 0.9,  # Natural fit
            'non_profit': 0.8,
            'education': 0.7,
            'healthcare': 0.5,  # Some qualify
            'private': 0.1,  # Would need to switch
        }.get(career_type, 0.3)
        
        # Age factor (10-year commitment harder when older)
        if age < 30:
            age_factor = 0.9
        elif age < 40:
            age_factor = 0.6
        else:
            age_factor = 0.3
        
        # Psychology factors
        commitment_ability = (
            self.psychology.future_orientation * 0.4 +  # Need long-term thinking
            (1 - self.psychology.risk_tolerance) * 0.3 +  # Risk-averse like certainty
            self.psychology.financial_literacy * 0.3  # Need to understand program
        )
        
        # Calculate overall probability
        base_probability = (
            financial_motivation * 0.4 +
            career_alignment * 0.3 +
            age_factor * 0.15 +
            commitment_ability * 0.15
        )
        
        will_pursue = base_probability > 0.5
        
        if will_pursue:
            # Calculate commitment strength (probability of completing)
            self.commitment_strength = min(0.95, base_probability * 1.2)
        
        return will_pursue, self.commitment_strength
    
    def will_stay_committed(
        self,
        years_completed: int,
        salary_growth: float,
        private_sector_opportunity: Optional[float] = None
    ) -> Tuple[bool, str]:
        """
        Determine if borrower stays in PSLF after initial commitment.
        
        Sunk cost fallacy keeps people in after 5+ years.
        """
        self.years_in_program = years_completed
        
        # Sunk cost effect - stronger commitment over time
        if years_completed < 3:
            sunk_cost_factor = 0.1
        elif years_completed < 5:
            sunk_cost_factor = 0.3
        elif years_completed < 7:
            sunk_cost_factor = 0.6
        else:
            sunk_cost_factor = 0.9  # Very unlikely to quit near end
        
        # Career satisfaction drift
        self.career_satisfaction *= (0.95 + np.random.normal(0, 0.05))
        self.career_satisfaction = max(0.1, min(1.0, self.career_satisfaction))
        
        # Temptation from private sector
        if private_sector_opportunity:
            salary_temptation = min(0.5, private_sector_opportunity / 100000)
        else:
            salary_temptation = 0.1
        
        # Calculate stay probability
        stay_probability = (
            self.commitment_strength * 0.3 +
            sunk_cost_factor * 0.4 +
            self.career_satisfaction * 0.2 +
            (1 - salary_temptation) * 0.1
        )
        
        if np.random.random() < stay_probability:
            return True, "staying_for_forgiveness"
        else:
            if salary_temptation > 0.3:
                reason = "private_sector_opportunity"
            elif self.career_satisfaction < 0.3:
                reason = "career_dissatisfaction"
            else:
                reason = "program_complexity"
            
            return False, reason


class StudentLoanBehaviorModel:
    """
    Main behavioral model for student loan decisions.
    Integrates all behavioral components.
    """
    
    def __init__(
        self,
        financial_literacy: float = 0.5,
        debt_shame: float = 0.5,
        future_orientation: float = 0.5,
        risk_tolerance: float = 0.5
    ):
        """
        Initialize with behavioral parameters.
        
        Args:
            financial_literacy: 0-1, understanding of loan options
            debt_shame: 0-1, emotional burden of debt
            future_orientation: 0-1, long-term thinking
            risk_tolerance: 0-1, financial risk comfort
        """
        self.psychology = RepaymentPsychology(
            debt_shame_level=debt_shame,
            financial_literacy=financial_literacy,
            future_orientation=future_orientation,
            risk_tolerance=risk_tolerance
        )
        
        self.forbearance_tree = ForbearanceDecisionTree(self.psychology)
        self.refinancing = RefinancingBehavior(self.psychology)
        self.forgiveness = ForgivenessCommitment(self.psychology)
    
    def calculate_repayment_plan_preference(
        self,
        income: float,
        debt_to_income: float,
        career_type: str,
        years_since_graduation: int = 0
    ) -> str:
        """
        Determine which repayment plan borrower will choose.
        
        Not always the mathematically optimal choice!
        """
        # Calculate preference scores for each option
        plans = ['standard', 'income_driven', 'aggressive', 'refinance']
        scores = {}
        
        for plan in plans:
            scores[plan] = self.psychology.calculate_plan_preference_score(
                plan, debt_to_income, years_since_graduation
            )
        
        # Add noise to represent decision uncertainty
        for plan in scores:
            scores[plan] += np.random.normal(0, 0.1)
        
        # Career type influences PSLF consideration
        if career_type in ['public', 'non_profit', 'education']:
            will_pursue, _ = self.forgiveness.will_pursue_pslf(
                debt_to_income * income,
                income,
                career_type,
                25 + years_since_graduation  # Estimate age
            )
            if will_pursue:
                return 'income_driven'  # Required for PSLF
        
        # Choose plan with highest score
        return max(scores, key=scores.get)
    
    def model_forbearance_likelihood(
        self,
        financial_stress_score: float,
        months_since_graduation: int,
        payment_to_income_ratio: float,
        emergency_fund_months: float = 2.0
    ) -> float:
        """
        Calculate probability of using forbearance.
        
        Returns:
            Probability between 0 and 1
        """
        # Estimate current payment and available income
        # These are simplified for the model
        current_payment = payment_to_income_ratio * 3000  # Assume $3k base income
        available_income = 3000
        
        will_forbear, _ = self.forbearance_tree.should_use_forbearance(
            financial_stress_score,
            months_since_graduation,
            current_payment,
            available_income,
            emergency_fund_months
        )
        
        # Return base probability for Monte Carlo
        # In actual simulation, this would be used with random draw
        if payment_to_income_ratio > 0.2:
            base_prob = 0.3
        else:
            base_prob = 0.1
        
        # Adjust for stress
        stress_multiplier = 1 + financial_stress_score
        
        return min(1.0, base_prob * stress_multiplier)
    
    def simulate_repayment_journey(
        self,
        initial_balance: float,
        monthly_income: float,
        interest_rate: float,
        career_type: str = 'private',
        max_months: int = 360
    ) -> Dict[str, any]:
        """
        Simulate complete loan repayment journey with behavioral factors.
        
        Returns:
            Dictionary with journey details including:
            - months_to_payoff: Time to pay off loans
            - total_paid: Total amount paid
            - forbearance_periods: List of forbearance uses
            - refinance_events: List of refinancing decisions
            - plan_changes: List of repayment plan changes
        """
        current_balance = initial_balance
        months_elapsed = 0
        total_paid = 0
        forbearance_periods = []
        refinance_events = []
        plan_changes = []
        
        # Initial plan selection
        debt_to_income = initial_balance / (monthly_income * 12)
        current_plan = self.calculate_repayment_plan_preference(
            monthly_income * 12, debt_to_income, career_type, 0
        )
        plan_changes.append({'month': 0, 'plan': current_plan})
        
        # Track financial stress
        financial_stress = 0.2  # Start with low stress
        
        while current_balance > 0 and months_elapsed < max_months:
            months_elapsed += 1
            
            # Update stress based on debt burden
            payment_burden = current_balance * 0.01 / monthly_income  # Simplified
            financial_stress = min(1.0, payment_burden * 2)
            
            # Check for forbearance
            if months_elapsed % 12 == 0:  # Annual decision point
                will_forbear, reason = self.forbearance_tree.should_use_forbearance(
                    financial_stress,
                    months_elapsed,
                    current_balance * 0.01,  # Estimated payment
                    monthly_income,
                    3  # Assumed emergency fund
                )
                
                if will_forbear:
                    duration = self.forbearance_tree.calculate_forbearance_duration(
                        reason, {'stress': financial_stress}
                    )
                    forbearance_periods.append({
                        'start_month': months_elapsed,
                        'duration': duration,
                        'reason': reason
                    })
                    # Skip payments during forbearance
                    months_elapsed += duration
                    # Interest continues to accrue
                    current_balance *= (1 + interest_rate/12) ** duration
                    continue
            
            # Check for refinancing every 6 months
            if months_elapsed % 6 == 0 and months_elapsed > 12:
                will_refi, refi_reason = self.refinancing.will_refinance(
                    interest_rate,
                    interest_rate * 0.8,  # Assume 20% rate reduction available
                    700,  # Assumed credit score
                    months_elapsed // 12,
                    True
                )
                
                if will_refi:
                    old_rate = interest_rate
                    interest_rate *= 0.8
                    refinance_events.append({
                        'month': months_elapsed,
                        'old_rate': old_rate,
                        'new_rate': interest_rate,
                        'balance': current_balance
                    })
            
            # Calculate payment based on current plan
            if current_plan == 'standard':
                payment = current_balance * 0.015  # Simplified
            elif current_plan == 'income_driven':
                payment = monthly_income * 0.10  # 10% of income
            elif current_plan == 'aggressive':
                payment = monthly_income * 0.25  # 25% of income
            else:
                payment = current_balance * 0.012
            
            # Apply payment
            interest_charge = current_balance * (interest_rate / 12)
            principal_payment = max(0, payment - interest_charge)
            current_balance -= principal_payment
            total_paid += payment
            
            # Reassess plan every year
            if months_elapsed % 12 == 0:
                new_plan = self.calculate_repayment_plan_preference(
                    monthly_income * 12,
                    current_balance / (monthly_income * 12),
                    career_type,
                    months_elapsed // 12
                )
                
                if new_plan != current_plan:
                    plan_changes.append({
                        'month': months_elapsed,
                        'old_plan': current_plan,
                        'new_plan': new_plan
                    })
                    current_plan = new_plan
        
        return {
            'months_to_payoff': months_elapsed,
            'total_paid': total_paid,
            'total_interest': total_paid - initial_balance,
            'forbearance_periods': forbearance_periods,
            'forbearance_months_total': sum(p['duration'] for p in forbearance_periods),
            'refinance_events': refinance_events,
            'plan_changes': plan_changes,
            'final_plan': current_plan
        }