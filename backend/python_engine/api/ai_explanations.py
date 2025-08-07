"""
AI-powered explanation generator for financial strategies.
Surgical precision implementation for generating personalized recommendation cards.
"""

import os
import json
import logging
from typing import List, Dict, Any, Union, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class AIActionPlan:
    """Data structure matching frontend card requirements exactly."""
    id: str
    title: str
    description: str
    tag: str
    tagColor: str
    potentialSaving: Union[int, str]
    rationale: str
    steps: List[str]
    detailed_insights: Optional[Dict[str, Any]] = None


@dataclass
class DetailedInsights:
    """Data structure for detailed simulation insights."""
    mechanics_explanation: str
    key_insights: List[str]
    scenario_nuances: str
    decision_context: str


class StrategyType(str, Enum):
    """Strategy risk levels."""
    CONSERVATIVE = "conservative"
    BALANCED = "balanced"
    AGGRESSIVE = "aggressive"


class AIProvider(str, Enum):
    """Supported AI providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


# Scenario-specific templates for consistent generation
SCENARIO_TEMPLATES = {
    "emergency_fund": {
        "conservative": {
            "title": "Safe Emergency Strategy",
            "description": "Secure savings with guaranteed access",
            "tag": "Conservative",
            "tagColor": "bg-green-500/20 text-green-300"
        },
        "balanced": {
            "title": "Balanced Emergency Plan",
            "description": "Mix of savings and short-term investments",
            "tag": "Balanced",
            "tagColor": "bg-blue-500/20 text-blue-300"
        },
        "aggressive": {
            "title": "Growth-Focused Emergency Fund",
            "description": "Higher yield with managed market exposure",
            "tag": "Growth",
            "tagColor": "bg-purple-500/20 text-purple-300"
        }
    },
    "student_loan_payoff": {
        "conservative": {
            "title": "Standard Repayment Strategy",
            "description": "Predictable payments with loan forgiveness options",
            "tag": "Stable",
            "tagColor": "bg-green-500/20 text-green-300"
        },
        "balanced": {
            "title": "Hybrid Loan Approach",
            "description": "Mix of aggressive payments and forgiveness programs",
            "tag": "Balanced",
            "tagColor": "bg-blue-500/20 text-blue-300"
        },
        "aggressive": {
            "title": "Accelerated Payoff Plan",
            "description": "Maximum payments for fastest debt elimination",
            "tag": "Fast Track",
            "tagColor": "bg-purple-500/20 text-purple-300"
        }
    }
}


class AIExplanationGenerator:
    """Generates personalized financial explanations using LLM APIs."""
    
    def __init__(self):
        """Initialize the AI explanation generator."""
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.provider = self._determine_provider()
        self.client = httpx.AsyncClient(timeout=30.0)
        
    def _determine_provider(self) -> Optional[AIProvider]:
        """Determine which AI provider to use based on available keys."""
        if self.openai_key:
            return AIProvider.OPENAI
        elif self.anthropic_key:
            return AIProvider.ANTHROPIC
        else:
            logger.warning("No AI API keys found in environment")
            return None
    
    async def generate_explanations(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        scenario_type: str,
        include_detailed_insights: bool = True
    ) -> List[AIActionPlan]:
        """
        Generate three strategy cards based on simulation results.
        
        Args:
            profile: User profile data
            simulation_result: Monte Carlo simulation results
            scenario_type: Type of scenario (emergency_fund or student_loan_payoff)
            include_detailed_insights: Whether to include detailed insights
            
        Returns:
            List of three AIActionPlan objects (conservative, balanced, aggressive)
        """
        try:
            # Generate cards for each strategy type
            cards = []
            for strategy in [StrategyType.CONSERVATIVE, StrategyType.BALANCED, StrategyType.AGGRESSIVE]:
                card = await self._generate_strategy_card(
                    profile, simulation_result, scenario_type, strategy
                )
                
                # Add detailed insights if requested
                if include_detailed_insights:
                    detailed_insights = await self._generate_detailed_insights(
                        profile, simulation_result, scenario_type, strategy
                    )
                    card.detailed_insights = detailed_insights
                
                cards.append(card)
            
            return cards
        except Exception as e:
            logger.error(f"Failed to generate AI explanations: {str(e)}")
            # Fall back to enhanced mock data
            return self._generate_fallback_cards(profile, simulation_result, scenario_type)
    
    async def _generate_strategy_card(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        scenario_type: str,
        strategy_type: StrategyType
    ) -> AIActionPlan:
        """Generate a single strategy card using AI."""
        
        # Get template for this scenario and strategy
        template = SCENARIO_TEMPLATES.get(scenario_type, {}).get(strategy_type.value, {})
        
        # Calculate potential savings based on simulation results
        potential_saving = self._calculate_potential_saving(
            simulation_result, strategy_type, scenario_type
        )
        
        # Generate rationale and steps using AI if available
        if self.provider:
            rationale = await self._generate_rationale(
                profile, simulation_result, strategy_type, scenario_type
            )
            steps = await self._generate_steps(
                profile, simulation_result, strategy_type, scenario_type
            )
        else:
            # Use enhanced fallback generation
            rationale = self._generate_fallback_rationale(
                profile, simulation_result, strategy_type, scenario_type
            )
            steps = self._generate_fallback_steps(
                profile, simulation_result, strategy_type, scenario_type
            )
        
        return AIActionPlan(
            id=f"{strategy_type.value}_{scenario_type}",
            title=template.get("title", f"{strategy_type.value.title()} Strategy"),
            description=template.get("description", "Optimized financial strategy"),
            tag=template.get("tag", strategy_type.value.title()),
            tagColor=template.get("tagColor", "bg-gray-500/20 text-gray-300"),
            potentialSaving=potential_saving,
            rationale=rationale,
            steps=steps
        )
    
    async def _generate_detailed_insights(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        scenario_type: str,
        strategy_type: StrategyType
    ) -> Dict[str, Any]:
        """Generate detailed insights using existing LLM infrastructure."""
        
        if not self.provider:
            return self._generate_fallback_detailed_insights(
                profile, simulation_result, scenario_type, strategy_type
            )
        
        prompt = self._build_detailed_insights_prompt(
            profile, simulation_result, scenario_type, strategy_type
        )
        
        response = await self._call_llm(prompt)
        return self._parse_detailed_insights(response)
    
    def _build_detailed_insights_prompt(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        scenario_type: str,
        strategy_type: StrategyType
    ) -> str:
        """Build prompt for detailed insights using existing patterns."""
        
        # Reuse existing profile formatting
        profile_summary = self._format_profile_for_prompt(profile)
        
        # Reuse existing simulation result formatting
        simulation_summary = self._format_simulation_for_prompt(simulation_result)
        
        return f"""
        Generate detailed insights for a {scenario_type} simulation with {strategy_type} strategy.
        
        Profile: {profile_summary}
        Simulation Results: {simulation_summary}
        
        Provide exactly:
        1. Simulation Mechanics Explained (2-3 sentences)
        2. Key Insights from Their Data (3-4 bullet points)
        3. Scenario-Specific Nuances (1 paragraph)
        4. Decision-Making Context (1 paragraph)
        
        Format as JSON:
        {{
            "mechanics_explanation": "...",
            "key_insights": ["...", "...", "...", "..."],
            "scenario_nuances": "...",
            "decision_context": "..."
        }}
        """
    
    def _format_profile_for_prompt(self, profile: Dict[str, Any]) -> str:
        """Format profile data for prompt using existing patterns."""
        
        # Basic profile formatting (reuse existing patterns)
        income = profile.get('income', 0)
        debt = profile.get('total_debt', 0)
        emergency_fund = profile.get('emergency_fund', 0)
        monthly_expenses = profile.get('monthly_expenses', 0)
        
        return f"""
        Income: ${income:,.0f}/month
        Total Debt: ${debt:,.0f}
        Emergency Fund: ${emergency_fund:,.0f} ({emergency_fund/monthly_expenses:.1f} months of expenses)
        Monthly Expenses: ${monthly_expenses:,.0f}
        """
    
    def _format_simulation_for_prompt(self, simulation_result: Dict[str, Any]) -> str:
        """Format simulation results for prompt using existing patterns."""
        
        result = simulation_result.get("result", {})
        percentiles = result.get("percentiles", {})
        probability_success = result.get("probability_success", 0)
        
        return f"""
        Success Probability: {probability_success:.1%}
        Median Timeline: {percentiles.get('p50', 0):.1f} months
        75th Percentile: {percentiles.get('p75', 0):.1f} months
        90th Percentile: {percentiles.get('p90', 0):.1f} months
        """
    
    def _parse_detailed_insights(self, response: str) -> Dict[str, Any]:
        """Parse detailed insights from LLM response."""
        
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                import json
                parsed = json.loads(json_match.group())
                return {
                    "mechanics_explanation": parsed.get("mechanics_explanation", ""),
                    "key_insights": parsed.get("key_insights", []),
                    "scenario_nuances": parsed.get("scenario_nuances", ""),
                    "decision_context": parsed.get("decision_context", "")
                }
        except Exception as e:
            logger.warning(f"Failed to parse detailed insights JSON: {e}")
        
        # Fallback parsing
        return self._parse_detailed_insights_fallback(response)
    
    def _parse_detailed_insights_fallback(self, response: str) -> Dict[str, Any]:
        """Fallback parsing for detailed insights."""
        
        lines = response.split('\n')
        mechanics = ""
        insights = []
        nuances = ""
        context = ""
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if "mechanics" in line.lower() or "simulation" in line.lower():
                current_section = "mechanics"
            elif "insights" in line.lower() or "data" in line.lower():
                current_section = "insights"
            elif "nuances" in line.lower():
                current_section = "nuances"
            elif "context" in line.lower() or "decision" in line.lower():
                current_section = "context"
            elif line.startswith('•') or line.startswith('-'):
                insights.append(line[1:].strip())
            elif current_section == "mechanics":
                mechanics += line + " "
            elif current_section == "nuances":
                nuances += line + " "
            elif current_section == "context":
                context += line + " "
        
        return {
            "mechanics_explanation": mechanics.strip(),
            "key_insights": insights,
            "scenario_nuances": nuances.strip(),
            "decision_context": context.strip()
        }
    
    def _generate_fallback_detailed_insights(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        scenario_type: str,
        strategy_type: StrategyType
    ) -> Dict[str, Any]:
        """Generate fallback detailed insights when LLM is unavailable."""
        
        income = profile.get('income', 0)
        debt = profile.get('total_debt', 0)
        emergency_fund = profile.get('emergency_fund', 0)
        
        if scenario_type == "emergency_fund":
            return {
                "mechanics_explanation": f"The simulation models your path to a 6-month emergency fund using your current ${emergency_fund:,.0f} balance and monthly expenses. It accounts for potential income disruptions and competing financial priorities.",
                "key_insights": [
                    f"Your current emergency fund covers {emergency_fund/income*12:.1f} months of income",
                    f"Your monthly income of ${income:,.0f} supports consistent savings",
                    f"Your debt-to-income ratio of {debt/income*12:.1%} affects your savings capacity",
                    f"Your current savings rate can be increased to accelerate the timeline"
                ],
                "scenario_nuances": f"The simulation assumes you can redirect discretionary spending to emergency fund building. Your income stability supports this strategy, but any disruption would significantly impact the timeline and potentially force you to dip into the emergency fund before it's fully established.",
                "decision_context": f"Monitor your monthly savings rate and emergency fund balance. If your income drops significantly or emergency fund falls below 2 months of expenses, pause the strategy and rebuild your safety net first. Success indicators include emergency fund growing consistently and maintaining 2+ months of expenses."
            }
        elif scenario_type == "student_loan_payoff":
            return {
                "mechanics_explanation": f"The simulation models your debt payoff timeline using your ${income:,.0f} monthly income, ${debt:,.0f} current debt, and aggressive payment strategy. It accounts for potential income increases, emergency expenses, and market volatility.",
                "key_insights": [
                    f"Your debt-to-income ratio of {debt/income*12:.1%} allows for aggressive payoff strategy",
                    f"Your student loan rate of 6.8% is higher than typical investment returns",
                    f"Your emergency fund covers {emergency_fund/income*12:.1f} months of income",
                    f"Your income stability supports consistent debt payments"
                ],
                "scenario_nuances": f"Your timeline is most sensitive to maintaining aggressive monthly payments. If you reduce payments, the payoff extends significantly. The simulation assumes no major emergencies, but your current emergency fund provides limited coverage, creating risk if unexpected expenses arise.",
                "decision_context": f"Monitor your ability to maintain aggressive monthly payments and your emergency fund balance. If your emergency fund drops below 1 month of expenses, consider reducing debt payments temporarily. Success indicators include debt balance decreasing consistently and emergency fund staying above minimum threshold."
            }
        else:
            return {
                "mechanics_explanation": f"The simulation models your financial strategy using your current profile data and market assumptions. It accounts for various risk factors and competing priorities.",
                "key_insights": [
                    f"Your income of ${income:,.0f}/month provides stable foundation",
                    f"Your debt level of ${debt:,.0f} affects your financial flexibility",
                    f"Your emergency fund covers {emergency_fund/income*12:.1f} months of income",
                    f"Your current financial position supports this strategy"
                ],
                "scenario_nuances": f"The simulation assumes stable income and manageable expenses. Your current financial profile supports this approach, but any significant changes to income or expenses would require strategy adjustment.",
                "decision_context": f"Monitor your key financial metrics and adjust the strategy if your income, expenses, or financial priorities change significantly. Success indicators include consistent progress toward your goals and maintaining financial stability."
            }
    
    async def _call_llm(self, prompt: str) -> str:
        """Call LLM using existing infrastructure."""
        
        if self.provider == AIProvider.OPENAI:
            return await self._call_openai(prompt)
        elif self.provider == AIProvider.ANTHROPIC:
            return await self._call_anthropic(prompt)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")
    
    def _calculate_potential_saving(
        self,
        simulation_result: Dict[str, Any],
        strategy_type: StrategyType,
        scenario_type: str
    ) -> Union[int, str]:
        """Calculate potential savings based on simulation results."""
        
        # Extract percentiles from simulation result
        result = simulation_result.get("result", {})
        percentiles = result.get("percentiles", {})
        
        if scenario_type == "emergency_fund":
            # For emergency fund, show months of runway
            if strategy_type == StrategyType.CONSERVATIVE:
                months = percentiles.get("p50", 6)  # Median
            elif strategy_type == StrategyType.BALANCED:
                months = percentiles.get("p75", 9)  # 75th percentile
            else:  # AGGRESSIVE
                months = percentiles.get("p90", 12)  # 90th percentile
            
            return f"{int(months)} months runway"
            
        elif scenario_type == "student_loan_payoff":
            # For student loans, show time saved
            baseline_months = percentiles.get("p50", 120)  # Standard repayment
            
            if strategy_type == StrategyType.CONSERVATIVE:
                savings = 0  # Standard repayment
            elif strategy_type == StrategyType.BALANCED:
                savings = int(baseline_months * 0.2)  # 20% faster
            else:  # AGGRESSIVE
                savings = int(baseline_months * 0.4)  # 40% faster
            
            if savings > 0:
                return f"{savings} months faster"
            else:
                return "Standard timeline"
        
        # Default fallback
        return 180
    
    async def _generate_rationale(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        strategy_type: StrategyType,
        scenario_type: str
    ) -> str:
        """Generate rationale using AI API."""
        
        prompt = self._build_rationale_prompt(
            profile, simulation_result, strategy_type, scenario_type
        )
        
        if self.provider == AIProvider.OPENAI:
            return await self._call_openai(prompt)
        elif self.provider == AIProvider.ANTHROPIC:
            return await self._call_anthropic(prompt)
        else:
            return self._generate_fallback_rationale(
                profile, simulation_result, strategy_type, scenario_type
            )
    
    async def _generate_steps(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        strategy_type: StrategyType,
        scenario_type: str
    ) -> List[str]:
        """Generate action steps using AI API."""
        
        prompt = self._build_steps_prompt(
            profile, simulation_result, strategy_type, scenario_type
        )
        
        if self.provider == AIProvider.OPENAI:
            response = await self._call_openai(prompt)
            return self._parse_steps(response)
        elif self.provider == AIProvider.ANTHROPIC:
            response = await self._call_anthropic(prompt)
            return self._parse_steps(response)
        else:
            return self._generate_fallback_steps(
                profile, simulation_result, strategy_type, scenario_type
            )
    
    def _build_rationale_prompt(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        strategy_type: StrategyType,
        scenario_type: str
    ) -> str:
        """Build prompt for rationale generation."""
        
        result = simulation_result.get("result", {})
        percentiles = result.get("percentiles", {})
        
        return f"""Generate a financial rationale for a {strategy_type.value} {scenario_type.replace('_', ' ')} strategy.

