"""
Test suite for AI explanation generation endpoint.
Validates card format, content quality, and performance requirements.
"""

import pytest
import asyncio
import json
import time
from typing import Dict, Any
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.ai_explanations import (
    AIExplanationGenerator, 
    AIActionPlan,
    StrategyType,
    SCENARIO_TEMPLATES
)


class TestAIExplanations:
    """Test AI explanation generation functionality."""
    
    @pytest.fixture
    def sample_profile(self) -> Dict[str, Any]:
        """Create sample profile for testing."""
        return {
            "demographic": "millennial",
            "monthly_income": 7500,
            "monthly_expenses": 4500,
            "emergency_fund": 15000,
            "student_loans": 35000,
            "net_worth": 45000,
            "age": 32
        }
    
    @pytest.fixture
    def sample_simulation_result(self) -> Dict[str, Any]:
        """Create sample simulation result for testing."""
        return {
            "result": {
                "scenario_name": "emergency_fund",
                "iterations": 10000,
                "percentiles": {
                    "p10": 4.2,
                    "p25": 5.8,
                    "p50": 7.5,
                    "p75": 9.2,
                    "p90": 11.1
                },
                "mean": 7.6,
                "std_dev": 2.1,
                "min_value": 2.5,
                "max_value": 15.3,
                "probability_success": 0.85,
                "confidence_interval_95": (5.2, 10.1),
                "processing_time_ms": 125.4
            }
        }
    
    @pytest.mark.asyncio
    async def test_card_format_validation(self, sample_profile, sample_simulation_result):
        """Test that generated cards match required format exactly."""
        generator = AIExplanationGenerator()
        
        try:
            # Generate cards for emergency fund scenario
            cards = await generator.generate_explanations(
                profile=sample_profile,
                simulation_result=sample_simulation_result,
                scenario_type="emergency_fund"
            )
            
            # Verify we get exactly 3 cards
            assert len(cards) == 3, "Should generate exactly 3 cards"
            
            # Verify each card has required fields
            required_fields = {
                'id', 'title', 'description', 'tag', 
                'tagColor', 'potentialSaving', 'rationale', 'steps'
            }
            
            for i, card in enumerate(cards):
                card_dict = card.__dict__ if hasattr(card, '__dict__') else card
                
                # Check all required fields exist
                missing_fields = required_fields - set(card_dict.keys())
                assert not missing_fields, f"Card {i} missing fields: {missing_fields}"
                
                # Validate field types
                assert isinstance(card_dict['id'], str)
                assert isinstance(card_dict['title'], str)
                assert isinstance(card_dict['description'], str)
                assert isinstance(card_dict['tag'], str)
                assert isinstance(card_dict['tagColor'], str)
                assert isinstance(card_dict['potentialSaving'], (int, str))
                assert isinstance(card_dict['rationale'], str)
                assert isinstance(card_dict['steps'], list)
                assert len(card_dict['steps']) == 4, "Should have exactly 4 steps"
                
                # Validate tagColor format
                assert 'bg-' in card_dict['tagColor'], "tagColor should contain bg- class"
                assert 'text-' in card_dict['tagColor'], "tagColor should contain text- class"
                
                # Validate rationale length (150-250 words typical)
                word_count = len(card_dict['rationale'].split())
                assert 50 <= word_count <= 300, f"Rationale should be 50-300 words, got {word_count}"
        
        finally:
            await generator.close()
    
    @pytest.mark.asyncio
    async def test_strategy_differentiation(self, sample_profile, sample_simulation_result):
        """Test that each strategy type generates distinct content."""
        generator = AIExplanationGenerator()
        
        try:
            cards = await generator.generate_explanations(
                profile=sample_profile,
                simulation_result=sample_simulation_result,
                scenario_type="emergency_fund"
            )
            
            # Extract cards by strategy type
            conservative = cards[0]
            balanced = cards[1]
            aggressive = cards[2]
            
            # Verify different titles
            assert conservative.title != balanced.title
            assert balanced.title != aggressive.title
            
            # Verify different tags
            assert conservative.tag != aggressive.tag
            
            # Verify different tagColors
            assert conservative.tagColor != balanced.tagColor
            assert balanced.tagColor != aggressive.tagColor
            
            # Verify different potential savings
            assert conservative.potentialSaving != aggressive.potentialSaving
            
            # Verify rationales are substantively different
            assert conservative.rationale != balanced.rationale
            assert balanced.rationale != aggressive.rationale
        
        finally:
            await generator.close()
    
    @pytest.mark.asyncio
    async def test_scenario_personalization(self, sample_profile):
        """Test that different scenarios generate appropriate content."""
        generator = AIExplanationGenerator()
        
        try:
            # Create simulation results for both scenarios
            emergency_result = {
                "result": {
                    "percentiles": {"p10": 4.2, "p50": 7.5, "p75": 9.2, "p90": 11.1},
                    "probability_success": 0.85
                }
            }
            
            loan_result = {
                "result": {
                    "percentiles": {"p10": 60, "p50": 84, "p75": 96, "p90": 120},
                    "probability_success": 0.90
                }
            }
            
            # Generate cards for emergency fund
            emergency_cards = await generator.generate_explanations(
                profile=sample_profile,
                simulation_result=emergency_result,
                scenario_type="emergency_fund"
            )
            
            # Generate cards for student loans
            loan_cards = await generator.generate_explanations(
                profile=sample_profile,
                simulation_result=loan_result,
                scenario_type="student_loan_payoff"
            )
            
            # Verify scenario-specific content
            for card in emergency_cards:
                # Emergency fund cards should mention runway/months
                assert any(word in str(card.potentialSaving).lower() 
                          for word in ['month', 'runway'])
            
            for card in loan_cards:
                # Loan cards should mention timeline/faster
                assert any(word in str(card.potentialSaving).lower() 
                          for word in ['month', 'faster', 'timeline', 'standard'])
        
        finally:
            await generator.close()
    
    @pytest.mark.asyncio
    async def test_simulation_data_integration(self, sample_profile, sample_simulation_result):
        """Test that real simulation numbers appear in generated content."""
        generator = AIExplanationGenerator()
        
        try:
            cards = await generator.generate_explanations(
                profile=sample_profile,
                simulation_result=sample_simulation_result,
                scenario_type="emergency_fund"
            )
            
            # Check that simulation percentiles are referenced
            all_rationales = ' '.join(card.rationale for card in cards)
            
            # Should reference at least some percentile values
            percentiles = sample_simulation_result['result']['percentiles']
            percentile_values = [
                str(int(percentiles['p50'])),  # 7
                str(int(percentiles['p75'])),  # 9
                str(int(percentiles['p90']))   # 11
            ]
            
            values_found = sum(1 for val in percentile_values if val in all_rationales)
            assert values_found > 0, "Rationales should reference simulation percentiles"
            
            # Should reference monthly income/expenses
            income_referenced = str(int(sample_profile['monthly_income'])) in all_rationales or \
                               str(sample_profile['monthly_income']) in all_rationales
            assert income_referenced, "Should reference user's monthly income"
        
        finally:
            await generator.close()
    
    @pytest.mark.asyncio
    async def test_performance_requirements(self, sample_profile, sample_simulation_result):
        """Test that explanation generation meets sub-2 second requirement."""
        generator = AIExplanationGenerator()
        
        try:
            start_time = time.time()
            
            cards = await generator.generate_explanations(
                profile=sample_profile,
                simulation_result=sample_simulation_result,
                scenario_type="emergency_fund"
            )
            
            elapsed_time = time.time() - start_time
            
            # Should complete within 2 seconds (even with fallback)
            assert elapsed_time < 2.0, f"Generation took {elapsed_time:.2f}s, exceeds 2s limit"
            
            # Verify cards were generated
            assert len(cards) == 3
        
        finally:
            await generator.close()
    
    @pytest.mark.asyncio
    async def test_fallback_generation(self, sample_profile, sample_simulation_result):
        """Test fallback generation when AI APIs are unavailable."""
        generator = AIExplanationGenerator()
        
        # Temporarily disable AI providers
        original_provider = generator.provider
        generator.provider = None
        
        try:
            cards = await generator.generate_explanations(
                profile=sample_profile,
                simulation_result=sample_simulation_result,
                scenario_type="emergency_fund"
            )
            
            # Should still generate valid cards
            assert len(cards) == 3
            
            # Check quality of fallback content
            for card in cards:
                # Should have substantive rationale
                assert len(card.rationale) > 100
                
                # Should have 4 actionable steps
                assert len(card.steps) == 4
                for step in card.steps:
                    assert len(step) > 10  # Each step should be meaningful
                
                # Should include real numbers
                assert '$' in card.rationale  # Should mention dollar amounts
        
        finally:
            generator.provider = original_provider
            await generator.close()
    
    @pytest.mark.asyncio
    async def test_all_customer_profiles(self):
        """Test with all three customer profiles."""
        generator = AIExplanationGenerator()
        
        profiles = [
            {
                "id": 1,
                "demographic": "genz",
                "monthly_income": 3500,
                "monthly_expenses": 2800,
                "emergency_fund": 2000,
                "student_loans": 28000,
                "age": 24
            },
            {
                "id": 2,
                "demographic": "millennial",
                "monthly_income": 7500,
                "monthly_expenses": 4500,
                "emergency_fund": 15000,
                "student_loans": 35000,
                "age": 32
            },
            {
                "id": 3,
                "demographic": "midcareer",
                "monthly_income": 12000,
                "monthly_expenses": 7000,
                "emergency_fund": 40000,
                "student_loans": 15000,
                "age": 45
            }
        ]
        
        simulation_result = {
            "result": {
                "percentiles": {"p10": 4.2, "p50": 7.5, "p75": 9.2, "p90": 11.1},
                "probability_success": 0.85
            }
        }
        
        try:
            for profile in profiles:
                cards = await generator.generate_explanations(
                    profile=profile,
                    simulation_result=simulation_result,
                    scenario_type="emergency_fund"
                )
                
                assert len(cards) == 3, f"Profile {profile['id']} should generate 3 cards"
                
                # Verify demographic-specific content
                all_content = ' '.join(card.rationale for card in cards)
                
                # Should reference income level
                income_str = str(int(profile['monthly_income']))
                assert income_str in all_content or \
                       f"${profile['monthly_income']:,}" in all_content
        
        finally:
            await generator.close()


def test_scenario_templates():
    """Test that scenario templates are properly defined."""
    
    # Check both scenarios exist
    assert "emergency_fund" in SCENARIO_TEMPLATES
    assert "student_loan_payoff" in SCENARIO_TEMPLATES
    
    # Check all strategy types exist for each scenario
    for scenario in ["emergency_fund", "student_loan_payoff"]:
        templates = SCENARIO_TEMPLATES[scenario]
        
        assert "conservative" in templates
        assert "balanced" in templates
        assert "aggressive" in templates
        
        # Check required fields in each template
        for strategy in ["conservative", "balanced", "aggressive"]:
            template = templates[strategy]
            
            assert "title" in template
            assert "description" in template
            assert "tag" in template
            assert "tagColor" in template
            
            # Validate tagColor format
            assert "bg-" in template["tagColor"]
            assert "text-" in template["tagColor"]


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])