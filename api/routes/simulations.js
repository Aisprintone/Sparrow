/**
 * Simulation API Routes
 * Handles all simulation and calculation endpoints
 */

import express from 'express';
import { SimulationService } from '../../services/simulationService.js';
import { validateSimulationRequest } from '../../utils/validation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();
const simulationService = new SimulationService();

/**
 * @route   POST /api/simulations/retirement
 * @desc    Calculate retirement projections
 * @access  Private
 */
router.post('/retirement', validateSimulationRequest, asyncHandler(async (req, res) => {
  const {
    current_age,
    retirement_age,
    current_savings,
    monthly_contribution,
    expected_return,
    inflation_rate
  } = req.body;
  
  const projection = await simulationService.calculateRetirementProjection({
    current_age: parseInt(current_age),
    retirement_age: parseInt(retirement_age),
    current_savings: parseFloat(current_savings),
    monthly_contribution: parseFloat(monthly_contribution),
    expected_return: parseFloat(expected_return),
    inflation_rate: parseFloat(inflation_rate)
  });
  
  res.json({
    success: true,
    data: projection
  });
}));

/**
 * @route   POST /api/simulations/investment
 * @desc    Calculate investment growth projections
 * @access  Private
 */
router.post('/investment', validateSimulationRequest, asyncHandler(async (req, res) => {
  const {
    initial_investment,
    monthly_contribution,
    years,
    expected_return,
    risk_level
  } = req.body;
  
  const projection = await simulationService.calculateInvestmentGrowth({
    initial_investment: parseFloat(initial_investment),
    monthly_contribution: parseFloat(monthly_contribution),
    years: parseInt(years),
    expected_return: parseFloat(expected_return),
    risk_level
  });
  
  res.json({
    success: true,
    data: projection
  });
}));

/**
 * @route   POST /api/simulations/debt-payoff
 * @desc    Calculate debt payoff strategies
 * @access  Private
 */
router.post('/debt-payoff', validateSimulationRequest, asyncHandler(async (req, res) => {
  const {
    debts,
    monthly_payment,
    strategy = 'avalanche' // avalanche or snowball
  } = req.body;
  
  const payoffPlan = await simulationService.calculateDebtPayoff({
    debts,
    monthly_payment: parseFloat(monthly_payment),
    strategy
  });
  
  res.json({
    success: true,
    data: payoffPlan
  });
}));

/**
 * @route   POST /api/simulations/budget
 * @desc    Calculate budget recommendations
 * @access  Private
 */
router.post('/budget', validateSimulationRequest, asyncHandler(async (req, res) => {
  const {
    income,
    expenses,
    goals,
    risk_tolerance
  } = req.body;
  
  const budget = await simulationService.calculateBudgetRecommendation({
    income: parseFloat(income),
    expenses,
    goals,
    risk_tolerance
  });
  
  res.json({
    success: true,
    data: budget
  });
}));

/**
 * @route   POST /api/simulations/emergency-fund
 * @desc    Calculate emergency fund needs
 * @access  Private
 */
router.post('/emergency-fund', validateSimulationRequest, asyncHandler(async (req, res) => {
  const {
    monthly_expenses,
    job_security,
    family_size,
    current_savings
  } = req.body;
  
  const emergencyFund = await simulationService.calculateEmergencyFund({
    monthly_expenses: parseFloat(monthly_expenses),
    job_security,
    family_size: parseInt(family_size),
    current_savings: parseFloat(current_savings)
  });
  
  res.json({
    success: true,
    data: emergencyFund
  });
}));

/**
 * @route   POST /api/simulations/loan-comparison
 * @desc    Compare different loan options
 * @access  Private
 */
router.post('/loan-comparison', validateSimulationRequest, asyncHandler(async (req, res) => {
  const {
    loan_amount,
    loan_terms,
    interest_rates
  } = req.body;
  
  const comparison = await simulationService.compareLoans({
    loan_amount: parseFloat(loan_amount),
    loan_terms,
    interest_rates
  });
  
  res.json({
    success: true,
    data: comparison
  });
}));

/**
 * @route   GET /api/simulations/risk-assessment
 * @desc    Get risk assessment for customer
 * @access  Private
 */
router.get('/risk-assessment/:customerId', asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  
  const assessment = await simulationService.getRiskAssessment(customerId);
  
  res.json({
    success: true,
    data: assessment
  });
}));

export default router; 