User Profile:
- Demographic: {profile.get('demographic', 'Unknown')}
- Monthly Income: ${profile.get('monthly_income', 0):,.0f}
- Monthly Expenses: ${profile.get('monthly_expenses', 0):,.0f}
- Emergency Fund: ${profile.get('emergency_fund', 0):,.0f}
- Student Loans: ${profile.get('student_loans', 0):,.0f}

Simulation Results:
- Best Case (90th percentile): {percentiles.get('p90', 0):.1f}
- Most Likely (50th percentile): {percentiles.get('p50', 0):.1f}
- Worst Case (10th percentile): {percentiles.get('p10', 0):.1f}
- Confidence Level: {result.get('probability_success', 0) * 100:.1f}%

Generate a 150-200 word rationale that:
1. Uses specific numbers from the simulation
2. Matches {strategy_type.value} risk level
3. Sounds professional but accessible
4. References the user's demographic situation
5. Justifies why this approach makes sense

Write in a tone similar to: "Focus on guaranteed returns through high-yield savings and conservative investments. This approach minimizes risk while ensuring steady progress toward your goals."
"""
    
    def _build_steps_prompt(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        strategy_type: StrategyType,
        scenario_type: str
    ) -> str:
        """Build prompt for steps generation."""
        
        result = simulation_result.get("result", {})
        percentiles = result.get("percentiles", {})
        
        return f"""Generate 4 specific action steps for a {strategy_type.value} {scenario_type.replace('_', ' ')} strategy.

