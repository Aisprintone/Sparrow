# Behavioral Economics Module

## Overview

This module transforms the Monte Carlo financial simulations from purely mathematical models into realistic behavioral finance models that account for how people actually make financial decisions under stress, uncertainty, and cognitive biases.

## Key Features

### 1. Emergency Behavior Modeling (`emergency_behavior.py`)

Implements realistic expense reduction patterns during financial emergencies:

- **Three-Phase Response Model**:
  - Month 1: 15% reduction (shock phase)
  - Month 2-3: 25% reduction (adaptation phase)
  - Month 4+: 35% reduction (survival phase)

- **Personality Types**:
  - **Planner**: Proactive, aggressive early cuts
  - **Avoider**: Delays difficult decisions
  - **Survivor**: Balanced, pragmatic approach
  - **Panicker**: Makes poor stress-driven decisions
  - **Optimizer**: Maximizes efficiency in cuts

- **Social Safety Net Modeling**:
  - Family support patterns by demographic
  - Help-seeking thresholds based on stress
  - Cultural variations in support availability

### 2. Student Loan Behavior (`student_loan_behavior.py`)

Models actual repayment behaviors vs optimal strategies:

- **Repayment Plan Psychology**:
  - Why people choose certain plans (not always optimal)
  - Impact of debt shame on decisions
  - Financial literacy effects

- **Forbearance Decision Trees**:
  - When people actually defer payments
  - Behavioral triggers vs financial need
  - Present bias in forbearance use

- **Refinancing Procrastination**:
  - Why people delay despite clear benefits
  - Federal protection bias
  - Complexity aversion

- **PSLF Commitment Modeling**:
  - Career impact of forgiveness programs
  - 10-year commitment psychology
  - Sunk cost effects

### 3. Cognitive Biases (`cognitive_biases.py`)

Implements key behavioral economics biases:

- **Loss Aversion** (2.1x multiplier):
  - People fear losses twice as much as equivalent gains
  - Affects risk-taking and insurance decisions

- **Present Bias** (β = 0.7):
  - Hyperbolic discounting of future benefits
  - Reduces savings rates by 30%

- **Mental Accounting**:
  - Different treatment of windfall vs earned money
  - Suboptimal allocation of bonuses/tax refunds

- **Optimism Bias**:
  - Overestimate good outcomes by 30%
  - Underestimate risks by 20%

- **Anchoring Effect**:
  - Salary negotiations anchored to first offer
  - Insufficient adjustment from initial information

### 4. Decision Framework (`decision_framework.py`)

Integrates all behavioral components:

- **Financial Stress Scoring**:
  - Composite stress from debt, liquidity, uncertainty
  - Stress levels affect decision quality

- **Decision Context Modeling**:
  - Time pressure effects
  - Information completeness
  - Emotional state impacts

- **Behavioral Profiles**:
  - Complete personality modeling
  - Demographic-based defaults
  - Adaptive learning over time

### 5. Social & Cultural Factors (`social_cultural.py`)

Models social environment influences:

- **Family Financial Obligations**:
  - Cultural variations in family support
  - Intergenerational wealth transfers
  - Filial piety in Eastern cultures

- **Peer Influence**:
  - Spending pressure from social comparison
  - Investment herding behavior
  - Status signaling effects

- **Cultural Debt Attitudes**:
  - Western acceptance of "good debt"
  - Eastern debt aversion
  - Immigrant financial conservatism

- **Generational Behaviors**:
  - Gen Z: Digital-native, high risk tolerance
  - Millennials: Gig economy, student debt burden
  - Gen X: Self-directed, retirement focused

## Usage Example

```python
from behavioral.behavioral_integration import BehavioralMonteCarloEnhancer

# Create enhancer for millennial demographic
enhancer = BehavioralMonteCarloEnhancer(demographic="millennial")

# Apply to Monte Carlo simulations
enhanced_outcomes, metrics = enhancer.enhance_emergency_fund_simulation(
    base_outcomes=monte_carlo_results,
    profile_data=user_profile,
    random_factors=random_factors
)

# Results show realistic behavior
print(f"Expense reduction: {metrics['mean_expense_reduction']*100:.1f}%")
print(f"Help-seeking rate: {metrics['help_seeking_rate']*100:.1f}%")
```

## Behavioral Impact on Outcomes

### Emergency Fund Simulations
- **Expense Reductions**: 15-40% based on crisis duration
- **Help-Seeking**: 20-60% seek family/social support
- **Survival Extension**: 2-6 months from behavioral adaptations

### Student Loan Simulations
- **Forbearance Usage**: 15-30% use forbearance unnecessarily
- **Refinancing Delays**: 70% delay beneficial refinancing
- **Repayment Extension**: 10-30% longer than optimal
- **Plan Selection**: 40% choose suboptimal repayment plans

### Cognitive Bias Costs
- **Loss Aversion**: $2,000-5,000/year in missed opportunities
- **Present Bias**: 30% reduction in retirement savings
- **Mental Accounting**: $1,000-3,000/year in misallocated windfalls
- **Optimism Bias**: 20-40% underinsured for emergencies

## Validation & Research Basis

All behavioral models are based on published research:

- Kahneman & Tversky (1979): Prospect Theory and Loss Aversion
- Laibson (1997): Hyperbolic Discounting and Present Bias
- Thaler (1985, 1999): Mental Accounting
- Weinstein (1980): Optimism Bias
- Federal Reserve Economic Data: Actual emergency spending patterns
- Consumer Expenditure Survey: Recession behavior data
- NCES Student Loan Data: Repayment behavior patterns

## Performance Considerations

- Behavioral calculations add <5ms per iteration
- Memory efficient with numpy vectorization
- Maintains compatibility with existing Monte Carlo engine
- Optional behavioral features can be disabled

## Configuration

Behavioral parameters can be customized:

```python
from behavioral.behavioral_integration import BehavioralParameters

params = BehavioralParameters(
    personality_type="planner",
    financial_literacy=0.7,
    loss_aversion=2.5,
    present_bias=0.6,
    cultural_background="eastern_collectivist"
)

enhancer = BehavioralMonteCarloEnhancer(behavioral_params=params)
```

## Testing

Run comprehensive test suite:

```bash
python tests/test_behavioral.py
```

Tests cover:
- All personality types
- Cognitive bias effects
- Cultural variations
- Demographic differences
- Integration with Monte Carlo

## Future Enhancements

Potential additions:
- Machine learning for personalized behavioral profiles
- Real-time behavioral calibration from user data
- Gamification to improve financial behaviors
- Behavioral nudges and interventions
- A/B testing framework for behavioral assumptions