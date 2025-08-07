"""
Unit tests for ProfileRAGSystem and ProfileRAGManager
"""

import pytest
import pandas as pd
import tempfile
import shutil
from pathlib import Path
import json
import sys

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from rag.profile_rag_system import (
    ProfileRAGSystem,
    ProfileRAGManager,
    get_rag_manager
)


class TestProfileRAGSystem:
    """Test cases for ProfileRAGSystem class"""
    
    @pytest.fixture
    def temp_csv_dir(self):
        """Create temporary directory with test CSV files"""
        temp_dir = tempfile.mkdtemp()
        
        # Create test account.csv
        account_data = {
            'account_id': [101, 102, 103, 201, 301],
            'customer_id': [1, 1, 1, 2, 3],
            'institution_name': ['Chase', 'Chase', 'Ally', 'Wells', 'BofA'],
            'account_type': ['checking', 'savings', 'credit_card', 'checking', 'savings'],
            'balance': [5000.0, 15000.0, -2000.0, 3000.0, 1000.0],
            'account_number': ['****1234', '****5678', '****9012', '****3456', '****7890']
        }
        pd.DataFrame(account_data).to_csv(f"{temp_dir}/account.csv", index=False)
        
        # Create test demographics.csv
        demographics_data = {
            'customer_id': [1, 2, 3],
            'age': [28, 35, 22],
            'income': [65000, 85000, 35000],
            'risk_tolerance': ['moderate', 'aggressive', 'conservative'],
            'location': ['NYC', 'SF', 'Austin']
        }
        pd.DataFrame(demographics_data).to_csv(f"{temp_dir}/demographics.csv", index=False)
        
        # Create empty transaction.csv for testing
        transaction_data = {
            'transaction_id': [1001, 1002],
            'customer_id': [1, 1],
            'amount': [-150.0, 3000.0],
            'category': ['groceries', 'salary'],
            'date': ['2024-01-15', '2024-01-01'],
            'description': ['Whole Foods', 'Monthly Salary']
        }
        pd.DataFrame(transaction_data).to_csv(f"{temp_dir}/transaction.csv", index=False)
        
        yield temp_dir
        
        # Cleanup
        shutil.rmtree(temp_dir)
    
    def test_profile_system_initialization(self, temp_csv_dir):
        """Test ProfileRAGSystem initialization with valid profile_id"""
        profile_id = 1
        system = ProfileRAGSystem(profile_id, temp_csv_dir)
        
        assert system.profile_id == profile_id
        assert system.csv_data_dir == temp_csv_dir
        assert system.vector_store is not None
        assert system.retriever is not None
        assert len(system.tools_registry) == 6
        
        # Check that profile data was loaded
        assert 'accounts' in system.profile_data
        assert 'demographics' in system.profile_data
        assert len(system.profile_data['accounts']) == 3  # Profile 1 has 3 accounts
        assert len(system.profile_data['demographics']) == 1  # Profile 1 has 1 demo record
    
    def test_csv_data_loading(self, temp_csv_dir):
        """Test CSV data loading and filtering"""
        system = ProfileRAGSystem(2, temp_csv_dir)  # Profile 2
        
        # Profile 2 should have 1 account
        assert len(system.profile_data['accounts']) == 1
        assert system.profile_data['accounts'].iloc[0]['customer_id'] == 2
        
        # Demographics should be filtered to profile 2
        assert len(system.profile_data['demographics']) == 1
        assert system.profile_data['demographics'].iloc[0]['customer_id'] == 2
    
    def test_document_creation(self, temp_csv_dir):
        """Test CSV to Document conversion"""
        system = ProfileRAGSystem(1, temp_csv_dir)
        documents = system._create_documents_from_data()
        
        assert len(documents) > 0
        
        # Check document structure
        for doc in documents:
            assert hasattr(doc, 'page_content')
            assert hasattr(doc, 'metadata')
            assert 'data_type' in doc.metadata
            assert 'customer_id' in doc.metadata
            assert doc.metadata['customer_id'] == 1
    
    def test_account_record_formatting(self, temp_csv_dir):
        """Test account record formatting to natural language"""
        system = ProfileRAGSystem(1, temp_csv_dir)
        
        # Test checking account formatting
        checking_row = {'account_type': 'checking', 'balance': 5000.0, 
                       'institution_name': 'Chase', 'account_number': '****1234'}
        formatted = system._format_account_record(checking_row)
        
        assert 'Checking account' in formatted
        assert 'Chase' in formatted
        assert '$5,000.00' in formatted
        
        # Test credit card formatting
        credit_row = {'account_type': 'credit_card', 'balance': -2000.0,
                     'institution_name': 'Ally', 'account_number': '****9012',
                     'credit_limit': 10000.0}
        formatted = system._format_account_record(credit_row)
        
        assert 'Credit card' in formatted
        assert '$2,000.00 owed' in formatted
        assert 'credit limit' in formatted
    
    def test_tool_registration(self, temp_csv_dir):
        """Test tool registration and availability"""
        system = ProfileRAGSystem(1, temp_csv_dir)
        
        expected_tools = [
            'query_accounts',
            'query_transactions', 
            'query_demographics',
            'query_goals',
            'query_investments',
            'query_all_data'
        ]
        
        for tool_name in expected_tools:
            assert tool_name in system.tools_registry
            tool = system.tools_registry[tool_name]
            assert hasattr(tool, 'name')
            assert hasattr(tool, 'description')
            assert hasattr(tool, 'func')
    
    def test_individual_tools(self, temp_csv_dir):
        """Test individual tool functionality"""
        system = ProfileRAGSystem(1, temp_csv_dir)
        
        # Test query_accounts tool
        accounts_result = system.query("What are my account balances?", "query_accounts")
        assert isinstance(accounts_result, str)
        assert len(accounts_result) > 0
        
        # Test query_demographics tool  
        demo_result = system.query("What is my risk profile?", "query_demographics")
        assert isinstance(demo_result, str)
        assert len(demo_result) > 0
        
        # Test query_all_data tool
        all_result = system.query("Tell me about my finances", "query_all_data")
        assert isinstance(all_result, str)
        assert len(all_result) > 0
    
    def test_missing_csv_files(self):
        """Test behavior when CSV files are missing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # No CSV files in directory
            system = ProfileRAGSystem(1, temp_dir)
            
            # Should initialize with empty DataFrames
            for data_type in ['accounts', 'transactions', 'demographics', 'goals', 'investments']:
                assert data_type in system.profile_data
                assert system.profile_data[data_type].empty
            
            # Should still have tools registered
            assert len(system.tools_registry) == 6
    
    def test_query_error_handling(self, temp_csv_dir):
        """Test error handling in queries"""
        system = ProfileRAGSystem(1, temp_csv_dir)
        
        # Test with invalid tool name
        result = system.query("test query", "invalid_tool")
        assert isinstance(result, str)
        # Should fall back to query_all_data
    
    def test_profile_summary(self, temp_csv_dir):
        """Test profile summary generation"""
        system = ProfileRAGSystem(1, temp_csv_dir)
        summary = system.get_profile_summary()
        
        assert summary['profile_id'] == 1
        assert 'data_types' in summary
        assert 'total_documents' in summary
        assert 'available_tools' in summary
        
        # Check data types summary
        assert 'accounts' in summary['data_types']
        assert summary['data_types']['accounts']['record_count'] == 3


class TestProfileRAGManager:
    """Test cases for ProfileRAGManager class"""
    
    @pytest.fixture
    def temp_csv_dir(self):
        """Create temporary directory with test CSV files"""
        temp_dir = tempfile.mkdtemp()
        
        # Create test account.csv with multiple profiles
        account_data = {
            'account_id': [101, 102, 201, 301],
            'customer_id': [1, 1, 2, 3],
            'institution_name': ['Chase', 'Chase', 'Wells', 'BofA'],
            'account_type': ['checking', 'savings', 'checking', 'savings'],
            'balance': [5000.0, 15000.0, 3000.0, 1000.0],
        }
        pd.DataFrame(account_data).to_csv(f"{temp_dir}/account.csv", index=False)
        
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    def test_manager_initialization(self, temp_csv_dir):
        """Test ProfileRAGManager initialization"""
        manager = ProfileRAGManager(temp_csv_dir)
        
        assert manager.csv_data_dir == temp_csv_dir
        assert isinstance(manager.profile_systems, dict)
        assert len(manager.profile_systems) == 0  # Systems created on demand
    
    def test_profile_system_creation_on_demand(self, temp_csv_dir):
        """Test profile systems are created on demand"""
        manager = ProfileRAGManager(temp_csv_dir)
        
        # Get system for profile 1
        system1 = manager.get_profile_system(1)
        assert isinstance(system1, ProfileRAGSystem)
        assert system1.profile_id == 1
        assert 1 in manager.profile_systems
        
        # Getting same profile should return cached system
        system1_again = manager.get_profile_system(1)
        assert system1 is system1_again  # Same object
        
        # Get system for profile 2
        system2 = manager.get_profile_system(2)
        assert system2.profile_id == 2
        assert system2 is not system1  # Different objects
    
    def test_query_profile(self, temp_csv_dir):
        """Test querying specific profiles"""
        manager = ProfileRAGManager(temp_csv_dir)
        
        # Query profile 1
        result1 = manager.query_profile(1, "What are my accounts?")
        assert isinstance(result1, str)
        assert len(result1) > 0
        
        # Query profile 2  
        result2 = manager.query_profile(2, "What are my accounts?")
        assert isinstance(result2, str)
        assert len(result2) > 0
        
        # Results should be different (different profile data)
        assert result1 != result2
    
    def test_all_profile_summaries(self, temp_csv_dir):
        """Test getting summaries for all profiles"""
        manager = ProfileRAGManager(temp_csv_dir)
        
        summaries = manager.get_all_profile_summaries()
        assert isinstance(summaries, dict)
        
        # Should have summaries for profiles 1, 2, 3
        for profile_id in [1, 2, 3]:
            assert profile_id in summaries
            summary = summaries[profile_id]
            if 'error' not in summary:
                assert summary['profile_id'] == profile_id
                assert 'data_types' in summary


class TestRAGManagerSingleton:
    """Test the global RAG manager singleton"""
    
    def test_singleton_behavior(self):
        """Test get_rag_manager returns same instance"""
        manager1 = get_rag_manager()
        manager2 = get_rag_manager()
        
        assert manager1 is manager2  # Same object
        assert isinstance(manager1, ProfileRAGManager)


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_invalid_profile_id(self, temp_dir=None):
        """Test behavior with invalid profile IDs"""
        if temp_dir is None:
            temp_dir = tempfile.mkdtemp()
            
        try:
            manager = ProfileRAGManager(temp_dir)
            
            # Query non-existent profile
            result = manager.query_profile(999, "test query")
            assert isinstance(result, str)
            # Should handle gracefully
            
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)
    
    def test_malformed_csv_data(self):
        """Test handling of malformed CSV data"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create malformed CSV
            with open(f"{temp_dir}/account.csv", 'w') as f:
                f.write("invalid,csv,data\n1,2\n")  # Missing column
            
            # Should not crash
            system = ProfileRAGSystem(1, temp_dir)
            result = system.query("test query")
            assert isinstance(result, str)
    
    def test_empty_csv_files(self):
        """Test handling of empty CSV files"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create empty CSV with headers
            empty_df = pd.DataFrame(columns=['account_id', 'customer_id', 'balance'])
            empty_df.to_csv(f"{temp_dir}/account.csv", index=False)
            
            system = ProfileRAGSystem(1, temp_dir)
            assert system.profile_data['accounts'].empty
            
            # Should still work with no data
            result = system.query("test query")
            assert isinstance(result, str)


# Test data validation
def test_tool_descriptions():
    """Test that all tools have proper descriptions"""
    with tempfile.TemporaryDirectory() as temp_dir:
        system = ProfileRAGSystem(1, temp_dir)
        
        for tool_name, tool in system.tools_registry.items():
            assert tool.name == tool_name
            assert len(tool.description) > 10  # Reasonable description length
            assert 'query' in tool.description.lower()


# Performance tests
def test_vector_store_performance():
    """Basic performance test for vector store operations"""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create larger dataset
        large_data = {
            'account_id': list(range(100, 200)),
            'customer_id': [1] * 100,
            'balance': [1000.0] * 100,
            'account_type': ['checking'] * 100
        }
        pd.DataFrame(large_data).to_csv(f"{temp_dir}/account.csv", index=False)
        
        system = ProfileRAGSystem(1, temp_dir)
        
        # Time a query
        import time
        start = time.time()
        result = system.query("What are my total balances?")
        elapsed = time.time() - start
        
        assert elapsed < 5.0  # Should complete within 5 seconds
        assert isinstance(result, str)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])