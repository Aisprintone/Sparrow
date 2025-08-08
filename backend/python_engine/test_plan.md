# RAG-Enhanced LangGraph-DSPy System Test Plan

## Overview
Comprehensive testing strategy for the profile-specific RAG system with tool registry and LangGraph-DSPy multi-agent integration.

## Test Environment Setup

### Prerequisites
- Python 3.9+
- CSV data files in `/data/` directory
- Environment variables: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (optional)
- All dependencies installed via `requirements.txt`

### Test Data Requirements
```
data/
├── account.csv         # Account balances, types, institutions
├── transaction.csv     # Transaction history (if available)
├── demographics.csv    # User profiles (if available)
├── goal.csv           # Financial goals (if available)
└── investment.csv     # Investment portfolios (if available)
```

## Test Categories

### 1. Unit Tests - RAG System Core

#### 1.1 ProfileRAGSystem Class
**Test File**: `test_profile_rag_system.py`

**Test Cases**:
- [ ] **test_profile_system_initialization**
  - Verify ProfileRAGSystem initializes with valid profile_id
  - Check CSV data loading for all data types
  - Validate vector store creation
  - Confirm tool registry population

- [ ] **test_csv_data_loading**
  - Test loading existing CSV files
  - Handle missing CSV files gracefully
  - Verify customer_id filtering works correctly
  - Check data type parsing and validation

- [ ] **test_document_creation**
  - Verify CSV to Document conversion
  - Check natural language formatting
  - Validate metadata extraction
  - Test different data types (accounts, transactions, etc.)

- [ ] **test_vector_store_setup**
  - Confirm vector store initialization
  - Test document embedding and storage
  - Verify retriever configuration
  - Check search functionality

#### 1.2 Tool Registry Tests
**Test Cases**:
- [ ] **test_tool_registration**
  - Verify all 6 tools are registered
  - Check tool names and descriptions
  - Validate tool function signatures

- [ ] **test_individual_tools**
  - `query_accounts`: Test account balance queries
  - `query_transactions`: Test spending pattern analysis
  - `query_demographics`: Test profile information retrieval
  - `query_goals`: Test financial goal queries
  - `query_investments`: Test investment portfolio queries
  - `query_all_data`: Test comprehensive analysis

- [ ] **test_tool_error_handling**
  - Test behavior with missing data
  - Verify graceful error responses
  - Check fallback mechanisms

### 2. Integration Tests - RAG Manager

#### 2.1 ProfileRAGManager Class
**Test Cases**:
- [ ] **test_manager_initialization**
  - Verify manager creates profile systems on demand
  - Test profile discovery from CSV data
  - Check singleton pattern behavior

- [ ] **test_multi_profile_operations**
  - Test queries across different profiles (1, 2, 3)
  - Verify profile isolation
  - Check summary generation for all profiles

- [ ] **test_profile_system_caching**
  - Verify profile systems are cached after first access
  - Test memory usage with multiple profiles
  - Check performance with repeated access

### 3. Integration Tests - LangGraph-DSPy Enhancement

#### 3.1 Enhanced Agent System
**Test File**: `test_langgraph_dspy_integration.py`

**Test Cases**:
- [ ] **test_rag_retriever_node**
  - Verify RAG insights retrieval for all data types
  - Check profile context generation
  - Test fallback behavior when RAG fails
  - Validate insight categories and structure

- [ ] **test_enhanced_data_analyzer**
  - Confirm RAG insights integration with simulation data
  - Test DSPy analysis with enhanced context
  - Verify analysis result structure

- [ ] **test_rag_enhanced_card_generation**
  - Compare cards with and without RAG enhancement
  - Verify personalization based on real user data
  - Check card format compliance with frontend interface

- [ ] **test_agent_flow_with_rag**
  - Test complete flow: RAG → Data Analysis → Card Generation
  - Verify state management between nodes
  - Check error propagation and recovery

### 4. API Endpoint Tests

#### 4.1 RAG Query Endpoints
**Test File**: `test_rag_api_endpoints.py`

