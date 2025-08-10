# COMPREHENSIVE FRONTEND DATA FLOW AUDIT REPORT
Generated: 2025-08-08

## EXECUTIVE SUMMARY

This audit provides a complete analysis of the frontend data flow architecture, identifying:
- All user flows across Goals, AI Actions, and Simulations screens
- Primary backend data sourcing lines and API endpoints
- Data consumption patterns and field utilization
- Critical gaps and unused data fields
- Comprehensive validation checklist for ensuring data integrity

## 1. CURRENT UI USER FLOWS ANALYSIS

### 1.1 Main Screen Architecture
The frontend consists of 24 screens with 3 primary data-intensive flows:

```
PRIMARY SCREENS:
├── Goals Management Flow
│   ├── goals-screen.tsx (Main listing)
│   ├── create-goal-screen.tsx (Creation)
│   └── goal-detail-screen.tsx (Detail/Edit)
├── AI Actions Flow
│   ├── ai-actions-screen.tsx (Main hub)
│   ├── ai-actions-screen-refactored.tsx (Enhanced version)
│   └── action-detail-screen.tsx (Automation details)
└── Simulations Flow
    ├── simulations-screen.tsx (Selection)
    ├── simulation-setup-screen.tsx (Configuration)
    ├── simulating-screen.tsx (Progress)
    └── simulation-results-screen.tsx (Results)
```

### 1.2 Data Presentation Points

#### Goals Screen (`/components/screens/goals-screen.tsx`)
**Data Fields Displayed:**
- `goal.title` - Goal name
- `goal.type` - Goal category
- `goal.target` - Target amount ($)
- `goal.current` - Current progress ($)
- `goal.deadline` - Target date
- `goal.monthlyContribution` - Monthly savings amount
- `goal.priority` - Priority level (high/medium/low)
- `goal.status` - Current status
- `goal.icon` - Visual indicator
- `goal.color` - Theme color
- `goal.aiInsights` - AI recommendations (if available)
- `goal.simulationTags` - Linked simulations
- `goal.simulationImpact` - Impact analysis results

**Calculated Metrics:**
- Progress percentage: `(current/target) * 100`
- Goal status: behind/on-track/ahead
- Time remaining calculations

#### AI Actions Screen (`/components/screens/ai-actions-screen.tsx`)
**Data Fields Displayed:**
- `action.title` - Action name
- `action.description` - Brief description
- `action.rationale` - Why this action matters
- `action.potentialSaving` - Monthly savings potential ($)
- `action.type` - optimization/simulation
- `action.status` - suggested/in-process/completed
- `action.steps` - Implementation steps array
- `action.progress` - Completion percentage
- `action.workflowStatus` - Workflow state
- `action.currentStep` - Current execution step
- `action.estimatedCompletion` - Time remaining
- `action.executionId` - Workflow tracking ID
- `action.detailed_insights` - Enhanced AI explanations

**Workflow Validation Fields:**
- Title match validation
- Automation requirements check
- Step completion tracking
- Risk assessment level
- Efficiency score

#### Simulation Screens
**Setup Screen (`simulation-setup-screen.tsx`) Parameters:**
- Emergency Fund: target_months, monthly_contribution, risk_tolerance
- Job Loss: termination_type, severance_weeks, unemployment_eligible, emergency_fund_months
- Debt Payoff: total_debt, monthly_payment, interest_rate, strategy
- Market Crash: investment_horizon, monthly_contribution, emergency_fund_months
- Medical Crisis: insurance_coverage, emergency_fund_months, health_status

**Results Screen (`simulation-results-screen.tsx`) Data:**
- `simulationResults.scenario_name` - Scenario title
- `simulationResults.ai_explanations` - AI-generated insights array
- Statistical results (percentiles, mean, std_dev)
- Probability metrics
- Confidence intervals
- Processing metadata

## 2. PRIMARY DATA SOURCING LINES

### 2.1 Backend API Endpoints

```javascript
BACKEND ENDPOINTS MAPPED:
├── Profile Management
│   ├── GET /profiles - List all profiles
│   ├── GET /profiles/{id} - Get specific profile
│   └── Returns: customer_id, name, age, demographic, income, expenses, accounts, transactions
├── Simulation Engine
│   ├── POST /simulation/{scenario_type} - Run simulation
│   └── Returns: scenario_name, results, ai_explanations, percentiles, metadata
├── Goals Management
│   ├── GET /api/goals - List goals (currently using local data)
│   ├── POST /api/goals - Create goal
│   └── DELETE /api/goals/{id} - Delete goal
├── AI Actions
│   ├── GET /api/ai-actions - Get AI recommendations
│   └── POST /api/ai-actions/execute - Execute automation
├── Market Data
│   ├── GET /api/market-data - Get current market indicators
│   └── Returns: market_indices, interest_rates, inflation_data, economic_indicators
└── Cache Management
    ├── GET /api/cache/{key} - Get cached data
    └── DELETE /api/cache/clear/{pattern} - Clear cache
```

