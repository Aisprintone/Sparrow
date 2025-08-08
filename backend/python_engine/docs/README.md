# FinanceAI Monte Carlo Simulation Engine

Production-grade Python Monte Carlo simulation engine for financial planning with SOLID architecture principles.

## Features

- **Emergency Fund Runway Simulation**: Calculates how long emergency savings will last under various economic conditions
- **Student Loan Payoff Simulation**: Projects time to pay off student loans with different strategies
- **Vectorized Calculations**: NumPy-based vectorized operations for high performance
- **Statistical Rigor**: Confidence intervals, percentiles, and convergence testing
- **SOLID Architecture**: Clean, maintainable, and extensible design
- **Real Data Integration**: Works with actual CSV financial data from 3 user personas

## Architecture

```
python_engine/
├── core/               # Core engine components
│   ├── config.py      # Centralized configuration (DRY principle)
│   ├── engine.py      # Monte Carlo engine (Single Responsibility)
│   └── models.py      # Pydantic data models
├── scenarios/         # Simulation scenarios (Open/Closed principle)
│   ├── emergency_fund.py
│   └── student_loan.py
├── data/              # Data loading layer
│   └── csv_loader.py  # CSV to ProfileData transformation
├── api/               # FastAPI REST endpoints
│   └── main.py        # API routes for Next.js integration
└── tests/             # Comprehensive test suite
    └── test_engine.py # Unit and integration tests
```

## Installation

1. **Install Python 3.9+**
```bash
python --version  # Should be 3.9 or higher
```

2. **Create virtual environment**
```bash
cd /Users/ai-sprint-02/Documents/Sparrow/backend/python_engine
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

## Running the API Server

1. **Start the FastAPI server**
```bash
python run_server.py
```

The API will be available at:
- API endpoints: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- OpenAPI spec: http://localhost:8000/openapi.json

2. **Test the API**
```bash
# Health check
curl http://localhost:8000/health

# Get available profiles
curl http://localhost:8000/api/profiles

# Run emergency fund simulation for Profile 1
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": 1,
    "scenario_type": "emergency_fund",
    "iterations": 10000
  }'
```

## Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html

# Run specific test
pytest tests/test_engine.py::TestMonteCarloEngine -v
```

## API Endpoints

### `GET /health`
Health check endpoint returning system status.

### `GET /api/profiles`
Returns available customer profiles with basic information.

### `GET /api/scenarios`
Returns available simulation scenarios with descriptions.

### `POST /api/simulate`
Run Monte Carlo simulation for specified profile and scenario.

**Request Body:**
```json
{
  "profile_id": 1,
  "scenario_type": "emergency_fund",
  "iterations": 10000,
  "include_advanced_metrics": true
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": 1,
    "demographic": "millennial",
    "net_worth": 150000,
    "monthly_income": 8500,
    "monthly_expenses": 4200,
    "emergency_fund": 35000
  },
  "simulation": {
    "scenario": "EmergencyFundScenario",
    "results": {
      "percentiles": {
        "p10": 7.2,
        "p25": 7.8,
        "p50": 8.3,
        "p75": 8.9,
        "p90": 9.6
      },
      "statistics": {
        "mean": 8.4,
        "std_dev": 1.2
      },
      "probability_success": 0.95,
      "confidence_interval": [8.2, 8.6]
    },
    "metadata": {
      "iterations": 10000,
      "convergence_achieved": true
    }
  },
  "advanced_metrics": {
    "target_months": 6,
    "probability_meet_target": 0.98,
    "recommended_additional_savings": 0
  }
}
```

## Integration with Next.js Frontend

The Python engine integrates with the existing Next.js frontend through API routes.

1. **Create Next.js API route** (`/frontend/app/api/simulation/route.ts`):
```typescript
export async function POST(request: Request) {
  const body = await request.json()
  
  // Forward to Python API
  const response = await fetch('http://localhost:8000/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  
  return Response.json(await response.json())
}
```

2. **Use in frontend components**:
```typescript
const runSimulation = async (profileId: number, scenario: string) => {
  const response = await fetch('/api/simulation', {
    method: 'POST',
    body: JSON.stringify({
      profile_id: profileId,
      scenario_type: scenario,
      iterations: 10000
    })
  })
  
  const result = await response.json()
  // Update UI with simulation results
}
```

## Performance Characteristics

- **10,000 iterations**: ~200-500ms
- **100,000 iterations**: ~2-5 seconds
- **Memory usage**: <100MB for typical simulations
- **Vectorized operations**: 10-100x faster than loop-based calculations

## SOLID Principles Implementation

1. **Single Responsibility**: Each class has one clear purpose
   - `MonteCarloEngine`: Orchestrates simulations
   - `EmergencyFundScenario`: Calculates emergency fund runway
   - `CSVDataLoader`: Loads and transforms CSV data

2. **Open/Closed**: New scenarios extend `BaseScenario` without modifying existing code

3. **Liskov Substitution**: Any scenario can be substituted in the engine

4. **Interface Segregation**: Scenarios only implement interfaces they need

5. **Dependency Inversion**: Engine depends on abstractions, not concrete implementations

## Production Deployment

For production deployment:

1. **Use environment variables**:
```bash
export DATA_DIR=/path/to/csv/data
export API_PORT=8000
export CORS_ORIGINS=https://financeai.app
```

2. **Run with Gunicorn**:
```bash
gunicorn python_engine.api.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

3. **Docker deployment**:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "python_engine.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Monitoring & Observability

The engine includes built-in metrics:
- Processing time per simulation
- Convergence detection
- Outlier detection
- Distribution type identification

Access metrics through the API response `metadata` field.

## License

Proprietary - FinanceAI 2024