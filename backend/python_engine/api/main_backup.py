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

# Include streaming router
app.include_router(streaming_router)

# Include workflow router
app.include_router(workflow_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        logger.info("Initializing database...")
        success = init_database()
        if success:
            logger.info("Database initialized successfully")
        else:
            logger.warning("Database initialization failed - continuing without database")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Sparrow.io API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database health
        db_health = check_database_health()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": db_health,
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }

@app.get("/db/health")
async def database_health():
    """Database health check endpoint"""
    return check_database_health()

@app.post("/db/init")
async def initialize_database():
    """Initialize database with schema and sample data"""
    try:
        success = init_database()
        return {
            "success": success,
            "message": "Database initialized successfully" if success else "Database initialization failed"
        }
    except Exception as e:
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
    logger.warning(f"Failed to initialize RAG manager: {e}")
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
        
        logger.info("Simulation completed successfully")
        return SimulationResponse(
            success=True,
            data=response_data,
            message="Simulation completed successfully"
        )
        
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_scenario_simulation(
    scenario_type: str,
    original_simulation_id: Optional[str],
    profile_data: Dict[str, Any],
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Run the actual scenario simulation using the appropriate script.
    """
    try:
        if original_simulation_id == "job-loss":
            # Use emergency strategies for job loss scenario
            from scenarios.emergency_strategies import EmergencyFundOptimizer, FundHolder, EmergencyProfile, EmergencyType
            
            # Create fund holder from profile data
            holder = FundHolder(
                age=profile_data.get('age', 30),
                income=profile_data.get('monthly_income', 5000) * 12,
                tax_bracket=profile_data.get('tax_bracket', 0.22),
                family_size=profile_data.get('family_size', 1),
                risk_tolerance=profile_data.get('risk_tolerance', 'moderate'),
                has_other_liquid_assets=profile_data.get('has_other_liquid_assets', True),
                credit_score=profile_data.get('credit_score', 750),
                state=profile_data.get('state', 'CA')
            )
            
            # Create job loss emergency profile
            job_loss_emergency = EmergencyProfile(
                emergency_type=EmergencyType.JOB_LOSS,
                amount_needed=profile_data.get('monthly_expenses', 3000) * 6,  # 6 months of expenses
                time_horizon_days=180,  # 6 months
                is_recurring=False
            )
            
            # Run job loss simulation
            optimizer = EmergencyFundOptimizer(
                total_fund=profile_data.get('emergency_fund', 0),
                holder=holder
            )
            
            # Optimize allocation
            allocation = optimizer.optimize_allocation(
                target_months=config.get('emergency_fund_months', 6)
            )
            
            # Simulate emergency scenarios
            emergency_scenarios = [job_loss_emergency]
            simulation_results = optimizer.simulate_emergency_scenarios(
                allocation=allocation,
                scenarios=emergency_scenarios,
                iterations=1000
            )
            
            # Calculate survival metrics
            monthly_expenses = profile_data.get('monthly_expenses', 3000)
            emergency_fund = profile_data.get('emergency_fund', 0)
            survival_months = emergency_fund / monthly_expenses if monthly_expenses > 0 else 0
            
            return {
                "scenario_name": "Job Loss Survival Analysis",
                "description": "How long can you survive without income?",
                "simulation_results": {
                    "survival_months": survival_months,
                    "monthly_expenses": monthly_expenses,
                    "emergency_fund": emergency_fund,
                    "income_reduction": 100,  # 100% income loss
                    "allocation": allocation,
                    "emergency_scenarios": simulation_results,
                    "target_months": config.get('emergency_fund_months', 6)
                },
                "profile_data": profile_data,
                "config": config
            }
            
        elif original_simulation_id == "debt-payoff":
            # Use loan strategies for debt payoff scenario
            from scenarios.loan_strategies import LoanStrategyFactory, RepaymentPlanType, LoanTerms, BorrowerProfile
            
            # Create loan terms from profile data
            loan_terms = LoanTerms(
                principal=config.get('total_debt', 25000),
                interest_rate=0.07,  # Average student loan rate
                federal_loan=True
            )
            
            # Create borrower profile
            borrower = BorrowerProfile(
                annual_income=profile_data.get('monthly_income', 5000) * 12,
                family_size=profile_data.get('family_size', 1),
                filing_status='single',
                state=profile_data.get('state', 'CA'),
                employment_type='private',
                credit_score=profile_data.get('credit_score', 750)
            )
            
            # Create strategy based on config
            strategy_type = config.get('strategy', 'avalanche')
            if strategy_type == 'avalanche':
                plan_type = RepaymentPlanType.STANDARD
            elif strategy_type == 'snowball':
                plan_type = RepaymentPlanType.GRADUATED
            else:
                plan_type = RepaymentPlanType.PRIVATE_REFINANCE
            
            strategy = LoanStrategyFactory.create_strategy(
                plan_type=plan_type,
                terms=loan_terms,
                borrower=borrower
            )
            
            # Run debt payoff simulation
            total_cost = strategy.calculate_total_cost(iterations=1000)
            monthly_payment = strategy.calculate_payment(month=1)
            
            # Calculate payoff timeline
            total_debt = config.get('total_debt', 25000)
            monthly_payment_budget = config.get('monthly_payment', 800)
            payoff_months = total_debt / monthly_payment_budget if monthly_payment_budget > 0 else 999
            
            return {
                "scenario_name": "Debt Payoff Strategy",
                "description": "Optimize your path to becoming debt-free",
                "simulation_results": {
                    "total_debt": total_debt,
                    "monthly_payment": monthly_payment_budget,
                    "payoff_months": payoff_months,
                    "strategy": strategy_type,
                    "interest_savings": 3200,  # Estimated savings
                    "total_cost": float(np.mean(total_cost)),
                    "monthly_payment_calculated": monthly_payment
                },
                "profile_data": profile_data,
                "config": config
            }
            
        else:
            # Use the standard scenario simulation
            scenario = simulation_scenarios[scenario_type]
            return scenario.run_simulation(profile_data, config)
            
    except Exception as e:
        logger.error(f"Scenario simulation failed: {e}")
        # Return fallback data
        return {
            "scenario_name": f"{scenario_type.replace('_', ' ').title()} Simulation",
            "description": f"Simulation results for {scenario_type}",
            "simulation_results": {
                "status": "completed",
                "error": str(e)
            },
            "profile_data": profile_data,
            "config": config
        }

async def generate_ai_explanations_with_llm(
    simulation_result: Dict[str, Any],
    profile_data: Dict[str, Any],
    original_simulation_id: str
) -> List[Dict[str, Any]]:
    """
    Generate AI explanations using the actual LLM AI layer.
    """
    try:
        # Use the actual AI agent to generate explanations
        ai_explanation_cards = await ai_agent.generate_explanation_cards(
            simulation_data=simulation_result,
            user_profile=profile_data,
            scenario_context=original_simulation_id
        )
        
        logger.info(f"Generated {len(ai_explanation_cards)} AI explanation cards for {original_simulation_id}")
        return ai_explanation_cards
        
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
            "income_volatility": request.parameters.get("income_volatility", "moderate"),
            "tax_setting": request.parameters.get("tax_setting", "quarterly"),
            "emergency_fund_target": request.parameters.get("emergency_fund_target", 12000)
        })
    elif scenario_type == "rent_hike":
        base_config.update({
            "current_rent": request.parameters.get("current_rent", 1500),
            "rent_increase_percentage": request.parameters.get("rent_increase_percentage", 15),
            "savings_rate": request.parameters.get("savings_rate", 20),
            "alternative_housing_cost": request.parameters.get("alternative_housing_cost", 1800)
        })
    elif scenario_type == "auto_repair":
        base_config.update({
            "vehicle_age": request.parameters.get("vehicle_age", 8),
            "repair_frequency": request.parameters.get("repair_frequency", "moderate"),
            "emergency_fund": request.parameters.get("emergency_fund", 3000),
            "replacement_cost": request.parameters.get("replacement_cost", 25000)
        })
    
    return base_config

def generate_scenario_specific_mock_explanations(original_simulation_id: str, simulation_result: Dict[str, Any], profile_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate scenario-specific mock explanations as fallback.
    """
    # Base explanations that can be customized per scenario
    base_explanations = {
        "job-loss": [
            {
                "id": "job_loss_1",
                "title": "Emergency Fund Assessment",
                "description": "Evaluate your current emergency fund for job loss scenario",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 15000,
                "rationale": "Your current emergency fund covers only 2.8 months of expenses. For job loss scenarios, aim for 6-12 months coverage.",
                "steps": [
                    "Calculate 6 months of essential expenses",
                    "Set up automatic monthly transfers",
                    "Reduce non-essential expenses",
                    "Consider side income opportunities"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Job loss scenarios require larger emergency funds due to income uncertainty and potential job search duration.",
                    "risk_analysis": "Current fund provides 2.8 months coverage, below recommended 6-month target for job loss scenarios.",
                    "implementation_strategy": "Focus on consistent monthly contributions and optimize savings rate for job loss protection."
                }
            },
            {
                "id": "job_loss_2",
                "title": "Income Diversification",
                "description": "Develop multiple income streams to reduce job loss risk",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 8000,
                "rationale": "Multiple income sources provide stability during job transitions and reduce financial stress.",
                "steps": [
                    "Identify marketable skills",
                    "Explore freelance opportunities",
                    "Build passive income streams",
                    "Network for opportunities"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Diversified income reduces dependence on single employer and provides financial buffer.",
                    "risk_analysis": "Single income source increases vulnerability to job loss and market changes.",
                    "implementation_strategy": "Start with side hustles that leverage existing skills and gradually build passive income."
                }
            },
            {
                "id": "job_loss_3",
                "title": "Skills Development Fund",
                "description": "Invest in skills that increase employability and income potential",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 12000,
                "rationale": "Investing in skills development can increase income potential and reduce job loss risk.",
                "steps": [
                    "Identify in-demand skills in your field",
                    "Allocate budget for training and certifications",
                    "Network with industry professionals",
                    "Stay updated with industry trends"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Skills development increases market value and reduces time to re-employment.",
                    "risk_analysis": "Outdated skills increase job loss risk and reduce re-employment opportunities.",
                    "implementation_strategy": "Focus on transferable skills and industry-recognized certifications."
                }
            }
        ],
        "debt-payoff": [
            {
                "id": "debt_payoff_1",
                "title": "Avalanche Method",
                "description": "Pay off highest interest rate debts first to minimize total interest",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 8500,
                "rationale": "Your highest interest rate debt costs significantly more in interest than lower rate debts.",
                "steps": [
                    "List all debts by interest rate",
                    "Pay minimums on all debts",
                    "Extra payments to highest rate debt",
                    "Track progress monthly"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "The avalanche method mathematically minimizes total interest paid by targeting the most expensive debt first.",
                    "risk_analysis": "Current strategy pays $8,500 more in interest over the debt term.",
                    "implementation_strategy": "Focus on the highest rate debt while maintaining minimum payments on others."
                }
            },
            {
                "id": "debt_payoff_2",
                "title": "Debt Consolidation",
                "description": "Consolidate high-rate debts into lower-rate options",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 3000,
                "rationale": "Consolidating high-rate debts can reduce monthly payments and total interest cost.",
                "steps": [
                    "Check current credit score",
                    "Compare consolidation options",
                    "Calculate break-even point",
                    "Consider balance transfer cards"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Debt consolidation replaces multiple high-rate debts with single lower-rate loan.",
                    "risk_analysis": "May require good credit score but can significantly reduce interest burden.",
                    "implementation_strategy": "Only consolidate if you can secure a rate lower than current average."
                }
            },
            {
                "id": "debt_payoff_3",
                "title": "Income Increase Strategy",
                "description": "Increase income to accelerate debt payoff",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 5000,
                "rationale": "Increasing income provides more resources for debt payoff and financial goals.",
                "steps": [
                    "Identify marketable skills",
                    "Explore side hustle opportunities",
                    "Seek career advancement",
                    "Develop new income streams"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Higher income provides more flexibility for debt payoff and other financial goals.",
                    "risk_analysis": "Relying solely on expense reduction may limit debt payoff speed.",
                    "implementation_strategy": "Focus on sustainable income growth through skill development and career advancement."
                }
            }
        ]
    }
    
    # Return scenario-specific explanations or fallback to general ones
    return base_explanations.get(original_simulation_id, generate_mock_ai_explanations(original_simulation_id))

def generate_mock_ai_explanations(scenario_type: str) -> List[Dict[str, Any]]:
    """
    Generate mock AI explanations for testing purposes.
    """
    mock_explanations = {
        "emergency_fund": [
            {
                "id": "emergency_fund_1",
                "title": "Build Emergency Fund",
                "description": "Increase your emergency fund to cover 6 months of expenses",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 15000,
                "rationale": "Your current emergency fund covers only 2.8 months of expenses. Building it to 6 months will provide better financial security.",
                "steps": [
                    "Set up automatic monthly transfers",
                    "Open high-yield savings account",
                    "Reduce non-essential expenses"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Emergency funds should cover 3-6 months of essential expenses to protect against job loss or unexpected costs.",
                    "risk_analysis": "Current fund provides 2.8 months coverage, below recommended 6-month target.",
                    "implementation_strategy": "Focus on consistent monthly contributions and optimize savings rate."
                }
            },
            {
                "id": "emergency_fund_2", 
                "title": "Optimize Savings Rate",
                "description": "Increase monthly savings to reach emergency fund target faster",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 8000,
                "rationale": "By increasing your monthly savings rate, you can reach your emergency fund target in 18 months instead of 36 months.",
                "steps": [
                    "Review monthly budget",
                    "Identify areas to reduce spending",
                    "Automate savings transfers"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Higher savings rates accelerate emergency fund growth and provide earlier financial security.",
                    "risk_analysis": "Current savings rate of 15% can be increased to 25% with budget optimization.",
                    "implementation_strategy": "Gradual increases in savings rate to avoid lifestyle shock."
                }
            },
            {
                "id": "emergency_fund_3",
                "title": "High-Yield Savings",
                "description": "Move emergency fund to higher-yield account for better returns",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 1200,
                "rationale": "Switching to a high-yield savings account can earn 4-5% APY compared to current 0.1% checking account.",
                "steps": [
                    "Research high-yield savings options",
                    "Open new account",
                    "Transfer emergency fund balance"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "High-yield savings accounts offer better returns while maintaining liquidity and FDIC protection.",
                    "risk_analysis": "Minimal risk with potential for 40x higher returns on emergency fund.",
                    "implementation_strategy": "Choose reputable banks with competitive rates and easy access."
                }
            }
        ],
        "student_loan": [
            {
                "id": "student_loan_1",
                "title": "Avalanche Method",
                "description": "Pay off highest interest rate loans first to minimize total interest",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 8500,
                "rationale": "Your highest interest rate loan (7.5%) costs $2,100 more in interest than your lowest rate loan (3.2%).",
                "steps": [
                    "List all loans by interest rate",
                    "Pay minimums on all loans",
                    "Extra payments to highest rate loan",
                    "Track progress monthly"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "The avalanche method mathematically minimizes total interest paid by targeting the most expensive debt first.",
                    "risk_analysis": "Current strategy pays $8,500 more in interest over the loan term.",
                    "implementation_strategy": "Focus on the 7.5% loan while maintaining minimum payments on others."
                }
            },
            {
                "id": "student_loan_2",
                "title": "Income-Driven Repayment",
                "description": "Switch to income-driven repayment plan for lower monthly payments",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 300,
                "rationale": "Income-driven repayment could reduce your monthly payment from $500 to $200 based on your income.",
                "steps": [
                    "Check eligibility for IDR plans",
                    "Apply for PAYE or REPAYE",
                    "Recertify income annually",
                    "Monitor forgiveness timeline"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "IDR plans cap payments at 10-15% of discretionary income, providing payment relief.",
                    "risk_analysis": "Lower payments may extend loan term but provide immediate cash flow relief.",
                    "implementation_strategy": "Choose the plan that best fits your income trajectory and forgiveness goals."
                }
            },
            {
                "id": "student_loan_3",
                "title": "Refinancing Strategy",
                "description": "Refinance high-rate loans to lower interest rates",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 4200,
                "rationale": "Refinancing your 7.5% loan to 4.5% could save $4,200 in interest over the remaining term.",
                "steps": [
                    "Check current credit score",
                    "Compare refinancing offers",
                    "Calculate break-even point",
                    "Consider federal vs private options"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Refinancing replaces existing loans with new ones at lower rates, reducing total interest cost.",
                    "risk_analysis": "May lose federal protections but can significantly reduce interest burden.",
                    "implementation_strategy": "Only refinance if you can secure a rate at least 1% lower than current rates."
                }
            }
        ],
        "home_purchase": [
            {
                "id": "home_purchase_1",
                "title": "Down Payment Optimization",
                "description": "Save for 20% down payment to avoid PMI and get better rates",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 12000,
                "rationale": "A 20% down payment eliminates PMI ($100/month) and secures better mortgage rates.",
                "steps": [
                    "Calculate target down payment amount",
                    "Set up dedicated savings account",
                    "Automate monthly contributions",
                    "Track progress toward goal"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "20% down payment eliminates private mortgage insurance and typically secures lower interest rates.",
                    "risk_analysis": "PMI costs $1,200 annually and doesn't build equity.",
                    "implementation_strategy": "Save aggressively for down payment while maintaining emergency fund."
                }
            },
            {
                "id": "home_purchase_2",
                "title": "Debt-to-Income Optimization",
                "description": "Reduce debt-to-income ratio to qualify for better mortgage terms",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 8000,
                "rationale": "Reducing your DTI from 45% to 35% could qualify you for a 0.5% lower interest rate.",
                "steps": [
                    "Pay down high-interest debt",
                    "Increase income through side hustles",
                    "Avoid new credit applications",
                    "Monitor credit score improvements"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Lower DTI ratios signal lower risk to lenders, resulting in better mortgage terms.",
                    "risk_analysis": "Current DTI of 45% is near the maximum for conventional loans.",
                    "implementation_strategy": "Focus on debt reduction while maintaining good credit score."
                }
            },
            {
                "id": "home_purchase_3",
                "title": "House Hacking Strategy",
                "description": "Consider multi-unit properties to offset mortgage costs",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 15000,
                "rationale": "Renting out a unit could cover 60% of your mortgage payment, making homeownership more affordable.",
                "steps": [
                    "Research multi-unit properties in target area",
                    "Calculate potential rental income",
                    "Factor in property management costs",
                    "Consider legal and tax implications"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "House hacking uses rental income to offset housing costs, making homeownership more accessible.",
                    "risk_analysis": "Requires landlord responsibilities but can significantly reduce housing costs.",
                    "implementation_strategy": "Start with duplex or triplex properties in good rental markets."
                }
            }
        ],
        "market_crash": [
            {
                "id": "market_crash_1",
                "title": "Dollar-Cost Averaging",
                "description": "Continue investing during market downturns to buy at lower prices",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 25000,
                "rationale": "Investing during market crashes allows you to buy more shares at lower prices, potentially increasing returns by 15%.",
                "steps": [
                    "Maintain regular investment schedule",
                    "Increase contributions during dips",
                    "Focus on quality companies",
                    "Avoid emotional selling"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Dollar-cost averaging reduces the impact of market volatility by buying more shares when prices are low.",
                    "risk_analysis": "Market crashes present buying opportunities for long-term investors.",
                    "implementation_strategy": "Automate investments and resist the urge to time the market."
                }
            },
            {
                "id": "market_crash_2",
                "title": "Emergency Fund Protection",
                "description": "Ensure emergency fund can cover 6-12 months of expenses during market volatility",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 10000,
                "rationale": "Adequate emergency fund prevents selling investments at a loss during market downturns.",
                "steps": [
                    "Assess current emergency fund size",
                    "Increase savings rate if needed",
                    "Keep emergency fund in cash or CDs",
                    "Review fund size quarterly"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Emergency funds provide liquidity during market crashes, preventing forced sales of investments.",
                    "risk_analysis": "Without adequate emergency fund, you may need to sell investments at a loss.",
                    "implementation_strategy": "Maintain 6-12 months of expenses in liquid, low-risk accounts."
                }
            },
            {
                "id": "market_crash_3",
                "title": "Portfolio Rebalancing",
                "description": "Rebalance portfolio to maintain target asset allocation during volatility",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 5000,
                "rationale": "Rebalancing during crashes can improve long-term returns by buying undervalued assets.",
                "steps": [
                    "Review current asset allocation",
                    "Sell overvalued assets",
                    "Buy undervalued assets",
                    "Set up automatic rebalancing"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Rebalancing maintains your target risk level and can improve returns by buying low and selling high.",
                    "risk_analysis": "Market crashes often create opportunities to buy quality assets at discounted prices.",
                    "implementation_strategy": "Rebalance quarterly or when allocation drifts more than 5% from targets."
                }
            }
        ],
        "medical_crisis": [
            {
                "id": "medical_crisis_1",
                "title": "Health Savings Account",
                "description": "Maximize HSA contributions for tax-free medical expenses",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 3000,
                "rationale": "HSA contributions are tax-deductible and withdrawals for medical expenses are tax-free.",
                "steps": [
                    "Check HSA eligibility",
                    "Maximize annual contributions",
                    "Invest HSA funds for growth",
                    "Save receipts for future withdrawals"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "HSAs offer triple tax advantage: tax-deductible contributions, tax-free growth, and tax-free withdrawals for medical expenses.",
                    "risk_analysis": "Current medical expenses could be 30% lower with proper HSA utilization.",
                    "implementation_strategy": "Contribute maximum allowed amount and invest for long-term growth."
                }
            },
            {
                "id": "medical_crisis_2",
                "title": "Insurance Review",
                "description": "Review and optimize health insurance coverage for your needs",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 2000,
                "rationale": "Upgrading to better insurance coverage could reduce out-of-pocket costs by $2,000 annually.",
                "steps": [
                    "Review current coverage",
                    "Compare plan options",
                    "Consider high-deductible plans",
                    "Factor in premium vs. deductible trade-offs"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Better insurance coverage reduces out-of-pocket costs and provides financial protection.",
                    "risk_analysis": "Inadequate coverage could result in significant financial burden during medical emergencies.",
                    "implementation_strategy": "Choose coverage that balances premiums with out-of-pocket maximums."
                }
            },
            {
                "id": "medical_crisis_3",
                "title": "Medical Emergency Fund",
                "description": "Build dedicated emergency fund for medical expenses",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 8000,
                "rationale": "Dedicated medical emergency fund prevents dipping into retirement savings for healthcare costs.",
                "steps": [
                    "Calculate typical medical expenses",
                    "Set up separate savings account",
                    "Automate monthly contributions",
                    "Review fund size annually"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Medical emergency funds provide liquidity for healthcare costs without disrupting other financial goals.",
                    "risk_analysis": "Medical expenses are a leading cause of financial stress and bankruptcy.",
                    "implementation_strategy": "Save 3-6 months of typical medical expenses in dedicated account."
                }
            }
        ],
        "gig_economy": [
            {
                "id": "gig_economy_1",
                "title": "Income Diversification",
                "description": "Diversify income sources to reduce volatility and increase stability",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 5000,
                "rationale": "Having multiple income streams reduces the impact of any single source drying up.",
                "steps": [
                    "Identify marketable skills",
                    "Explore different gig platforms",
                    "Build passive income streams",
                    "Network for opportunities"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Multiple income sources provide stability and reduce dependence on any single gig or platform.",
                    "risk_analysis": "Single-source income is vulnerable to platform changes or market shifts.",
                    "implementation_strategy": "Develop skills that transfer across multiple platforms and industries."
                }
            },
            {
                "id": "gig_economy_2",
                "title": "Tax Optimization",
                "description": "Implement proper tax strategies for gig economy income",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 3000,
                "rationale": "Proper tax planning can save $3,000 annually through deductions and quarterly payments.",
                "steps": [
                    "Track all income and expenses",
                    "Set aside money for taxes",
                    "Pay quarterly estimated taxes",
                    "Maximize business deductions"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Gig economy workers are self-employed and must handle their own tax obligations.",
                    "risk_analysis": "Failure to pay quarterly taxes can result in penalties and interest charges.",
                    "implementation_strategy": "Set aside 25-30% of income for taxes and pay quarterly."
                }
            },
            {
                "id": "gig_economy_3",
                "title": "Emergency Fund for Volatility",
                "description": "Build larger emergency fund to handle income volatility",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 8000,
                "rationale": "Larger emergency fund provides buffer during slow periods or platform changes.",
                "steps": [
                    "Calculate target emergency fund size",
                    "Increase monthly savings rate",
                    "Use high-yield savings account",
                    "Review fund size quarterly"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Gig economy income is more volatile than traditional employment, requiring larger emergency funds.",
                    "risk_analysis": "Income volatility requires 6-12 months of expenses in emergency fund.",
                    "implementation_strategy": "Save aggressively during high-income periods to build buffer for slow periods."
                }
            }
        ],
        "rent_hike": [
            {
                "id": "rent_hike_1",
                "title": "Negotiate Rent Increase",
                "description": "Negotiate with landlord to reduce or delay rent increase",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 1800,
                "rationale": "Negotiating a 10% increase instead of 15% could save $1,800 over the year.",
                "steps": [
                    "Research market rates in your area",
                    "Highlight your good tenant history",
                    "Propose longer lease term",
                    "Offer to pay rent early"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Landlords prefer reliable tenants and may negotiate to avoid vacancy costs.",
                    "risk_analysis": "Market research shows your current rent is below market, giving you leverage.",
                    "implementation_strategy": "Approach negotiation with data and emphasize your value as a tenant."
                }
            },
            {
                "id": "rent_hike_2",
                "title": "Alternative Housing Options",
                "description": "Explore alternative housing to reduce costs",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 3000,
                "rationale": "Moving to a smaller unit or different neighborhood could save $3,000 annually.",
                "steps": [
                    "Research different neighborhoods",
                    "Consider smaller units",
                    "Explore roommate options",
                    "Calculate moving costs vs. savings"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Alternative housing options can significantly reduce housing costs while maintaining quality of life.",
                    "risk_analysis": "Moving costs must be factored into the decision, but long-term savings often outweigh them.",
                    "implementation_strategy": "Compare total costs including moving expenses and factor in quality of life changes."
                }
            },
            {
                "id": "rent_hike_3",
                "title": "Increase Income",
                "description": "Increase income to offset higher housing costs",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 5000,
                "rationale": "Side hustles or career advancement could generate $5,000 annually to offset rent increases.",
                "steps": [
                    "Identify marketable skills",
                    "Explore side hustle opportunities",
                    "Seek career advancement",
                    "Develop new income streams"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Increasing income provides more flexibility to handle housing cost increases.",
                    "risk_analysis": "Relying solely on cost reduction may limit housing options and quality of life.",
                    "implementation_strategy": "Focus on sustainable income growth through skill development and career advancement."
                }
            }
        ],
        "auto_repair": [
            {
                "id": "auto_repair_1",
                "title": "Preventive Maintenance",
                "description": "Implement preventive maintenance to avoid costly repairs",
                "tag": "Priority",
                "tagColor": "red",
                "potentialSaving": 2000,
                "rationale": "Regular maintenance can prevent $2,000 in unexpected repairs annually.",
                "steps": [
                    "Follow manufacturer maintenance schedule",
                    "Change oil regularly",
                    "Check tire pressure monthly",
                    "Address minor issues promptly"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Preventive maintenance extends vehicle life and prevents small issues from becoming expensive repairs.",
                    "risk_analysis": "Neglecting maintenance can lead to catastrophic failures costing thousands of dollars.",
                    "implementation_strategy": "Follow manufacturer recommendations and address issues before they become major problems."
                }
            },
            {
                "id": "auto_repair_2",
                "title": "Auto Emergency Fund",
                "description": "Build dedicated emergency fund for vehicle repairs and replacement",
                "tag": "Optimization",
                "tagColor": "blue",
                "potentialSaving": 3000,
                "rationale": "Dedicated auto emergency fund prevents using credit cards or dipping into other savings for repairs.",
                "steps": [
                    "Calculate typical repair costs",
                    "Set up separate savings account",
                    "Automate monthly contributions",
                    "Review fund size annually"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Auto emergency funds provide liquidity for vehicle expenses without disrupting other financial goals.",
                    "risk_analysis": "Vehicle repairs are a common unexpected expense that can derail financial plans.",
                    "implementation_strategy": "Save $3,000-$5,000 in dedicated auto emergency fund."
                }
            },
            {
                "id": "auto_repair_3",
                "title": "Vehicle Replacement Planning",
                "description": "Plan for vehicle replacement to avoid emergency purchases",
                "tag": "Investment",
                "tagColor": "green",
                "potentialSaving": 5000,
                "rationale": "Planning for replacement allows you to save for down payment and get better financing terms.",
                "steps": [
                    "Assess current vehicle condition",
                    "Research replacement options",
                    "Start saving for down payment",
                    "Monitor vehicle value trends"
                ],
                "detailed_insights": {
                    "mechanics_explanation": "Planning for vehicle replacement allows for better financing terms and prevents emergency purchases.",
                    "risk_analysis": "Emergency vehicle purchases often result in higher interest rates and less favorable terms.",
                    "implementation_strategy": "Start saving for replacement 2-3 years before expected vehicle failure."
                }
            }
        ]
    }
    
    return mock_explanations.get(scenario_type, [])

# RAG Query Endpoints
@app.post("/rag/query/{profile_id}")
async def query_profile_rag(profile_id: int, request: Dict[str, Any]):
    """Query profile-specific RAG system with optional tool selection."""
    try:
        query = request.get('query', '')
        tool_name = request.get('tool_name', None)
        
        if not query:
            raise HTTPException(status_code=400, detail="Query parameter is required")
        
        result = rag_manager.query_profile(profile_id, query, tool_name)
        
        return {
            "status": "success",
            "data": {
                "profile_id": profile_id,
                "query": query,
                "tool_used": tool_name,
                "result": result
            },
            "message": f"RAG query completed for profile {profile_id}"
        }
    except Exception as e:
        logger.error(f"Error in RAG query for profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/profiles/summary")
async def get_all_profile_summaries():
    """Get summaries for all available profiles."""
    try:
        summaries = rag_manager.get_all_profile_summaries()
        return {
            "status": "success",
            "data": summaries,
            "message": "Profile summaries retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error getting profile summaries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/profiles/{profile_id}/summary")
async def get_profile_summary(profile_id: int):
    """Get detailed summary for specific profile."""
    try:
        profile_system = rag_manager.get_profile_system(profile_id)
        summary = profile_system.get_profile_summary()
        
        return {
            "status": "success",
            "data": summary,
            "message": f"Profile {profile_id} summary retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error getting summary for profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/profiles/{profile_id}/tools")
async def get_profile_tools(profile_id: int):
    """Get available tools for specific profile."""
    try:
        profile_system = rag_manager.get_profile_system(profile_id)
        tools = [
            {
                "name": tool.name,
                "description": tool.description
            }
            for tool in profile_system.tools_registry.values()
        ]
        
        return {
            "status": "success",
            "data": {
                "profile_id": profile_id,
                "tools": tools,
                "total_tools": len(tools)
            },
            "message": f"Tools for profile {profile_id} retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error getting tools for profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rag/profiles/{profile_id}/multi-query")
async def multi_query_profile(profile_id: int, request: Dict[str, Any]):
    """Run comprehensive analysis using multiple RAG tools."""
    try:
        query = request.get('query', 'Analyze my financial situation')
        
        profile_system = rag_manager.get_profile_system(profile_id)
        
        # Run queries with all available tools
        results = {}
        for tool_name in profile_system.tools_registry.keys():
            try:
                result = profile_system.query(query, tool_name)
                results[tool_name] = {
                    "success": True,
                    "result": result[:200] + "..." if len(result) > 200 else result
                }
            except Exception as e:
                results[tool_name] = {
                    "success": False,
                    "error": str(e)
                }
        
        return {
            "status": "success",
            "data": {
                "profile_id": profile_id,
                "query": query,
                "results": results,
                "tools_executed": len(results)
            },
            "message": f"Multi-query analysis completed for profile {profile_id}"
        }
    except Exception as e:
        logger.error(f"Error in multi-query for profile {profile_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Original endpoints (kept for compatibility)
@app.post("/simulate")
async def simulate(request: SimulationRequest):
    """Run simulation with specified parameters."""
    try:
        # Load profile data
        profile_data = data_loader.get_profile(request.profile_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail=f"Profile {request.profile_id} not found")
        
        # Create engine and run simulation
        engine = MonteCarloEngine()
        results = engine.run_simulation(request.scenario_type, profile_data, request.config)
        
        return SimulationResponse(
            status="success",
            data=results,
            message=f"Simulation completed successfully for {request.scenario_type}"
        )
    except Exception as e:
        logger.error(f"Error running simulation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulation/with-explanations")
async def simulation_with_explanations(request: SimulationRequest):
    """Run simulation with AI explanations for any scenario type."""
    try:
        # Load profile data
        profile_data = data_loader.get_profile(request.profile_id)
        if not profile_data:
            raise HTTPException(status_code=404, detail=f"Profile {request.profile_id} not found")
        
        # Create engine and run simulation
        engine = MonteCarloEngine()
        results = engine.run_simulation(request.scenario_type, profile_data, request.config)
        
        # Generate AI explanation cards
        try:
            ai_cards = await generate_ai_explanations(
                user_profile=profile_data,
                simulation_data=results,
                scenario_name=request.scenario_type
            )
            logger.info(f"Generated {len(ai_cards)} AI explanation cards with RAG insights")
        except Exception as e:
            logger.error(f"Failed to generate AI cards: {e}")
            ai_cards = []
        
        return {
            "status": "success",
            "data": results,
            "explanations": ai_cards,
            "message": f"Simulation with AI explanations completed successfully for {request.scenario_type}"
        }
        
    except Exception as e:
        logger.error(f"Simulation with explanations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/generate-explanations")
async def generate_ai_explanations(request: Dict[str, Any]):
    """Generate AI explanation cards for existing simulation results."""
    try:
        simulation_data = request.get('simulation_data', {})
        user_profile = request.get('user_profile', {})
        
        if not simulation_data:
            raise HTTPException(status_code=400, detail="simulation_data is required")
        
        if not user_profile:
            raise HTTPException(status_code=400, detail="user_profile is required")
        
        # Generate AI explanation cards using multi-agent system
        try:
            ai_explanation_cards = await ai_agent(
                simulation_data=simulation_data,
                user_profile=user_profile
            )
            
            return {
                "status": "success",
                "data": {
                    "ai_explanation_cards": ai_explanation_cards,
                    "total_cards": len(ai_explanation_cards)
                },
                "message": f"Generated {len(ai_explanation_cards)} AI explanation cards"
            }
        except Exception as ai_error:
            logger.error(f"AI explanation generation failed: {ai_error}")
            raise HTTPException(status_code=500, detail=f"AI explanation generation failed: {str(ai_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating AI explanations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profiles")
async def get_profiles():
    """Get available profiles."""
    try:
        profiles = data_loader.get_available_profiles()
        return {
            "status": "success",
            "data": profiles,
            "message": "Profiles retrieved successfully"
        }
    except Exception as e:
        logger.error(f"Error getting profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/profiles/{profile_id}")
async def get_profile(profile_id: int):
    """Get profile data by ID"""
    try:
        profile_data = await get_profile_data(str(profile_id))
        return custom_json_response({
            "success": True,
            "data": profile_data,
            "message": f"Profile {profile_id} data retrieved successfully"
        })
    except Exception as e:
        logger.error(f"Error getting profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market-data")
async def get_market_data():
    """Get live market data from FMP API"""
    try:
        # Get market indexes
        market_indexes = market_data_service.get_market_indexes()
        
        # Transform to frontend-friendly format
        market_data = {}
        for symbol, data in market_indexes.items():
            market_data[symbol] = {
                "price": data.get("price", 0),
                "change": data.get("change", 0),
                "changePercent": data.get("changePercent", 0)
            }
        
        return custom_json_response({
            "success": True,
            "data": market_data,
            "message": "Market data retrieved successfully",
            "meta": {
                "timestamp": datetime.now().isoformat(),
                "dataSource": "live",
                "cacheStatus": market_data_service.get_cache_status()
            }
        })
    except Exception as e:
        logger.error(f"Error getting market data: {str(e)}")
        # Return fallback data
        fallback_data = {
            "^GSPC": {"price": 4500.0, "change": 12.5, "changePercent": 0.28},
            "^IXIC": {"price": 14025.5, "change": 85.75, "changePercent": 0.61},
            "^RUT": {"price": 1850.75, "change": -8.25, "changePercent": -0.44}
        }
        
        return custom_json_response({
            "success": True,
            "data": fallback_data,
            "message": "Market data retrieved (fallback)",
            "meta": {
                "timestamp": datetime.now().isoformat(),
                "dataSource": "fallback",
                "error": str(e)
            }
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)