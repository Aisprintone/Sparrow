"""
Test Personalization Scaling Engine
====================================
Validates that recommendations properly scale based on net worth and demographics.
Tests the critical fix for GenZ vs Millennial personalization gap.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.recommendation_scaling_engine import (
    ProfileAnalyzer,
    DemographicAwareScaler,
    RecommendationPersonalizer,
    FinancialCapacityTier,
    create_recommendation_personalizer
)
from ai.unified_card_generator import UnifiedCardGenerator
import json


def test_scaling_engine():
    """Test the scaling engine with different profiles"""
    
    # Initialize components
    analyzer = ProfileAnalyzer()
    scaler = DemographicAwareScaler(analyzer)
    personalizer = RecommendationPersonalizer(scaler, analyzer)
    
    # Test Profile 1: GenZ with negative net worth
    genz_profile = {
        'demographic': 'genz',
        'age': 23,
        'net_worth': -21000,
        'portfolio_value': 3000,
        'monthly_income': 4000,
        'monthly_expenses': 3500,
        'monthly_debt_payments': 400,
        'total_debt': 24000
    }
    
    # Test Profile 2: Millennial with high net worth
    millennial_profile = {
        'demographic': 'millennial',
        'age': 34,
        'net_worth': 210000,
        'portfolio_value': 550000,
        'monthly_income': 12000,
        'monthly_expenses': 7000,
        'monthly_debt_payments': 1500,
        'total_debt': 340000  # Mortgage
    }
    
    print("=" * 80)
    print("PERSONALIZATION SCALING ENGINE TEST")
    print("=" * 80)
    
    # Analyze GenZ profile
    print("\n📊 GenZ Profile Analysis:")
    print(f"  Age: {genz_profile['age']}")
    print(f"  Net Worth: ${genz_profile['net_worth']:,}")
    print(f"  Portfolio: ${genz_profile['portfolio_value']:,}")
    print(f"  Monthly Income: ${genz_profile['monthly_income']:,}")
    
    genz_tier = analyzer.analyze_capacity(genz_profile)
    genz_disposable = analyzer.calculate_disposable_income(genz_profile)
    print(f"  Capacity Tier: {genz_tier.value}")
    print(f"  Disposable Income: ${genz_disposable:,.0f}/month")
    
    # Test scaling for GenZ
    base_amount = 50
    genz_scaled = scaler.scale_amount(base_amount, genz_profile)
    print(f"  Base $50 scales to: ${genz_scaled:,.0f}")
    
    # Analyze Millennial profile
    print("\n📊 Millennial Profile Analysis:")
    print(f"  Age: {millennial_profile['age']}")
    print(f"  Net Worth: ${millennial_profile['net_worth']:,}")
    print(f"  Portfolio: ${millennial_profile['portfolio_value']:,}")
    print(f"  Monthly Income: ${millennial_profile['monthly_income']:,}")
    
    millennial_tier = analyzer.analyze_capacity(millennial_profile)
    millennial_disposable = analyzer.calculate_disposable_income(millennial_profile)
    print(f"  Capacity Tier: {millennial_tier.value}")
    print(f"  Disposable Income: ${millennial_disposable:,.0f}/month")
    
    # Test scaling for Millennial
    millennial_scaled = scaler.scale_amount(base_amount, millennial_profile)
    print(f"  Base $50 scales to: ${millennial_scaled:,.0f}")
    
    # Calculate scaling ratio
    scaling_ratio = millennial_scaled / genz_scaled if genz_scaled > 0 else 0
    print(f"\n🎯 Scaling Ratio: {scaling_ratio:.1f}x")
    print(f"   Millennial gets {scaling_ratio:.1f}x larger recommendations than GenZ")
    
    # Test with realistic recommendation
    print("\n" + "=" * 80)
    print("TESTING REALISTIC RECOMMENDATIONS")
    print("=" * 80)
    
    base_recommendation = {
        'id': 'test_recommendation',
        'title': 'Build Emergency Fund',
        'potentialSaving': 5000,
        'action': 'Save $100/month for emergency fund'
    }
    
    # Personalize for GenZ
    genz_personalized = personalizer.personalize_recommendation(
        base_recommendation.copy(), 
        genz_profile
    )
    
    print("\n🎮 GenZ Personalized Recommendation:")
    print(f"  Original Amount: ${base_recommendation['potentialSaving']:,}")
    print(f"  Personalized Amount: ${genz_personalized['potentialSaving']:,}")
    print(f"  Action: {genz_personalized['action']}")
    print(f"  Tier: {genz_personalized['personalization_context']['capacity_tier']}")
    
    # Personalize for Millennial
    millennial_personalized = personalizer.personalize_recommendation(
        base_recommendation.copy(),
        millennial_profile
    )
    
    print("\n💼 Millennial Personalized Recommendation:")
    print(f"  Original Amount: ${base_recommendation['potentialSaving']:,}")
    print(f"  Personalized Amount: ${millennial_personalized['potentialSaving']:,}")
    print(f"  Action: {millennial_personalized['action']}")
    print(f"  Tier: {millennial_personalized['personalization_context']['capacity_tier']}")
    
    # Calculate effectiveness
    genz_effectiveness = min(10, genz_personalized['potentialSaving'] / max(1, genz_disposable * 12))
    millennial_effectiveness = min(10, millennial_personalized['potentialSaving'] / max(1, millennial_disposable * 12))
    
    print("\n" + "=" * 80)
    print("PERSONALIZATION EFFECTIVENESS SCORES")
    print("=" * 80)
    print(f"GenZ Effectiveness: {genz_effectiveness:.1f}/10")
    print(f"Millennial Effectiveness: {millennial_effectiveness:.1f}/10")
    
    # Success criteria
    success = (
        millennial_personalized['potentialSaving'] > genz_personalized['potentialSaving'] * 2
        and genz_effectiveness >= 6
        and millennial_effectiveness >= 6
    )
    
    print("\n" + "=" * 80)
    if success:
        print("✅ SUCCESS: Personalization properly scales with financial capacity!")
        print(f"   - Millennial recommendations are {millennial_personalized['potentialSaving'] / genz_personalized['potentialSaving']:.1f}x larger")
        print(f"   - Both demographics receive appropriate recommendations")
    else:
        print("❌ FAILURE: Personalization not properly scaling")
    print("=" * 80)
    
    return success


def test_card_generation_with_scaling():
    """Test that the unified card generator uses scaling properly"""
    
    print("\n" + "=" * 80)
    print("TESTING CARD GENERATION WITH SCALING")
    print("=" * 80)
    
    generator = UnifiedCardGenerator()
    
    # Test profiles
    profiles = {
        'genz': {
            'demographic': 'genz',
            'age': 23,
            'net_worth': -21000,
            'portfolio_value': 3000,
            'monthly_income': 4000,
            'monthly_expenses': 3500,
            'monthly_debt_payments': 400
        },
        'millennial': {
            'demographic': 'millennial',
            'age': 34,
            'net_worth': 210000,
            'portfolio_value': 550000,
            'monthly_income': 12000,
            'monthly_expenses': 7000,
            'monthly_debt_payments': 1500
        }
    }
    
    simulation_data = {
        'scenario_name': 'emergency_fund',
        'survival_months': 2,
        'scenario_type': 'emergency_fund'
    }
    
    for profile_name, profile in profiles.items():
        print(f"\n📊 Testing {profile_name.upper()} Profile:")
        print(f"   Net Worth: ${profile['net_worth']:,}")
        print(f"   Portfolio: ${profile['portfolio_value']:,}")
        
        cards = generator.generate_cards(
            simulation_data=simulation_data,
            user_profile=profile,
            scenario_config={'target_months': 6}
        )
        
        print(f"\n   Generated {len(cards)} cards:")
        for i, card in enumerate(cards, 1):
            print(f"   Card {i}: {card.get('title', 'No title')}")
            print(f"      Potential Saving: ${card.get('potentialSaving', 0):,}")
            if 'action' in card:
                print(f"      Action: {card['action'][:60]}...")
            if 'context' in card and 'capacity_tier' in card['context']:
                print(f"      Capacity Tier: {card['context']['capacity_tier']}")
    
    # Compare first card amounts
    genz_cards = generator.generate_cards(simulation_data, profiles['genz'], {'target_months': 6})
    millennial_cards = generator.generate_cards(simulation_data, profiles['millennial'], {'target_months': 6})
    
    genz_amount = genz_cards[0].get('potentialSaving', 0)
    millennial_amount = millennial_cards[0].get('potentialSaving', 0)
    
    print("\n" + "=" * 80)
    print("COMPARISON RESULTS:")
    print(f"GenZ Card 1 Amount: ${genz_amount:,}")
    print(f"Millennial Card 1 Amount: ${millennial_amount:,}")
    print(f"Scaling Factor: {millennial_amount / max(1, genz_amount):.1f}x")
    
    success = millennial_amount > genz_amount * 2
    if success:
        print("✅ Card generation properly scales with net worth!")
    else:
        print("❌ Card generation not scaling properly")
    print("=" * 80)
    
    return success


if __name__ == "__main__":
    print("\n🔬 TESTING AI PERSONALIZATION SCALING ENGINE\n")
    
    # Run tests
    test1_passed = test_scaling_engine()
    test2_passed = test_card_generation_with_scaling()
    
    # Summary
    print("\n" + "=" * 80)
    print("FINAL TEST RESULTS:")
    print("=" * 80)
    print(f"Scaling Engine Test: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Card Generation Test: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 ALL TESTS PASSED! Personalization properly scales with financial capacity.")
    else:
        print("\n⚠️ TESTS FAILED! Review the implementation.")
    print("=" * 80)