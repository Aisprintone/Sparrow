"""
FastAPI application for Monte Carlo simulation engine.
Provides REST API endpoints for Next.js integration.
"""

from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import traceback
import sys
import os
import json
import numpy as np
import time
from datetime import datetime

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Custom JSON encoder to handle numpy types and infinite values
class NumpyEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle numpy types and infinite values"""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            if np.isinf(obj) or np.isnan(obj):
                return None  # Replace infinite/NaN values with None
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

# Add the parent directory to the path so we can import from core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import SimulationConfig
from core.engine import MonteCarloEngine
from core.models import (
    SimulationRequest,
    SimulationResponse,
    ScenarioType,
    ScenarioResult,
    AccountType
)
from core.market_data import market_data_service
from data.csv_loader import CSVDataLoader
from scenarios.emergency_fund import EmergencyFundScenario
from scenarios.student_loan import StudentLoanScenario
from scenarios.medical_crisis import MedicalCrisisScenario
from scenarios.gig_economy import GigEconomyScenario
from scenarios.market_crash import MarketCrashScenario
from scenarios.home_purchase import HomePurchaseScenario
from scenarios.rent_hike import RentHikeScenario
from scenarios.auto_repair import AutoRepairScenario
from rag.profile_rag_system import get_rag_manager
# Import the batched RAG service for optimized queries
from rag.batched_service import BatchedRAGService
from rag.abstractions import (
    BatchedRAGRequest, RAGQuery, QueryType
)
from rag.implementations import (
    SimpleRAGQueryExecutor, SimpleRAGCache, SimpleRAGMetrics
)
# Import the multi-agent AI system
from ai.langgraph_dspy_agent import FinancialAIAgentSystem

# Import streaming endpoints
from api.streaming_endpoints import router as streaming_router

# Import workflow endpoints
from api.workflow_endpoints import router as workflow_router

# Import cache endpoints - PATTERN GUARDIAN ENFORCED
from api.cache_endpoints import router as cache_router

# Import database configuration
from core.database import init_database, check_database_health

# Import unified cache for initialization
from core.api_cache import api_cache, CACHE_WARMING_SCENARIOS
from core.cache_manager import cache_manager

# Configure logging
from logging_config import setup_logging, get_logger, PerformanceLogger

# Setup comprehensive logging
logger = setup_logging(level="INFO", log_to_file=True, log_to_console=True)
perf_logger = PerformanceLogger(logger)

app = FastAPI(title="Financial Simulation API", version="1.0.0")

# Configure FastAPI to use custom JSON encoder
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

def custom_json_response(content, status_code=200, headers=None):
    """Custom JSON response with NumpyEncoder"""
    return JSONResponse(
        content=json.dumps(content, cls=NumpyEncoder),
        status_code=status_code,
        headers=headers,
        media_type="application/json"
    )

# Configure custom JSON encoder for numpy types
app.json_encoder = NumpyEncoder

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(streaming_router, prefix="/streaming", tags=["streaming"])
app.include_router(workflow_router, prefix="/workflow", tags=["workflow"])
app.include_router(cache_router, prefix="/cache", tags=["cache"])

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    print("[RAILWAY BACKEND] 🚀 Application startup initiated")
    print("[RAILWAY BACKEND] Environment:", os.getenv("ENVIRONMENT", "development"))
    print("[RAILWAY BACKEND] Python version:", sys.version)
    
    try:
        # Initialize database
        print("[RAILWAY BACKEND] 🔄 Initializing database...")
        await init_database()
        print("[RAILWAY BACKEND] ✅ Database initialized successfully")
        
        # Initialize cache (cache_manager is already initialized at module level)
        print("[RAILWAY BACKEND] 🔄 Cache system ready")
        print("[RAILWAY BACKEND] ✅ Cache system initialized")
        
        # Skip cache warming for faster startup during development
        # print("[RAILWAY BACKEND] 🔄 Warming up cache with common scenarios...")
        # await api_cache.warm_cache(CACHE_WARMING_SCENARIOS)
        # print("[RAILWAY BACKEND] ✅ Cache warming completed")
        
        # RAG system is already initialized at module level
        print("[RAILWAY BACKEND] 🔄 RAG system ready")
        print("[RAILWAY BACKEND] ✅ RAG system initialized")
        
        print("[RAILWAY BACKEND] 🎉 Application startup completed successfully")
        
    except Exception as e:
        print(f"[RAILWAY BACKEND] ❌ Startup failed: {e}")
        print(f"[RAILWAY BACKEND] Error details: {traceback.format_exc()}")
        raise

@app.get("/")
async def root():
    """Root endpoint for Railway deployment health checks"""
    print("[RAILWAY BACKEND] 🏠 Root endpoint accessed")
    return {
        "message": "Sparrow FinanceAI API",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway deployment monitoring"""
    print("[RAILWAY BACKEND] 🏥 Health check requested")
    
    try:
        # Check database health
        db_status = "healthy"
        try:
            await check_database_health()
            print("[RAILWAY BACKEND] ✅ Database health check passed")
        except Exception as e:
            print(f"[RAILWAY BACKEND] ❌ Database health check failed: {e}")
            db_status = "unhealthy"
        
        # Check market data service
        market_status = "healthy"
        try:
            # Simple market data check
            market_data_service.get_current_prices()
            print("[RAILWAY BACKEND] ✅ Market data service check passed")
        except Exception as e:
            print(f"[RAILWAY BACKEND] ⚠️ Market data service check failed: {e}")
            market_status = "degraded"
        
        health_data = {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "database": db_status,
                "market_data": market_status,
                "simulation_engine": "healthy"
            },
            "environment": os.getenv("ENVIRONMENT", "development"),
            "version": "1.0.0"
        }
        
        print(f"[RAILWAY BACKEND] 🏥 Health check completed - Status: {health_data['status']}")
        return health_data
        
    except Exception as e:
        print(f"[RAILWAY BACKEND] ❌ Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/db/health")
