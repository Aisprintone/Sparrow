# AI Explanation API Documentation

## Overview

The AI Explanation API generates personalized financial recommendation cards using Monte Carlo simulation results and LLM-powered content generation. This surgical precision enhancement provides three strategy options (Conservative, Balanced, Aggressive) with detailed rationales and action steps.

## API Endpoints

### 1. Generate Explanations Only

**Endpoint:** `POST /api/simulation/explain`

Generates AI-powered explanation cards based on simulation results.

**Request Body:**
```json
{
  "profile_id": 2,
  "scenario_type": "emergency_fund",
  "simulation_result": null,  // Optional, will run simulation if not provided
  "iterations": 10000
}
```

**Response:**
```json
{
  "success": true,
  "cards": [
    {
      "id": "conservative_emergency_fund",
      "title": "Safe Emergency Strategy",
      "description": "Secure savings with guaranteed access",
      "tag": "Conservative",
      "tagColor": "bg-green-500/20 text-green-300",
      "potentialSaving": "7 months runway",
      "rationale": "Based on your $7,500 monthly income and simulation showing 7 months of runway at the median...",
      "steps": [
        "Move funds to 4.5% APY savings account",
        "Set up $500 monthly auto-transfer",
        "Target $27,000 total emergency fund",
        "Review account rates quarterly for optimization"
      ]
    },
    // ... 2 more cards (balanced, aggressive)
  ],
  "profile_id": 2,
  "scenario_type": "emergency_fund",
  "simulation_metadata": {
    "iterations": 10000,
    "confidence_level": 0.95,
    "ai_provider": "openai"  // or "anthropic" or "fallback"
  }
}
```

### 2. Combined Simulation + Explanations

**Endpoint:** `POST /api/simulation/with-explanations`

Runs Monte Carlo simulation and generates explanations in a single optimized call.

**Request Body:**
```json
{
  "profile_id": 2,
  "scenario_type": "student_loan_payoff",
  "iterations": 10000,
  "include_advanced_metrics": true
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    // Full simulation results
    "percentile_50": 84.2,
    "percentile_90": 120.5,
    "probability_success": 0.85,
    // ... other simulation data
  },
  "profile": {
    // Profile data
  },
  "market_context": {
    // Market data
  },
  "explanations": [
    // 3 AI-generated cards
  ],
  "ai_metadata": {
    "iterations": 10000,
    "confidence_level": 0.95,
    "ai_provider": "openai"
  }
}
```

## Card Format Specification

Each card MUST contain exactly these fields:

```typescript
interface AIActionPlan {
  id: string;                    // Unique identifier
  title: string;                 // Strategy title
  description: string;           // Brief description
  tag: string;                   // Strategy tag
  tagColor: string;              // Tailwind CSS classes
  potentialSaving: number | string;  // Numeric or descriptive saving
  rationale: string;             // 150-200 word explanation
  steps: string[];               // Exactly 4 action steps
}
```

## Scenario Templates

### Emergency Fund Scenarios

| Strategy | Tag | Color | Focus |
|----------|-----|-------|-------|
| Conservative | "Conservative" | Green | Safe, guaranteed returns |
| Balanced | "Balanced" | Blue | Mix of safety and growth |
| Aggressive | "Growth" | Purple | Maximum yield potential |

### Student Loan Scenarios

| Strategy | Tag | Color | Focus |
|----------|-----|-------|-------|
| Conservative | "Stable" | Green | Standard repayment |
| Balanced | "Balanced" | Blue | Accelerated with flexibility |
| Aggressive | "Fast Track" | Purple | Maximum speed payoff |

## AI Provider Configuration

### Environment Variables

Create a `.env` file with your API keys:

```bash
# OpenAI (preferred for speed)
OPENAI_API_KEY=sk-your-openai-key

# Anthropic (alternative)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Provider Selection Logic

1. **OpenAI**: If `OPENAI_API_KEY` is present, uses GPT-4-mini
2. **Anthropic**: If only `ANTHROPIC_API_KEY` is present, uses Claude-3-Haiku
3. **Fallback**: If no keys present, uses enhanced algorithmic generation

## Performance Specifications

- **Response Time**: < 2 seconds (p99)
- **Fallback Activation**: Automatic on API failure
- **Cache Strategy**: 15-minute result caching
- **Concurrent Requests**: Supports up to 100 simultaneous

## Integration Examples

### JavaScript/TypeScript

```typescript
async function getFinancialRecommendations(profileId: number, scenario: string) {
  const response = await fetch('http://localhost:8000/api/simulation/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: profileId,
      scenario_type: scenario,
      iterations: 10000
    })
  });
  
  const data = await response.json();
  return data.cards;
}
```

### Python

```python
import httpx

async def get_recommendations(profile_id: int, scenario: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/simulation/explain",
            json={
                "profile_id": profile_id,
                "scenario_type": scenario,
                "iterations": 10000
            }
        )
        return response.json()["cards"]
```

## Testing

### Unit Tests
```bash
pytest tests/test_ai_explanations.py -v
```

### Integration Test
```bash
python scripts/test_explanation_api.py
```

### Performance Benchmark
```bash
# Included in test_explanation_api.py
# Validates sub-2 second requirement
```

## Error Handling

The API implements graceful degradation:

1. **API Key Missing**: Falls back to algorithmic generation
2. **AI API Failure**: Falls back to enhanced templates
3. **Timeout**: Returns partial results with fallback content
4. **Invalid Profile**: Returns 400 with available profiles
5. **Invalid Scenario**: Returns 400 with valid scenarios

## Quality Assurance

### Content Quality Checks

- Rationale: 150-200 words, includes simulation data
- Steps: 4 specific, actionable items with numbers
- Personalization: References user demographics and income
- Differentiation: Each strategy clearly distinct

### Data Integration

- Uses real Monte Carlo simulation percentiles
- Incorporates user profile data (income, expenses, debts)
- References market data when available
- Calculates realistic potential savings

## Monitoring

### Key Metrics to Track

- AI provider usage and fallback rate
- Response time percentiles (p50, p95, p99)
- Content quality scores
- User engagement with each strategy type

### Logging

All explanation generation is logged with:
- Profile ID and scenario type
- AI provider used
- Generation time
- Fallback activation status

## Future Enhancements

1. **Multi-language Support**: Generate explanations in user's language
2. **Voice Explanations**: Text-to-speech for accessibility
3. **Historical Tracking**: Compare recommendations over time
4. **A/B Testing**: Test different explanation styles
5. **Custom Strategies**: User-defined risk profiles