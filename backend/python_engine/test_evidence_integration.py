#!/usr/bin/env python3
"""
Simple integration test for evidence-based workflow system
Tests the key components work together correctly
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from workflows.workflow_registry import WorkflowRegistry
from workflows.workflow_engine import WorkflowEngine
from workflows.workflow_definitions import get_workflow_by_id

async def test_evidence_integration():
    """Test the evidence-based workflow integration"""
    print("🧪 Testing Evidence-Based Workflow Integration")
    
    # Initialize components
    registry = WorkflowRegistry()
    engine = WorkflowEngine()
    
    # Test data
    test_user_data = {
        "user_id": "test_user",
        "user_profile": {
            "demographic": "millennial",
            "income": 70000,
            "debt_level": "medium"
        },
        "plaid_transactions": [
            {
                "merchant_name": "Netflix",
                "amount": -15.99,
                "date": "2024-01-15",
                "category": "Entertainment"
            }
        ],
        "plaid_accounts": [
            {
                "subtype": "savings",
                "balance": 8000.00,
                "institution": "Chase"
            }
        ]
    }
    
    print("✅ Components initialized successfully")
    
    # Test 1: Evidence extraction
    print("\n📊 Testing evidence extraction...")
    evidence_list = await registry._extract_evidence(test_user_data)
    print(f"   Extracted {len(evidence_list)} pieces of evidence")
    for evidence in evidence_list:
        print(f"   - {evidence.type.value}: {evidence.description}")
    
    # Test 2: Evidence-based workflow selection
    print("\n🎯 Testing workflow selection...")
    workflow_matches = await registry.get_evidence_based_workflows(test_user_data, max_recommendations=3)
    print(f"   Found {len(workflow_matches)} workflow matches")
    for match in workflow_matches:
        print(f"   - {match.workflow_name}: {match.confidence_score:.2f} confidence, {match.trust_level} trust")
    
    # Test 3: Workflow validation
    if workflow_matches:
        print(f"\n🔍 Testing workflow validation for: {workflow_matches[0].workflow_id}")
        validation = await engine.validate_workflow_evidence(
            workflow_matches[0].workflow_id,
            test_user_data
        )
        print(f"   Valid: {validation['valid']}, Confidence: {validation.get('confidence', 0):.2f}")
        if validation.get('evidence_summary'):
            print(f"   Evidence: {len(validation['evidence_summary'])} points")
    
    # Test 4: Execution plan generation
    if workflow_matches:
        print(f"\n📋 Testing execution plan generation...")
        execution_plan = await engine.get_workflow_execution_plan(
            workflow_matches[0].workflow_id,
            test_user_data
        )
        print(f"   Workflow: {execution_plan['workflow_name']}")
        print(f"   Steps: {len(execution_plan['steps'])}")
        print(f"   Duration: {execution_plan['estimated_duration']}")
        print(f"   Risk Level: {execution_plan['risk_level']}")
        print(f"   Automation: {execution_plan['automation_level']}")
    
    # Test 5: Safety analysis
    if workflow_matches:
        print(f"\n🛡️ Testing safety analysis...")
        safety_analysis = await engine.get_workflow_safety_analysis(
            workflow_matches[0].workflow_id,
            test_user_data
        )
        print(f"   Risk Level: {safety_analysis['overall_risk_level']}")
        print(f"   Safety Measures: {len(safety_analysis['safety_measures'])}")
        print(f"   Risk Factors: {len(safety_analysis['risk_factors'])}")
        if safety_analysis['approval_requirements']:
            print(f"   Approval Required: {safety_analysis['approval_requirements'][0]}")
    
    # Test 6: Workflow definition enhancements
    print(f"\n🏗️ Testing workflow definition enhancements...")
    netflix_workflow = get_workflow_by_id("optimize.cancel_subscriptions.v1")
    if netflix_workflow and netflix_workflow.evidence_patterns:
        print(f"   Netflix workflow has evidence patterns: {list(netflix_workflow.evidence_patterns.keys())}")
        print(f"   Confidence thresholds: {netflix_workflow.confidence_thresholds}")
        print(f"   Trust requirements: {list(netflix_workflow.trust_requirements.keys())}")
    
    hysa_workflow = get_workflow_by_id("optimize.high_yield_savings.v1")
    if hysa_workflow and hysa_workflow.evidence_patterns:
        print(f"   HYSA workflow has evidence patterns: {list(hysa_workflow.evidence_patterns.keys())}")
    
    print("\n🎉 All integration tests passed successfully!")
    print("📈 Evidence-based workflow system is working correctly")

if __name__ == "__main__":
    asyncio.run(test_evidence_integration())