### 2.2 Frontend API Service Layer

```typescript
// Primary API Services Used:
├── apiClient (/lib/api/client.ts)
├── aiActionsService (/lib/api/ai-actions-service.ts)
├── GoalService (/lib/services/goal-service.ts)
├── SpendingService (/lib/services/spending-service.ts)
├── workflowAPI (/lib/api/integration.ts)
└── MarketDataService (/lib/api/services.ts)
```

## 3. DATA CONSUMPTION PATTERNS

### 3.1 Backend Fields Actually Used vs Available

#### Profile Data
**USED Fields:**
- ✅ customer_id
- ✅ demographic
- ✅ monthly_income
- ✅ monthly_expenses
- ✅ age
- ✅ location
- ✅ accounts (partial - only type and balance)
- ✅ credit_score

**UNUSED/UNDERUTILIZED Fields:**
- ❌ transactions (fetched but not displayed in UI)
- ❌ total_debt (calculated but not shown)
- ❌ emergency_fund (fetched but not prominently displayed)
- ❌ student_loan_balance (available but not used)
- ❌ risk_tolerance (calculated but not shown to user)
- ❌ account.institution_name (fetched but not displayed)

#### Simulation Results
**USED Fields:**
- ✅ scenario_name
- ✅ ai_explanations
- ✅ percentile results (partial)
- ✅ mean/median values

**UNUSED Fields:**
- ❌ std_dev (standard deviation not shown)
- ❌ min_value/max_value (range not displayed)
- ❌ confidence_interval_95 (available but not used)
- ❌ processing_time_ms (performance metric not shown)
- ❌ metadata object (additional context not utilized)

### 3.2 Data Flow Gaps Identified

#### Critical Gaps:
1. **Goals-Backend Disconnect**: Goals are managed locally in `/lib/data.ts` instead of backend persistence
2. **Transaction Data Waste**: Full transaction history fetched but never displayed
3. **AI Insights Underutilization**: Backend provides detailed insights but UI shows limited subset
4. **Market Data Integration**: Market data endpoint exists but not integrated into simulations UI
5. **Profile Financial Metrics**: Net worth, debt ratios calculated but not surfaced

#### Missing Data Connections:
1. **Goals ↔ Simulations**: simulationTags exist but weak integration
2. **AI Actions ↔ Goals**: No automatic goal creation from AI actions
3. **Spending ↔ Goals**: Monthly spending not reflected in goal progress
4. **Profile ↔ Market Data**: User portfolio not connected to market indicators

## 4. CRITICAL FOCUS AREAS

### 4.1 Goals Screen Issues
- **Local Storage Only**: No backend persistence
- **Missing Fields**: No user_id association, no created/updated timestamps
- **Simulation Integration**: Tags exist but no real-time impact updates
- **AI Insights**: Static recommendations, not dynamically generated

### 4.2 AI Actions Screen Issues
- **Workflow Tracking**: executionId exists but limited status polling
- **Detailed Insights**: Backend provides rich data but UI shows basic info
- **Action History**: No persistence of completed actions
- **Impact Tracking**: Potential savings not verified post-execution

### 4.3 Simulations Screen Issues
- **Parameter Validation**: No backend validation of input parameters
- **Results Caching**: Results not cached for repeat viewing
- **Goal Impact**: Simulation results don't update related goals
- **Explanations**: AI explanations truncated or summarized

## 5. COMPREHENSIVE VALIDATION CHECKLIST

### 5.1 Backend Fields That MUST Be Used

#### Profile Data Requirements
- [ ] Display total_debt prominently on dashboard
- [ ] Show emergency_fund status with visual indicator
- [ ] Surface risk_tolerance in investment recommendations
- [ ] Display transaction history in spending tracker
- [ ] Show account institutions for credibility
- [ ] Calculate and display debt-to-income ratio
- [ ] Show student loan balance if applicable

#### Simulation Data Requirements
- [ ] Display confidence intervals for transparency
- [ ] Show standard deviation for risk assessment
- [ ] Display min/max ranges for worst/best cases
- [ ] Show processing time for performance feedback
- [ ] Utilize metadata for contextual information
- [ ] Display probability_success prominently
- [ ] Show all percentile breakdowns (10, 25, 50, 75, 90)

#### AI Actions Data Requirements
- [ ] Display full detailed_insights object
- [ ] Show mechanics_explanation for transparency
- [ ] List all key_insights points
- [ ] Display scenario_nuances for context
- [ ] Show decision_context for informed choices
- [ ] Track and display execution history
- [ ] Show real-time workflow status updates

