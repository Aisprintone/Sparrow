# Fixed indentation for methods that should be part of FinancialAIAgentSystem class

    def generate_job_loss_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate job loss specific cards"""
        survival_months = simulation_data.get("survival_months", 2)
        monthly_expenses = simulation_data.get("monthly_expenses", 3000)
        emergency_fund = simulation_data.get("emergency_fund", 10000)
        
        return [
            {
                "id": "job_loss_emergency",
                "title": "Emergency Fund Optimization",
                "description": "Maximize your job loss survival time",
                "tag": "URGENT",
                "tagColor": "bg-red-500",
                "potentialSaving": int(monthly_expenses * 3),
                "rationale": f"Your current emergency fund covers {survival_months} months of expenses. This plan focuses on extending your survival time to 6 months.",
                "steps": [
                    f"Cut non-essential expenses by ${monthly_expenses * 0.3:.0f}/month",
                    "Build emergency fund to cover 6 months of expenses",
                    "Explore unemployment benefits and side income",
                    "Review and reduce monthly bills"
                ]
            },
            {
                "id": "job_loss_income",
                "title": "Income Diversification Strategy",
                "description": "Create multiple income streams",
                "tag": "STRATEGIC",
                "tagColor": "bg-blue-500",
                "potentialSaving": int(monthly_expenses * 2),
                "rationale": "Diversifying income sources reduces dependency on a single job and provides financial resilience during job loss.",
                "steps": [
                    "Develop freelance or consulting skills",
                    "Start a side business or gig work",
                    "Build passive income streams",
                    "Network for job opportunities"
                ]
            },
            {
                "id": "job_loss_expenses",
                "title": "Expense Reduction Plan",
                "description": "Minimize monthly expenses during job loss",
                "tag": "CONSERVATIVE",
                "tagColor": "bg-green-500",
                "potentialSaving": int(monthly_expenses * 0.4),
                "rationale": "Reducing expenses by 40% can extend your emergency fund coverage and provide more time to find new employment.",
                "steps": [
                    "Create a bare-bones budget",
                    "Negotiate lower rates on bills",
                    "Cancel non-essential subscriptions",
                    "Use public transportation"
                ]
            }
        ]

    def generate_emergency_fund_cards(self, simulation_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate emergency fund specific cards"""
        target_months = simulation_data.get("target_months", 6)
        monthly_contribution = simulation_data.get("monthly_contribution", 500)
        current_fund = simulation_data.get("emergency_fund", 2000)
        
        return [
            {
                "id": "emergency_conservative",
                "title": "Conservative Savings Plan",
                "description": "Build emergency fund through steady savings",
                "tag": "CONSERVATIVE",
                "tagColor": "bg-green-500",
                "potentialSaving": target_months * monthly_contribution,
                "rationale": f"Build a {target_months}-month emergency fund with consistent ${monthly_contribution} monthly contributions.",
                "steps": [
                    f"Set up automatic transfer of ${monthly_contribution}/month",
                    "Open high-yield savings account (4.5% APY)",
                    f"Target ${target_months * monthly_contribution} total fund",
                    "Review and adjust quarterly"
                ]
            },
            {
                "id": "emergency_balanced",
                "title": "Balanced Growth Strategy",
                "description": "Mix savings with low-risk investments",
                "tag": "BALANCED",
                "tagColor": "bg-blue-500",
                "potentialSaving": int(target_months * monthly_contribution * 1.2),
                "rationale": "Combine high-yield savings with conservative investments for better returns while maintaining liquidity.",
                "steps": [
                    "Allocate 60% to high-yield savings",
                    "Invest 40% in short-term bonds",
                    f"Contribute ${monthly_contribution * 1.2:.0f}/month",
                    "Rebalance portfolio quarterly"
                ]
            },
            {
                "id": "emergency_aggressive",
                "title": "Accelerated Fund Building",
                "description": "Aggressive approach to build fund quickly",
                "tag": "AGGRESSIVE",
                "tagColor": "bg-purple-500",
                "potentialSaving": int(target_months * monthly_contribution * 1.5),
                "rationale": "Maximize contributions and returns through aggressive saving and strategic investments.",
                "steps": [
                    f"Increase contributions to ${monthly_contribution * 1.5:.0f}/month",
                    "Use money market funds for higher yields",
                    "Add side income directly to fund",
                    "Target completion in half the time"
                ]
            }
        ]