User Context:
- Monthly Income: ${profile.get('monthly_income', 0):,.0f}
- Monthly Expenses: ${profile.get('monthly_expenses', 0):,.0f}
- Simulation shows {percentiles.get('p50', 0):.1f} months runway

Generate exactly 4 action steps that are:
- Actionable and specific
- Use real numbers when possible
- Start with action verb
- 6-10 words each

Format as a list with each step on a new line starting with a dash:
- Step one here
- Step two here
- Step three here
- Step four here
"""
    
    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API for text generation."""
        try:
            response = await self.client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are a financial advisor AI assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.error(f"OpenAI API error: {response.status_code}")
                return ""
                
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            return ""
    
    async def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic API for text generation."""
        try:
            response = await self.client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["content"][0]["text"]
            else:
                logger.error(f"Anthropic API error: {response.status_code}")
                return ""
                
        except Exception as e:
            logger.error(f"Anthropic API call failed: {str(e)}")
            return ""
    
    def _parse_steps(self, response: str) -> List[str]:
        """Parse steps from AI response."""
        lines = response.strip().split('\n')
        steps = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('-') or line.startswith('•') or line.startswith('*'):
                step = line.lstrip('-•* ').strip()
                if step:
                    steps.append(step)
        
        # Ensure we have exactly 4 steps
        while len(steps) < 4:
            steps.append("Review and adjust strategy quarterly")
        
        return steps[:4]
    
    def _generate_fallback_rationale(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        strategy_type: StrategyType,
        scenario_type: str
    ) -> str:
        """Generate fallback rationale using simulation data."""
        
        result = simulation_result.get("result", {})
        percentiles = result.get("percentiles", {})
        monthly_income = profile.get("monthly_income", 5000)
        
        if scenario_type == "emergency_fund":
            if strategy_type == StrategyType.CONSERVATIVE:
                return (
                    f"Based on your ${monthly_income:,.0f} monthly income and simulation showing "
                    f"{percentiles.get('p50', 6):.0f} months of runway at the median, this conservative "
                    f"approach prioritizes capital preservation through FDIC-insured accounts. With a "
                    f"{result.get('probability_success', 0.95) * 100:.0f}% confidence level, you'll maintain "
                    f"liquid access to funds while earning 4.5% APY. This strategy ensures your emergency "
                    f"fund remains stable regardless of market conditions, providing peace of mind during "
                    f"unexpected financial challenges."
                )
            elif strategy_type == StrategyType.BALANCED:
                return (
                    f"Your simulation indicates {percentiles.get('p75', 9):.0f} months runway at the 75th "
                    f"percentile. This balanced strategy splits your emergency fund between high-yield savings "
                    f"(60%) and short-term bond funds (40%), targeting 5.2% overall returns. With "
                    f"${monthly_income:,.0f} monthly income, you can maintain liquidity while achieving "
                    f"moderate growth. The {result.get('probability_success', 0.85) * 100:.0f}% success rate "
                    f"demonstrates strong resilience against inflation while preserving capital access."
                )
            else:  # AGGRESSIVE
                return (
                    f"Simulation shows potential for {percentiles.get('p90', 12):.0f} months runway at the "
                    f"90th percentile. This growth-focused approach allocates 40% to high-yield savings, 30% "
                    f"to bond ETFs, and 30% to dividend stocks, targeting 7% annual returns. Your "
                    f"${monthly_income:,.0f} income supports this calculated risk approach. While maintaining "
                    f"{result.get('probability_success', 0.75) * 100:.0f}% success probability, you'll maximize "
                    f"long-term purchasing power against inflation."
                )
        
        else:  # student_loan_payoff
            loan_balance = profile.get("student_loans", 30000)
            if strategy_type == StrategyType.CONSERVATIVE:
                return (
                    f"With ${loan_balance:,.0f} in student loans, standard repayment offers predictability "
                    f"over {percentiles.get('p50', 120):.0f} months. This approach maintains eligibility for "
                    f"forgiveness programs while keeping payments at ${loan_balance/120:.0f} monthly. Your "
                    f"${monthly_income:,.0f} income easily supports this payment, leaving room for other "
                    f"financial goals. The {result.get('probability_success', 0.95) * 100:.0f}% confidence "
                    f"level ensures sustainable payments through income fluctuations."
                )
            elif strategy_type == StrategyType.BALANCED:
                return (
                    f"Simulation suggests payoff in {percentiles.get('p50', 96):.0f} months with balanced "
                    f"approach. By paying ${loan_balance/96:.0f} monthly (125% of minimum), you'll save "
                    f"${loan_balance * 0.15:,.0f} in interest while maintaining forgiveness eligibility. Your "
                    f"${monthly_income:,.0f} income supports this accelerated schedule. With "
                    f"{result.get('probability_success', 0.85) * 100:.0f}% success probability, this strategy "
                    f"balances debt elimination with financial flexibility."
                )
            else:  # AGGRESSIVE
                return (
                    f"Aggressive repayment can eliminate your ${loan_balance:,.0f} debt in just "
                    f"{percentiles.get('p50', 72):.0f} months. By allocating ${loan_balance/72:.0f} monthly "
                    f"(167% of minimum), you'll save ${loan_balance * 0.25:,.0f} in total interest. Your "
                    f"${monthly_income:,.0f} income makes this feasible while maintaining emergency reserves. "
                    f"The {result.get('probability_success', 0.70) * 100:.0f}% confidence level reflects "
                    f"aggressive but achievable targets for debt freedom."
                )
    
    def _generate_fallback_steps(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        strategy_type: StrategyType,
        scenario_type: str
    ) -> List[str]:
        """Generate fallback action steps using simulation data."""
        
        monthly_income = profile.get("monthly_income", 5000)
        monthly_expenses = profile.get("monthly_expenses", 3000)
        emergency_fund = profile.get("emergency_fund", 10000)
        student_loans = profile.get("student_loans", 30000)
        
        if scenario_type == "emergency_fund":
            target_fund = monthly_expenses * 6  # 6 months expenses
            
            if strategy_type == StrategyType.CONSERVATIVE:
                return [
                    f"Move funds to 4.5% APY savings account",
                    f"Set up ${(target_fund - emergency_fund)/12:.0f} monthly auto-transfer",
                    f"Target ${target_fund:,.0f} total emergency fund",
                    "Review account rates quarterly for optimization"
                ]
            elif strategy_type == StrategyType.BALANCED:
                return [
                    f"Allocate 60% to high-yield savings at 4.5%",
                    f"Invest 40% in short-term bond fund",
                    f"Automate ${(target_fund - emergency_fund)/10:.0f} monthly contributions",
                    "Rebalance portfolio every six months"
                ]
            else:  # AGGRESSIVE
                return [
                    f"Keep ${monthly_expenses * 3:,.0f} in liquid savings",
                    f"Invest ${monthly_expenses * 2:,.0f} in bond ETFs",
                    f"Allocate ${monthly_expenses:,.0f} to dividend stocks",
                    "Monitor and rebalance quarterly for growth"
                ]
        
        else:  # student_loan_payoff
            if strategy_type == StrategyType.CONSERVATIVE:
                return [
                    f"Maintain standard ${student_loans/120:.0f} monthly payment",
                    "Enroll in autopay for 0.25% rate reduction",
                    "Apply for income-driven repayment if eligible",
                    "Track forgiveness program requirements annually"
                ]
            elif strategy_type == StrategyType.BALANCED:
                return [
                    f"Increase payment to ${student_loans/96:.0f} monthly",
                    "Apply tax refunds directly to principal",
                    "Refinance if rates drop below 4%",
                    "Maintain 3-month emergency fund simultaneously"
                ]
            else:  # AGGRESSIVE
                return [
                    f"Pay ${student_loans/72:.0f} monthly toward loans",
                    "Apply all bonuses to loan principal",
                    "Consider side income for extra payments",
                    "Target complete payoff within 6 years"
                ]
    
    def _generate_fallback_cards(
        self,
        profile: Dict[str, Any],
        simulation_result: Dict[str, Any],
        scenario_type: str
    ) -> List[AIActionPlan]:
        """Generate complete fallback cards when AI is unavailable."""
        
        cards = []
        for strategy in [StrategyType.CONSERVATIVE, StrategyType.BALANCED, StrategyType.AGGRESSIVE]:
            template = SCENARIO_TEMPLATES.get(scenario_type, {}).get(strategy.value, {})
            
            card = AIActionPlan(
                id=f"{strategy.value}_{scenario_type}",
                title=template.get("title", f"{strategy.value.title()} Strategy"),
                description=template.get("description", "Optimized financial strategy"),
                tag=template.get("tag", strategy.value.title()),
                tagColor=template.get("tagColor", "bg-gray-500/20 text-gray-300"),
                potentialSaving=self._calculate_potential_saving(
                    simulation_result, strategy, scenario_type
                ),
                rationale=self._generate_fallback_rationale(
                    profile, simulation_result, strategy, scenario_type
                ),
                steps=self._generate_fallback_steps(
                    profile, simulation_result, strategy, scenario_type
                )
            )
            cards.append(card)
        
        return cards
    
    async def close(self):
        """Clean up HTTP client."""
        await self.client.aclose()