async def database_health():
    """Database health check"""
    return await check_database_health()

@app.post("/db/init")
async def initialize_database():
    """Initialize database tables"""
    try:
        await init_database()
        return {"success": True, "message": "Database initialized successfully"}
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# Global data loader and RAG manager
try:
    data_loader = CSVDataLoader()
    logger.info("CSV data loader initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize CSV data loader: {e}")
    raise

try:
    rag_manager = get_rag_manager()
    logger.info("RAG manager initialized successfully")
    
    # Initialize batched RAG service for optimized performance
    rag_query_executor = SimpleRAGQueryExecutor(rag_manager)
    rag_cache = SimpleRAGCache()
    rag_metrics = SimpleRAGMetrics()
    batched_rag_service = BatchedRAGService(
        query_executor=rag_query_executor,
        cache=rag_cache,
        metrics=rag_metrics,
        max_parallel_queries=6
    )
    logger.info("Batched RAG service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize RAG manager: {e}")
    rag_manager = None
    batched_rag_service = None

# Pydantic models for request/response
class SimulationRequest(BaseModel):
    profile_id: str
    use_current_profile: bool = False
    parameters: Dict[str, Any] = {}
    scenario_type: str
    original_simulation_id: Optional[str] = None  # Add original simulation ID for context

class SimulationResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: str

# Initialize simulation scenarios
simulation_scenarios = {
    'emergency_fund': EmergencyFundScenario(),
    'student_loan': StudentLoanScenario(),
    'home_purchase': HomePurchaseScenario(),
    'market_crash': MarketCrashScenario(),
    'medical_crisis': MedicalCrisisScenario(),
    'gig_economy': GigEconomyScenario(),
    'rent_hike': RentHikeScenario(),
    'auto_repair': AutoRepairScenario()
}

# Initialize AI agent (it has its own RAG integration internally)
ai_agent = FinancialAIAgentSystem()

