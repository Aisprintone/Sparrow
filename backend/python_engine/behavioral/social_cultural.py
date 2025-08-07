"""
Social and Cultural Factors Model - How social environment and cultural background
influence financial behavior and decision-making.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass, field


class CulturalBackground(Enum):
    """Cultural backgrounds with different financial attitudes."""
    WESTERN_INDIVIDUALIST = "western_individualist"
    EASTERN_COLLECTIVIST = "eastern_collectivist"
    IMMIGRANT_FIRST_GEN = "immigrant_first_gen"
    IMMIGRANT_SECOND_GEN = "immigrant_second_gen"
    LATIN_AMERICAN = "latin_american"
    AFRICAN_AMERICAN = "african_american"
    MIXED_HERITAGE = "mixed_heritage"


class SocialNetwork(Enum):
    """Strength and type of social support network."""
    STRONG_FAMILY = "strong_family"
    STRONG_COMMUNITY = "strong_community"
    MODERATE_MIXED = "moderate_mixed"
    WEAK_ISOLATED = "weak_isolated"
    PROFESSIONAL_NETWORK = "professional_network"


class GenerationalCohort(Enum):
    """Generational cohorts with shared experiences."""
    SILENT_GEN = "silent_gen"  # Born 1928-1945
    BABY_BOOMER = "baby_boomer"  # Born 1946-1964
    GEN_X = "gen_x"  # Born 1965-1980
    MILLENNIAL = "millennial"  # Born 1981-1996
    GEN_Z = "gen_z"  # Born 1997-2012
    GEN_ALPHA = "gen_alpha"  # Born 2013+


@dataclass
class FamilySupportModel:
    """
    Models family financial support patterns across cultures.
    Based on research on intergenerational wealth transfers.
    """
    cultural_background: CulturalBackground
    family_size: int = 4
    generation_position: str = "middle"  # "elder", "middle", "younger"
    
    # Support patterns by culture
    SUPPORT_PATTERNS = {
        CulturalBackground.WESTERN_INDIVIDUALIST: {
            'gives_to_parents': 0.1,  # 10% of income
            'receives_from_parents': 0.05,
            'gives_to_siblings': 0.02,
            'emergency_support_likelihood': 0.6,
            'expectation_pressure': 0.3
        },
        CulturalBackground.EASTERN_COLLECTIVIST: {
            'gives_to_parents': 0.25,  # 25% of income - filial piety
            'receives_from_parents': 0.15,
            'gives_to_siblings': 0.05,
            'emergency_support_likelihood': 0.9,
            'expectation_pressure': 0.8
        },
        CulturalBackground.IMMIGRANT_FIRST_GEN: {
            'gives_to_parents': 0.20,
            'receives_from_parents': 0.02,  # Parents have less
            'gives_to_siblings': 0.08,
            'emergency_support_likelihood': 0.85,
            'expectation_pressure': 0.7
        },
        CulturalBackground.LATIN_AMERICAN: {
            'gives_to_parents': 0.15,
            'receives_from_parents': 0.08,
            'gives_to_siblings': 0.05,
            'emergency_support_likelihood': 0.8,
            'expectation_pressure': 0.6
        }
    }
    
    def calculate_family_financial_obligations(
        self,
        monthly_income: float,
        age: int,
        has_dependents: bool = False
    ) -> Dict[str, float]:
        """
        Calculate expected family financial obligations.
        
        Returns:
            Dictionary of financial flows to/from family
        """
        pattern = self.SUPPORT_PATTERNS.get(
            self.cultural_background,
            self.SUPPORT_PATTERNS[CulturalBackground.WESTERN_INDIVIDUALIST]
        )
        
        obligations = {}
        
        # Adjust for generation position
        position_multipliers = {
            'elder': {'to_parents': 1.5, 'from_parents': 0.5},
            'middle': {'to_parents': 1.0, 'from_parents': 1.0},
            'younger': {'to_parents': 0.5, 'from_parents': 1.5}
        }
        
        pos_mult = position_multipliers.get(self.generation_position, 
                                            position_multipliers['middle'])
        
        # Calculate flows
        obligations['to_parents'] = (
            monthly_income * pattern['gives_to_parents'] * pos_mult['to_parents']
        )
        
        obligations['from_parents'] = (
            monthly_income * pattern['receives_from_parents'] * pos_mult['from_parents']
        )
        
        # Sibling support depends on relative success
        obligations['to_siblings'] = monthly_income * pattern['gives_to_siblings']
        
        # Extended family emergencies
        emergency_reserve = monthly_income * 0.05 * pattern['emergency_support_likelihood']
        obligations['emergency_reserve'] = emergency_reserve
        
        # Total family obligation
        obligations['total_obligation'] = (
            obligations['to_parents'] + 
            obligations['to_siblings'] + 
            obligations['emergency_reserve']
        )
        
        # Net family support (can be negative)
        obligations['net_family_support'] = (
            obligations['from_parents'] - obligations['total_obligation']
        )
        
        # Psychological burden score (0-1)
        obligations['obligation_stress'] = min(1.0, 
            obligations['total_obligation'] / (monthly_income * 0.3))
        
        return obligations
    
    def will_seek_family_help(
        self,
        financial_stress: float,
        months_of_expenses_remaining: float,
        previous_help_received: int = 0
    ) -> Tuple[bool, float]:
        """
        Determine if individual will seek family help.
        
        Returns:
            Tuple of (will_seek_help, amount_as_months_of_expenses)
        """
        pattern = self.SUPPORT_PATTERNS.get(
            self.cultural_background,
            self.SUPPORT_PATTERNS[CulturalBackground.WESTERN_INDIVIDUALIST]
        )
        
        # Base threshold varies by culture
        threshold = 2.0 / pattern['emergency_support_likelihood']
        
        # Adjust for previous help (shame/reciprocity)
        if previous_help_received > 0:
            threshold *= (1 + previous_help_received * 0.3)  # Harder each time
        
        # Stress overrides shame eventually
        threshold *= (1 - financial_stress * 0.5)
        
        if months_of_expenses_remaining < threshold:
            # Will seek help
            # Amount depends on family capacity and cultural norms
            if pattern['emergency_support_likelihood'] > 0.8:
                amount = np.random.uniform(2, 6)  # Strong support cultures
            else:
                amount = np.random.uniform(1, 3)  # Weaker support cultures
            
            return True, amount
        
        return False, 0.0


class PeerInfluenceCalculator:
    """
    Models how peer behavior influences financial decisions.
    Based on social proof and relative deprivation research.
    """
    
    def __init__(self, social_network: SocialNetwork):
        self.social_network = social_network
        self.peer_comparisons = []
        
        # Influence strength by network type
        self.INFLUENCE_WEIGHTS = {
            SocialNetwork.STRONG_FAMILY: 0.6,
            SocialNetwork.STRONG_COMMUNITY: 0.7,
            SocialNetwork.MODERATE_MIXED: 0.5,
            SocialNetwork.WEAK_ISOLATED: 0.2,
            SocialNetwork.PROFESSIONAL_NETWORK: 0.8
        }
    
    def calculate_spending_pressure(
        self,
        own_income: float,
        peer_median_income: float,
        peer_spending_visible: Dict[str, float],
        age: int
    ) -> Dict[str, Any]:
        """
        Calculate pressure to match peer spending patterns.
        
        Args:
            own_income: Individual's income
            peer_median_income: Median income of peer group
            peer_spending_visible: Visible spending categories by peers
            age: Individual's age
            
        Returns:
            Spending pressure metrics
        """
        influence_weight = self.INFLUENCE_WEIGHTS.get(self.social_network, 0.5)
        
        # Relative income position
        relative_position = own_income / peer_median_income if peer_median_income > 0 else 1.0
        
        # Pressure varies by relative position
        if relative_position < 0.8:
            # Below peers - high pressure to keep up
            base_pressure = 0.7
        elif relative_position < 1.2:
            # Similar to peers - moderate pressure
            base_pressure = 0.5
        else:
            # Above peers - low pressure, maybe showing off
            base_pressure = 0.3
        
        # Age affects susceptibility
        age_susceptibility = {
            range(18, 25): 0.9,  # Highly susceptible
            range(25, 35): 0.7,
            range(35, 45): 0.5,
            range(45, 55): 0.4,
            range(55, 100): 0.3  # Less susceptible
        }
        
        age_factor = 0.5  # Default
        for age_range, factor in age_susceptibility.items():
            if age in age_range:
                age_factor = factor
                break
        
        # Calculate pressure by spending category
        category_pressures = {}
        for category, peer_amount in peer_spending_visible.items():
            # Visible categories create more pressure
            visibility_multipliers = {
                'housing': 0.8,  # Somewhat visible
                'car': 1.0,  # Very visible
                'clothing': 0.9,
                'dining': 0.7,
                'travel': 1.0,  # Social media effect
                'gadgets': 0.8,
                'education': 0.3  # Less visible
            }
            
            visibility = visibility_multipliers.get(category, 0.5)
            
            category_pressure = (
                base_pressure * 
                influence_weight * 
                age_factor * 
                visibility
            )
            
            # Expected spending to match peers
            expected_spending = peer_amount * (0.8 + category_pressure * 0.4)
            
            category_pressures[category] = {
                'pressure_score': category_pressure,
                'peer_spending': peer_amount,
                'expected_spending': expected_spending,
                'overspending_risk': category_pressure > 0.6
            }
        
        # Overall metrics
        overall_pressure = np.mean([cp['pressure_score'] 
                                   for cp in category_pressures.values()])
        
        # Will individual succumb to pressure?
        will_overspend = overall_pressure > 0.5 and relative_position < 1.0
        
        return {
            'overall_pressure': overall_pressure,
            'relative_income_position': relative_position,
            'category_pressures': category_pressures,
            'will_likely_overspend': will_overspend,
            'recommended_resistance_strategies': self._get_resistance_strategies(overall_pressure)
        }
    
    def _get_resistance_strategies(self, pressure_level: float) -> List[str]:
        """Recommend strategies to resist peer pressure."""
        strategies = []
        
        if pressure_level > 0.7:
            strategies.extend([
                'automatic_savings_before_seeing_income',
                'avoid_social_media_during_vulnerable_times',
                'find_lower_spending_peer_groups'
            ])
        elif pressure_level > 0.5:
            strategies.extend([
                'set_clear_budget_limits',
                'track_peer_pressure_incidents',
                'practice_saying_no'
            ])
        else:
            strategies.append('maintain_current_boundaries')
        
        return strategies
    
    def calculate_investment_herding(
        self,
        peer_investment_choices: List[str],
        own_risk_tolerance: float
    ) -> Dict[str, Any]:
        """
        Model investment herding behavior - following peers into investments.
        """
        if not peer_investment_choices:
            return {'herding_risk': 0, 'likely_action': 'independent_choice'}
        
        # Count peer choices
        choice_counts = {}
        for choice in peer_investment_choices:
            choice_counts[choice] = choice_counts.get(choice, 0) + 1
        
        # Most popular choice
        popular_choice = max(choice_counts, key=choice_counts.get)
        popularity = choice_counts[popular_choice] / len(peer_investment_choices)
        
        # Herding probability
        influence_weight = self.INFLUENCE_WEIGHTS.get(self.social_network, 0.5)
        herding_probability = popularity * influence_weight
        
        # Adjust for risk tolerance mismatch
        risky_choices = ['crypto', 'options', 'startups', 'meme_stocks']
        if popular_choice in risky_choices and own_risk_tolerance < 0.5:
            # Low risk tolerance but peers doing risky things
            mismatch_stress = 0.7
        else:
            mismatch_stress = 0.2
        
        return {
            'popular_choice': popular_choice,
            'herding_probability': herding_probability,
            'will_likely_follow': herding_probability > 0.6,
            'mismatch_stress': mismatch_stress,
            'independent_thinking_score': 1 - herding_probability
        }


class CulturalDebtAttitude:
    """
    Models cultural attitudes toward debt and borrowing.
    Different cultures have very different relationships with debt.
    """
    
    CULTURAL_ATTITUDES = {
        CulturalBackground.WESTERN_INDIVIDUALIST: {
            'debt_acceptance': 0.7,  # Comfortable with "good debt"
            'credit_card_normalization': 0.8,
            'mortgage_expectation': 0.9,
            'student_loan_acceptance': 0.85,
            'shame_level': 0.3
        },
        CulturalBackground.EASTERN_COLLECTIVIST: {
            'debt_acceptance': 0.3,  # Debt is shameful
            'credit_card_normalization': 0.4,
            'mortgage_expectation': 0.7,  # Property exception
            'student_loan_acceptance': 0.6,  # Education exception
            'shame_level': 0.8
        },
        CulturalBackground.IMMIGRANT_FIRST_GEN: {
            'debt_acceptance': 0.2,  # Very debt-averse
            'credit_card_normalization': 0.3,
            'mortgage_expectation': 0.8,  # American dream
            'student_loan_acceptance': 0.7,
            'shame_level': 0.7
        }
    }
    
    def __init__(self, cultural_background: CulturalBackground):
        self.cultural_background = cultural_background
        self.attitudes = self.CULTURAL_ATTITUDES.get(
            cultural_background,
            self.CULTURAL_ATTITUDES[CulturalBackground.WESTERN_INDIVIDUALIST]
        )
    
    def will_take_debt(
        self,
        debt_type: str,
        debt_to_income_ratio: float,
        necessity_level: float  # 0-1, how necessary is this debt
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Determine if individual will take on debt given cultural background.
        """
        # Base acceptance for debt type
        acceptance_by_type = {
            'credit_card': self.attitudes['credit_card_normalization'],
            'mortgage': self.attitudes['mortgage_expectation'],
            'student_loan': self.attitudes['student_loan_acceptance'],
            'auto_loan': self.attitudes['debt_acceptance'] * 0.8,
            'personal_loan': self.attitudes['debt_acceptance'] * 0.5,
            'payday_loan': 0.1  # Almost never acceptable
        }
        
        base_acceptance = acceptance_by_type.get(debt_type, 
                                                 self.attitudes['debt_acceptance'])
        
        # Adjust for existing debt burden
        if debt_to_income_ratio > 0.4:
            debt_burden_penalty = 0.5
        elif debt_to_income_ratio > 0.2:
            debt_burden_penalty = 0.2
        else:
            debt_burden_penalty = 0
        
        base_acceptance *= (1 - debt_burden_penalty)
        
        # Necessity overrides cultural reluctance somewhat
        necessity_boost = necessity_level * 0.3
        final_acceptance = min(1.0, base_acceptance + necessity_boost)
        
        # Shame and stress calculation
        if final_acceptance < 0.5:
            shame_level = self.attitudes['shame_level']
            stress_level = shame_level * (1 - necessity_level)
        else:
            shame_level = self.attitudes['shame_level'] * 0.5
            stress_level = shame_level * 0.5
        
        will_take = np.random.random() < final_acceptance
        
        reasoning = {
            'cultural_acceptance': base_acceptance,
            'necessity_adjusted': final_acceptance,
            'shame_level': shame_level,
            'stress_from_decision': stress_level,
            'alternative_seeking': not will_take and necessity_level > 0.7
        }
        
        return will_take, reasoning


