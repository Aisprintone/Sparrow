#!/usr/bin/env python3
"""
AI INSIGHTS AUDITOR: Direct evaluation of AI-generated financial explanations.
Tests the AI explanation system directly without simulation dependencies.
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

from api.ai_explanations import AIExplanationGenerator, StrategyType


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


class AIInsightsAuditor:
    """Direct auditor for AI-generated financial insights."""
    
    def __init__(self):
        self.ai_generator = AIExplanationGenerator()
        self.scoring_matrix = {}
        self.excellent_examples = []
        self.poor_examples = []
        self.findings = []
        
        # Test profiles representing our 3 user types
        self.test_profiles = {
            1: {  # Gen Z Student
                "id": 1,
                "demographic": "genz",
                "name": "Gen Z Student",
                "monthly_income": 3200,
                "monthly_expenses": 2400,
                "emergency_fund": 1500,
                "student_loans": 15000,
                "total_debt": 17000,
                "income": 3200,
                "credit_card_debt": 2000,
                "age": 22,
                "risk_tolerance": "moderate"
            },
            2: {  # Mid-Career Professional
                "id": 2,
                "demographic": "midcareer",
                "name": "Mid-Career Professional",
                "monthly_income": 7500,
                "monthly_expenses": 5200,
                "emergency_fund": 12000,
                "student_loans": 0,
                "total_debt": 5000,
                "income": 7500,
                "credit_card_debt": 5000,
                "age": 35,
                "risk_tolerance": "balanced"
            },
            3: {  # Established Millennial
                "id": 3,
                "demographic": "millennial",
                "name": "Established Millennial",
                "monthly_income": 9000,
                "monthly_expenses": 6500,
                "emergency_fund": 25000,
                "student_loans": 8000,
                "total_debt": 10000,
                "income": 9000,
                "credit_card_debt": 2000,
                "age": 42,
                "risk_tolerance": "conservative"
            }
        }
        
        # Test scenarios
        self.test_scenarios = [
            "emergency_fund",
            "student_loan_payoff",
            "home_purchase",
            "market_crash",
            "medical_crisis",
            "gig_economy",
            "rent_hike",
            "auto_repair"
        ]
    
    def generate_simulation_result(self, profile: Dict, scenario: str) -> Dict:
        """Generate realistic simulation results for testing."""
        base_months = 12
        
        # Adjust based on scenario
        if scenario == "emergency_fund":
            target_months = 6 if profile["demographic"] == "genz" else 12
            current_coverage = profile["emergency_fund"] / profile["monthly_expenses"]
            median = max(1, target_months - current_coverage) * 4
        elif scenario == "student_loan_payoff":
            if profile["student_loans"] > 0:
                median = profile["student_loans"] / (profile["monthly_income"] * 0.15)
            else:
                median = 0
        elif scenario == "home_purchase":
            median = 36  # Typical home purchase timeline
        elif scenario == "market_crash":
            median = 18  # Recovery timeline
        elif scenario == "medical_crisis":
            median = 6  # Emergency handling
        elif scenario == "gig_economy":
            median = 12  # Income stabilization
        elif scenario == "rent_hike":
            median = 3  # Adjustment period
        else:  # auto_repair
            median = 2  # Quick resolution
        
        # Generate percentiles with realistic spread
        return {
            "result": {
                "percentiles": {
                    "p10": max(1, median * 0.7),
                    "p25": max(1, median * 0.85),
                    "p50": median,
                    "p75": median * 1.2,
                    "p90": median * 1.5
                },
                "probability_success": 0.75 + (0.2 * np.random.random()),
                "confidence_interval": (median * 0.7, median * 1.5)
            }
        }
    
    async def audit_all_combinations(self):
        """Audit all 24 profile-scenario combinations."""
        print("\n" + "="*70)
        print("AI INSIGHTS QUALITY AUDIT: DIRECT EVALUATION")
        print("="*70)
        print("\nTesting 3 profiles x 8 scenarios = 24 combinations")
        print("Each generates 3 strategy cards = 72 total evaluations\n")
        
        total_evaluated = 0
        
        for profile_id, profile in self.test_profiles.items():
            print(f"\n--- PROFILE {profile_id}: {profile['name']} ---")
            print(f"Income: ${profile['monthly_income']:,.0f}/month")
            print(f"Expenses: ${profile['monthly_expenses']:,.0f}/month")
            print(f"Emergency Fund: ${profile['emergency_fund']:,.0f}")
            print(f"Student Loans: ${profile['student_loans']:,.0f}")
            
            for scenario in self.test_scenarios:
                # Skip scenarios that don't apply
                if scenario == "student_loan_payoff" and profile["student_loans"] == 0:
                    print(f"\n  Skipping {scenario} (no student loans)")
                    continue
                
                print(f"\n  Testing {scenario}...")
                
                try:
                    # Generate simulation data
                    simulation_data = self.generate_simulation_result(profile, scenario)
                    
                    # Generate AI explanations
                    cards = await self.ai_generator.generate_explanations(
                        profile,
                        simulation_data,
                        scenario.replace("_payoff", ""),  # Handle naming variation
                        include_detailed_insights=True
                    )
                    
                    # Evaluate each strategy card
                    for card in cards:
                        score = self._evaluate_card_quality(
                            card, profile, simulation_data, scenario
                        )
                        
                        # Store in matrix
                        key = f"{profile_id}_{scenario}_{card.tag.lower()}"
                        self.scoring_matrix[key] = score
                        total_evaluated += 1
                        
                        # Collect examples
                        if score.overall >= 8.0:
                            self.excellent_examples.append({
                                "profile": profile['name'],
                                "scenario": scenario,
                                "strategy": card.tag,
                                "title": card.title,
                                "rationale": card.rationale[:200] + "...",
                                "score": score.overall
                            })
                        elif score.overall <= 5.0:
                            self.poor_examples.append({
                                "profile": profile['name'],
                                "scenario": scenario,
                                "strategy": card.tag,
                                "issues": self._identify_issues(score),
                                "score": score.overall
                            })
                        
                        # Quick feedback
                        status = "✓" if score.overall >= 7 else "✗" if score.overall < 5 else "~"
                        print(f"    {status} {card.tag:12} Score: {score.overall:.1f}/10")
                    
                except Exception as e:
                    self.findings.append(f"ERROR: {profile['name']} - {scenario}: {str(e)}")
                    print(f"    ✗ ERROR: {str(e)}")
        
        print(f"\n\nTotal Evaluations Completed: {total_evaluated}")
    
    def _evaluate_card_quality(
        self,
        card: Any,
        profile: Dict[str, Any],
        simulation: Dict[str, Any],
        scenario: str
    ) -> QualityScore:
        """Evaluate quality of a single AI-generated card."""
        
        # 1. ACTIONABILITY SCORE
        actionability = self._score_actionability(card)
        
        # 2. PERSONALIZATION SCORE
        personalization = self._score_personalization(card, profile, scenario)
        
        # 3. NUANCE SCORE
        nuance = self._score_nuance(card, simulation, scenario)
        
        # 4. INFORMATION BALANCE
        info_balance = self._score_information_balance(card)
        
        # 5. FINANCIAL LOGIC
        financial_logic = self._score_financial_logic(card, simulation, profile)
        
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
    
    def _score_actionability(self, card) -> float:
        """Score how actionable the recommendations are."""
        score = 5.0
        
        # Check for specific numbers in steps
        if hasattr(card, 'steps') and card.steps:
            numbers_in_steps = sum(1 for step in card.steps if any(c.isdigit() for c in step))
            score += min(2.0, numbers_in_steps * 0.5)
            
            # Check for action verbs
            action_verbs = ['set', 'open', 'transfer', 'allocate', 'pay', 'review', 'monitor']
            verbs_found = sum(1 for step in card.steps 
                             for verb in action_verbs 
                             if verb.lower() in step.lower())
            score += min(1.5, verbs_found * 0.3)
        
        # Check rationale for timelines
        if hasattr(card, 'rationale'):
            if any(word in card.rationale.lower() for word in ['months', 'weeks', 'quarterly']):
                score += 0.5
            
            # Penalize vague language
            vague_terms = ['consider', 'think about', 'maybe', 'possibly']
            vague_count = sum(1 for term in vague_terms if term in card.rationale.lower())
            score -= min(1.0, vague_count * 0.25)
        
        return max(1.0, min(10.0, score))
    
    def _score_personalization(self, card, profile: Dict, scenario: str) -> float:
        """Score how well personalized to the specific profile."""
        score = 5.0
        
        if not hasattr(card, 'rationale'):
            return score
        
        rationale_lower = card.rationale.lower()
        
        # Check for income mention
        if str(int(profile['monthly_income'])) in card.rationale:
            score += 1.5
        
        # Check for demographic-specific language
        demographic_terms = {
            "genz": ["early career", "starting out", "young professional"],
            "midcareer": ["established", "mid-career", "experienced"],
            "millennial": ["family", "long-term", "retirement planning"]
        }
        
        demo = profile.get('demographic', '')
        if demo in demographic_terms:
            if any(term in rationale_lower for term in demographic_terms[demo]):
                score += 1.5
        
        # Check for specific numbers from profile
        if str(int(profile.get('emergency_fund', 0))) in card.rationale:
            score += 1.0
        if profile.get('student_loans', 0) > 0 and str(int(profile['student_loans'])) in card.rationale:
            score += 1.0
        
        # Scenario-specific personalization
        if scenario in rationale_lower:
            score += 0.5
        
        return max(1.0, min(10.0, score))
    
    def _score_nuance(self, card, simulation: Dict, scenario: str) -> float:
        """Score how well it captures scenario complexity."""
        score = 5.0
        
        if not hasattr(card, 'rationale'):
            return score
        
        rationale_lower = card.rationale.lower()
        
        # Check for percentile/confidence mentions
        if any(word in rationale_lower for word in ['percentile', 'confidence', 'probability']):
            score += 1.0
        
        # Check for risk discussion
        if any(word in rationale_lower for word in ['risk', 'volatility', 'uncertainty']):
            score += 1.0
        
        # Check for trade-off mentions
        if any(word in rationale_lower for word in ['however', 'although', 'while', 'balance']):
            score += 0.5
        
        # Check detailed insights
        if hasattr(card, 'detailed_insights') and card.detailed_insights:
            if isinstance(card.detailed_insights, dict):
                if card.detailed_insights.get('scenario_nuances'):
                    score += 1.5
                if len(card.detailed_insights.get('key_insights', [])) >= 3:
                    score += 1.0
        
        # Scenario-specific complexity
        scenario_keywords = {
            "emergency_fund": ["liquidity", "access", "coverage"],
            "student_loan": ["interest", "forgiveness", "repayment"],
            "market_crash": ["volatility", "recovery", "portfolio"],
            "medical_crisis": ["insurance", "deductible", "coverage"]
        }
        
        for key, keywords in scenario_keywords.items():
            if key in scenario and any(kw in rationale_lower for kw in keywords):
                score += 1.0
                break
        
        return max(1.0, min(10.0, score))
    
    def _score_information_balance(self, card) -> float:
        """Score the balance of information provided."""
        score = 5.0
        
        # Check rationale length
        if hasattr(card, 'rationale'):
            word_count = len(card.rationale.split())
            if 100 <= word_count <= 250:
                score += 2.0
            elif word_count < 50:
                score -= 2.0
            elif word_count > 400:
                score -= 1.0
        
        # Check steps
        if hasattr(card, 'steps') and card.steps:
            if len(card.steps) == 4:
                score += 1.0
            
            avg_step_length = sum(len(step.split()) for step in card.steps) / len(card.steps)
            if 5 <= avg_step_length <= 15:
                score += 1.0
        
        # Check for structure
        if hasattr(card, 'rationale') and card.rationale.count('.') >= 3:
            score += 0.5
        
        # Check completeness
        if all(hasattr(card, attr) for attr in ['title', 'description', 'rationale', 'steps']):
            score += 0.5
        
        return max(1.0, min(10.0, score))
    
    def _score_financial_logic(self, card, simulation: Dict, profile: Dict) -> float:
        """Score the soundness of financial reasoning."""
        score = 5.0
        
        if not hasattr(card, 'rationale'):
            return score
        
        import re
        
        # Check for percentage mentions
        percentages = re.findall(r'\d+(?:\.\d+)?%', card.rationale)
        if percentages:
            score += min(1.5, len(percentages) * 0.5)
        
        # Check for dollar amounts
        dollar_amounts = re.findall(r'\$[\d,]+', card.rationale)
        if dollar_amounts:
            score += min(1.5, len(dollar_amounts) * 0.5)
        
        # Check for financial terms
        financial_terms = ['interest', 'return', 'yield', 'rate', 'payment', 'balance', 'investment']
        terms_found = sum(1 for term in financial_terms if term in card.rationale.lower())
        score += min(1.5, terms_found * 0.3)
        
        # Check for logical flow
        logical_words = ['because', 'therefore', 'since', 'resulting in']
        logical_count = sum(1 for word in logical_words if word in card.rationale.lower())
        score += min(1.0, logical_count * 0.5)
        
        return max(1.0, min(10.0, score))
    
    def _score_automation_theatre(self, card) -> float:
        """Score how effortless and trustworthy it feels."""
        score = 5.0
        
        # Check presentation quality
        if hasattr(card, 'title') and card.title and len(card.title) > 5:
            score += 0.5
        if hasattr(card, 'description') and card.description and len(card.description) > 10:
            score += 0.5
        
        # Check for professional appearance
        if hasattr(card, 'tag') and hasattr(card, 'tagColor'):
            score += 1.0
        
        # Check for confidence-inspiring language
        if hasattr(card, 'rationale'):
            confidence_words = ['ensure', 'secure', 'protect', 'optimize', 'strengthen']
            confidence_count = sum(1 for word in confidence_words if word in card.rationale.lower())
            score += min(1.0, confidence_count * 0.5)
            
            # Check for smooth flow (no technical artifacts)
            if not any(char in card.rationale for char in ['[', ']', '{', '}', 'ERROR', 'TODO', 'undefined']):
                score += 1.0
        
        # Check completeness
        required_attrs = ['title', 'description', 'rationale', 'steps', 'potentialSaving']
        if all(hasattr(card, attr) and getattr(card, attr) for attr in required_attrs):
            score += 1.0
        
        # Check potential saving format
        if hasattr(card, 'potentialSaving'):
            saving = str(card.potentialSaving)
            if 'months' in saving or '$' in saving or 'faster' in saving:
                score += 1.0
        
        return max(1.0, min(10.0, score))
    
    def _identify_issues(self, score: QualityScore) -> str:
        """Identify main issues based on score."""
        issues = []
        
        if score.actionability < 5:
            issues.append("Not actionable")
        if score.personalization < 5:
            issues.append("Too generic")
        if score.nuance < 5:
            issues.append("Oversimplified")
        if score.information_balance < 5:
            issues.append("Poor info balance")
        if score.financial_logic < 5:
            issues.append("Weak logic")
        if score.automation_theatre < 5:
            issues.append("Feels mechanical")
        
        return ", ".join(issues) if issues else "Multiple quality issues"
    
    def generate_detailed_report(self):
        """Generate comprehensive audit report."""
        print("\n" + "="*70)
        print("DETAILED QUALITY ASSESSMENT")
        print("="*70)
        
        if not self.scoring_matrix:
            print("No data collected for assessment")
            return
        
        # Overall statistics
        all_scores = list(self.scoring_matrix.values())
        overall_avg = sum(s.overall for s in all_scores) / len(all_scores)
        
        print(f"\n--- OVERALL METRICS ---")
        print(f"Total Evaluations: {len(all_scores)}")
        print(f"Average Score: {overall_avg:.1f}/10")
        
        # Metric breakdown
        metrics = {
            'Actionability': [s.actionability for s in all_scores],
            'Personalization': [s.personalization for s in all_scores],
            'Nuance': [s.nuance for s in all_scores],
            'Info Balance': [s.information_balance for s in all_scores],
            'Financial Logic': [s.financial_logic for s in all_scores],
            'Automation Theatre': [s.automation_theatre for s in all_scores]
        }
        
        print("\n--- CRITERIA SCORES ---")
        for metric, scores in metrics.items():
            avg = sum(scores) / len(scores)
            bar = "█" * int(avg) + "░" * (10 - int(avg))
            print(f"{metric:18} {bar} {avg:.1f}/10")
        
        # Quality distribution
        excellent = sum(1 for s in all_scores if s.overall >= 8)
        good = sum(1 for s in all_scores if 7 <= s.overall < 8)
        adequate = sum(1 for s in all_scores if 5 <= s.overall < 7)
        poor = sum(1 for s in all_scores if s.overall < 5)
        
        print("\n--- QUALITY DISTRIBUTION ---")
        print(f"Excellent (8-10): {excellent} ({excellent/len(all_scores)*100:.1f}%)")
        print(f"Good (7-8): {good} ({good/len(all_scores)*100:.1f}%)")
        print(f"Adequate (5-7): {adequate} ({adequate/len(all_scores)*100:.1f}%)")
        print(f"Poor (<5): {poor} ({poor/len(all_scores)*100:.1f}%)")
        
        # Examples
        if self.excellent_examples:
            print("\n--- EXCELLENT EXAMPLES ---")
            for ex in self.excellent_examples[:2]:
                print(f"\n{ex['profile']} - {ex['scenario']} ({ex['strategy']})")
                print(f"Score: {ex['score']:.1f}/10")
                print(f"Excerpt: {ex['rationale']}")
        
        if self.poor_examples:
            print("\n--- POOR EXAMPLES ---")
            for ex in self.poor_examples[:2]:
                print(f"\n{ex['profile']} - {ex['scenario']} ({ex['strategy']})")
                print(f"Score: {ex['score']:.1f}/10")
                print(f"Issues: {ex['issues']}")
        
        # Recommendations
        print("\n--- RECOMMENDATIONS ---")
        
        avg_actionability = sum(s.actionability for s in all_scores) / len(all_scores)
        avg_personalization = sum(s.personalization for s in all_scores) / len(all_scores)
        avg_automation = sum(s.automation_theatre for s in all_scores) / len(all_scores)
        
        if avg_actionability < 7:
            print("\n[HIGH PRIORITY] Improve Actionability:")
            print("• Add specific dollar amounts and percentages to all recommendations")
            print("• Include concrete timelines (e.g., '6 months', 'quarterly')")
            print("• Start each step with a strong action verb")
            print("• Remove vague terms like 'consider' or 'maybe'")
        
        if avg_personalization < 7:
            print("\n[HIGH PRIORITY] Enhance Personalization:")
            print("• Always reference the user's actual income and expenses")
            print("• Use demographic-appropriate language (Gen Z vs Mid-Career)")
            print("• Include user's specific financial numbers in explanations")
            print("• Tailor advice to their life stage and situation")
        
        if avg_automation < 7:
            print("\n[MEDIUM PRIORITY] Improve Trust & Polish:")
            print("• Ensure all cards have complete information")
            print("• Use confidence-inspiring language")
            print("• Remove any technical artifacts or placeholders")
            print("• Format potential savings consistently")
        
        # Final verdict
        print("\n" + "="*70)
        print("FINAL VERDICT: AUTOMATION THEATRE ASSESSMENT")
        print("="*70)
        
        trust_score = avg_automation
        print(f"\nTRUST SCORE: {trust_score:.1f}/10")
        
        if overall_avg >= 8 and trust_score >= 7:
            print("\n✓ PRODUCTION READY")
            print("The AI system delivers high-quality, trustworthy financial insights.")
            print("Users will feel confident relying on these recommendations.")
        elif overall_avg >= 6:
            print("\n~ NEEDS IMPROVEMENT")
            print("The system works but requires refinement for production use.")
            print("Focus on the high-priority recommendations above.")
        else:
            print("\n✗ NOT READY")
            print("Significant quality issues prevent effective use.")
            print("Major improvements needed in personalization and actionability.")
        
        # Save report
        self.save_report(overall_avg, metrics, trust_score)
    
    def save_report(self, overall_avg: float, metrics: Dict, trust_score: float):
        """Save detailed report to JSON."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "overall_score": overall_avg,
                "trust_score": trust_score,
                "total_evaluations": len(self.scoring_matrix)
            },
            "metrics": {k: sum(v)/len(v) for k, v in metrics.items()},
            "scoring_details": {k: v.to_dict() for k, v in self.scoring_matrix.items()},
            "excellent_examples": self.excellent_examples[:5],
            "poor_examples": self.poor_examples[:5],
            "findings": self.findings
        }
        
        with open("ai_insights_audit_report.json", 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: ai_insights_audit_report.json")


async def main():
    """Run the AI insights quality audit."""
    print("\n" + "="*70)
    print("AI-GENERATED INSIGHTS QUALITY AUDIT")
    print("Direct Evaluation of Financial Explanations")
    print("="*70)
    
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("ANTHROPIC_API_KEY"):
        print("\n⚠️  WARNING: No AI API keys found")
        print("   Using fallback generation (limited quality)")
        print("   Set OPENAI_API_KEY or ANTHROPIC_API_KEY for full evaluation\n")
    
    auditor = AIInsightsAuditor()
    
    # Run comprehensive audit
    await auditor.audit_all_combinations()
    
    # Generate detailed report
    auditor.generate_detailed_report()
    
    print("\n" + "="*70)
    print("AUDIT COMPLETE")
    print("="*70)


if __name__ == "__main__":
    asyncio.run(main())