**Test Cases**:
- [ ] **test_rag_query_profile_endpoint**
  ```
  POST /rag/query/{profile_id}
  ```
  - Test with valid profile IDs (1, 2, 3)
  - Test with specific tool names
  - Test with general queries
  - Verify response format and status codes
  - Test error handling for invalid inputs

- [ ] **test_profile_summaries_endpoints**
  ```
  GET /rag/profiles/summary
  GET /rag/profiles/{profile_id}/summary
  ```
  - Verify summary data structure
  - Check data type reporting
  - Test document count accuracy
  - Validate tool availability reporting

- [ ] **test_profile_tools_endpoint**
  ```
  GET /rag/profiles/{profile_id}/tools
  ```
  - Verify all tools are listed
  - Check tool descriptions
  - Test tool count accuracy

- [ ] **test_multi_query_endpoint**
  ```
  POST /rag/profiles/{profile_id}/multi-query
  ```
  - Test comprehensive analysis across all tools
  - Verify success/failure tracking
  - Check response time and performance
  - Validate result structure

#### 4.2 Enhanced Simulation Endpoints
**Test Cases**:
- [ ] **test_enhanced_emergency_fund_simulation**
  ```
  POST /simulation/emergency-fund
  ```
  - Verify RAG integration in simulation results
  - Check `ai_explanation_cards` field
  - Test card personalization with real profile data

- [ ] **test_enhanced_student_loan_simulation**
  ```
  POST /simulation/student-loan
  ```
  - Similar tests as emergency fund
  - Verify debt-specific personalization

### 5. Performance Tests

#### 5.1 RAG System Performance
**Test Cases**:
- [ ] **test_vector_search_performance**
  - Measure query response times
  - Test with various query lengths
  - Check memory usage during searches

- [ ] **test_multi_profile_scalability**
  - Load test with all 3 profiles simultaneously
  - Measure memory usage per profile
  - Test concurrent query handling

- [ ] **test_card_generation_performance**
  - Measure end-to-end card generation time
  - Compare with/without RAG enhancement
  - Test with different simulation types

#### 5.2 API Performance
**Test Cases**:
- [ ] **test_endpoint_response_times**
  - Target: < 500ms for simple queries
  - Target: < 2s for multi-query analysis
  - Target: < 3s for card generation

### 6. Error Handling & Resilience Tests

#### 6.1 Data Availability Tests
**Test Cases**:
- [ ] **test_missing_csv_files**
  - Test behavior when CSV files are missing
  - Verify fallback to empty DataFrames
  - Check error messages and logging

- [ ] **test_empty_csv_files**
  - Test with empty CSV files
  - Verify graceful handling
  - Check fallback card generation

- [ ] **test_malformed_csv_data**
  - Test with invalid CSV formats
  - Missing required columns
  - Invalid data types

#### 6.2 API Key Availability Tests
**Test Cases**:
- [ ] **test_no_api_keys**
  - Test system behavior without OpenAI/Anthropic keys
  - Verify fallback to basic embeddings
  - Check DSPy fallback behavior

- [ ] **test_api_key_failures**
  - Simulate API rate limits
  - Test API key exhaustion
  - Verify error handling and retries

### 7. End-to-End User Journey Tests

#### 7.1 Complete Financial Analysis Flow
**Test Cases**:
- [ ] **test_profile_1_emergency_fund_journey**
  1. Load Profile 1 data
  2. Query account balances via RAG
  3. Run emergency fund simulation
  4. Generate enhanced AI cards
  5. Verify personalization accuracy

- [ ] **test_profile_2_student_loan_journey**
  1. Load Profile 2 data
  2. Query debt information via RAG
  3. Run student loan simulation
  4. Generate enhanced AI cards
  5. Verify debt-specific recommendations

- [ ] **test_cross_profile_comparison**
  1. Query same question across all profiles
  2. Verify different responses based on data
  3. Check personalization accuracy

### 8. Data Quality & Accuracy Tests

#### 8.1 RAG Retrieval Accuracy
**Test Cases**:
- [ ] **test_account_query_accuracy**
  - Query specific account types
  - Verify returned data matches CSV
  - Check balance calculations

- [ ] **test_transaction_analysis_accuracy**
  - Query spending patterns
  - Verify category analysis
  - Check date range filtering

