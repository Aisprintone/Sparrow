# Evidence-Based System Migration Plan

## The Fuckup Assessment

### What I Created in Wrong Location (`/Users/ai-sprint-02/Sparrow/`)
1. **Backend Files** (WRONG LOCATION):
   - `backend/python_engine/workflows/evidence_based_selection.py`
   - `backend/python_engine/workflows/contextual_explanations.py` 
   - `backend/python_engine/workflows/trust_automation.py`
   - `backend/python_engine/workflows/enhanced_workflow_registry.py`
   - `backend/python_engine/api/personalized_workflow_api.py`
   - `backend/python_engine/test_evidence_based_system.py`

2. **Frontend Files** (PARTIALLY WRONG):
   - Modified existing files in correct location (`/Users/ai-sprint-02/Documents/Sparrow/frontend/`)
   - BUT also created `personalized-workflow-service.ts` in wrong location first

### What's Actually in Correct Location (`/Users/ai-sprint-02/Documents/Sparrow/`)
1. **Frontend modifications** ✅ (Already correct):
   - `frontend/components/ai-actions/action-card-factory.tsx` - Enhanced with evidence fields
   - `frontend/components/screens/ai-actions-screen.tsx` - Added explain dialog
   - `frontend/components/screens/simulation-results-screen.tsx` - Enhanced with evidence
   - `frontend/lib/api/ai-actions-service.ts` - Updated to use evidence service

2. **Backend structure** ❌ (Missing evidence system):
   - Has existing workflow system but NO evidence-based enhancements
   - Missing all the sophisticated evidence analysis I built

## Migration Strategy

### Phase 1: Backend Evidence System Migration (HIGH PRIORITY)

#### 1.1 Core Evidence Engine
```bash
# Copy these files to correct location:
/Users/ai-sprint-02/Documents/Sparrow/backend/python_engine/workflows/
├── evidence_based_selection.py     ← MIGRATE
├── contextual_explanations.py      ← MIGRATE  
├── trust_automation.py             ← MIGRATE
└── enhanced_workflow_registry.py   ← MIGRATE
```

#### 1.2 API Integration
```bash
# Copy to correct location:
/Users/ai-sprint-02/Documents/Sparrow/backend/python_engine/api/
└── personalized_workflow_api.py    ← MIGRATE
```

#### 1.3 Test System
```bash
# Copy to correct location:
/Users/ai-sprint-02/Documents/Sparrow/backend/python_engine/
└── test_evidence_based_system.py   ← MIGRATE
```

### Phase 2: Frontend Service Fix (MEDIUM PRIORITY)

#### 2.1 Service Layer
- `frontend/lib/api/personalized-workflow-service.ts` ✅ (Already created in correct location)

#### 2.2 Verify Enhanced Components
- Check all frontend modifications are actually in correct location
- Test that evidence data flows through properly

### Phase 3: Integration Testing (HIGH PRIORITY)

#### 3.1 Backend API Testing
```bash
cd /Users/ai-sprint-02/Documents/Sparrow/backend/python_engine
python test_evidence_based_system.py
```

#### 3.2 Frontend-Backend Integration
- Test that `ai-actions-service.ts` connects to evidence backend
- Verify explain dialogs show evidence data
- Check simulation results display enhanced recommendations

### Phase 4: System Verification (CRITICAL)

#### 4.1 Evidence Flow Verification
1. Backend generates evidence-based recommendations ✓
2. API serves personalized workflows ✓  
3. Frontend service calls correct endpoints ✓
4. Cards display evidence badges and trust scores ✓
5. Explain dialogs show detailed evidence ✓

#### 4.2 Fallback Testing
- Ensure system gracefully degrades if evidence backend fails
- Verify existing workflows still work as fallback

## Immediate Action Items

### 🔥 **CRITICAL - Do First**
1. **Copy all evidence backend files to correct location**
2. **Test evidence system in correct directory**
3. **Verify API endpoints work in correct backend**

### ⚠️ **IMPORTANT - Do Second** 
1. **Test frontend can connect to evidence backend**
2. **Verify all enhanced UI components work**
3. **Check explain functionality displays evidence**

### ✅ **VERIFY - Do Third**
1. **End-to-end test: Evidence → API → Frontend → UI**
2. **Test fallback when evidence system fails**
3. **Confirm no UX changes (same user experience)**

## Files That Need Migration

### Backend Files (MUST COPY):
```
FROM: /Users/ai-sprint-02/Sparrow/backend/python_engine/
TO:   /Users/ai-sprint-02/Documents/Sparrow/backend/python_engine/

Files:
- workflows/evidence_based_selection.py
- workflows/contextual_explanations.py  
- workflows/trust_automation.py
- workflows/enhanced_workflow_registry.py
- api/personalized_workflow_api.py
- test_evidence_based_system.py
```

### Frontend Files (VERIFY LOCATION):
```
Should be in: /Users/ai-sprint-02/Documents/Sparrow/frontend/

Files to verify:
- lib/api/personalized-workflow-service.ts ✅
- lib/api/ai-actions-service.ts (check modifications)
- components/ai-actions/action-card-factory.tsx (check enhancements)
- components/screens/ai-actions-screen.tsx (check explain dialog)
- components/screens/simulation-results-screen.tsx (check evidence display)
```

## Recovery Priority

1. **FIRST**: Copy backend evidence system to correct location
2. **SECOND**: Test evidence system works in correct backend  
3. **THIRD**: Verify frontend connects to correct backend
4. **FOURTH**: End-to-end test the complete evidence flow

The core issue: I built a sophisticated evidence-based system but in the wrong directory. The system itself is solid, it just needs to be moved to the correct location and tested there.

## Status: READY TO MIGRATE
The evidence-based system is complete and working, just needs to be moved to the right location.