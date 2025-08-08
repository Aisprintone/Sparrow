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
    ScenarioResult
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
# Import the multi-agent AI system
from ai.langgraph_dspy_agent import FinancialAIAgentSystem

# Import streaming endpoints
from api.streaming_endpoints import router as streaming_router

# Import workflow endpoints
from api.workflow_endpoints import router as workflow_router

# Import database configuration
from core.database import init_database, check_database_health

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Initialize database
        await init_database()
        logger.info("Database initialized successfully")
        
        # Initialize market data service
        await market_data_service.initialize()
        logger.info("Market data service initialized successfully")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Financial Simulation API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database health
        db_health = await check_database_health()
        
        # Check market data service
        market_health = market_data_service.is_healthy()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": db_health,
            "market_data": market_health,
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
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
except Exception as e:
    logger.error(f"Failed to initialize RAG manager: {e}")
    rag_manager = None

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

# Initialize AI agent
ai_agent = FinancialAIAgentSystem()

@app.post("/simulation/{scenario_type}")
async def run_simulation(scenario_type: str, request: SimulationRequest):
    """
    Run a financial simulation with the specified scenario type.
    
    Args:
        scenario_type: The type of simulation to run
        request: SimulationRequest containing profile_id, use_current_profile, and parameters
    
    Returns:
        SimulationResponse with simulation results and AI explanations
    """
    try:
        logger.info(f"Starting simulation for scenario: {scenario_type}")
        logger.info(f"Request data: profile_id={request.profile_id}, use_current_profile={request.use_current_profile}")
        logger.info(f"Original simulation ID: {request.original_simulation_id}")
        
        # Validate scenario type
        if scenario_type not in simulation_scenarios:
            raise HTTPException(status_code=400, detail=f"Unknown scenario type: {scenario_type}")
        
        # Get the simulation scenario
        scenario = simulation_scenarios[scenario_type]
        
        # Get profile data
        profile_data = await get_profile_data(request.profile_id)
        
        # Prepare simulation config with original simulation context
        config = prepare_simulation_config(request, scenario_type)
        
        # Add original simulation context to config
        if request.original_simulation_id:
            config['original_simulation_id'] = request.original_simulation_id
        
        # Run the actual simulation using the scenario script
        logger.info("Running simulation using scenario script...")
        simulation_result = await run_scenario_simulation(
            scenario_type=scenario_type,
            original_simulation_id=request.original_simulation_id,
            profile_data=profile_data,
            config=config
        )
        
        # Generate AI explanations using the LLM AI layer
        logger.info("Generating AI explanations using LLM...")
        ai_explanations = await generate_ai_explanations_with_llm(
            simulation_result=simulation_result,
            profile_data=profile_data,
            original_simulation_id=request.original_simulation_id or scenario_type
        )
        
        # Prepare response
        response_data = {
            "scenario_name": simulation_result.get("scenario_name", scenario_type),
            "description": simulation_result.get("description", ""),
            "simulation_results": simulation_result,
            "ai_explanations": ai_explanations,
            "profile_data": profile_data,
            "config": config,
            "original_simulation_id": request.original_simulation_id,
            "timestamp": datetime.now().isoformat()
        }
        
        return SimulationResponse(
            success=True,
            data=response_data,
            message=f"Simulation completed successfully for {scenario_type}"
        )
        
    except Exception as e:
        logger.error(f"Simulation failed for {scenario_type}: {e}")
        logger.error(traceback.format_exc())
        return SimulationResponse(
            success=False,
            data={},
            message=f"Simulation failed: {str(e)}"
        )

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
        
        # Create simulation engine
        engine = MonteCarloEngine()
        
        # Run the simulation
        result = await scenario_class.run_simulation(profile_data, config)
        
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
        # Use the AI agent to generate explanations
        explanations = await ai_agent.generate_explanations(
            simulation_result=simulation_result,
            profile_data=profile_data,
            scenario_type=original_simulation_id
        )
        
        return explanations
        
    except Exception as e:
        logger.error(f"Failed to generate AI explanations for {original_simulation_id}: {e}")
        # No fallbacks - must use real AI explanations
        raise Exception("AI explanation generation failed - no mock fallbacks allowed")

async def get_profile_data(profile_id: str) -> Dict[str, Any]:
    """
    Get profile data for the specified profile ID from CSV data.
    """
    try:
        # Load profile data from CSV using the data loader
        profile_data = data_loader.load_profile(int(profile_id))
        
        # Convert to dictionary format
        return {
            "customer_id": profile_data.customer_id,
            "name": profile_data.name,
            "age": profile_data.age,
            "monthly_income": profile_data.monthly_income,
            "monthly_expenses": profile_data.monthly_expenses,
            "emergency_fund": profile_data.emergency_fund,
            "student_loan_balance": profile_data.student_loan_balance,
            "risk_tolerance": profile_data.risk_tolerance,
            "credit_score": profile_data.credit_score,
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
                    "category": transaction.category,
                    "date": transaction.date.isoformat(),
                    "description": transaction.description
                }
                for transaction in profile_data.transactions
            ]
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
    """
    try:
        if rag_manager is None:
            raise HTTPException(status_code=500, detail="RAG manager not initialized")
        
        queries = request.get("queries", [])
        results = {}
        
        for query_info in queries:
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
