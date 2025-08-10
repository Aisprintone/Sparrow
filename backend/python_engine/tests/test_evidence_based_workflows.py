"""
Tests for Evidence-Based Workflow System
Tests the integrated evidence-based workflow selection, validation, and execution
"""

import pytest
import asyncio
from typing import Dict, Any
from unittest.mock import Mock, patch
from datetime import datetime

# Import the system components
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from workflows.workflow_registry import WorkflowRegistry, Evidence, EvidenceType, WorkflowMatch
from workflows.workflow_engine import WorkflowEngine
from workflows.workflow_definitions import get_workflow_by_id

class TestEvidenceBasedWorkflows:
    """Test suite for evidence-based workflow system"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.workflow_registry = WorkflowRegistry()
        self.workflow_engine = WorkflowEngine()
        
        # Sample user data for testing
        self.sample_user_data = {
            "user_id": "test_user_123",
            "user_profile": {
                "demographic": "millennial",
                "income": 75000,
                "debt_level": "medium"
            },
            "plaid_transactions": [
                {
                    "merchant_name": "Netflix",
                    "amount": -15.99,
                    "date": "2024-01-15",
                    "category": "Entertainment"
                },
                {
                    "merchant_name": "Chase Bank",
                    "amount": -25.00,
                    "date": "2024-01-10",
                    "category": "Bank Fees"
                }
            ],
            "plaid_accounts": [
                {
                    "account_id": "savings_001",
                    "subtype": "savings",
                    "balance": 8500.00,
                    "institution": "Chase"
                },
                {
                    "account_id": "checking_001",
                    "subtype": "checking", 
                    "balance": 2300.00,
                    "institution": "Chase"
                }
            ]
        }
    
    @pytest.mark.asyncio
    async def test_evidence_extraction_from_transactions(self):
        """Test evidence extraction from transaction data"""
        evidence_list = await self.workflow_registry._extract_transaction_evidence(
            self.sample_user_data["plaid_transactions"]
        )
        
        assert len(evidence_list) > 0
        netflix_evidence = next(
            (e for e in evidence_list if "netflix" in e.description.lower()), 
            None
        )
        assert netflix_evidence is not None
        assert netflix_evidence.type == EvidenceType.TRANSACTION_PATTERN
        assert netflix_evidence.confidence > 0.8
        assert "netflix_charges_present" in netflix_evidence.data
    
    @pytest.mark.asyncio
    async def test_evidence_extraction_from_accounts(self):
        """Test evidence extraction from account data"""
        evidence_list = await self.workflow_registry._extract_account_evidence(
            self.sample_user_data["plaid_accounts"]
        )
        
        assert len(evidence_list) > 0
        savings_evidence = next(
            (e for e in evidence_list if e.type == EvidenceType.ACCOUNT_BALANCE),
            None
        )
        assert savings_evidence is not None
        assert savings_evidence.data["savings_balance"] == 8500.00
        assert savings_evidence.data["current_apy"] == 0.01  # Mock low APY
        assert savings_evidence.confidence > 0.9
    
    @pytest.mark.asyncio
    async def test_evidence_based_workflow_selection(self):
        """Test evidence-based workflow selection"""
        workflow_matches = await self.workflow_registry.get_evidence_based_workflows(
            self.sample_user_data, max_recommendations=3
        )
        
        assert len(workflow_matches) > 0
        assert all(isinstance(match, WorkflowMatch) for match in workflow_matches)
        
        # Check that workflow matches are sorted by confidence
        for i in range(1, len(workflow_matches)):
            assert workflow_matches[i-1].confidence_score >= workflow_matches[i].confidence_score
        
        # Check that high-confidence matches have evidence
        high_confidence_matches = [m for m in workflow_matches if m.confidence_score > 0.8]
        for match in high_confidence_matches:
            assert len(match.evidence) > 0
            assert match.explanation
            assert match.trust_level in ["high", "very_high"]
    
    @pytest.mark.asyncio
    async def test_workflow_evidence_validation(self):
        """Test workflow evidence validation"""
        # Test Netflix cancellation workflow validation
        validation = await self.workflow_engine.validate_workflow_evidence(
            "optimize.cancel_subscriptions.v1", 
            self.sample_user_data
        )
        
        assert "valid" in validation
        assert "confidence" in validation
        assert "evidence_summary" in validation
        
        if validation["valid"]:
            assert validation["confidence"] > 0.0
            assert len(validation["evidence_summary"]) > 0
    
    @pytest.mark.asyncio
    async def test_workflow_execution_plan_generation(self):
        """Test workflow execution plan generation"""
        execution_plan = await self.workflow_engine.get_workflow_execution_plan(
            "optimize.high_yield_savings.v1",
            self.sample_user_data
        )
        
        assert execution_plan["workflow_id"] == "optimize.high_yield_savings.v1"
        assert "workflow_name" in execution_plan
        assert "steps" in execution_plan
        assert "evidence_validation" in execution_plan
        assert "automation_level" in execution_plan
        assert "risk_level" in execution_plan
        
        # Check steps structure
        assert len(execution_plan["steps"]) > 0
        first_step = execution_plan["steps"][0]
        assert "step_number" in first_step
        assert "name" in first_step
        assert "type" in first_step
    
    @pytest.mark.asyncio
    async def test_workflow_safety_analysis(self):
        """Test workflow safety analysis"""
        safety_analysis = await self.workflow_engine.get_workflow_safety_analysis(
            "optimize.cancel_subscriptions.v1",
            self.sample_user_data
        )
        
        assert "workflow_id" in safety_analysis
        assert "overall_risk_level" in safety_analysis
        assert "safety_measures" in safety_analysis
        assert "risk_factors" in safety_analysis
        assert "approval_requirements" in safety_analysis
        
        # Check that safety measures are provided
        assert len(safety_analysis["safety_measures"]) > 0
        assert len(safety_analysis["risk_factors"]) > 0
    
    def test_confidence_to_trust_level_mapping(self):
        """Test confidence score to trust level mapping"""
        registry = self.workflow_registry
        
        assert registry._get_trust_level(0.95) == "very_high"
        assert registry._get_trust_level(0.80) == "high"
        assert registry._get_trust_level(0.65) == "medium"
        assert registry._get_trust_level(0.45) == "low"
        assert registry._get_trust_level(0.25) == "very_low"
    
    def test_automation_level_determination(self):
        """Test automation level determination"""
        engine = self.workflow_engine
        
        assert engine._determine_automation_level(0.95) == "full"
        assert engine._determine_automation_level(0.80) == "assisted" 
        assert engine._determine_automation_level(0.65) == "manual"
    
    @pytest.mark.asyncio
    async def test_evidence_pattern_evaluation(self):
        """Test evidence pattern evaluation logic"""
        # Create mock evidence
        test_evidence = [
            Evidence(
                type=EvidenceType.TRANSACTION_PATTERN,
                source="plaid_transactions",
                data={"netflix_charges_present": True, "usage_hours_last_60_days": 2.1},
                confidence=0.95,
                timestamp=datetime.now(),
                description="Netflix subscription detected with low usage"
            )
        ]
        
        # Test required pattern
        required_pattern = {"required": True, "weight": 0.4}
        score = self.workflow_engine._evaluate_evidence_pattern(required_pattern, test_evidence)
        assert score == 1.0
        
        # Test threshold pattern - should meet threshold
        threshold_pattern = {"threshold": 5.0, "metric": "usage_hours_last_60_days", "weight": 0.3}
        score = self.workflow_engine._evaluate_evidence_pattern(threshold_pattern, test_evidence)
        assert score == 0.0  # 2.1 < 5.0, so should fail threshold
    
    @pytest.mark.asyncio
    async def test_personalized_workflow_caching(self):
        """Test that personalized workflows are cached for performance"""
        # First call
        workflow_matches_1 = await self.workflow_engine.get_personalized_workflows(
            self.sample_user_data
        )
        
        # Second call with same data should use cache
        workflow_matches_2 = await self.workflow_engine.get_personalized_workflows(
            self.sample_user_data
        )
        
        # Results should be identical (from cache)
        assert len(workflow_matches_1) == len(workflow_matches_2)
    
    def test_workflow_definition_evidence_patterns(self):
        """Test that workflow definitions include evidence patterns"""
        # Test Netflix cancellation workflow
        netflix_workflow = get_workflow_by_id("optimize.cancel_subscriptions.v1")
        assert netflix_workflow is not None
        assert netflix_workflow.evidence_patterns is not None
        assert "subscription_charges_detected" in netflix_workflow.evidence_patterns
        assert netflix_workflow.confidence_thresholds is not None
        assert netflix_workflow.trust_requirements is not None
        
        # Test high-yield savings workflow
        hysa_workflow = get_workflow_by_id("optimize.high_yield_savings.v1")
        assert hysa_workflow is not None
        assert hysa_workflow.evidence_patterns is not None
        assert "low_yield_savings_detected" in hysa_workflow.evidence_patterns
    
    @pytest.mark.asyncio
    async def test_empty_user_data_handling(self):
        """Test handling of empty or invalid user data"""
        empty_data = {}
        
        workflow_matches = await self.workflow_registry.get_evidence_based_workflows(empty_data)
        assert isinstance(workflow_matches, list)
        assert len(workflow_matches) == 0  # Should return empty list, not error
    
    @pytest.mark.asyncio
    async def test_invalid_workflow_id_handling(self):
        """Test handling of invalid workflow IDs"""
        validation = await self.workflow_engine.validate_workflow_evidence(
            "invalid.workflow.id",
            self.sample_user_data
        )
        
        assert validation["valid"] is False
        assert "reason" in validation
    
    @pytest.mark.asyncio
    async def test_evidence_explanation_generation(self):
        """Test evidence-based explanation generation"""
        # Test Netflix explanation
        explanation = self.workflow_registry._generate_evidence_explanation(
            "optimize.cancel_subscriptions.v1",
            [],  # Mock evidence list
            {
                "monthly_cost": 15.99,
                "usage_hours_last_60_days": 1.3,
                "cost_per_hour": 12.30
            }
        )
        
        assert "Netflix" in explanation
        assert "1.3 hours" in explanation
        assert "save" in explanation.lower()
        
        # Test HYSA explanation
        hysa_explanation = self.workflow_registry._generate_evidence_explanation(
            "optimize.high_yield_savings.v1",
            [],
            {
                "savings_balance": 8000,
                "annual_opportunity": 352.00
            }
        )
        
        assert "8,000" in hysa_explanation
        assert "4.5%" in hysa_explanation
        assert "352" in hysa_explanation

class TestWorkflowIntegration:
    """Integration tests for the complete evidence-based workflow system"""
    
    def setup_method(self):
        """Set up integration test fixtures"""
        self.workflow_engine = WorkflowEngine()
        
        self.integration_user_data = {
            "user_id": "integration_test_user",
            "user_profile": {
                "demographic": "millennial",
                "income": 65000,
                "debt_level": "low"
            },
            "plaid_transactions": [
                {"merchant_name": "Netflix", "amount": -15.99, "date": "2024-01-15"},
                {"merchant_name": "Spotify", "amount": -9.99, "date": "2024-01-12"},
                {"merchant_name": "Comcast", "amount": -89.99, "date": "2024-01-08"}
            ],
            "plaid_accounts": [
                {"subtype": "savings", "balance": 12000.00, "institution": "Chase"},
                {"subtype": "checking", "balance": 3200.00, "institution": "Chase"}
            ]
        }
    
    @pytest.mark.asyncio
    async def test_end_to_end_workflow_recommendation(self):
        """Test complete end-to-end workflow recommendation flow"""
        # Get personalized recommendations
        workflow_matches = await self.workflow_engine.get_personalized_workflows(
            self.integration_user_data
        )
        
        assert len(workflow_matches) > 0
        
        # For each match, validate evidence and generate execution plan
        for match in workflow_matches[:2]:  # Test first 2 matches
            # Validate evidence
            validation = await self.workflow_engine.validate_workflow_evidence(
                match.workflow_id,
                self.integration_user_data
            )
            
            if validation["valid"]:
                # Generate execution plan
                execution_plan = await self.workflow_engine.get_workflow_execution_plan(
                    match.workflow_id,
                    self.integration_user_data
                )
                
                assert execution_plan["workflow_id"] == match.workflow_id
                assert len(execution_plan["steps"]) > 0
                
                # Generate safety analysis
                safety_analysis = await self.workflow_engine.get_workflow_safety_analysis(
                    match.workflow_id,
                    self.integration_user_data
                )
                
                assert "safety_measures" in safety_analysis
                assert len(safety_analysis["safety_measures"]) > 0

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])