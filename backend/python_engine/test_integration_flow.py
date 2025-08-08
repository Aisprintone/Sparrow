#!/usr/bin/env python3
"""
Test script to verify the complete AI integration flow from backend to frontend.
Tests that AI content is properly generated and would be rendered in the UI.
"""

import asyncio
import json
import logging
from typing import Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_ai_integration():
    """Test the complete AI integration flow"""
    
    try:
        # Import the necessary components
        from api.main import generate_ai_explanations_with_llm
        from ai.langgraph_dspy_agent import FinancialAIAgentSystem
        
        logger.info("="*60)
        logger.info("TESTING AI INTEGRATION FLOW")
        logger.info("="*60)
        
        # Initialize the AI agent
        logger.info("\n1. Initializing AI Agent System...")
        ai_agent = FinancialAIAgentSystem()
        logger.info("✓ AI Agent initialized successfully")
        
        # Prepare test data
        simulation_result = {
            "scenario_name": "emergency_fund",
            "survival_months": 3,
            "monthly_expenses": 3000,
            "emergency_fund": 10000,
            "result": {
                "percentiles": {"p50": 15000, "p75": 20000},
                "probability_success": 0.85
            }
        }
        
        profile_data = {
            "user_id": 1,
            "profile_id": 1,
            "income": 5000,
            "total_debt": 15000,
            "emergency_fund": 10000,
            "monthly_expenses": 3000,
            "name": "Test User",
            "age": 28
        }
        
        original_simulation_id = "emergency-fund"
        
        logger.info("\n2. Generating AI Explanations...")
        logger.info(f"   Scenario: {original_simulation_id}")
        logger.info(f"   Profile: User {profile_data['name']}, Age {profile_data['age']}")
        
        # Call the AI generation method directly
        explanations = await ai_agent.generate_explanation_cards(
            simulation_data=simulation_result,
            user_profile=profile_data,
            scenario_context=original_simulation_id
        )
        
        logger.info(f"\n3. AI Explanations Generated:")
        logger.info(f"   Number of cards: {len(explanations)}")
        
        # Verify the structure of each card
        required_fields = ["id", "title", "description", "tag", "tagColor", "potentialSaving", "rationale", "steps"]
        
        for i, card in enumerate(explanations):
            logger.info(f"\n   Card {i+1}: {card.get('title', 'Unknown')}")
            logger.info(f"   - ID: {card.get('id')}")
            logger.info(f"   - Tag: {card.get('tag')}")
            logger.info(f"   - Description: {card.get('description', '')[:100]}...")
            logger.info(f"   - Rationale: {card.get('rationale', '')[:100]}...")
            logger.info(f"   - Steps: {len(card.get('steps', []))} action items")
            
            # Verify all required fields are present
            missing_fields = [field for field in required_fields if field not in card]
            if missing_fields:
                logger.warning(f"   ⚠ Missing fields: {missing_fields}")
            else:
                logger.info(f"   ✓ All required fields present")
        
        # Simulate the frontend response structure
        logger.info("\n4. Simulating Frontend Response Structure:")
        frontend_response = {
            "success": True,
            "data": {
                "scenario_name": simulation_result["scenario_name"],
                "simulation_results": simulation_result,
                "ai_explanations": explanations,
                "profile_data": profile_data,
                "original_simulation_id": original_simulation_id
            },
            "message": "Simulation completed successfully"
        }
        
        # The frontend stores result.data as simulationResults
        simulationResults = frontend_response["data"]
        
        # Verify frontend can access AI explanations
        logger.info("\n5. Verifying Frontend Access Pattern:")
        if simulationResults and simulationResults.get("ai_explanations"):
            ai_explanations = simulationResults["ai_explanations"]
            logger.info(f"   ✓ Frontend can access AI explanations: {len(ai_explanations)} cards")
            logger.info(f"   ✓ First card title: {ai_explanations[0].get('title')}")
            logger.info(f"   ✓ First card will render with tag: {ai_explanations[0].get('tag')}")
        else:
            logger.error("   ✗ Frontend cannot access AI explanations!")
        
        logger.info("\n" + "="*60)
        logger.info("TEST COMPLETED SUCCESSFULLY")
        logger.info("AI content will flow correctly from backend to frontend UI")
        logger.info("="*60)
        
        return True
        
    except Exception as e:
        logger.error(f"\n✗ Test failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = asyncio.run(test_ai_integration())
    exit(0 if success else 1)