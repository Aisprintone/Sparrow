#!/usr/bin/env python3
"""
AI QUALITY AUDITOR: Comprehensive assessment of AI-generated financial insights
This script evaluates the quality, actionability, and personalization of AI explanations.
"""

import sys
import os
import asyncio
import json
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import SimulationConfig
from core.engine import MonteCarloEngine
from data.csv_loader import CSVDataLoader
from api.ai_explanations import AIExplanationGenerator, StrategyType
from scenarios.emergency_fund import EmergencyFundScenario
from scenarios.student_loan import StudentLoanScenario
from scenarios.medical_crisis import MedicalCrisisScenario
from scenarios.gig_economy import GigEconomyScenario
from scenarios.market_crash import MarketCrashScenario
from scenarios.home_purchase import HomePurchaseScenario
from scenarios.rent_hike import RentHikeScenario
from scenarios.auto_repair import AutoRepairScenario


@dataclass
class QualityScore:
    """Quality scores for AI-generated insights."""
    actionability: float  # 1-10: How specific and implementable
    personalization: float  # 1-10: How well tailored to profile
    nuance: float  # 1-10: Captures scenario complexity
    information_balance: float  # 1-10: Right amount of detail
    financial_logic: float  # 1-10: Sound reasoning
    automation_theatre: float  # 1-10: Feels effortless and trustworthy
    
    @property
    def overall(self) -> float:
        """Calculate overall score."""
        scores = [
            self.actionability,
            self.personalization,
            self.nuance,
            self.information_balance,
            self.financial_logic,
            self.automation_theatre
        ]
        return sum(scores) / len(scores)
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary."""
        return {
            "actionability": self.actionability,
            "personalization": self.personalization,
            "nuance": self.nuance,
            "information_balance": self.information_balance,
            "financial_logic": self.financial_logic,
            "automation_theatre": self.automation_theatre,
            "overall": self.overall
        }


@dataclass
class InsightExample:
    """Example of AI-generated insight for analysis."""
    profile_id: int
    scenario: str
    strategy: str
    title: str
    rationale: str
    steps: List[str]
    score: QualityScore
    notes: str


class AIQualityAuditor:
    """
    Comprehensive auditor for AI-generated financial insights.
    Evaluates actionability, personalization, and user experience.
    """
    
    def __init__(self):
        self.config = SimulationConfig()
        self.config.RANDOM_SEED = 42
        self.engine = MonteCarloEngine(self.config)
        self.loader = CSVDataLoader()
        self.ai_generator = AIExplanationGenerator()
        
        # Scoring matrix storage
        self.scoring_matrix = {}
        
        # Examples storage
        self.excellent_examples = []
        self.poor_examples = []
        
        # Findings storage
        self.findings = []
        self.recommendations = []
        
        # Scenario mappings
        self.scenarios = {
            'emergency_fund': EmergencyFundScenario(),
            'student_loan': StudentLoanScenario(),
            'home_purchase': HomePurchaseScenario(),
            'market_crash': MarketCrashScenario(),
            'medical_crisis': MedicalCrisisScenario(),
            'gig_economy': GigEconomyScenario(),
            'rent_hike': RentHikeScenario(),
            'auto_repair': AutoRepairScenario()
        }
        
        # Profile demographics for reference
        self.profile_demographics = {
            1: "Gen Z Student",
            2: "Mid-Career Professional",
            3: "Established Millennial"
        }
    
    async def audit_all_combinations(self):
        """Audit all 24 profile-scenario combinations."""
        print("\n" + "="*70)
        print("AI QUALITY AUDIT: COMPREHENSIVE EVALUATION")
        print("="*70)
        print("\nEvaluating 3 profiles x 8 scenarios = 24 combinations")
        print("Each combination tested with 3 strategies = 72 total evaluations\n")
        
        for profile_id in [1, 2, 3]:
            profile = self.loader.load_profile(profile_id)
            profile_name = self.profile_demographics[profile_id]
            
            print(f"\n--- PROFILE {profile_id}: {profile_name} ---")
            print(f"Income: ${profile.monthly_income:,.0f}/month")
            print(f"Expenses: ${profile.monthly_expenses:,.0f}/month")
            print(f"Emergency Fund: ${profile.emergency_fund_balance:,.0f}")
            print(f"Student Loans: ${profile.student_loan_balance:,.0f}")
            
            for scenario_name, scenario in self.scenarios.items():
                print(f"\n  Testing {scenario_name}...")
                
                try:
                    # Run simulation
                    result = self.engine.run_scenario(scenario, profile, iterations=1000)
                    
                    # Convert to proper format for AI generator
                    simulation_data = {
                        "result": {
                            "percentiles": {
                                "p10": result.percentile_10,
                                "p25": result.percentile_25,
                                "p50": result.percentile_50,
                                "p75": result.percentile_75,
                                "p90": result.percentile_90
                            },
                            "probability_success": result.probability_success,
                            "confidence_interval": (result.percentile_10, result.percentile_90)
                        }
                    }
                    
                    # Convert profile to dict format
                    profile_dict = {
                        "demographic": profile.demographic,
                        "monthly_income": profile.monthly_income,
                        "monthly_expenses": profile.monthly_expenses,
                        "emergency_fund": profile.emergency_fund_balance,
                        "student_loans": profile.student_loan_balance,
                        "income": profile.monthly_income,
                        "total_debt": profile.student_loan_balance + profile.credit_card_debt
                    }
                    
                    # Generate AI explanations
                    cards = await self.ai_generator.generate_explanations(
                        profile_dict,
                        simulation_data,
                        scenario_name,
                        include_detailed_insights=True
                    )
                    
                    # Evaluate each strategy card
                    for card in cards:
                        score = self._evaluate_card_quality(
                            card, profile_dict, simulation_data, scenario_name
                        )
                        
                        # Store in matrix
                        key = f"{profile_id}_{scenario_name}_{card.tag.lower()}"
                        self.scoring_matrix[key] = score
                        
                        # Collect examples
                        example = InsightExample(
                            profile_id=profile_id,
                            scenario=scenario_name,
                            strategy=card.tag,
                            title=card.title,
                            rationale=card.rationale,
                            steps=card.steps,
                            score=score,
                            notes=self._generate_notes(score)
                        )
                        
                        if score.overall >= 8.0:
                            self.excellent_examples.append(example)
                        elif score.overall <= 5.0:
                            self.poor_examples.append(example)
                        
                        # Quick feedback
                        status = "✓" if score.overall >= 7 else "✗" if score.overall < 5 else "~"
                        print(f"    {status} {card.tag}: Score {score.overall:.1f}/10")
                    
                except Exception as e:
                    self.findings.append(
                        f"ERROR: Failed to generate insights for Profile {profile_id} - {scenario_name}: {str(e)}"
                    )
                    print(f"    ✗ ERROR: {str(e)}")
    
    def _evaluate_card_quality(
        self,
        card: Any,
        profile: Dict[str, Any],
        simulation: Dict[str, Any],
        scenario: str
    ) -> QualityScore:
        """Evaluate quality of a single AI-generated card."""
        
        # 1. ACTIONABILITY SCORE
        actionability = self._score_actionability(card.steps, card.rationale)
        
        # 2. PERSONALIZATION SCORE
        personalization = self._score_personalization(
            card.rationale, profile, scenario
        )
        
        # 3. NUANCE SCORE
        nuance = self._score_nuance(card, simulation, scenario)
        
        # 4. INFORMATION BALANCE
        info_balance = self._score_information_balance(
            card.rationale, card.steps, card.detailed_insights
        )
        
        # 5. FINANCIAL LOGIC
        financial_logic = self._score_financial_logic(
            card.rationale, simulation, profile
        )
        
        # 6. AUTOMATION THEATRE
        automation_theatre = self._score_automation_theatre(card)
        
        return QualityScore(
            actionability=actionability,
            personalization=personalization,
            nuance=nuance,
            information_balance=info_balance,
            financial_logic=financial_logic,
            automation_theatre=automation_theatre
        )
    
    def _score_actionability(self, steps: List[str], rationale: str) -> float:
        """Score how actionable the recommendations are."""
        score = 5.0  # Base score
        
        # Check for specific numbers in steps
        numbers_in_steps = sum(1 for step in steps if any(c.isdigit() for c in step))
        score += min(2.0, numbers_in_steps * 0.5)
        
        # Check for action verbs
        action_verbs = ['set', 'open', 'transfer', 'allocate', 'pay', 'review', 'monitor']
        verbs_found = sum(1 for step in steps 
                         for verb in action_verbs 
                         if verb.lower() in step.lower())
        score += min(1.5, verbs_found * 0.25)
        
        # Check for timeline mentions
        if any(word in rationale.lower() for word in ['months', 'weeks', 'quarterly', 'annually']):
            score += 0.5
        
        # Penalize vague language
        vague_terms = ['consider', 'think about', 'maybe', 'possibly', 'could']
        vague_count = sum(1 for term in vague_terms if term in rationale.lower())
        score -= min(1.0, vague_count * 0.25)
        
        # Check step specificity
        if all(len(step) > 20 for step in steps):
            score += 1.0
        
        return max(1.0, min(10.0, score))
    
    def _score_personalization(self, rationale: str, profile: Dict, scenario: str) -> float:
        """Score how well personalized to the specific profile."""
        score = 5.0
        
        # Check for income mention
        if str(int(profile['monthly_income'])) in rationale:
            score += 1.5
        
        # Check for demographic-specific language
        demographic = profile.get('demographic', '').lower()
        if demographic in rationale.lower():
            score += 1.0
        
        # Check for situation-specific references
        if scenario == 'student_loan' and 'student' in rationale.lower():
            score += 0.5
        elif scenario == 'emergency_fund' and 'emergency' in rationale.lower():
            score += 0.5
        elif scenario == 'gig_economy' and 'gig' in rationale.lower():
            score += 0.5
        
        # Check for specific financial numbers from profile
        if str(int(profile.get('emergency_fund', 0))) in rationale:
            score += 1.0
        if str(int(profile.get('student_loans', 0))) in rationale:
            score += 1.0
        
        # Penalize generic language
        generic_terms = ['typical', 'average', 'standard', 'normal']
        generic_count = sum(1 for term in generic_terms if term in rationale.lower())
        score -= min(1.0, generic_count * 0.5)
        
        return max(1.0, min(10.0, score))
    
    def _score_nuance(self, card: Any, simulation: Dict, scenario: str) -> float:
        """Score how well it captures scenario complexity."""
        score = 5.0
        
        # Check for percentile mentions
        rationale_lower = card.rationale.lower()
        if 'percentile' in rationale_lower or 'confidence' in rationale_lower:
            score += 1.0
        
        # Check for risk discussion
        if any(word in rationale_lower for word in ['risk', 'volatility', 'uncertainty']):
            score += 1.0
        
        # Check for trade-off mentions
        if any(word in rationale_lower for word in ['however', 'although', 'while', 'but']):
            score += 0.5
        
        # Check for scenario-specific complexity
        if scenario == 'market_crash' and 'market' in rationale_lower:
            score += 1.0
        elif scenario == 'medical_crisis' and 'medical' in rationale_lower:
            score += 1.0
        
        # Check detailed insights if available
        if hasattr(card, 'detailed_insights') and card.detailed_insights:
            insights = card.detailed_insights
            if isinstance(insights, dict):
                if insights.get('scenario_nuances'):
                    score += 1.5
                if len(insights.get('key_insights', [])) >= 3:
                    score += 1.0
        
        return max(1.0, min(10.0, score))
    
    def _score_information_balance(self, rationale: str, steps: List[str], detailed_insights: Any) -> float:
        """Score the balance of information provided."""
        score = 5.0
        
        # Check rationale length (150-250 words ideal)
        word_count = len(rationale.split())
        if 150 <= word_count <= 250:
            score += 2.0
        elif word_count < 100:
            score -= 1.0
        elif word_count > 400:
            score -= 0.5
        
        # Check step count and length
        if len(steps) == 4:
            score += 1.0
        
        avg_step_length = sum(len(step.split()) for step in steps) / len(steps)
        if 5 <= avg_step_length <= 12:
            score += 1.0
        
        # Check for structure
        if rationale.count('.') >= 3:  # Multiple sentences
            score += 0.5
        
        # Check detailed insights structure
        if detailed_insights and isinstance(detailed_insights, dict):
            if len(detailed_insights.get('key_insights', [])) == 4:
                score += 0.5
        
        return max(1.0, min(10.0, score))
    
    def _score_financial_logic(self, rationale: str, simulation: Dict, profile: Dict) -> float:
        """Score the soundness of financial reasoning."""
        score = 5.0
        
        # Check for mention of actual simulation results
        result = simulation.get('result', {})
        if str(int(result.get('percentiles', {}).get('p50', 0))) in rationale:
            score += 1.5
        
        # Check for percentage mentions
        import re
        percentages = re.findall(r'\d+(?:\.\d+)?%', rationale)
        if percentages:
            score += min(1.5, len(percentages) * 0.5)
        
        # Check for dollar amounts
        dollar_amounts = re.findall(r'\$[\d,]+', rationale)
        if dollar_amounts:
            score += min(1.5, len(dollar_amounts) * 0.5)
        
        # Check for financial terms
        financial_terms = ['interest', 'return', 'yield', 'rate', 'payment', 'balance', 'principal']
        terms_found = sum(1 for term in financial_terms if term in rationale.lower())
        score += min(1.0, terms_found * 0.25)
        
        # Check for logical flow words
        logical_words = ['because', 'therefore', 'since', 'as a result']
        logical_count = sum(1 for word in logical_words if word in rationale.lower())
        score += min(0.5, logical_count * 0.25)
        
        return max(1.0, min(10.0, score))
    
    def _score_automation_theatre(self, card: Any) -> float:
        """Score how effortless and trustworthy it feels."""
        score = 5.0
        
        # Check for professional presentation
        if card.title and len(card.title) > 10:
            score += 0.5
        if card.description and len(card.description) > 20:
            score += 0.5
        
        # Check for appropriate tag and color
        if card.tag and card.tagColor:
            score += 1.0
        
        # Check for confidence-inspiring language
        confidence_words = ['ensure', 'guarantee', 'secure', 'protect', 'optimize']
        confidence_count = sum(1 for word in confidence_words if word in card.rationale.lower())
        score += min(1.0, confidence_count * 0.5)
        
        # Check for smooth flow
        if not any(char in card.rationale for char in ['[', ']', '{', '}', 'ERROR', 'TODO']):
            score += 1.0
        
        # Check for completeness
        if all([card.title, card.description, card.rationale, card.steps, card.potentialSaving]):
            score += 1.0
        
        # Check potential saving format
        if isinstance(card.potentialSaving, str) and ('months' in str(card.potentialSaving) or '$' in str(card.potentialSaving)):
            score += 1.0
        
        return max(1.0, min(10.0, score))
    
    def _generate_notes(self, score: QualityScore) -> str:
        """Generate notes about the quality score."""
        notes = []
        
        if score.actionability < 5:
            notes.append("Lacks specific actionable steps")
        elif score.actionability >= 8:
            notes.append("Highly actionable with clear steps")
        
        if score.personalization < 5:
            notes.append("Too generic, not personalized")
        elif score.personalization >= 8:
            notes.append("Well personalized to user profile")
        
        if score.nuance < 5:
            notes.append("Oversimplified, misses complexity")
        elif score.nuance >= 8:
            notes.append("Captures scenario nuances well")
        
        if score.automation_theatre < 5:
            notes.append("Feels mechanical or incomplete")
        elif score.automation_theatre >= 8:
            notes.append("Smooth, trustworthy experience")
        
        return "; ".join(notes) if notes else "Adequate quality"
    
    def generate_scoring_matrix_report(self):
        """Generate the detailed scoring matrix report."""
        print("\n" + "="*70)
        print("SCORING MATRIX ANALYSIS")
        print("="*70)
        
        # Aggregate by profile
        for profile_id in [1, 2, 3]:
            profile_scores = {k: v for k, v in self.scoring_matrix.items() if k.startswith(f"{profile_id}_")}
            if not profile_scores:
                continue
            
            print(f"\n--- Profile {profile_id}: {self.profile_demographics[profile_id]} ---")
            
            # Calculate averages for this profile
            avg_scores = {
                'actionability': [],
                'personalization': [],
                'nuance': [],
                'information_balance': [],
                'financial_logic': [],
                'automation_theatre': []
            }
            
            for score in profile_scores.values():
                avg_scores['actionability'].append(score.actionability)
                avg_scores['personalization'].append(score.personalization)
                avg_scores['nuance'].append(score.nuance)
                avg_scores['information_balance'].append(score.information_balance)
                avg_scores['financial_logic'].append(score.financial_logic)
                avg_scores['automation_theatre'].append(score.automation_theatre)
            
            print("\nAverage Scores Across All Scenarios:")
            for metric, values in avg_scores.items():
                if values:
                    avg = sum(values) / len(values)
                    bar = "█" * int(avg) + "░" * (10 - int(avg))
                    print(f"  {metric.replace('_', ' ').title():20} {bar} {avg:.1f}/10")
            
            # Best and worst scenarios for this profile
            best_key = max(profile_scores, key=lambda k: profile_scores[k].overall)
            worst_key = min(profile_scores, key=lambda k: profile_scores[k].overall)
            
            print(f"\n  Best: {best_key.split('_', 1)[1]} ({profile_scores[best_key].overall:.1f}/10)")
            print(f"  Worst: {worst_key.split('_', 1)[1]} ({profile_scores[worst_key].overall:.1f}/10)")
        
        # Aggregate by scenario
        print("\n" + "-"*40)
        print("SCENARIO PERFORMANCE")
        print("-"*40)
        
        for scenario_name in self.scenarios.keys():
            scenario_scores = [v for k, v in self.scoring_matrix.items() if scenario_name in k]
            if not scenario_scores:
                continue
            
            avg_overall = sum(s.overall for s in scenario_scores) / len(scenario_scores)
            print(f"{scenario_name.replace('_', ' ').title():20} {avg_overall:.1f}/10")
    
    def generate_quality_examples(self):
        """Generate examples of excellent and poor insights."""
        print("\n" + "="*70)
        print("QUALITY EXAMPLES")
        print("="*70)
        
        if self.excellent_examples:
            print("\n--- EXCELLENT INSIGHTS (Score >= 8.0) ---")
            for i, example in enumerate(self.excellent_examples[:3], 1):
                print(f"\nExample {i}: {example.title}")
                print(f"Profile: {self.profile_demographics[example.profile_id]}")
                print(f"Scenario: {example.scenario}")
                print(f"Score: {example.score.overall:.1f}/10")
                print(f"Rationale excerpt: {example.rationale[:200]}...")
                print(f"Sample step: {example.steps[0] if example.steps else 'N/A'}")
                print(f"Notes: {example.notes}")
        
        if self.poor_examples:
            print("\n--- POOR INSIGHTS (Score <= 5.0) ---")
            for i, example in enumerate(self.poor_examples[:3], 1):
                print(f"\nExample {i}: {example.title}")
                print(f"Profile: {self.profile_demographics[example.profile_id]}")
                print(f"Scenario: {example.scenario}")
                print(f"Score: {example.score.overall:.1f}/10")
                print(f"Issues: {example.notes}")
    
    def generate_recommendations(self):
        """Generate specific improvement recommendations."""
        print("\n" + "="*70)
        print("IMPROVEMENT RECOMMENDATIONS")
        print("="*70)
        
        # Analyze patterns in scoring
        all_scores = list(self.scoring_matrix.values())
        if not all_scores:
            print("No data to analyze")
            return
        
        avg_metrics = {
            'actionability': sum(s.actionability for s in all_scores) / len(all_scores),
            'personalization': sum(s.personalization for s in all_scores) / len(all_scores),
            'nuance': sum(s.nuance for s in all_scores) / len(all_scores),
            'information_balance': sum(s.information_balance for s in all_scores) / len(all_scores),
            'financial_logic': sum(s.financial_logic for s in all_scores) / len(all_scores),
            'automation_theatre': sum(s.automation_theatre for s in all_scores) / len(all_scores)
        }
        
        # Generate recommendations based on weak areas
        recommendations = []
        
        if avg_metrics['actionability'] < 7:
            recommendations.append({
                "priority": "HIGH",
                "area": "Actionability",
                "issue": f"Average score {avg_metrics['actionability']:.1f}/10",
                "recommendation": "Add specific dollar amounts, percentages, and timelines to all recommendations. Replace vague terms with concrete actions.",
                "example": "Instead of 'increase savings', say 'Transfer $500 monthly to high-yield savings account earning 4.5% APY'"
            })
        
        if avg_metrics['personalization'] < 7:
            recommendations.append({
                "priority": "HIGH",
                "area": "Personalization",
                "issue": f"Average score {avg_metrics['personalization']:.1f}/10",
                "recommendation": "Reference user's actual income, expenses, and demographic in every explanation. Use profile-specific language.",
                "example": "For Gen Z: 'Your $3,200 monthly income as an early-career professional...'"
            })
        
        if avg_metrics['nuance'] < 7:
            recommendations.append({
                "priority": "MEDIUM",
                "area": "Scenario Nuance",
                "issue": f"Average score {avg_metrics['nuance']:.1f}/10",
                "recommendation": "Include risk discussions, trade-offs, and scenario-specific complexities. Reference simulation percentiles.",
                "example": "While the median outcome is 6 months, there's a 25% chance it could take up to 9 months if market volatility increases"
            })
        
        if avg_metrics['automation_theatre'] < 7:
            recommendations.append({
                "priority": "MEDIUM",
                "area": "User Experience",
                "issue": f"Average score {avg_metrics['automation_theatre']:.1f}/10",
                "recommendation": "Ensure smooth, professional presentation with complete information. Remove any technical artifacts or placeholder text.",
                "example": "Polished cards with clear titles, appropriate tags, and confidence-inspiring language"
            })
        
        # Print recommendations
        for rec in recommendations:
            print(f"\n[{rec['priority']}] {rec['area']}")
            print(f"  Issue: {rec['issue']}")
            print(f"  Fix: {rec['recommendation']}")
            print(f"  Example: {rec['example']}")
        
        # Additional patterns
        print("\n--- KEY PATTERNS IDENTIFIED ---")
        
        # Check for profile-specific weaknesses
        for profile_id in [1, 2, 3]:
            profile_scores = [self.scoring_matrix[k] for k in self.scoring_matrix if k.startswith(f"{profile_id}_")]
            if profile_scores:
                avg = sum(s.overall for s in profile_scores) / len(profile_scores)
                if avg < 6:
                    print(f"• Profile {profile_id} ({self.profile_demographics[profile_id]}) underperforming: {avg:.1f}/10")
        
        # Check for scenario-specific weaknesses
        for scenario in self.scenarios.keys():
            scenario_scores = [self.scoring_matrix[k] for k in self.scoring_matrix if scenario in k]
            if scenario_scores:
                avg = sum(s.overall for s in scenario_scores) / len(scenario_scores)
                if avg < 6:
                    print(f"• {scenario.replace('_', ' ').title()} scenario weak: {avg:.1f}/10")
    
    def generate_final_assessment(self):
        """Generate the final assessment of the AI system."""
        print("\n" + "="*70)
        print("FINAL ASSESSMENT: AUTOMATION THEATRE EVALUATION")
        print("="*70)
        
        all_scores = list(self.scoring_matrix.values())
        if not all_scores:
            print("No data available for assessment")
            return
        
        overall_average = sum(s.overall for s in all_scores) / len(all_scores)
        
        print(f"\nOVERALL SYSTEM SCORE: {overall_average:.1f}/10")
        
        # Calculate percentage meeting thresholds
        excellent_count = sum(1 for s in all_scores if s.overall >= 8)
        good_count = sum(1 for s in all_scores if 7 <= s.overall < 8)
        poor_count = sum(1 for s in all_scores if s.overall < 5)
        
        print(f"\nQuality Distribution:")
        print(f"  Excellent (8-10): {excellent_count}/{len(all_scores)} ({excellent_count/len(all_scores)*100:.1f}%)")
        print(f"  Good (7-8): {good_count}/{len(all_scores)} ({good_count/len(all_scores)*100:.1f}%)")
        print(f"  Poor (<5): {poor_count}/{len(all_scores)} ({poor_count/len(all_scores)*100:.1f}%)")
        
        # Trust assessment
        automation_avg = sum(s.automation_theatre for s in all_scores) / len(all_scores)
        
        print(f"\n--- AUTOMATION THEATRE ASSESSMENT ---")
        print(f"Trust Score: {automation_avg:.1f}/10")
        
        if automation_avg >= 8:
            print("✓ HIGHLY TRUSTWORTHY: Users will confidently rely on the system")
            print("  The AI feels like a knowledgeable advisor, not a calculator")
        elif automation_avg >= 6:
            print("~ MODERATELY TRUSTWORTHY: Users will use with some skepticism")
            print("  The system works but feels somewhat mechanical")
        else:
            print("✗ LOW TRUST: Users unlikely to rely on recommendations")
            print("  The output feels generic and disconnected from their situation")
        
        # Actionability assessment
        action_avg = sum(s.actionability for s in all_scores) / len(all_scores)
        
        print(f"\n--- ACTIONABILITY ASSESSMENT ---")
        print(f"Action Score: {action_avg:.1f}/10")
        
        if action_avg >= 7:
            print("✓ Users can immediately act on recommendations")
        elif action_avg >= 5:
            print("~ Recommendations need interpretation before action")
        else:
            print("✗ Recommendations too vague to be useful")
        
        # Final verdict
        print("\n" + "-"*40)
        print("VERDICT")
        print("-"*40)
        
        if overall_average >= 8 and automation_avg >= 7:
            print("✓ PRODUCTION READY: System delivers genuine value with trustworthy experience")
            print("  Users will feel confident letting the AI guide their financial decisions")
        elif overall_average >= 6:
            print("~ NEEDS IMPROVEMENT: Core functionality works but lacks polish")
            print("  Focus on personalization and actionability improvements")
        else:
            print("✗ NOT READY: Significant quality issues prevent user trust")
            print("  Major overhaul needed in AI explanation generation")
        
        # Save detailed report
        self.save_detailed_report(overall_average, automation_avg, action_avg)
    
    def save_detailed_report(self, overall_avg: float, automation_avg: float, action_avg: float):
        """Save detailed report to JSON file."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "overall_score": overall_avg,
                "automation_theatre_score": automation_avg,
                "actionability_score": action_avg,
                "total_evaluations": len(self.scoring_matrix)
            },
            "scoring_matrix": {
                k: v.to_dict() for k, v in self.scoring_matrix.items()
            },
            "findings": self.findings,
            "recommendations": self.recommendations
        }
        
        output_file = "ai_quality_audit_report.json"
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {output_file}")


async def main():
    """Run comprehensive AI quality audit."""
    print("\n" + "="*70)
    print("AI-GENERATED INSIGHTS QUALITY AUDIT")
    print("Evaluating Business Value and User Experience")
    print("="*70)
    
    auditor = AIQualityAuditor()
    
    # Run all audits
    await auditor.audit_all_combinations()
    
    # Generate reports
    auditor.generate_scoring_matrix_report()
    auditor.generate_quality_examples()
    auditor.generate_recommendations()
    auditor.generate_final_assessment()
    
    print("\n" + "="*70)
    print("AUDIT COMPLETE")
    print("="*70)


if __name__ == "__main__":
    # Check for API keys
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("ANTHROPIC_API_KEY"):
        print("\n⚠️  WARNING: No AI API keys found")
        print("   The system will use fallback generation")
        print("   Set OPENAI_API_KEY or ANTHROPIC_API_KEY for full AI evaluation\n")
    
    asyncio.run(main())