### 5.2 Frontend Presentation Points Needing Data

#### Dashboard Screen
- [ ] Net worth calculation and trend
- [ ] Debt-to-income ratio indicator
- [ ] Emergency fund coverage months
- [ ] Goal progress summary widget
- [ ] Recent AI action impacts
- [ ] Market condition indicators

#### Goals Screen
- [ ] Backend persistence for all goals
- [ ] Real-time simulation impact updates
- [ ] Dynamic AI recommendations
- [ ] Progress trend visualization
- [ ] Milestone tracking with dates
- [ ] Category-based grouping

#### AI Actions Screen
- [ ] Full workflow visualization
- [ ] Detailed impact projections
- [ ] Historical action performance
- [ ] Category filtering
- [ ] Priority scoring display
- [ ] Automation success rates

### 5.3 Data Provisioning Validation

#### API Integration Checks
- [ ] All frontend API calls have error handling
- [ ] Fallback data only used when backend unavailable
- [ ] Cache invalidation on data updates
- [ ] Optimistic UI updates with rollback
- [ ] Rate limiting compliance
- [ ] Authentication token management

#### Data Consistency Checks
- [ ] Profile data synchronized across screens
- [ ] Goal progress updates reflected immediately
- [ ] Simulation results persist across navigation
- [ ] AI action states maintain consistency
- [ ] Cache coherence between frontend/backend
- [ ] Transaction data integrity maintained

## 6. RECOMMENDATIONS

### 6.1 Immediate Actions Required

1. **Implement Goals Backend Persistence**
   - Migrate from local data.ts to backend API
   - Add proper CRUD operations with database storage
   - Implement user association and timestamps

2. **Surface Unused Profile Data**
   - Display total_debt on dashboard
   - Show emergency fund coverage prominently
   - Add transaction history view
   - Display risk tolerance in recommendations

3. **Enhance AI Actions Display**
   - Show full detailed_insights content
   - Implement real-time workflow tracking
   - Add execution history persistence
   - Display impact verification metrics

4. **Improve Simulation Integration**
   - Connect results to goal updates
   - Cache results for review
   - Display all statistical metrics
   - Show full AI explanations

### 6.2 Data Optimization Opportunities

1. **Reduce Wasted Fetches**
   - Lazy load transaction history
   - Paginate large data sets
   - Implement field selection in APIs
   - Use GraphQL for precise queries

2. **Improve Caching Strategy**
   - Cache simulation results by parameters
   - Implement stale-while-revalidate
   - Add cache warming for common queries
   - Use edge caching for static data

3. **Enhance Real-time Updates**
   - Implement WebSocket for live updates
   - Add Server-Sent Events for progress
   - Use optimistic updates with rollback
   - Implement change detection

## 7. TESTING REQUIREMENTS

### 7.1 Data Flow Tests Needed

```typescript
// Critical test scenarios:
- Profile data loading and error handling
- Goal CRUD operations with backend
- Simulation parameter validation
- AI action workflow execution
- Cache invalidation on updates
- Data consistency across screens
- API error recovery mechanisms
- Optimistic update rollbacks
```

### 7.2 Performance Benchmarks

```typescript
// Target metrics:
- Profile load: < 500ms
- Goal operations: < 200ms
- Simulation execution: < 3s
- AI action generation: < 1s
- Cache hit rate: > 80%
- API response time: < 300ms p95
```

## CONCLUSION

The frontend has a robust architecture but significant data utilization gaps exist. The backend provides rich data that remains largely untapped in the UI. Immediate priorities should focus on:

1. Implementing proper backend persistence for goals
2. Surfacing all available profile and financial metrics
3. Displaying complete AI insights and explanations
4. Creating stronger integration between features
5. Reducing wasted data fetches while ensuring all valuable data is displayed

By addressing these gaps, the application can provide a more comprehensive and data-rich user experience while optimizing performance and reducing unnecessary backend load.

## APPENDIX: File References

### Frontend Components
- `/frontend/components/screens/goals-screen.tsx`
- `/frontend/components/screens/ai-actions-screen.tsx`
- `/frontend/components/screens/simulation-setup-screen.tsx`
- `/frontend/components/screens/simulation-results-screen.tsx`
- `/frontend/hooks/use-app-state.tsx`
- `/frontend/lib/api/services.ts`
- `/frontend/lib/data.ts`

### Backend Endpoints
- `/backend/python_engine/app.py`
- `/backend/python_engine/core/models.py`
- `/backend/python_engine/data/csv_loader.py`

### API Routes
- `/frontend/app/api/goals/route.ts`
- `/frontend/app/api/profiles/route.ts`
- `/frontend/app/api/simulation/[scenarioType]/route.ts`