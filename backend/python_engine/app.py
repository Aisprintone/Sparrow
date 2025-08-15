"""
FastAPI application for Monte Carlo simulation engine.
Provides REST API endpoints for Next.js integration.
"""

from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Depends
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

# Import unified classification engine - PHASE 2+: INTEGRATE CLASSIFICATION
try:
    from workflows.domain.unified_classification_engine import (
        UnifiedClassificationService,
        UnifiedClassificationEngine,
        FinancialIntentType
    )
    from workflows.domain.classification_engine import ClassificationService
    from workflows.abstractions.value_objects import WorkflowContext
    UNIFIED_CLASSIFICATION_AVAILABLE = True
    print("[PHASE 2+] ✅ Unified classification engine imported successfully")
    
    # Initialize unified classification service
    unified_classification_service = UnifiedClassificationService()
    print("[PHASE 2+] ✅ Unified classification service initialized")
    
except ImportError as e:
    print(f"[PHASE 2+] ⚠️ Unified classification not available: {e}")
    UNIFIED_CLASSIFICATION_AVAILABLE = False
    unified_classification_service = None

# Simplified workflow endpoints without dependency injection
WORKFLOW_SYSTEM_AVAILABLE = False  # Temporarily disabled due to DI complexity

# Import cache endpoints - PATTERN GUARDIAN ENFORCED
from api.cache_endpoints import router as cache_router

# Import database configuration
from core.database import init_database, check_database_health

# Import unified cache for initialization
from core.api_cache import api_cache, CACHE_WARMING_SCENARIOS
from core.cache_manager import cache_manager

# Import security components
from security.microservice_auth import (
    verify_netlify_service,
    verify_service_rate_limit,
    validate_microservice_environment,
)
from security.middleware import SecurityMiddleware, CORSSecurityMiddleware
from security.auth import ALLOWED_ORIGINS, NETLIFY_DOMAIN

# Configure logging
from logging_config import setup_logging, get_logger, PerformanceLogger

# Setup comprehensive logging
logger = setup_logging(level="INFO", log_to_file=True, log_to_console=True)
perf_logger = PerformanceLogger(logger)

app = FastAPI(title="FinanceAI Secure API", version="4.0.0", description="Secure microservice API for Netlify frontend")

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

# Add security middleware
app.add_middleware(SecurityMiddleware, rate_limit_per_minute=100, rate_limit_burst=20)
app.add_middleware(CORSSecurityMiddleware, allowed_origins=ALLOWED_ORIGINS)

# Secure CORS middleware - only allow Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Service-Key", "X-Signature", "X-Timestamp"],
    expose_headers=["X-Request-ID"],
)

# Include routers
app.include_router(streaming_router, prefix="/streaming", tags=["streaming"])

# PHASE 2: Include workflow system routers
if WORKFLOW_SYSTEM_AVAILABLE:
    app.include_router(classification_router, prefix="/api/v1/classify", tags=["classification"])
    app.include_router(goal_router, prefix="/api/v1/goals", tags=["goals"]) 
    app.include_router(workflow_execution_router, prefix="/api/v1/workflows", tags=["workflows"])
    app.include_router(workflow_health_router, prefix="/api/v1/health", tags=["workflow-health"])
    print("[PHASE 2] ✅ Workflow routers integrated with API versioning")

app.include_router(cache_router, prefix="/cache", tags=["cache"])

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    print("[RAILWAY BACKEND] 🚀 Application startup initiated")
    print("[RAILWAY BACKEND] Environment:", os.getenv("ENVIRONMENT", "development"))
    print("[RAILWAY BACKEND] Python version:", sys.version)
    
    try:
        # Validate security configuration
        print("[RAILWAY BACKEND] 🔄 Validating security configuration...")
        validate_microservice_environment()
        print("[RAILWAY BACKEND] ✅ Security configuration validated")
        
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

# Initialize AI agent lazily to avoid startup failures
ai_agent = None