- [ ] **test_goal_progress_accuracy**
  - Query goal completion status
  - Verify progress calculations
  - Check target date handling

### 9. Security & Data Privacy Tests

#### 9.1 Data Isolation Tests
**Test Cases**:
- [ ] **test_profile_data_isolation**
  - Ensure Profile 1 queries don't return Profile 2 data
  - Test customer_id filtering
  - Verify cross-profile data leakage prevention

- [ ] **test_sensitive_data_handling**
  - Check account number masking
  - Verify no sensitive data in logs
  - Test data sanitization in responses

## Test Execution Plan

### Phase 1: Foundation Testing (Week 1)
- Unit tests for RAG system core
- Tool registry validation
- Basic integration tests

### Phase 2: Integration Testing (Week 2)
- LangGraph-DSPy integration tests
- API endpoint testing
- Error handling validation

### Phase 3: Performance & Load Testing (Week 3)
- Performance benchmarking
- Scalability testing
- Memory usage analysis

### Phase 4: End-to-End & Security Testing (Week 4)
- Complete user journey testing
- Data accuracy validation
- Security and privacy verification

## Test Data Requirements

### Minimum Test Data Set
```csv
# account.csv (minimum 3 profiles)
account_id,customer_id,institution_name,account_type,balance
101,1,Chase,checking,5000
102,1,Chase,savings,15000
103,1,Chase,credit_card,-2000
201,2,Ally,checking,3000
301,3,Wells,checking,1000

# demographics.csv
customer_id,age,income,risk_tolerance
1,28,65000,moderate
2,35,85000,aggressive
3,22,35000,conservative
```

## Success Criteria

### Functional Requirements
- [ ] All RAG tools return relevant results for each profile
- [ ] LangGraph-DSPy integration generates personalized cards
- [ ] API endpoints respond within performance targets
- [ ] Error handling gracefully manages edge cases

### Performance Requirements
- [ ] Query response time < 500ms (90th percentile)
- [ ] Card generation time < 3s (95th percentile)
- [ ] Memory usage < 1GB per profile
- [ ] Support 10 concurrent users

### Quality Requirements
- [ ] 95%+ test coverage for core RAG functionality
- [ ] Zero data leakage between profiles
- [ ] 99.9% uptime during testing period
- [ ] All critical user journeys pass end-to-end tests

## Test Automation

### Continuous Integration
```yaml
# .github/workflows/rag-tests.yml
name: RAG System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run RAG unit tests
        run: pytest tests/test_profile_rag_system.py -v
      - name: Run integration tests
        run: pytest tests/test_langgraph_dspy_integration.py -v
      - name: Run API tests
        run: pytest tests/test_rag_api_endpoints.py -v
```

### Test Execution Commands
```bash
# Run all RAG tests
python -m pytest tests/ -v --cov=rag --cov=ai

# Run performance tests
python -m pytest tests/performance/ -v --benchmark-only

# Run end-to-end tests
python test_rag_system.py

# Run API integration tests
python -m pytest tests/api/ -v
```

## Risk Mitigation

### High-Risk Areas
1. **API Key Dependencies**: Fallback implementations required
2. **CSV Data Quality**: Validation and error handling critical
3. **Memory Usage**: Profile systems could consume significant memory
4. **Response Time**: Complex RAG queries may be slow

### Mitigation Strategies
1. Comprehensive fallback testing without API keys
2. Data validation at CSV load time
3. Memory profiling and optimization
4. Performance benchmarking and optimization

## Test Deliverables

1. **Test Code**: Complete test suite with 95%+ coverage
2. **Test Reports**: Automated test execution reports
3. **Performance Benchmarks**: Response time and memory usage baselines
4. **User Acceptance Tests**: End-to-end journey validation
5. **Security Assessment**: Data privacy and isolation verification

## Tools & Frameworks

- **Testing**: pytest, pytest-cov, pytest-benchmark
- **API Testing**: httpx, FastAPI TestClient
- **Performance**: memory-profiler, line-profiler
- **Mocking**: pytest-mock, unittest.mock
- **Data Generation**: faker, factory-boy
- **CI/CD**: GitHub Actions, pytest-html reporting