@app.post("/simulation/{scenario_type}")
async def run_simulation(scenario_type: str, request: SimulationRequest):
    """Run a financial simulation with enhanced AI explanations"""
    logger.info(f"🚀 SIMULATION REQUEST: {scenario_type} for profile {request.profile_id}")
    logger.info(f"📊 Request details: use_current_profile={request.use_current_profile}, original_sim_id={request.original_simulation_id}")
    
    start_time = datetime.now()
    
    try:
        # Validate scenario type
        if scenario_type not in simulation_scenarios:
            logger.error(f"❌ INVALID SCENARIO: {scenario_type}")
            logger.error(f"📋 Available scenarios: {list(simulation_scenarios.keys())}")
            raise HTTPException(status_code=400, detail=f"Invalid scenario type: {scenario_type}")
        
        logger.info(f"✅ SCENARIO VALIDATED: {scenario_type}")
        
        # Get profile data
        logger.info(f"🔄 FETCHING PROFILE: ID {request.profile_id}")
        profile_start = time.time()
        profile_data = await get_profile_data(request.profile_id)
        profile_time = time.time() - profile_start
        logger.info(f"✅ PROFILE LOADED: {profile_time:.3f}s")
        
        # Prepare simulation configuration
        logger.info(f"🔄 PREPARING CONFIG: {scenario_type}")
        config_start = time.time()
        config = prepare_simulation_config(request, scenario_type)
        config_time = time.time() - config_start
        logger.info(f"✅ CONFIG PREPARED: {config_time:.3f}s")
        
        # Run simulation
        logger.info(f"🔄 STARTING SIMULATION: {scenario_type}")
        sim_start = time.time()
        simulation_result = await run_scenario_simulation(
            scenario_type,
            request.original_simulation_id,
            profile_data,
            config
        )
        sim_time = time.time() - sim_start
        logger.info(f"✅ SIMULATION COMPLETED: {sim_time:.3f}s")
        
        # Generate AI explanations
        logger.info(f"🔄 GENERATING AI EXPLANATIONS")
        ai_start = time.time()
        ai_explanations = await generate_ai_explanations_with_llm(
            simulation_result,
            profile_data,
            request.original_simulation_id or "new_simulation"
        )
        ai_time = time.time() - ai_start
        logger.info(f"✅ AI EXPLANATIONS GENERATED: {len(ai_explanations)} cards in {ai_time:.3f}s")
        
        # Calculate total time
        total_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"🎉 SIMULATION SUCCESS: Total time {total_time:.3f}s")
        
        # Prepare response
        response_data = {
            "success": True,
            "data": {
                "simulation_result": simulation_result,
                "ai_explanations": ai_explanations,
                "profile_data": profile_data,
                "config": config
            },
            "message": f"Simulation completed successfully with {len(ai_explanations)} AI explanations",
            "meta": {
                "scenario_type": scenario_type,
                "profile_id": request.profile_id,
                "execution_time": total_time,
                "ai_explanations_count": len(ai_explanations),
                "timestamp": datetime.now().isoformat()
            }
        }
        
        total_time = (datetime.now() - start_time).total_seconds()
        print(f"[RAILWAY BACKEND] ✅ Simulation request completed in {total_time:.2f}s")
        print(f"[RAILWAY BACKEND] Response includes {len(ai_explanations)} AI explanations")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        error_time = (datetime.now() - start_time).total_seconds()
        print(f"[RAILWAY BACKEND] ❌ Simulation failed after {error_time:.2f}s: {str(e)}")
        print(f"[RAILWAY BACKEND] Error details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

async def run_scenario_simulation(
    scenario_type: str,
    original_simulation_id: Optional[str],
    profile_data: Dict[str, Any],
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Run a specific scenario simulation.
    """
    try:
        # Get the scenario class
        scenario_class = simulation_scenarios[scenario_type]
        
        # Run the simulation - scenarios have their own simulation logic
        result = scenario_class.run_simulation(profile_data, config)
        
        return result
        
    except Exception as e:
        logger.error(f"Scenario simulation failed: {e}")
        raise

async def generate_ai_explanations_with_llm(
    simulation_result: Dict[str, Any],
    profile_data: Dict[str, Any],
    original_simulation_id: str
) -> List[Dict[str, Any]]:
    """
    Generate AI explanations using the LLM system.
    """
    try:
        # Use the AI agent to generate explanation cards
        # The method is generate_explanation_cards, not generate_explanations
        explanations = await ai_agent.generate_explanation_cards(
            simulation_data=simulation_result,
            user_profile=profile_data,
            scenario_context=original_simulation_id
        )
        
        # Ensure we have exactly 3 cards as expected by frontend
        if not explanations or len(explanations) == 0:
            logger.warning(f"AI agent returned no explanations for {original_simulation_id}")
            raise Exception("No AI explanations generated")
        
        # Log the structure for debugging
        logger.info(f"Generated {len(explanations)} AI explanation cards for {original_simulation_id}")
        if explanations:
            logger.debug(f"First card structure: {list(explanations[0].keys())}")
        
        return explanations
        
    except Exception as e:
        logger.error(f"Failed to generate AI explanations for {original_simulation_id}: {e}")
        # No fallbacks - must use real AI explanations
        raise Exception(f"AI explanation generation failed: {str(e)}")

async def get_profile_data(profile_id: str) -> Dict[str, Any]:
    """
    Get profile data for the specified profile ID from CSV data.
    """
    try:
        # Load profile data from CSV using the data loader
        profile_data = data_loader.load_profile(int(profile_id))
        
        # Calculate emergency fund and student loan balance from accounts
        emergency_fund = sum(
            account.balance for account in profile_data.accounts 
            if account.account_type in [AccountType.SAVINGS, "savings"] and account.balance > 0
        )
        
        student_loan_balance = sum(
            abs(account.balance) for account in profile_data.accounts 
            if account.account_type in [AccountType.STUDENT_LOAN, "student_loan"] and account.balance < 0
        )
        
        # Determine risk tolerance based on demographic
        risk_tolerance_map = {
            "genz": "aggressive",
            "millennial": "moderate",
            "midcareer": "moderate",
            "senior": "conservative",
            "retired": "conservative"
        }
        # Handle demographic as string or enum
        demographic_value = profile_data.demographic.value if hasattr(profile_data.demographic, 'value') else str(profile_data.demographic)
        risk_tolerance = risk_tolerance_map.get(demographic_value, "moderate")
        
        # Convert to dictionary format
        return {
            "customer_id": profile_data.customer_id,
            "name": f"Profile {profile_data.customer_id}",  # Use profile ID as name
            "age": profile_data.age,
            "demographic": demographic_value,
            "monthly_income": profile_data.monthly_income,
            "monthly_expenses": profile_data.monthly_expenses,
            "emergency_fund": emergency_fund,
            "student_loan_balance": student_loan_balance,
            "risk_tolerance": risk_tolerance,
            "credit_score": profile_data.credit_score,
            "location": profile_data.location,
            "accounts": [
                {
                    "type": account.account_type.value,
                    "balance": account.balance,
                    "institution": account.institution_name
                }
                for account in profile_data.accounts
            ],
            "transactions": [
                {
                    "amount": transaction.amount,
                    "category": transaction.category or "uncategorized",
                    "date": transaction.timestamp.isoformat(),
                    "description": transaction.description
                }
                for transaction in profile_data.transactions
            ],
            "total_debt": abs(sum(
                account.balance for account in profile_data.accounts 
                if account.balance < 0
            )),
            "income": profile_data.monthly_income  # Add income field for AI agent
        }
    except Exception as e:
        logger.error(f"Failed to load profile {profile_id}: {e}")
        raise ValueError(f"Profile {profile_id} not found in CSV data")

def prepare_simulation_config(request: SimulationRequest, scenario_type: str) -> Dict[str, Any]:
    """
    Prepare simulation configuration based on request parameters.
    """
    base_config = {
        "simulations": 1000,
        "iterations": 10000,
        "years": 10,
        "months": 60
    }
    
    # Add scenario-specific parameters
    if scenario_type == "emergency_fund":
        base_config.update({
            "target_months": request.parameters.get("target_months", 6),
            "monthly_contribution": request.parameters.get("monthly_contribution", 500),
            "risk_tolerance": request.parameters.get("risk_tolerance", "moderate")
        })
    elif scenario_type == "student_loan":
        base_config.update({
            "target_payoff_years": request.parameters.get("target_payoff_years", 5),
            "available_for_loan_payment": request.parameters.get("available_for_loan_payment", 500),
            "risk_tolerance": request.parameters.get("risk_tolerance", "moderate")
        })
    elif scenario_type == "home_purchase":
        base_config.update({
            "purchase_price": request.parameters.get("purchase_price", 400000),
            "down_payment_percentage": request.parameters.get("down_payment_percentage", 20),
            "income": request.parameters.get("income", 80000),
            "credit_score": request.parameters.get("credit_score", 750)
        })
    elif scenario_type == "market_crash":
        base_config.update({
            "investment_horizon_years": request.parameters.get("investment_horizon_years", 20),
            "monthly_contribution": request.parameters.get("monthly_contribution", 1000),
            "emergency_fund_months": request.parameters.get("emergency_fund_months", 6)
        })
    elif scenario_type == "medical_crisis":
        base_config.update({
            "insurance_coverage": request.parameters.get("insurance_coverage", "standard"),
            "emergency_fund_months": request.parameters.get("emergency_fund_months", 6),
            "health_status": request.parameters.get("health_status", "good")
        })
    elif scenario_type == "gig_economy":
        base_config.update({
            "monthly_gig_income": request.parameters.get("monthly_gig_income", 2000),
            "income_volatility": request.parameters.get("income_volatility", "high"),
            "emergency_fund_months": request.parameters.get("emergency_fund_months", 8)
        })
    elif scenario_type == "rent_hike":
        base_config.update({
            "rent_increase_percentage": request.parameters.get("rent_increase_percentage", 15),
            "current_rent": request.parameters.get("current_rent", 2000),
            "emergency_fund_months": request.parameters.get("emergency_fund_months", 6)
        })
    elif scenario_type == "auto_repair":
        base_config.update({
            "vehicle_age": request.parameters.get("vehicle_age", 8),
            "repair_fund_target": request.parameters.get("repair_fund_target", 3000),
            "monthly_contribution": request.parameters.get("monthly_contribution", 200)
        })
    
    return base_config

# Mock functions removed - no mocks allowed

@app.post("/rag/query/{profile_id}")
async def query_profile_rag(profile_id: int, request: Dict[str, Any]):
    """
    Query the RAG system for a specific profile.
    """
    try:
        if rag_manager is None:
            raise HTTPException(status_code=500, detail="RAG manager not initialized")
        
        query = request.get("query", "")
        tool_name = request.get("tool_name")
        
        result = rag_manager.query_profile(profile_id, query, tool_name)
        
        return {
            "success": True,
            "profile_id": profile_id,
            "query": query,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"RAG query failed for profile {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/rag/profiles/summary")
async def get_all_profile_summaries():
    """
    Get summaries of all profile RAG systems.
    """
    try:
        if rag_manager is None:
            raise HTTPException(status_code=500, detail="RAG manager not initialized")
        
        summaries = rag_manager.get_all_profile_summaries()
        
        return {
            "success": True,
            "summaries": summaries
        }
        
    except Exception as e:
        logger.error(f"Failed to get profile summaries: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/rag/profiles/{profile_id}/summary")
async def get_profile_summary(profile_id: int):
    """
    Get summary of a specific profile RAG system.
    """
    try:
        if rag_manager is None:
            raise HTTPException(status_code=500, detail="RAG manager not initialized")
        
        profile_system = rag_manager.get_profile_system(profile_id)
        summary = profile_system.get_profile_summary()
        
        return {
            "success": True,
            "profile_id": profile_id,
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"Failed to get profile {profile_id} summary: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/rag/profiles/{profile_id}/tools")
async def get_profile_tools(profile_id: int):
    """
    Get available tools for a specific profile.
    """
    try:
        if rag_manager is None:
            raise HTTPException(status_code=500, detail="RAG manager not initialized")
        
        profile_system = rag_manager.get_profile_system(profile_id)
        tools = profile_system.get_all_tools()
        
        return {
            "success": True,
            "profile_id": profile_id,
            "tools": [tool.name for tool in tools]
        }
        
    except Exception as e:
        logger.error(f"Failed to get profile {profile_id} tools: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/rag/profiles/{profile_id}/multi-query")
async def multi_query_profile(profile_id: int, request: Dict[str, Any]):
    """
    Perform multiple queries on a profile using different tools.
    Uses batched RAG service for optimized parallel execution.
    """
    try:
        if rag_manager is None:
            raise HTTPException(status_code=500, detail="RAG manager not initialized")
        
        queries_info = request.get("queries", [])
        
        # Use batched service if available
        if batched_rag_service and len(queries_info) > 1:
            # Convert to batched request
            rag_queries = []
            for query_info in queries_info:
                query_text = query_info.get("query", "")
                tool_name = query_info.get("tool_name", "query_all_data")
                
                # Map tool name to QueryType
                query_type_map = {
                    "query_accounts": QueryType.ACCOUNTS,
                    "query_transactions": QueryType.TRANSACTIONS,
                    "query_demographics": QueryType.DEMOGRAPHICS,
                    "query_goals": QueryType.GOALS,
                    "query_investments": QueryType.INVESTMENTS,
                    "query_all_data": QueryType.COMPREHENSIVE
                }
                query_type = query_type_map.get(tool_name, QueryType.COMPREHENSIVE)
                
                rag_queries.append(RAGQuery(
                    query_text=query_text,
                    query_type=query_type
                ))
            
            # Execute batch
            batch_request = BatchedRAGRequest(
                profile_id=profile_id,
                queries=rag_queries
            )
            batch_response = await batched_rag_service.execute_batch(batch_request)
            
            # Format results
            results = {}
            for query_info in queries_info:
                query_text = query_info.get("query", "")
                tool_name = query_info.get("tool_name", "query_all_data")
                query_type = query_type_map.get(tool_name, QueryType.COMPREHENSIVE)
                
                result = batch_response.get_result(query_type)
                if result:
                    results[query_text] = result.result
                else:
                    results[query_text] = "Query failed"
            
            return {
                "success": True,
                "profile_id": profile_id,
                "results": results,
                "execution_time_ms": batch_response.total_execution_time_ms,
                "success_rate": batch_response.success_rate
            }
        
        else:
            # Fallback to sequential queries
            results = {}
            for query_info in queries_info:
                query = query_info.get("query", "")
                tool_name = query_info.get("tool_name")
                
                result = rag_manager.query_profile(profile_id, query, tool_name)
                results[query] = result
            
            return {
                "success": True,
                "profile_id": profile_id,
                "results": results
            }
        
    except Exception as e:
        logger.error(f"Multi-query failed for profile {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/simulate")
async def simulate(request: SimulationRequest):
    """
    Legacy endpoint for backward compatibility.
    """
    return await run_simulation(request.scenario_type, request)

@app.post("/api/simulation/with-explanations")
async def simulation_with_explanations(request: SimulationRequest):
    """
    Run simulation with AI explanations included.
    """
    return await run_simulation(request.scenario_type, request)

@app.post("/ai/generate-explanations")
async def generate_ai_explanations(request: Dict[str, Any]):
    """
    Generate AI explanations for simulation results.
    """
    try:
        simulation_result = request.get("simulation_result", {})
        profile_data = request.get("profile_data", {})
        scenario_type = request.get("scenario_type", "unknown")
        
        explanations = await generate_ai_explanations_with_llm(
            simulation_result=simulation_result,
            profile_data=profile_data,
            original_simulation_id=scenario_type
        )
        
        return {
            "success": True,
            "explanations": explanations
        }
        
    except Exception as e:
        logger.error(f"Failed to generate AI explanations: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/profiles")
async def get_profiles():
    """
    Get all available profiles.
    """
    try:
        # Get available profiles from CSV data
        available_profiles = data_loader.get_available_profiles()
        
        return {
            "success": True,
            "profiles": available_profiles
        }
        
    except Exception as e:
        logger.error(f"Failed to get profiles: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/profiles/{profile_id}")
async def get_profile(profile_id: int):
    """
    Get a specific profile by ID.
    """
    try:
        profile_data = await get_profile_data(str(profile_id))
        
        return {
            "success": True,
            "profile": profile_data
        }
        
    except Exception as e:
        logger.error(f"Failed to get profile {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/market-data")
async def get_market_data():
    """
    Get current market data.
    """
    try:
        market_data = await market_data_service.get_current_data()
        
        return {
            "success": True,
            "data": market_data
        }
        
    except Exception as e:
        logger.error(f"Failed to get market data: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/optimization/metrics")
async def get_optimization_metrics():
    """
    Get metrics for optimization performance including cache and batching.
    """
    try:
        metrics = {
            "api_cache": api_cache.get_stats(),
            "rag_batching": rag_metrics.get_metrics_summary() if batched_rag_service else None,
            "cache_manager": cache_manager.get_stats() if cache_manager else None
        }
        
        return {
            "success": True,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get optimization metrics: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/optimization/warm-cache")
async def warm_cache(request: Dict[str, Any] = {}):
    """
    Warm the cache with common scenarios for better performance.
    """
    try:
        # Warm API cache with common scenarios
        await api_cache.warm_cache(CACHE_WARMING_SCENARIOS)
        
        # Warm RAG cache if batched service available
        if batched_rag_service and request.get("warm_rag", False):
            profile_ids = request.get("profile_ids", [1, 2, 3])
            for profile_id in profile_ids:
                # Create common queries for warming
                common_queries = [
                    RAGQuery("What are my account balances?", QueryType.ACCOUNTS),
                    RAGQuery("Show my recent transactions", QueryType.TRANSACTIONS),
                    RAGQuery("What are my financial goals?", QueryType.GOALS)
                ]
                
                batch_request = BatchedRAGRequest(
                    profile_id=profile_id,
                    queries=common_queries
                )
                
                await batched_rag_service.execute_batch(batch_request)
        
        return {
            "success": True,
            "message": "Cache warming initiated",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Cache warming failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }
