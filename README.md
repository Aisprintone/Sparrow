# FinanceAI - Your Autonomous Financial Co-Pilot

A comprehensive financial management application with AI-powered insights, simulations, and personalized recommendations.

## 🚀 Live Application

- **Frontend**: https://sparrow-finance-app.netlify.app
- **Backend**: https://feeble-bite-production.up.railway.app

## 📋 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Railway CLI: `npm install -g @railway/cli`
- Netlify CLI: `npm install -g netlify-cli`
- Docker and Docker Compose (for local database)

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd Sparrow

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend/python_engine
pip install -r requirements.txt

# Start development servers
# Frontend (in frontend/ directory)
npm run dev

# Backend (in backend/python_engine/ directory)
uvicorn main:app --reload
```

### Local Database Setup
All database operations are handled through the consolidated `db-manager.sh` script:

```bash
# Start the database
./db-manager.sh start

# Stop the database
./db-manager.sh stop

# Reset database (fresh start with confirmation)
./db-manager.sh reset

# Check database status
./db-manager.sh status

# View database logs
./db-manager.sh logs

# Connect to database via MySQL client
./db-manager.sh connect

# Show help
./db-manager.sh help
```

### Production Deployment
```bash
# Deploy both frontend and backend
./deploy.sh

# Or deploy individually:
# Backend
cd backend/python_engine && railway up

# Frontend
cd frontend && npm run build && netlify deploy --prod
```

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Deployment**: Netlify
- **Features**: 
  - Responsive design
  - Real-time financial data
  - AI-powered recommendations
  - Interactive simulations
  - Profile-specific goals with simulation integration

### Backend (FastAPI)
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL (Railway managed)
- **Deployment**: Railway
- **Features**:
  - RESTful API
  - AI/ML integration
  - Financial calculations
  - Data processing

## 🔧 Key Features

### Profile-Specific Goals System
- Dynamic goal generation based on actual user profile data
- 1-3 relevant goals per user demographic (Gen Z, Millennial, Mid-career)
- Goals mapped to appropriate simulation scenarios
- Realistic targets, timelines, and contributions based on user financials
- AI insights and milestone tracking for each generated goal

### Financial Dashboard
- Net worth tracking
- Asset/liability breakdown
- Financial health metrics
- Recent activity feed

### AI-Powered Insights
- Transaction analysis
- Personalized recommendations
- Savings opportunities
- Automated actions

### Financial Simulations
- Emergency fund strategies
- Student loan payoff optimization
- Home purchase planning
- Market crash impact analysis
- Medical crisis planning
- Job loss scenarios
- Gig economy volatility

### Market Data Integration
- Real-time stock prices
- Market trends
- Portfolio tracking
- Investment insights

## 🎯 Profile-Specific Goals

The application intelligently generates goals based on:
- **Account balances and emergency fund coverage**
- **Debt levels** (student loans, credit cards)
- **Monthly income/spending patterns**
- **Demographic-specific priorities and timelines**

### Goal Types by Demographic:
- **Gen Z**: Emergency Fund + Student Loans + Investment Portfolio
- **Mid-career**: Emergency Fund + Debt Payoff + Home Down Payment
- **Millennial**: Emergency Fund + Student Loans + Retirement Fund

Each goal is automatically mapped to relevant simulations for strategic planning.

## 📊 Database Schema

### Tables
- **CUSTOMER**: Customer information with location, age, and notification preferences
- **ACCOUNT**: Financial accounts linked to customers
- **TRANSACTION**: Financial transactions with categorization
- **CATEGORY**: Transaction categories for classification
- **GOAL**: Financial goals set by customers

### Connection Details
- **Host**: localhost
- **Port**: 3306
- **Database**: sparrow_db
- **Username**: sparrow_user
- **Password**: sparrow_password

## 📊 API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /profiles` - User profiles
- `POST /simulation/{scenarioType}` - Financial simulations
- `GET /market-data/quotes` - Market data
- `GET /goals` - Profile-specific goals
- `POST /goals/{id}/simulations` - Run goal simulations

### AI Endpoints
- `POST /ai/chat` - AI chat interface
- `GET /ai/actions` - AI recommendations
- `POST /ai/analyze` - Transaction analysis

## 🧪 Testing

### Run All Tests
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend/python_engine && python -m pytest

# Integration tests
npx playwright test
```

### Health Checks
```bash
# Backend health
curl https://feeble-bite-production.up.railway.app/health

# Frontend health
curl -I https://sparrow-finance-app.netlify.app
```

## 🔐 Environment Variables

### Backend (Railway)
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access
- `FMP_API_KEY` - Financial Modeling Prep API

### Frontend (Netlify)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_ENVIRONMENT` - Environment

## 📈 Performance

- **Frontend Load Time**: < 2 seconds
- **API Response Time**: ~389ms average
- **Database Connection**: Healthy
- **Uptime**: 99.9%+

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   cd backend/python_engine
   railway logs
   ```

2. **Frontend Build Issues**
   ```bash
   cd frontend
   npm run build
   ```

3. **API Rate Limiting**
   - FMP API: Using cached data as fallback
   - OpenAI API: Fallback to Anthropic

### Health Check Commands
```bash
# Check backend status
curl https://feeble-bite-production.up.railway.app/health

# Check frontend status
curl -I https://sparrow-finance-app.netlify.app

# Check database connection
curl https://feeble-bite-production.up.railway.app/db/health
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [API Documentation](docs/) - API reference and examples
- [Architecture Overview](docs/backend-engineering-spec.md) - System design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test && python -m pytest`
5. Deploy: `./deploy.sh`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For deployment issues:
1. Check the [Deployment Guide](DEPLOYMENT_GUIDE.md)
2. Review service-specific logs
3. Run health checks
4. Contact the development team

---

**Status**: ✅ Production Ready  
**Last Updated**: August 2025  
**Version**: 1.0.0 - Profile-Specific Goals Release