class GenerationalBehavior:
    """
    Models generational differences in financial behavior.
    Each generation has unique experiences shaping their financial psychology.
    """
    
    GENERATIONAL_TRAITS = {
        GenerationalCohort.BABY_BOOMER: {
            'digital_adoption': 0.5,
            'risk_tolerance': 0.4,
            'brand_loyalty': 0.8,
            'diy_preference': 0.7,
            'advisor_trust': 0.7,
            'retirement_focus': 0.9
        },
        GenerationalCohort.GEN_X: {
            'digital_adoption': 0.7,
            'risk_tolerance': 0.5,
            'brand_loyalty': 0.6,
            'diy_preference': 0.8,
            'advisor_trust': 0.5,
            'retirement_focus': 0.7
        },
        GenerationalCohort.MILLENNIAL: {
            'digital_adoption': 0.9,
            'risk_tolerance': 0.6,
            'brand_loyalty': 0.4,
            'diy_preference': 0.6,
            'advisor_trust': 0.4,
            'retirement_focus': 0.5
        },
        GenerationalCohort.GEN_Z: {
            'digital_adoption': 1.0,
            'risk_tolerance': 0.7,
            'brand_loyalty': 0.2,
            'diy_preference': 0.5,
            'advisor_trust': 0.3,
            'retirement_focus': 0.3
        }
    }
    
    # Formative experiences by generation
    FORMATIVE_EXPERIENCES = {
        GenerationalCohort.BABY_BOOMER: ['prosperity', 'pensions', 'housing_boom'],
        GenerationalCohort.GEN_X: ['dotcom_bust', 'housing_crisis', 'pension_decline'],
        GenerationalCohort.MILLENNIAL: ['great_recession', 'gig_economy', 'student_debt_crisis'],
        GenerationalCohort.GEN_Z: ['pandemic', 'crypto_boom', 'inflation_return']
    }
    
    def __init__(self, cohort: GenerationalCohort):
        self.cohort = cohort
        self.traits = self.GENERATIONAL_TRAITS.get(
            cohort,
            self.GENERATIONAL_TRAITS[GenerationalCohort.MILLENNIAL]
        )
        self.experiences = self.FORMATIVE_EXPERIENCES.get(cohort, [])
    
    def predict_financial_behavior(
        self,
        scenario: str
    ) -> Dict[str, Any]:
        """
        Predict behavior based on generational traits.
        """
        predictions = {}
        
        if scenario == 'investment_platform_choice':
            if self.traits['digital_adoption'] > 0.8:
                predictions['platform'] = 'robo_advisor'
                predictions['reasoning'] = 'digital_native_comfort'
            elif self.traits['advisor_trust'] > 0.6:
                predictions['platform'] = 'traditional_advisor'
                predictions['reasoning'] = 'values_human_guidance'
            else:
                predictions['platform'] = 'self_directed'
                predictions['reasoning'] = 'diy_preference'
        
        elif scenario == 'emergency_fund_building':
            # Generations with crisis experience save more
            if 'great_recession' in self.experiences or 'pandemic' in self.experiences:
                predictions['target_months'] = 9
                predictions['urgency'] = 'high'
            else:
                predictions['target_months'] = 6
                predictions['urgency'] = 'moderate'
        
        elif scenario == 'retirement_planning':
            predictions['engagement_level'] = self.traits['retirement_focus']
            predictions['starting_age'] = 65 - int(self.traits['retirement_focus'] * 40)
            predictions['strategy'] = (
                'traditional_401k' if self.traits['advisor_trust'] > 0.5
                else 'self_directed_ira'
            )
        
        return predictions


