"""
Emergency Behavior Model - How people actually behave during financial emergencies.

Based on behavioral economics research showing how financial stress impacts
decision-making, spending patterns, and help-seeking behaviors.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass


class BehavioralPersonality(Enum):
    """Behavioral personality types based on financial psychology research."""
    PLANNER = "planner"  # Proactive, prepares for emergencies
    AVOIDER = "avoider"  # Avoids thinking about financial problems
    SURVIVOR = "survivor"  # Resilient, adapts quickly to crisis
    PANICKER = "panicker"  # Makes poor decisions under stress
    OPTIMIZER = "optimizer"  # Seeks to maximize every decision


class ExpenseCategory(Enum):
    """Expense categories with different reduction priorities."""
    HOUSING = "housing"  # Rent/mortgage - last to cut
    FOOD = "food"  # Essential but can be optimized
    TRANSPORTATION = "transportation"  # Car/transit - some flexibility
    HEALTHCARE = "healthcare"  # Often protected
    ENTERTAINMENT = "entertainment"  # First to cut
    SUBSCRIPTIONS = "subscriptions"  # Quick wins
    DINING_OUT = "dining_out"  # Early reduction
    SHOPPING = "shopping"  # Discretionary
    UTILITIES = "utilities"  # Some reduction possible
    INSURANCE = "insurance"  # Risky to cut but happens


@dataclass
class StressResponseCurve:
    """
    Models how financial stress impacts decision quality over time.
    Based on Yerkes-Dodson law and financial stress research.
    """
    optimal_stress_level: float = 0.3  # Some stress improves focus
    breakdown_threshold: float = 0.8  # Where decision-making deteriorates
    recovery_rate: float = 0.1  # Monthly stress recovery rate
    
    def calculate_decision_quality(self, stress_level: float) -> float:
        """
        Calculate decision quality based on stress level.
        
        Returns value between 0 and 1, where 1 is optimal decision-making.
        """
        if stress_level <= self.optimal_stress_level:
            # Low stress: slightly suboptimal due to lack of urgency
            return 0.85 + (0.15 * stress_level / self.optimal_stress_level)
        elif stress_level <= self.breakdown_threshold:
            # Moderate stress: declining quality
            stress_range = self.breakdown_threshold - self.optimal_stress_level
            stress_above_optimal = stress_level - self.optimal_stress_level
            return 1.0 - (0.4 * stress_above_optimal / stress_range)
        else:
            # High stress: poor decision-making
            excess_stress = min(stress_level - self.breakdown_threshold, 0.2)
            return 0.6 - (2 * excess_stress)  # Rapid deterioration


class ExpenseReductionPattern:
    """
    Models realistic expense reduction patterns during financial crisis.
    Based on Consumer Expenditure Survey data during recessions.
    """
    
    # Reduction potential by category (% of baseline that can be cut)
    REDUCTION_POTENTIAL = {
        ExpenseCategory.HOUSING: 0.05,  # 5% max (negotiate, downsize)
        ExpenseCategory.FOOD: 0.30,  # 30% (cooking more, cheaper options)
        ExpenseCategory.TRANSPORTATION: 0.25,  # 25% (public transit, carpool)
        ExpenseCategory.HEALTHCARE: 0.10,  # 10% (defer non-urgent)
        ExpenseCategory.ENTERTAINMENT: 0.90,  # 90% (nearly eliminated)
        ExpenseCategory.SUBSCRIPTIONS: 0.85,  # 85% (keep only essential)
        ExpenseCategory.DINING_OUT: 0.95,  # 95% (rare treats only)
        ExpenseCategory.SHOPPING: 0.80,  # 80% (necessities only)
        ExpenseCategory.UTILITIES: 0.15,  # 15% (conservation)
        ExpenseCategory.INSURANCE: 0.20,  # 20% (risky reductions)
    }
    
    # Time to implement reductions (months)
    IMPLEMENTATION_SPEED = {
        ExpenseCategory.ENTERTAINMENT: 0.5,  # Immediate
        ExpenseCategory.SUBSCRIPTIONS: 0.5,
        ExpenseCategory.DINING_OUT: 1.0,
        ExpenseCategory.SHOPPING: 1.0,
        ExpenseCategory.FOOD: 1.5,
        ExpenseCategory.UTILITIES: 2.0,
        ExpenseCategory.TRANSPORTATION: 2.5,
        ExpenseCategory.INSURANCE: 3.0,
        ExpenseCategory.HEALTHCARE: 3.5,
        ExpenseCategory.HOUSING: 4.0,  # Takes time to move/renegotiate
    }
    
    def calculate_reduction_timeline(
        self,
        months_in_crisis: float,
        personality: BehavioralPersonality,
        initial_stress: float = 0.3
    ) -> Dict[ExpenseCategory, float]:
        """
        Calculate expense reductions over time based on crisis duration.
        
        Returns:
            Dictionary of reduction percentages by category
        """
        reductions = {}
        
        # Personality affects reduction aggressiveness
        personality_multipliers = {
            BehavioralPersonality.PLANNER: 1.2,  # More aggressive early
            BehavioralPersonality.AVOIDER: 0.6,  # Delays cuts
            BehavioralPersonality.SURVIVOR: 1.1,  # Balanced approach
            BehavioralPersonality.PANICKER: 0.8,  # Erratic cuts
            BehavioralPersonality.OPTIMIZER: 1.3,  # Maximum efficiency
        }
        
        multiplier = personality_multipliers.get(personality, 1.0)
        
        for category in ExpenseCategory:
            # Calculate how much of potential reduction is realized
            time_to_implement = self.IMPLEMENTATION_SPEED[category]
            
            if months_in_crisis >= time_to_implement:
                # Full reduction achieved
                reduction_progress = 1.0
            else:
                # Gradual reduction using sigmoid curve
                reduction_progress = 1 / (1 + np.exp(-3 * (months_in_crisis - time_to_implement/2)))
            
            # Apply personality and stress adjustments
            base_reduction = self.REDUCTION_POTENTIAL[category]
            stress_adjustment = min(1.0, initial_stress + months_in_crisis * 0.05)
            
            reductions[category] = (
                base_reduction * reduction_progress * multiplier * stress_adjustment
            )
        
        return reductions


class SocialSafetyNet:
    """
    Models when and how people seek help from social networks during crisis.
    Based on social psychology and economic support research.
    """
    
    def __init__(self, demographic: str, cultural_background: Optional[str] = None):
        self.demographic = demographic
        self.cultural_background = cultural_background or "western"
        
        # Threshold for seeking help (months of expenses remaining)
        self.help_thresholds = {
            "family": 2.0,  # Seek family help with 2 months runway left
            "friends": 1.5,  # Friends when more desperate
            "government": 1.0,  # Government programs last resort
            "community": 1.8,  # Community organizations
            "employer": 2.5,  # Employer assistance programs
        }
        
        # Probability of receiving help when sought
        self.help_availability = {
            "genz": {"family": 0.7, "friends": 0.3, "government": 0.6, "community": 0.4, "employer": 0.3},
            "millennial": {"family": 0.5, "friends": 0.4, "government": 0.5, "community": 0.4, "employer": 0.5},
            "midcareer": {"family": 0.3, "friends": 0.5, "government": 0.4, "community": 0.3, "employer": 0.6},
            "senior": {"family": 0.2, "friends": 0.4, "government": 0.7, "community": 0.5, "employer": 0.4},
        }
        
        # Amount of help available (months of expenses)
        self.help_amounts = {
            "family": (1.0, 3.0),  # 1-3 months support
            "friends": (0.5, 1.5),  # 0.5-1.5 months
            "government": (1.0, 6.0),  # 1-6 months (unemployment)
            "community": (0.3, 1.0),  # 0.3-1 month
            "employer": (0.5, 2.0),  # 0.5-2 months (hardship funds)
        }
    
    def determine_help_seeking(
        self,
        months_remaining: float,
        already_sought: List[str],
        stress_level: float
    ) -> Tuple[Optional[str], float]:
        """
        Determine if person seeks help and from whom.
        
        Returns:
            Tuple of (help_source, amount_received)
        """
        # Stress makes people more likely to seek help
        threshold_adjustment = 1.0 + (stress_level * 0.5)
        
        availability = self.help_availability.get(self.demographic, {})
        
        for source, base_threshold in self.help_thresholds.items():
            if source in already_sought:
                continue
                
            adjusted_threshold = base_threshold * threshold_adjustment
            
            if months_remaining <= adjusted_threshold:
                # Check if help is available
                if np.random.random() < availability.get(source, 0.3):
                    # Determine amount of help
                    min_help, max_help = self.help_amounts[source]
                    amount = np.random.uniform(min_help, max_help)
                    return source, amount
        
        return None, 0.0


class EmergencyBehaviorModel:
    """
    Main behavioral model for emergency financial situations.
    Integrates all behavioral components.
    """
    
    def __init__(self, personality_type: str = "survivor"):
        """
        Initialize with a personality type.
        
        Args:
            personality_type: One of planner, avoider, survivor, panicker, optimizer
        """
        self.personality = BehavioralPersonality(personality_type)
        self.stress_curve = StressResponseCurve()
        self.expense_pattern = ExpenseReductionPattern()
        self.current_stress = 0.0
        self.months_in_emergency = 0
        self.help_sought = []
    
    def calculate_expense_reduction(
        self,
        months_unemployed: int,
        personality_type: str,
        expense_breakdown: Optional[Dict[str, float]] = None
    ) -> float:
        """
        Calculate total expense reduction based on unemployment duration.
        
        This implements the three-phase model:
        - Month 1: 15% reduction (shock phase)
        - Month 2-3: 25% reduction (adaptation phase)
        - Month 4+: 35% reduction (survival phase)
        
        Args:
            months_unemployed: Number of months without income
            personality_type: Behavioral personality type
            expense_breakdown: Optional breakdown of expenses by category
            
        Returns:
            Percentage reduction in expenses (0.0 to 1.0)
        """
        personality = BehavioralPersonality(personality_type)
        
        # Update stress level based on unemployment duration
        self.current_stress = min(1.0, 0.2 + (months_unemployed * 0.15))
        
        # Get detailed reductions by category
        reductions = self.expense_pattern.calculate_reduction_timeline(
            months_unemployed,
            personality,
            self.current_stress
        )
        
        if expense_breakdown:
            # Calculate weighted average based on actual expense breakdown
            total_expenses = sum(expense_breakdown.values())
            weighted_reduction = 0.0
            
            for category, amount in expense_breakdown.items():
                category_enum = self._map_to_category(category)
                reduction = reductions.get(category_enum, 0.0)
                weight = amount / total_expenses
                weighted_reduction += reduction * weight
            
            return weighted_reduction
        else:
            # Use typical expense distribution
            typical_distribution = {
                ExpenseCategory.HOUSING: 0.30,
                ExpenseCategory.FOOD: 0.15,
                ExpenseCategory.TRANSPORTATION: 0.15,
                ExpenseCategory.HEALTHCARE: 0.10,
                ExpenseCategory.UTILITIES: 0.08,
                ExpenseCategory.INSURANCE: 0.07,
                ExpenseCategory.ENTERTAINMENT: 0.05,
                ExpenseCategory.DINING_OUT: 0.04,
                ExpenseCategory.SHOPPING: 0.04,
                ExpenseCategory.SUBSCRIPTIONS: 0.02,
            }
            
            weighted_reduction = sum(
                reductions[cat] * weight
                for cat, weight in typical_distribution.items()
            )
            
            # Apply behavioral phases overlay
            if months_unemployed <= 1:
                # Shock phase: delayed response
                phase_multiplier = 0.5
            elif months_unemployed <= 3:
                # Adaptation phase: active cutting
                phase_multiplier = 0.9
            else:
                # Survival phase: maximum reduction
                phase_multiplier = 1.1
            
            return min(0.5, weighted_reduction * phase_multiplier)  # Cap at 50% total
    
    def determine_help_seeking_threshold(
        self,
        savings_ratio: float,
        social_network: str,
        demographic: str = "millennial"
    ) -> int:
        """
        Determine when someone seeks help based on savings and social factors.
        
        Args:
            savings_ratio: Current savings as ratio of monthly expenses
            social_network: Type of social network (strong, moderate, weak)
            demographic: Person's demographic group
            
        Returns:
            Number of months before seeking help
        """
        safety_net = SocialSafetyNet(demographic)
        
        # Social network strength affects willingness to seek help
        network_multipliers = {
            "strong": 0.8,  # Seek help sooner with strong network
            "moderate": 1.0,
            "weak": 1.3,  # Delay seeking help with weak network
        }
        
        multiplier = network_multipliers.get(social_network, 1.0)
        
        # Personality affects help-seeking
        personality_adjustments = {
            BehavioralPersonality.PLANNER: 0.9,  # Seeks help strategically
            BehavioralPersonality.AVOIDER: 1.5,  # Delays seeking help
            BehavioralPersonality.SURVIVOR: 1.0,  # Pragmatic
            BehavioralPersonality.PANICKER: 0.7,  # Seeks help early
            BehavioralPersonality.OPTIMIZER: 0.8,  # Maximizes resources
        }
        
        personality_mult = personality_adjustments.get(self.personality, 1.0)
        
        # Base threshold is when 2 months of expenses remain
        base_threshold = 2.0
        
        # Adjust based on factors
        adjusted_threshold = base_threshold * multiplier * personality_mult
        
        # Convert ratio to months until help needed
        if savings_ratio > adjusted_threshold:
            return int(savings_ratio - adjusted_threshold)
        else:
            return 0  # Need help immediately
    
    def simulate_emergency_response(
        self,
        initial_savings: float,
        monthly_expenses: float,
        emergency_duration: int,
        demographic: str = "millennial",
        include_help: bool = True
    ) -> Dict[str, any]:
        """
        Simulate complete emergency response over time.
        
        Returns:
            Dictionary with simulation results including:
            - final_savings: Remaining savings
            - months_survived: How long savings lasted
            - help_received: List of help sources and amounts
            - expense_reductions: Timeline of expense cuts
            - stress_trajectory: Stress levels over time
        """
        current_savings = initial_savings
        months_survived = 0
        help_received = []
        expense_timeline = []
        stress_timeline = []
        
        safety_net = SocialSafetyNet(demographic) if include_help else None
        
        for month in range(emergency_duration):
            # Calculate current stress
            savings_ratio = current_savings / monthly_expenses if monthly_expenses > 0 else 0
            self.current_stress = min(1.0, 0.3 + (0.2 * (3 - savings_ratio)))
            stress_timeline.append(self.current_stress)
            
            # Calculate expense reduction
            reduction = self.calculate_expense_reduction(
                month + 1,
                self.personality.value
            )
            adjusted_expenses = monthly_expenses * (1 - reduction)
            expense_timeline.append(adjusted_expenses)
            
            # Check for help seeking
            if include_help and safety_net and savings_ratio < 3:
                help_source, help_amount = safety_net.determine_help_seeking(
                    savings_ratio,
                    self.help_sought,
                    self.current_stress
                )
                
                if help_source:
                    self.help_sought.append(help_source)
                    help_in_dollars = help_amount * monthly_expenses
                    current_savings += help_in_dollars
                    help_received.append({
                        'month': month,
                        'source': help_source,
                        'amount': help_in_dollars
                    })
            
            # Deduct expenses
            current_savings -= adjusted_expenses
            
            if current_savings <= 0:
                break
            
            months_survived += 1
        
        return {
            'final_savings': max(0, current_savings),
            'months_survived': months_survived,
            'help_received': help_received,
            'expense_reductions': expense_timeline,
            'stress_trajectory': stress_timeline,
            'total_reduction': np.mean([(monthly_expenses - e) / monthly_expenses 
                                        for e in expense_timeline]) if expense_timeline else 0
        }
    
    def _map_to_category(self, expense_name: str) -> ExpenseCategory:
        """Map expense name to category enum."""
        mapping = {
            'rent': ExpenseCategory.HOUSING,
            'mortgage': ExpenseCategory.HOUSING,
            'groceries': ExpenseCategory.FOOD,
            'food': ExpenseCategory.FOOD,
            'gas': ExpenseCategory.TRANSPORTATION,
            'car': ExpenseCategory.TRANSPORTATION,
            'transit': ExpenseCategory.TRANSPORTATION,
            'medical': ExpenseCategory.HEALTHCARE,
            'health': ExpenseCategory.HEALTHCARE,
            'entertainment': ExpenseCategory.ENTERTAINMENT,
            'streaming': ExpenseCategory.SUBSCRIPTIONS,
            'subscriptions': ExpenseCategory.SUBSCRIPTIONS,
            'restaurants': ExpenseCategory.DINING_OUT,
            'dining': ExpenseCategory.DINING_OUT,
            'shopping': ExpenseCategory.SHOPPING,
            'utilities': ExpenseCategory.UTILITIES,
            'electric': ExpenseCategory.UTILITIES,
            'insurance': ExpenseCategory.INSURANCE,
        }
        
        for key, category in mapping.items():
            if key in expense_name.lower():
                return category
        
        return ExpenseCategory.SHOPPING  # Default to discretionary