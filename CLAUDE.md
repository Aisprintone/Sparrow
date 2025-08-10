# CLAUDE.md - Sparrow Project

## Bash Commands

### Frontend (Next.js 15 + React 19)
- `npm run build`: Build the Next.js application for production
- `npm run dev`: Start development server (runs on port 3000 by default)
- `npm run lint`: Run ESLint on the codebase
- `npm run start`: Start production server
- `npm test`: Run Jest unit tests
- `npm run test:watch`: Run Jest in watch mode for development
- `npm run test:coverage`: Generate test coverage report
- `npm run test:e2e`: Run Playwright end-to-end tests
- `npm run test:ci`: Run tests in CI environment with coverage

### Backend (FastAPI + Python)
- `uvicorn app:app --host 0.0.0.0 --port 8000`: Start the FastAPI server locally
- `python -m pytest`: Run Python tests
- `python -m pytest tests/`: Run tests from specific directory

## Code Style Guidelines

### Frontend
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (e.g., `import { useState } from 'react'`)
- Use TypeScript for all new files
- Follow Next.js 15 App Router patterns
- Use Tailwind CSS classes for styling
- Components use shadcn/ui design system
- Prefer function components with hooks over class components

### Backend
- Use FastAPI with async/await patterns
- Follow Python PEP 8 style guidelines
- Use Pydantic models for request/response validation
- Type hints are required for all function signatures
- Use SQLAlchemy 2.0 syntax for database operations
- Organize code into modules: api/, core/, workflows/, rag/, etc.

## Development Principles

### SOLID Principles
- **Single Responsibility**: Each class/function should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: No client should depend on methods it doesn't use
- **Dependency Inversion**: Depend on abstractions, not concretions

### DRY Principles
- Don't Repeat Yourself - extract common logic into reusable functions/classes
- Use configuration files for environment-specific values
- Create utility functions for repeated operations
- Implement shared interfaces for similar functionality

## Testing Instructions

### Frontend Testing
- Unit tests: Use Jest with React Testing Library
- Integration tests: Located in `__tests__/integration/`
- E2E tests: Use Playwright, located in `e2e/`
- Performance tests: Located in `__tests__/performance/`
- Security tests: Located in `__tests__/security/`
- Run specific test suites using pattern matching: `npm run test:unit`, `npm run test:integration`

### Backend Testing
- Use pytest for all Python testing
- Tests located in `tests/` directory
- Include both unit and integration tests
- Test AI/RAG functionality with mock data
- Performance testing available via `scripts/performance_profiler.py`

## Development Workflow

### Before Coding
1. **Plan First**: Create a detailed plan using TodoWrite tool
2. **Research Existing Code**: Use Read/Grep/Glob tools to understand current implementation
3. **Check Context7 MCP**: Reference best practices for libraries being used
4. **Identify Patterns**: Look for existing patterns to follow in the codebase

### During Development
- Always run type checking: `npm run lint` (frontend)
- Test changes with Playwright MCP to ensure functionality works
- Avoid hardcoded values - use configuration/environment variables
- Implement proper error handling and fallbacks
- Follow existing code patterns and conventions

### After Development
- Run full test suite: `npm test` (frontend), `pytest` (backend)
- Verify with Playwright that changes work as intended
- Ensure no breaking changes to existing functionality
- Document any new patterns or architectural decisions

## Developer Environment Setup

### Frontend Setup
- Node.js 18+ required
- Uses npm (package-lock.json present)
- Next.js 15.2.4 with React 19
- TypeScript 5+ configured

### Backend Setup
- Python 3.11+ required (see runtime.txt)
- Virtual environment recommended
- Install dependencies: `pip install -r requirements.txt`
- Uses PostgreSQL database
- Redis for caching
- Environment variables needed for OpenAI/Anthropic API keys

## Architecture Notes

### Frontend Architecture
- Next.js App Router (not Pages Router)
- React Server Components where applicable
- Client components marked with 'use client'
- State management via custom hooks (use-app-state.tsx)
- API routes in `app/api/` directory
- Components organized by screens and UI elements

### Backend Architecture
- FastAPI with modular structure
- AI/ML capabilities using LangChain, LangGraph, and DSPy
- RAG (Retrieval-Augmented Generation) system for personalized insights
- Workflow engine for financial planning scenarios
- Vector database integration (ChromaDB, FAISS)
- Behavioral modeling for financial decision-making

## Code Quality Guardrails

### Architecture Enforcement
- **Pattern Registry**: Document and follow established patterns - don't create new ones without justification
- **Component Limits**: Max 200 lines per component, max 50 lines per function
- **Dependency Audit**: New dependencies require explicit justification and alternatives analysis
- **Abstraction Threshold**: Don't abstract until you have 3+ similar implementations (Rule of Three)

### Duplication Prevention
- **Similarity Detection**: Before writing new code, search for existing similar functionality
- **Shared Utilities**: Use existing utility functions instead of creating new ones
- **Configuration Centralization**: All config values must go in designated config files, not scattered throughout code
- **Interface Consistency**: APIs must follow existing endpoint patterns and response structures

### Quality Gates
- **Code Coverage Minimum**: 80% test coverage required for new code
- **Performance Budget**: Bundle size increases >10KB require optimization plan
- **Security Scanning**: All new code must pass security linters
- **Type Safety**: 100% TypeScript coverage, no `any` types without explicit justification

### Documentation Requirements
- **Decision Records**: Major architectural decisions must be documented in `/docs`
- **API Documentation**: All endpoints must have OpenAPI/Swagger documentation
- **Component Documentation**: All reusable components need usage examples
- **Migration Guides**: Breaking changes require migration documentation

### Refactoring Mandates
- **Technical Debt Reviews**: Monthly review of TODO comments and technical debt
- **Code Cleanup**: Remove unused code, dependencies, and dead imports before each release
- **Performance Audits**: Regular performance profiling to prevent gradual degradation
- **Accessibility Audits**: Regular a11y testing to prevent regression

### AI-Specific Guardrails
- **Human Review Required**: All AI-generated code >50 lines needs human architectural review
- **Pattern Compliance**: AI suggestions must follow existing codebase patterns, not create new ones
- **Incremental Changes**: Large AI-generated features must be broken into reviewable chunks
- **Validation Testing**: All AI changes require Playwright verification before integration

## Special Behaviors & Warnings

- Frontend uses Next.js 15 with React 19 - be aware of breaking changes from earlier versions
- Backend AI features require OpenAI and Anthropic API keys
- RAG system requires vector database initialization
- Some test files have been removed from git (see .gitignore patterns)
- Performance monitoring via custom logging in `logs/` directory
- **No Hardcoded Fallbacks**: Always ensure primary systems are working before implementing fallbacks
- **Validation Required**: Use Playwright MCP to test all changes before considering them complete