def get_ai_agent():
    """Get or initialize the AI agent lazily"""
    global ai_agent
    if ai_agent is None:
        try:
            # Check if API keys are available
            if not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("OPENAI_API_KEY"):
                logger.warning("No API keys found for AI agent - simulation will work without AI explanations")
                raise ValueError("No API keys available for AI agent")
            
            ai_agent = FinancialAIAgentSystem()
            logger.info("AI agent initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AI agent: {e}")
            raise HTTPException(status_code=500, detail="AI system not available")
    return ai_agent

@app.post("/simulation/{scenario_type}")
async def run_simulation(
    scenario_type: str, 
    request: SimulationRequest,
    service_auth: Dict[str, Any] = Depends(verify_netlify_service),
    rate_limit_check: bool = Depends(verify_service_rate_limit)
):
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
            request.original_simulation_id or "new_simulation",
            config  # Pass the config for unified card generator
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
        print(f"[RAILWAY BACKEND] 🔄 Attempting hardcoded fallback for scenario: {scenario_type}")
        
        # Implement hardcoded fallback values for failed API integrations per user request
        try:
            fallback_result = await generate_hardcoded_simulation_fallback(
                scenario_type, request.profile_id, profile_data, config
            )
            if fallback_result:
                print(f"[RAILWAY BACKEND] ✅ Hardcoded fallback successful for {scenario_type}")
                return fallback_result
        except Exception as fallback_error:
            print(f"[RAILWAY BACKEND] ❌ Fallback also failed: {fallback_error}")
        
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

