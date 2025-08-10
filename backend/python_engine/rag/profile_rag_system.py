"""
Profile-Specific RAG System with Tool Registry
Loads CSV data into vector databases per profile with query tools
"""

import os
import pandas as pd
import logging
import time
from typing import Dict, List, Any, Optional
from pathlib import Path
import json

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# LangChain imports for RAG
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_chroma import Chroma
from langchain_core.retrievers import BaseRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ENFORCED: Import unified cache for embeddings
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.api_cache import CacheAwareEmbeddings, api_cache

# DSPy for structured queries
import dspy
from dspy import Signature, Module, InputField, OutputField

# Tool registry
from langchain_core.tools import Tool
from typing import Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FinancialDataAnalysisSignature(Signature):
    """Analyze financial data and extract insights"""
    query = InputField(desc="Financial question or analysis request")
    context_data = InputField(desc="Relevant financial data context")
    analysis_result = OutputField(desc="Detailed financial analysis and insights")


class ProfileRAGSystem:
    """RAG system for individual user profiles with financial data"""
    
    def __init__(self, profile_id: int, csv_data_dir: str):
        self.profile_id = profile_id
        self.csv_data_dir = csv_data_dir
        self.vector_store = None
        self.retriever = None
        self.embeddings = None
        self.profile_data = {}
        self.tools_registry = {}
        
        # Configure embeddings
        self._setup_embeddings()
        
        # Load and process CSV data
        self._load_profile_data()
        
        # Create vector store and retriever
        self._setup_vector_store()
        
        # Register query tools
        self._register_tools()
        
        # Setup DSPy analyzer
        self._setup_dspy_analyzer()
    
    def _setup_embeddings(self):
        """ENFORCED: Use unified cached embeddings - no more duplicates."""
        try:
            # Use unified cache-aware embeddings
            self.embeddings = CacheAwareEmbeddings()
            logger.info(f"Using cached embeddings with provider: {self.embeddings.provider.value}")
        except ValueError as e:
            # Final fallback to in-memory embeddings for testing
            logger.warning(f"No API keys found: {e}, using basic embeddings")
            from langchain_core.embeddings import DeterministicFakeEmbedding
            self.embeddings = DeterministicFakeEmbedding(size=384)
        except Exception as e:
            logger.error(f"Failed to setup embeddings: {e}")
            raise
    
    def _load_profile_data(self):
        """Load all CSV data for the specific profile"""
        try:
            csv_files = {
                'accounts': 'account.csv',
                'transactions': 'transaction.csv', 
                'demographics': 'demographics.csv',
                'goals': 'goal.csv',
                'investments': 'investment.csv'
            }
            
            for data_type, filename in csv_files.items():
                csv_path = Path(self.csv_data_dir) / filename
                if csv_path.exists():
                    df = pd.read_csv(csv_path)
                    
                    # Filter by customer_id (assuming it exists in all files)
                    if 'customer_id' in df.columns:
                        profile_df = df[df['customer_id'] == self.profile_id]
                        self.profile_data[data_type] = profile_df
                        logger.info(f"Loaded {len(profile_df)} {data_type} records for profile {self.profile_id}")
                    else:
                        # For files without customer_id, load all data
                        self.profile_data[data_type] = df
                        logger.info(f"Loaded {len(df)} {data_type} records (no customer filter)")
                else:
                    logger.warning(f"CSV file not found: {csv_path}")
                    self.profile_data[data_type] = pd.DataFrame()
            
        except Exception as e:
            logger.error(f"Failed to load profile data: {e}")
            raise
    
    def _create_documents_from_data(self) -> List[Document]:
        """Convert CSV data into LangChain documents for vector storage"""
        documents = []
        
        try:
            for data_type, df in self.profile_data.items():
                if df.empty:
                    continue
                    
                for idx, row in df.iterrows():
                    # Convert row to readable text
                    content_parts = []
                    metadata = {
                        'data_type': data_type,
                        'record_id': str(idx),
                        'customer_id': self.profile_id
                    }
                    
                    # Create natural language description based on data type
                    if data_type == 'accounts':
                        content = self._format_account_record(row)
                    elif data_type == 'transactions':
                        content = self._format_transaction_record(row)
                    elif data_type == 'demographics':
                        content = self._format_demographic_record(row)
                    elif data_type == 'goals':
                        content = self._format_goal_record(row)
                    elif data_type == 'investments':
                        content = self._format_investment_record(row)
                    else:
                        # Generic formatting
                        content = f"{data_type.title()} record: "
                        content += ", ".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                    
                    # Add financial context metadata
                    if 'balance' in row:
                        metadata['balance'] = float(row['balance'])
                    if 'amount' in row:
                        metadata['amount'] = float(row['amount'])
                    if 'account_type' in row:
                        metadata['account_type'] = str(row['account_type'])
                    
                    documents.append(Document(
                        page_content=content,
                        metadata=metadata
                    ))
            
            logger.info(f"Created {len(documents)} documents for profile {self.profile_id}")
            return documents
            
        except Exception as e:
            logger.error(f"Failed to create documents: {e}")
            return []
    
    def _format_account_record(self, row) -> str:
        """Format account record into natural language"""
        account_type = row.get('account_type', 'account')
        balance = float(row.get('balance', 0))
        institution = row.get('institution_name', 'Unknown')
        account_num = row.get('account_number', 'Unknown')
        
        if account_type == 'credit_card':
            if balance < 0:
                return f"Credit card account {account_num} at {institution} has a balance of ${abs(balance):,.2f} owed with credit limit of ${row.get('credit_limit', 0):,.2f}"
            else:
                return f"Credit card account {account_num} at {institution} has available credit of ${balance:,.2f}"
        elif account_type == 'mortgage':
            return f"Mortgage account {account_num} at {institution} has remaining balance of ${abs(balance):,.2f}"
        else:
            return f"{account_type.title()} account {account_num} at {institution} has balance of ${balance:,.2f}"
    
    def _format_transaction_record(self, row) -> str:
        """Format transaction record into natural language"""
        amount = float(row.get('amount', 0))
        category = row.get('category', 'transaction')
        description = row.get('description', 'Unknown transaction')
        date = row.get('date', 'Unknown date')
        
        if amount < 0:
            return f"Expense of ${abs(amount):,.2f} on {date} for {category}: {description}"
        else:
            return f"Income of ${amount:,.2f} on {date} for {category}: {description}"
    
    def _format_demographic_record(self, row) -> str:
        """Format demographic record into natural language"""
        parts = []
        
        if 'age' in row and pd.notna(row['age']):
            parts.append(f"Age: {row['age']}")
        if 'income' in row and pd.notna(row['income']):
            parts.append(f"Annual income: ${row['income']:,.2f}")
        if 'location' in row and pd.notna(row['location']):
            parts.append(f"Location: {row['location']}")
        if 'employment_status' in row and pd.notna(row['employment_status']):
            parts.append(f"Employment: {row['employment_status']}")
        if 'risk_tolerance' in row and pd.notna(row['risk_tolerance']):
            parts.append(f"Risk tolerance: {row['risk_tolerance']}")
            
        return f"User demographics - {', '.join(parts)}"
    
    def _format_goal_record(self, row) -> str:
        """Format financial goal record into natural language"""
        goal_type = row.get('goal_type', 'financial goal')
        target_amount = float(row.get('target_amount', 0))
        current_amount = float(row.get('current_amount', 0))
        target_date = row.get('target_date', 'No deadline')
        
        progress = (current_amount / target_amount * 100) if target_amount > 0 else 0
        
        return f"{goal_type.title()} goal: Save ${target_amount:,.2f} by {target_date}. Current progress: ${current_amount:,.2f} ({progress:.1f}%)"
    
    def _format_investment_record(self, row) -> str:
        """Format investment record into natural language"""
        symbol = row.get('symbol', 'Unknown')
        shares = float(row.get('shares', 0))
        current_value = float(row.get('current_value', 0))
        purchase_price = float(row.get('purchase_price', 0))
        
        gain_loss = current_value - purchase_price
        gain_loss_pct = (gain_loss / purchase_price * 100) if purchase_price > 0 else 0
        
        return f"Investment in {symbol}: {shares} shares worth ${current_value:,.2f}. Gain/Loss: ${gain_loss:,.2f} ({gain_loss_pct:+.2f}%)"
    
    def _setup_vector_store(self):
        """Setup vector store with profile documents"""
        try:
            documents = self._create_documents_from_data()
            
            if not documents:
                logger.warning(f"No documents created for profile {self.profile_id}")
                # Create empty vector store
                self.vector_store = InMemoryVectorStore(self.embeddings)
                self.retriever = self.vector_store.as_retriever()
                return
            
            # Split documents if they're too long
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50
            )
            split_docs = text_splitter.split_documents(documents)
            
            # Use InMemoryVectorStore for simplicity and speed
            self.vector_store = InMemoryVectorStore(self.embeddings)
            self.vector_store.add_documents(split_docs)
            
            # Create retriever
            self.retriever = self.vector_store.as_retriever(
                search_kwargs={"k": 5}  # Return top 5 relevant documents
            )
            
            logger.info(f"Vector store created with {len(split_docs)} document chunks for profile {self.profile_id}")
            
        except Exception as e:
            logger.error(f"Failed to setup vector store: {e}")
            raise
    
    def _setup_dspy_analyzer(self):
        """Setup DSPy analyzer for structured financial analysis"""
        try:
            # Configure DSPy if API keys are available
            if os.getenv("ANTHROPIC_API_KEY"):
                lm = dspy.LM("anthropic/claude-3-5-sonnet-20241022", api_key=os.getenv("ANTHROPIC_API_KEY"))
                dspy.configure(lm=lm)
                
                class FinancialAnalyzer(Module):
                    def __init__(self):
                        super().__init__()
                        self.analyzer = dspy.ChainOfThought(FinancialDataAnalysisSignature)
                    
                    def forward(self, query: str, context_data: str) -> str:
                        result = self.analyzer(query=query, context_data=context_data)
                        return result.analysis_result
                
                self.dspy_analyzer = FinancialAnalyzer()
                logger.info("DSPy financial analyzer configured with Anthropic")
            elif os.getenv("OPENAI_API_KEY"):
                lm = dspy.LM("openai/gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
                dspy.configure(lm=lm)
                
                class FinancialAnalyzer(Module):
                    def __init__(self):
                        super().__init__()
                        self.analyzer = dspy.ChainOfThought(FinancialDataAnalysisSignature)
                    
                    def forward(self, query: str, context_data: str) -> str:
                        result = self.analyzer(query=query, context_data=context_data)
                        return result.analysis_result
                
                self.dspy_analyzer = FinancialAnalyzer()
                logger.info("DSPy financial analyzer configured with OpenAI")
            else:
                self.dspy_analyzer = None
                logger.warning("DSPy analyzer not configured - no API key")
                
        except Exception as e:
            logger.error(f"Failed to setup DSPy analyzer: {e}")
            self.dspy_analyzer = None
    
    def _register_tools(self):
        """Register query tools for this profile's RAG system"""
        
        # Account query tool
        def query_accounts(query: str) -> str:
            """Query account information for this profile"""
            try:
                accounts_df = self.profile_data.get('accounts', pd.DataFrame())
                if accounts_df.empty:
                    return "No account information found for this profile."
                
                # Use retriever to find relevant account info
                docs = self.retriever.invoke(f"accounts {query}")
                if not docs:
                    return "No relevant account information found."
                
                context = "\n".join([doc.page_content for doc in docs[:3]])
                
                # Use DSPy analyzer if available
                if self.dspy_analyzer:
                    try:
                        analysis = self.dspy_analyzer(query, context)
                        return analysis
                    except:
                        pass
                
                # Fallback to context return
                return f"Account information: {context}"
                
            except Exception as e:
                return f"Error querying accounts: {str(e)}"
        
        # Transaction query tool
        def query_transactions(query: str) -> str:
            """Query transaction history for this profile"""
            try:
                transactions_df = self.profile_data.get('transactions', pd.DataFrame())
                if transactions_df.empty:
                    return "No transaction history found for this profile."
                
                # Use retriever to find relevant transactions
                docs = self.retriever.invoke(f"transactions {query}")
                if not docs:
                    return "No relevant transactions found."
                
                context = "\n".join([doc.page_content for doc in docs[:5]])
                
                # Use DSPy analyzer if available
                if self.dspy_analyzer:
                    try:
                        analysis = self.dspy_analyzer(query, context)
                        return analysis
                    except:
                        pass
                
                return f"Transaction analysis: {context}"
                
            except Exception as e:
                return f"Error querying transactions: {str(e)}"
        
        # Demographics query tool
        def query_demographics(query: str) -> str:
            """Query demographic and profile information"""
            try:
                demographics_df = self.profile_data.get('demographics', pd.DataFrame())
                if demographics_df.empty:
                    return "No demographic information found for this profile."
                
                docs = self.retriever.invoke(f"demographics {query}")
                if not docs:
                    return "No relevant demographic information found."
                
                context = "\n".join([doc.page_content for doc in docs[:2]])
                return f"Profile information: {context}"
                
            except Exception as e:
                return f"Error querying demographics: {str(e)}"
        
        # Financial goals query tool
        def query_goals(query: str) -> str:
            """Query financial goals and progress"""
            try:
                goals_df = self.profile_data.get('goals', pd.DataFrame())
                if goals_df.empty:
                    return "No financial goals found for this profile."
                
                docs = self.retriever.invoke(f"goals {query}")
                if not docs:
                    return "No relevant goals found."
                
                context = "\n".join([doc.page_content for doc in docs[:3]])
                
                if self.dspy_analyzer:
                    try:
                        analysis = self.dspy_analyzer(query, context)
                        return analysis
                    except:
                        pass
                
                return f"Financial goals: {context}"
                
            except Exception as e:
                return f"Error querying goals: {str(e)}"
        
        # Investment query tool
        def query_investments(query: str) -> str:
            """Query investment portfolio information"""
            try:
                investments_df = self.profile_data.get('investments', pd.DataFrame())
                if investments_df.empty:
                    return "No investment information found for this profile."
                
                docs = self.retriever.invoke(f"investments {query}")
                if not docs:
                    return "No relevant investment information found."
                
                context = "\n".join([doc.page_content for doc in docs[:3]])
                
                if self.dspy_analyzer:
                    try:
                        analysis = self.dspy_analyzer(query, context)
                        return analysis
                    except:
                        pass
                
                return f"Investment analysis: {context}"
                
            except Exception as e:
                return f"Error querying investments: {str(e)}"
        
        # General financial query tool
        def query_all_data(query: str) -> str:
            """Query across all financial data for this profile"""
            try:
                docs = self.retriever.invoke(query)
                if not docs:
                    return "No relevant financial information found."
                
                context = "\n".join([doc.page_content for doc in docs[:5]])
                
                if self.dspy_analyzer:
                    try:
                        analysis = self.dspy_analyzer(query, context)
                        return analysis
                    except:
                        pass
                
                return f"Financial analysis: {context}"
                
            except Exception as e:
                return f"Error in financial query: {str(e)}"
        
        # Register tools in the registry
        self.tools_registry = {
            'query_accounts': Tool(
                name="query_accounts",
                description="Query account information including balances, types, and institutions",
                func=query_accounts
            ),
            'query_transactions': Tool(
                name="query_transactions", 
                description="Query transaction history including expenses, income, and spending patterns",
                func=query_transactions
            ),
            'query_demographics': Tool(
                name="query_demographics",
                description="Query user demographic and profile information",
                func=query_demographics
            ),
            'query_goals': Tool(
                name="query_goals",
                description="Query financial goals and progress tracking",
                func=query_goals
            ),
            'query_investments': Tool(
                name="query_investments",
                description="Query investment portfolio and performance",
                func=query_investments
            ),
            'query_all_data': Tool(
                name="query_all_data",
                description="Query across all financial data types for comprehensive analysis",
                func=query_all_data
            )
        }
        
        logger.info(f"Registered {len(self.tools_registry)} query tools for profile {self.profile_id}")
    
    def get_tool(self, tool_name: str) -> Optional[Tool]:
        """Get a specific tool from the registry"""
        return self.tools_registry.get(tool_name)
    
    def get_all_tools(self) -> List[Tool]:
        """Get all tools as a list"""
        return list(self.tools_registry.values())
    
    def query(self, query: str, tool_name: Optional[str] = None) -> str:
        """
        Query the RAG system directly or through a specific tool
        
        Args:
            query: The question or query string
            tool_name: Optional specific tool to use
            
        Returns:
            Analysis result string
        """
        start_time = time.time()
        logger.info(f"🔍 RAG QUERY: Profile {self.profile_id}")
        logger.info(f"📝 Query: {query[:100]}...")
        logger.info(f"🛠️ Tool: {tool_name or 'query_all_data'}")
        
        try:
            if tool_name and tool_name in self.tools_registry:
                # Use specific tool
                logger.info(f"🎯 USING SPECIFIC TOOL: {tool_name}")
                tool = self.tools_registry[tool_name]
                result = tool.func(query)
                query_time = time.time() - start_time
                logger.info(f"✅ TOOL QUERY COMPLETED: {query_time:.3f}s")
                return result
            else:
                # Use general query across all data
                logger.info(f"🌐 USING GENERAL QUERY")
                result = self.tools_registry['query_all_data'].func(query)
                query_time = time.time() - start_time
                logger.info(f"✅ GENERAL QUERY COMPLETED: {query_time:.3f}s")
                return result
                
        except Exception as e:
            query_time = time.time() - start_time
            logger.error(f"❌ RAG QUERY FAILED: {e} after {query_time:.3f}s")
            return f"Error processing query: {str(e)}"
    
    def get_profile_summary(self) -> Dict[str, Any]:
        """Get summary of profile data loaded into RAG system"""
        summary = {
            'profile_id': self.profile_id,
            'data_types': {},
            'total_documents': 0,
            'available_tools': list(self.tools_registry.keys())
        }
        
        for data_type, df in self.profile_data.items():
            summary['data_types'][data_type] = {
                'record_count': len(df),
                'columns': list(df.columns) if not df.empty else []
            }
        
        if self.vector_store:
            # Count documents in vector store
            try:
                # This is an approximation since InMemoryVectorStore doesn't expose count directly
                test_docs = self.retriever.invoke("test", k=1000)  # Try to get many docs
                summary['total_documents'] = len(test_docs)
            except:
                summary['total_documents'] = 0
        
        return summary


class ProfileRAGManager:
    """Manager for multiple profile RAG systems"""
    
    def __init__(self, csv_data_dir: str):
        self.csv_data_dir = csv_data_dir
        self.profile_systems: Dict[int, ProfileRAGSystem] = {}
        
        # Load available profile IDs from CSV data
        self._discover_profiles()
    
    def _discover_profiles(self):
        """Discover available profiles from CSV data"""
        try:
            account_file = Path(self.csv_data_dir) / "account.csv"
            if account_file.exists():
                df = pd.read_csv(account_file)
                if 'customer_id' in df.columns:
                    profile_ids = df['customer_id'].unique()
                    logger.info(f"Discovered profiles: {profile_ids}")
                    return profile_ids
            
            # Fallback to default profiles if no CSV found
            return [1, 2, 3]
            
        except Exception as e:
            logger.error(f"Error discovering profiles: {e}")
            return [1, 2, 3]
    
    def get_profile_system(self, profile_id: int) -> ProfileRAGSystem:
        """Get or create RAG system for a profile"""
        if profile_id not in self.profile_systems:
            logger.info(f"Creating RAG system for profile {profile_id}")
            self.profile_systems[profile_id] = ProfileRAGSystem(profile_id, self.csv_data_dir)
        
        return self.profile_systems[profile_id]
    
    def query_profile(self, profile_id: int, query: str, tool_name: Optional[str] = None) -> str:
        """Query a specific profile's RAG system"""
        try:
            profile_system = self.get_profile_system(profile_id)
            return profile_system.query(query, tool_name)
        except Exception as e:
            logger.error(f"Error querying profile {profile_id}: {e}")
            return f"Error: {str(e)}"
    
    def get_all_profile_summaries(self) -> Dict[int, Dict[str, Any]]:
        """Get summaries of all profile RAG systems"""
        summaries = {}
        
        for profile_id in [1, 2, 3]:  # Known profiles
            try:
                profile_system = self.get_profile_system(profile_id)
                summaries[profile_id] = profile_system.get_profile_summary()
            except Exception as e:
                logger.error(f"Error getting summary for profile {profile_id}: {e}")
                summaries[profile_id] = {'error': str(e)}
        
        return summaries


# Global manager instance
rag_manager = None


def get_rag_manager(csv_data_dir: str = None) -> ProfileRAGManager:
    """Get or create the global RAG manager"""
    global rag_manager
    
    if rag_manager is None:
        if csv_data_dir is None:
            # Default to the data directory relative to this file
            csv_data_dir = str(Path(__file__).parent.parent.parent.parent / "data")
        
        rag_manager = ProfileRAGManager(csv_data_dir)
    
    return rag_manager