class SocialCulturalFactors:
    """
    Integrated model of social and cultural influences on financial behavior.
    """
    
    def __init__(
        self,
        cultural_background: CulturalBackground,
        generational_cohort: GenerationalCohort,
        social_network: SocialNetwork,
        geographic_region: str = "urban"
    ):
        """
        Initialize social and cultural factors model.
        """
        self.cultural_background = cultural_background
        self.generational_cohort = generational_cohort
        self.social_network = social_network
        self.geographic_region = geographic_region
        
        # Initialize component models
        self.family_support = FamilySupportModel(cultural_background)
        self.peer_influence = PeerInfluenceCalculator(social_network)
        self.debt_attitude = CulturalDebtAttitude(cultural_background)
        self.generational = GenerationalBehavior(generational_cohort)
    
    def calculate_social_financial_pressure(
        self,
        individual_income: float,
        peer_median_income: float,
        family_expectations: bool = True
    ) -> float:
        """
        Calculate overall social pressure on financial decisions.
        
        Returns:
            Pressure score 0-1 (1 = maximum pressure)
        """
        # Family obligation pressure
        if family_expectations:
            family_obligations = self.family_support.calculate_family_financial_obligations(
                individual_income, 35, False
            )
            family_pressure = family_obligations['obligation_stress']
        else:
            family_pressure = 0
        
        # Peer pressure
        peer_pressure_data = self.peer_influence.calculate_spending_pressure(
            individual_income,
            peer_median_income,
            {'car': 500, 'dining': 300, 'travel': 200},
            35
        )
        peer_pressure = peer_pressure_data['overall_pressure']
        
        # Cultural pressure (debt shame, saving expectations)
        cultural_pressure = self.debt_attitude.attitudes['shame_level'] * 0.5
        
        # Weighted combination
        total_pressure = (
            family_pressure * 0.4 +
            peer_pressure * 0.4 +
            cultural_pressure * 0.2
        )
        
        return min(1.0, total_pressure)
    
    def predict_financial_decision(
        self,
        decision_type: str,
        options: List[str],
        context: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Predict financial decision based on social and cultural factors.
        """
        # Generate scores for each option
        option_scores = {}
        
        for option in options:
            score = 0.5  # Base score
            
            # Apply cultural influence
            if decision_type == 'debt' and option == 'take_loan':
                will_take, reasoning = self.debt_attitude.will_take_debt(
                    context.get('debt_type', 'personal_loan'),
                    context.get('debt_to_income', 0.2),
                    context.get('necessity', 0.5)
                )
                score = 0.8 if will_take else 0.2
            
            # Apply generational influence
            gen_behavior = self.generational.predict_financial_behavior(decision_type)
            if option in str(gen_behavior.get('platform', '')):
                score += 0.2
            
            # Apply peer influence
            if context.get('peer_choice') == option:
                influence_weight = self.peer_influence.INFLUENCE_WEIGHTS.get(
                    self.social_network, 0.5
                )
                score += influence_weight * 0.3
            
            option_scores[option] = score
        
        # Choose option with highest score
        chosen_option = max(option_scores, key=option_scores.get)
        
        # Create reasoning
        reasoning = {
            'option_scores': option_scores,
            'primary_influence': self._identify_primary_influence(
                decision_type, chosen_option
            ),
            'cultural_alignment': self._assess_cultural_alignment(
                chosen_option, decision_type
            )
        }
        
        return chosen_option, reasoning
    
    def _identify_primary_influence(
        self,
        decision_type: str,
        chosen_option: str
    ) -> str:
        """Identify the primary social/cultural influence on decision."""
        if 'debt' in decision_type or 'loan' in chosen_option:
            return 'cultural_debt_attitude'
        elif 'invest' in decision_type:
            return 'peer_influence'
        elif 'save' in decision_type:
            return 'family_expectations'
        else:
            return 'generational_traits'
    
    def _assess_cultural_alignment(
        self,
        choice: str,
        decision_type: str
    ) -> float:
        """Assess how well choice aligns with cultural values."""
        # Simplified assessment
        if 'save' in choice or 'frugal' in choice:
            if self.cultural_background in [
                CulturalBackground.EASTERN_COLLECTIVIST,
                CulturalBackground.IMMIGRANT_FIRST_GEN
            ]:
                return 0.9
        elif 'debt' in choice or 'loan' in choice:
            if self.cultural_background == CulturalBackground.WESTERN_INDIVIDUALIST:
                return 0.7
            else:
                return 0.3
        
        return 0.5  # Neutral alignment