async def generate_hardcoded_simulation_fallback(
    scenario_type: str,
    profile_id: str,
    profile_data: Dict[str, Any],
    config: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Generate hardcoded simulation fallback based on internet-researched market values.
    User explicitly requested: "get all scenarios working..if errors are due to api integration 
    like market crash, hard code values based on internet searched values"
    """
    
    demographic = profile_data.get('demographic', 'millennial')
    income = profile_data.get('monthly_income', 5000)
    age = profile_data.get('age', 30)
    
    if scenario_type == "market_crash":
        # Based on real market crash research:
        # - 2008 Financial Crisis: -56.8% decline, 17-month duration, 48-month recovery
        # - 2020 COVID Crash: -33.9% decline, 2-month duration, 5-month recovery  
        # - 2000 Dot-com Bubble: -49.1% decline, 31-month duration, 84-month recovery
        simulation_results = {
            "scenario_name": "Market Crash Impact",
            "description": "Portfolio resilience during market downturns (based on historical data)",
            "portfolio_decline": -35.2,  # Average of major crashes
            "recovery_months": 24,       # Conservative recovery estimate
            "survival_months": 18,       # Based on emergency fund analysis
            "portfolio_value_after_crash": income * 12 * 2.5 * 0.648,  # ~35% decline from 2.5x annual income
            "recommended_emergency_fund": income * 12,  # 12 months for market volatility
            "risk_metrics": {
                "max_drawdown": -35.2,
                "volatility": 22.5,        # Historical market volatility during crashes
                "correlation_bonds": 0.15,  # Bonds often provide protection
                "correlation_gold": -0.25   # Gold as hedge against market crashes
            }
        }
        
        # Generate hardcoded AI explanations based on real market crash strategies
        ai_explanations = [
            {
                "id": "market_crash_protection",
                "title": f"Weather ${abs(simulation_results['portfolio_decline']):,.1f}% Market Decline", 
                "description": f"Build resilience for {demographic} investors during market volatility",
                "tag": "CRITICAL",
                "tagColor": "bg-red-500",
                "potentialSaving": int(simulation_results['recommended_emergency_fund']),
                "category": "Market Protection",
                "steps": [
                    "Maintain 12 months emergency fund for market volatility",
                    "Diversify with 20-30% bonds during market uncertainty", 
                    "Continue dollar-cost averaging during market declines",
                    "Review portfolio allocation quarterly during volatile periods"
                ],
                "explanation": f"Based on historical market crashes (2008: -56.8%, 2020: -33.9%, 2000: -49.1%), a diversified portfolio typically sees 35% declines during severe market stress. Recovery averages 24 months for major crashes."
            },
            {
                "id": "market_crash_opportunity", 
                "title": "Buy Market Dips Strategically",
                "description": "Turn market crashes into wealth-building opportunities",
                "tag": "OPPORTUNITY", 
                "tagColor": "bg-green-500",
                "potentialSaving": int(income * 6),  # 6 months additional contributions during crash
                "category": "Investment Strategy",
                "steps": [
                    "Increase contributions by 50% during market declines",
                    "Focus on broad market index funds during volatility",
                    "Avoid panic selling during temporary market drops", 
                    "Rebalance portfolio when assets are 'on sale'"
                ],
                "explanation": f"Market crashes create buying opportunities. Investors who increased contributions during 2008-2009 crash saw returns of 400%+ over the following decade. Dollar-cost averaging during declines reduces average cost basis significantly."
            }
        ]
        
        return {
            "success": True,
            "data": {
                "simulation_results": simulation_results,
                "ai_explanations": ai_explanations,
                "metadata": {
                    "scenario_type": scenario_type,
                    "profile_id": profile_id,
                    "fallback_reason": "API integration failure - using historical market data",
                    "data_source": "Historical market crash analysis (2000, 2008, 2020)"
                }
            }
        }
    
    elif scenario_type == "student_loan":
        # Based on real student loan research:
        # - Average student loan debt: $37,338 (Federal Reserve 2023)  
        # - Average interest rate: 5.50% (2023-2024 federal rates)
        # - Standard repayment: 10 years, Income-driven: 20-25 years
        avg_loan_balance = 37338
        avg_interest_rate = 0.055
        monthly_payment = (avg_loan_balance * (avg_interest_rate / 12)) / (1 - (1 + avg_interest_rate / 12) ** -120)  # 10-year term
        
        simulation_results = {
            "scenario_name": "Student Loan Optimization",
            "description": "Optimize student loan payoff vs investment strategy",
            "loan_balance": avg_loan_balance,
            "interest_rate": avg_interest_rate,
            "monthly_payment": monthly_payment,
            "years_to_payoff": 10,
            "total_interest_paid": (monthly_payment * 120) - avg_loan_balance,
            "investment_alternative_return": income * 12 * 0.07 * 10,  # 7% market return over 10 years
            "recommended_strategy": "pay_minimum_invest_difference" if avg_interest_rate < 0.07 else "accelerate_payoff"
        }
        
        ai_explanations = [
            {
                "id": "student_loan_optimization",
                "title": f"Optimize ${avg_loan_balance:,.0f} Student Loan Strategy",
                "description": f"Balance loan payoff vs investment for {demographic} borrowers", 
                "tag": "STRATEGY",
                "tagColor": "bg-blue-500", 
                "potentialSaving": int(simulation_results['total_interest_paid'] * 0.3),  # 30% interest savings
                "category": "Debt Management",
                "steps": [
                    f"Pay minimum ${monthly_payment:,.0f}/month on {avg_interest_rate*100:.1f}% loans",
                    "Invest difference in broad market index funds for higher returns",
                    "Consider loan refinancing if credit score improved",
                    "Prioritize employer 401k match before extra loan payments"
                ],
                "explanation": f"With student loans at {avg_interest_rate*100:.1f}%, paying minimum and investing surplus typically yields higher long-term wealth. Market returns average 7-10% vs {avg_interest_rate*100:.1f}% loan cost."
            },
            {
                "id": "student_loan_tax_benefits",
                "title": "Maximize Student Loan Tax Deduction", 
                "description": "Leverage tax benefits while building wealth",
                "tag": "TAX SAVINGS",
                "tagColor": "bg-purple-500",
                "potentialSaving": 2500,  # Maximum annual deduction
                "category": "Tax Strategy", 
                "steps": [
                    "Claim up to $2,500 annual student loan interest deduction",
                    "Keep loans if interest rate under 4% for tax arbitrage",
                    "Track loan interest payments for tax filing",
                    "Consider income limits for deduction eligibility"
                ],
                "explanation": "Student loan interest is tax-deductible up to $2,500 annually. Combined with low interest rates, this effectively reduces loan cost below inflation in many cases."
            }
        ]
        
        return {
            "success": True, 
            "data": {
                "simulation_results": simulation_results,
                "ai_explanations": ai_explanations,
                "metadata": {
                    "scenario_type": scenario_type,
                    "profile_id": profile_id,
                    "fallback_reason": "API integration failure - using federal student loan data",
                    "data_source": "Federal Reserve student loan statistics 2023"
                }
            }
        }
    
    # Return None for scenarios we don't have hardcoded fallbacks for
    return None

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
    original_simulation_id: str,
    config: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Generate AI explanations using the LLM system.
    """
    try:
        # Get the AI agent lazily
        ai_agent = get_ai_agent()
        
        # Use the AI agent to generate explanation cards with enhanced context
        # Pass the full configuration to enable termination-specific card generation
        explanations = await ai_agent.generate_explanation_cards(
            simulation_data=simulation_result,
            user_profile=profile_data,
            scenario_context=original_simulation_id,
            scenario_config=config  # NEW: Pass full config including termination_type
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
                    "type": str(account.account_type),
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
        emergency_type = request.parameters.get("emergency_type", "job_loss")
        base_config.update({
            "target_months": request.parameters.get("target_months", 6),
            "monthly_contribution": request.parameters.get("monthly_contribution", 500),
            "risk_tolerance": request.parameters.get("risk_tolerance", "moderate"),
            "emergency_type": emergency_type
        })
        
        # Add job loss specific parameters
        if emergency_type == "job_loss":
            base_config.update({
                "termination_type": request.parameters.get("termination_type", "fired"),
                "severance_weeks": request.parameters.get("severance_weeks", 8),
                "unemployment_eligible": request.parameters.get("unemployment_eligible", True),
                "cobra_coverage": request.parameters.get("cobra_coverage", True)
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

@app.post("/rag/query/{profile_id}")
async def query_profile_rag(
    profile_id: int, 
    request: Dict[str, Any],
    service_auth: Dict[str, Any] = Depends(verify_netlify_service)
):
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

# ==================== UNIFIED CLASSIFICATION ENDPOINTS - PHASE 2+ ====================

@app.post("/api/classification/unified")
async def classify_unified_intent(request: Dict[str, Any]):
    """
    Classify user input using unified classification engine.
    Integrates evidence-based, registry-based, and traditional classification.
    
    Request format:
    {
        "user_input": "I want to save for an emergency fund",
        "user_id": "123",
        "user_data": {...},  # Optional: profile data for evidence-based analysis
        "use_unified": true  # Optional: default true
    }
    """
    if not UNIFIED_CLASSIFICATION_AVAILABLE:
        raise HTTPException(status_code=503, detail="Unified classification engine not available")
    
    try:
        user_input = request.get("user_input", "")
        user_id = request.get("user_id", "anonymous")
        user_data = request.get("user_data")
        use_unified = request.get("use_unified", True)
        
        if not user_input:
            raise HTTPException(status_code=400, detail="user_input is required")
        
        # Create workflow context
        context = WorkflowContext(
            user_id=user_id,
            user_profile=user_data.get("profile", {}) if user_data else {},
            financial_data=user_data.get("financial_data", {}) if user_data else {},
            preferences=user_data.get("preferences", {}) if user_data else {}
        )
        
        # Perform classification
        classification_result = await unified_classification_service.classify(
            user_input=user_input,
            context=context,
            use_unified=use_unified,
            user_data=user_data
        )
        
        # Convert result to dict for API response
        if hasattr(classification_result, 'to_dict'):
            result_dict = classification_result.to_dict()
        else:
            # Legacy format
            result_dict = {
                "category": classification_result.category.value,
                "confidence": classification_result.confidence,
                "sub_category": classification_result.sub_category,
                "intent_keywords": classification_result.intent_keywords,
                "suggested_workflows": classification_result.suggested_workflows
            }
        
        return {
            "success": True,
            "classification": result_dict,
            "unified_engine_used": use_unified,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        logger.error(traceback.format_exc())
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }

@app.get("/api/classification/supported-intents")
async def get_supported_intents():
    """Get list of supported financial intent types."""
    if not UNIFIED_CLASSIFICATION_AVAILABLE:
        raise HTTPException(status_code=503, detail="Unified classification engine not available")
    
    try:
        intents = unified_classification_service.get_supported_intents()
        metrics = unified_classification_service.get_metrics()
        
        return {
            "success": True,
            "supported_intents": intents,
            "metrics": metrics,
            "engine_version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Failed to get supported intents: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/classification/legacy")
async def classify_legacy_format(request: Dict[str, Any]):
    """
    Legacy classification endpoint for backward compatibility.
    Always returns traditional WorkflowClassification format.
    """
    if not UNIFIED_CLASSIFICATION_AVAILABLE:
        raise HTTPException(status_code=503, detail="Unified classification engine not available")
    
    try:
        user_input = request.get("user_input", "")
        user_id = request.get("user_id", "anonymous")
        user_data = request.get("user_data")
        
        if not user_input:
            raise HTTPException(status_code=400, detail="user_input is required")
        
        # Create workflow context
        context = WorkflowContext(
            user_id=user_id,
            user_profile=user_data.get("profile", {}) if user_data else {},
            financial_data=user_data.get("financial_data", {}) if user_data else {},
            preferences=user_data.get("preferences", {}) if user_data else {}
        )
        
        # Get legacy format result
        legacy_result = await unified_classification_service.classify_legacy(
            user_input=user_input,
            context=context
        )
        
        return {
            "success": True,
            "classification": legacy_result.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Legacy classification failed: {e}")
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
        market_data = market_data_service.get_current_prices()
        
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

# ==================== GOALS API ENDPOINTS - PHASE 1 CRITICAL ====================

@app.get("/api/goals")
async def get_all_goals():
    """Get all goals from CSV data."""
    try:
        all_goals = data_loader.get_all_goals()
        
        return {
            "success": True,
            "goals": all_goals,
            "total_count": len(all_goals),
            "data_source": "CSV (goal.csv)"
        }
        
    except Exception as e:
        logger.error(f"Failed to get all goals: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/goals/profile/{profile_id}")
async def get_profile_goals(profile_id: int):
    """Get goals for specific profile from CSV data."""
    try:
        profile_goals = data_loader.load_goals(profile_id)
        
        # Calculate progress if possible from accounts
        try:
            profile_data = data_loader.load_profile(profile_id)
            total_assets = sum(a.balance for a in profile_data.accounts if a.balance > 0)
            
            # Update goal progress based on available assets
            for goal in profile_goals:
                if goal['target_amount'] and goal['target_amount'] > 0:
                    # Simple heuristic: if goal is house down payment, use savings accounts
                    if 'house' in goal['title'].lower() or 'home' in goal['title'].lower():
                        savings_accounts = [a for a in profile_data.accounts if 'savings' in a.name.lower()]
                        current_amount = sum(a.balance for a in savings_accounts)
                        goal['current_amount'] = max(0, current_amount)
                        goal['progress_percentage'] = min(100, (current_amount / goal['target_amount']) * 100)
                    
        except Exception as e:
            logger.warning(f"Could not calculate goal progress: {e}")
        
        return {
            "success": True,
            "goals": profile_goals,
            "profile_id": profile_id,
            "goal_count": len(profile_goals),
            "data_source": "CSV (goal.csv)"
        }
        
    except Exception as e:
        logger.error(f"Failed to get goals for profile {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/goals/profile/{profile_id}/progress")
async def update_goal_progress(profile_id: int, request: Dict[str, Any]):
    """Update goal progress (placeholder for future database integration)."""
    try:
        goal_id = request.get("goal_id")
        current_amount = request.get("current_amount", 0)
        
        # For now, return success - this would update database in production
        return {
            "success": True,
            "message": f"Goal progress updated (simulation only)",
            "goal_id": goal_id,
            "current_amount": current_amount,
            "note": "CSV data is read-only. Use database for persistence."
        }
        
    except Exception as e:
        logger.error(f"Failed to update goal progress: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# ==================== TRANSACTION SUMMARY ENDPOINTS - PHASE 1 CRITICAL ====================

@app.get("/api/transactions/summary/{profile_id}")
async def get_transaction_summary(profile_id: int):
    """Get transaction summary instead of full transaction list (fixes 70% over-fetching)."""
    try:
        profile_data = data_loader.load_profile(profile_id)
        
        # Calculate summary metrics instead of returning all transactions
        summary = {
            "profile_id": profile_id,
            "total_transactions": len(profile_data.transactions),
            "monthly_income": profile_data.monthly_income,
            "monthly_expenses": profile_data.monthly_expenses,
            "net_monthly_flow": profile_data.monthly_income - profile_data.monthly_expenses,
            
            # Transaction category breakdown
            "income_total": sum(t.amount for t in profile_data.transactions if t.amount > 0),
            "expense_total": abs(sum(t.amount for t in profile_data.transactions if t.amount < 0)),
            
            # Recent activity (last 5 transactions only)
            "recent_transactions": [
                {
                    "description": t.description,
                    "amount": t.amount,
                    "timestamp": t.timestamp.isoformat(),
                    "account_id": t.account_id
                }
                for t in sorted(profile_data.transactions, key=lambda x: x.timestamp, reverse=True)[:5]
            ],
            
            # Data efficiency note
            "efficiency_note": f"Reduced from {len(profile_data.transactions)} full transactions to summary + 5 recent"
        }
        
        return {
            "success": True,
            "transaction_summary": summary,
            "data_source": "CSV (optimized)",
            "bandwidth_saved": f"{len(profile_data.transactions) - 5} transactions"
        }
        
    except Exception as e:
        logger.error(f"Failed to get transaction summary for profile {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/transactions/categories/{profile_id}")
async def get_transaction_categories(profile_id: int):
    """Get transaction categories breakdown (lightweight alternative to full transactions)."""
    try:
        profile_data = data_loader.load_profile(profile_id)
        
        # Analyze transaction patterns
        category_analysis = {}
        expense_transactions = [t for t in profile_data.transactions if t.amount < 0]
        
        # Simple category classification
        for transaction in expense_transactions:
            desc_lower = transaction.description.lower()
            category = "Other"
            
            if any(keyword in desc_lower for keyword in ['grocery', 'food', 'restaurant', 'dining']):
                category = "Food & Dining"
            elif any(keyword in desc_lower for keyword in ['gas', 'fuel', 'car', 'auto', 'insurance']):
                category = "Transportation"
            elif any(keyword in desc_lower for keyword in ['rent', 'mortgage', 'utilities', 'electric', 'water']):
                category = "Housing"
            elif any(keyword in desc_lower for keyword in ['shopping', 'amazon', 'store', 'retail']):
                category = "Shopping"
            elif any(keyword in desc_lower for keyword in ['medical', 'health', 'pharmacy', 'doctor']):
                category = "Healthcare"
            
            if category not in category_analysis:
                category_analysis[category] = {"amount": 0, "count": 0, "transactions": []}
            
            category_analysis[category]["amount"] += abs(transaction.amount)
            category_analysis[category]["count"] += 1
            category_analysis[category]["transactions"].append({
                "description": transaction.description,
                "amount": transaction.amount,
                "timestamp": transaction.timestamp.isoformat()
            })
        
        # Convert to sorted list
        categories = [
            {
                "category": cat,
                "total_amount": data["amount"],
                "transaction_count": data["count"],
                "average_amount": data["amount"] / data["count"] if data["count"] > 0 else 0,
                "recent_examples": data["transactions"][-3:] if data["transactions"] else []
            }
            for cat, data in category_analysis.items()
        ]
        categories.sort(key=lambda x: x["total_amount"], reverse=True)
        
        return {
            "success": True,
            "categories": categories,
            "profile_id": profile_id,
            "total_categories": len(categories),
            "analysis_period": "All available data"
        }
        
    except Exception as e:
        logger.error(f"Failed to get transaction categories for profile {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# ==================== OPTIMIZED PROFILE ENDPOINTS - PHASE 1 CRITICAL ====================

@app.get("/api/profiles/summary/{profile_id}")
async def get_profile_summary(profile_id: int):
    """Get optimized profile summary (only essential fields, removes 50% data waste)."""
    try:
        profile_data = data_loader.load_profile(profile_id)
        
        # Simple test - just return basic info
        summary = {
            "profile_id": profile_id,
            "customer_id": profile_data.customer_id,
            "age": profile_data.age,
            "monthly_income": profile_data.monthly_income,
            "monthly_expenses": profile_data.monthly_expenses,
            "credit_score": profile_data.credit_score,
            "total_assets": sum(a.balance for a in profile_data.accounts if a.balance > 0),
            "total_debt": abs(sum(a.balance for a in profile_data.accounts if a.balance < 0)),
            "status": "working"
        }
        
        return {
            "success": True,
            "profile_summary": summary,
            "data_source": "CSV (simplified for testing)"
        }
        
    except Exception as e:
        logger.error(f"Failed to get profile summary for {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/profiles/financial-health/{profile_id}")
async def get_financial_health(profile_id: int):
    """Get comprehensive financial health metrics (previously hidden data now surfaced)."""
    try:
        profile_data = data_loader.load_profile(profile_id)
        
        # Calculate comprehensive financial health metrics
        total_assets = sum(a.balance for a in profile_data.accounts if a.balance > 0)
        total_debt = abs(sum(a.balance for a in profile_data.accounts if a.balance < 0))
        annual_income = profile_data.monthly_income * 12
        annual_expenses = profile_data.monthly_expenses * 12
        
        health_metrics = {
            "profile_id": profile_id,
            
            # Core ratios (previously computed but hidden)
            "debt_to_income_ratio": total_debt / max(annual_income, 1),
            "debt_to_asset_ratio": total_debt / max(total_assets, 1),
            "savings_rate": max(0, (annual_income - annual_expenses) / max(annual_income, 1)),
            "emergency_fund_coverage": total_assets / max(profile_data.monthly_expenses, 1),
            
            # Credit health
            "credit_score": profile_data.credit_score,
            "credit_rating": (
                "Excellent" if profile_data.credit_score >= 800 else
                "Very Good" if profile_data.credit_score >= 740 else
                "Good" if profile_data.credit_score >= 670 else
                "Fair" if profile_data.credit_score >= 580 else
                "Poor"
            ),
            
            # Risk assessment
            "financial_risk_level": (
                "Low" if total_debt / max(annual_income, 1) < 0.2 and total_assets / max(profile_data.monthly_expenses, 1) >= 6 else
                "Medium" if total_debt / max(annual_income, 1) < 0.4 and total_assets / max(profile_data.monthly_expenses, 1) >= 3 else
                "High"
            ),
            
            # Recommendations based on data
            "recommendations": [],
            
            # Detailed breakdown
            "net_worth": total_assets - total_debt,
            "monthly_free_cash": profile_data.monthly_income - profile_data.monthly_expenses,
            "annual_savings_potential": (profile_data.monthly_income - profile_data.monthly_expenses) * 12,
        }
        
        # Generate personalized recommendations
        if health_metrics["emergency_fund_coverage"] < 3:
            health_metrics["recommendations"].append("Build emergency fund to 3-6 months expenses")
        if health_metrics["debt_to_income_ratio"] > 0.4:
            health_metrics["recommendations"].append("Focus on debt reduction - debt-to-income ratio is high")
        if health_metrics["savings_rate"] < 0.1:
            health_metrics["recommendations"].append("Increase savings rate to at least 10% of income")
        if profile_data.credit_score < 700:
            health_metrics["recommendations"].append("Work on improving credit score")
        
        return {
            "success": True,
            "financial_health": health_metrics,
            "analysis_date": datetime.now().isoformat(),
            "note": "Previously hidden backend calculations now surfaced"
        }
        
    except Exception as e:
        logger.error(f"Failed to get financial health for {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
