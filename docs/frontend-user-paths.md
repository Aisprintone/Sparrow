# Sparrow FinanceAI Frontend User Paths - Complete Journey Map

## Overview
This document maps ALL possible user paths through the Sparrow FinanceAI frontend application, documenting every journey from entry to exit with complete technical details.

## 1. Complete User Journey Map

### 1.1 Application Entry Flow
1. **Initial Load** → `/app/page.tsx` renders main container
2. **Login Screen Display** → `login-screen.tsx` (default initial screen)
3. **Authentication Options**:
   - Path A: "Continue with FaceID" → Direct to Dashboard
   - Path B: "Use Passcode" → (UI present but no implementation)
4. **Post-Authentication** → Dashboard Screen becomes active
5. **Bottom Navigation Appears** → 4 main sections available

### 1.2 Main Navigation Paths (via Bottom Nav)
From any screen with bottom nav visible, users can navigate to:
1. **Home** → Dashboard Screen
2. **AI Actions** → AI Actions Screen  
3. **Simulations** → Simulations Screen
4. **Spending** → Spend Tracking Screen

### 1.3 Dashboard-Initiated Journeys
From Dashboard (`dashboard-screen.tsx`), users can:
1. **Profile Access** → Click profile icon → Profile Screen
2. **Net Worth Details** → Click net worth card → Net Worth Detail Screen
3. **Credit Score Details** → Click credit score card → Credit Score Screen
4. **Spending Insights** → Click spending insights card → Spend Tracking Screen
5. **AI Action Expansion** → Click "Why we suggest this" → Inline expansion
6. **AI Action Deep Dive** → Click "Dive Deep" → AI Chat Drawer opens
7. **AI Action Automation** → Click "Automate" → Action activated (toast notification)
8. **AI Action Cancellation** → Click "Cancel" → Action dismissed
9. **Demographic Switch** → Dropdown menu → Switch between Gen Z/Millennial personas

### 1.4 Complete Screen-by-Screen User Paths

#### Login Screen (`login-screen.tsx`)
- **Entry**: App initialization
- **Actions**: 
  - Continue with FaceID → Dashboard
  - Use Passcode → (UI only)
- **Exit**: Authentication success → Dashboard

#### Dashboard Screen (`dashboard-screen.tsx`)
- **Entry**: Post-login, Bottom nav "Home", or back navigation
- **Actions**:
  - View net worth → Net Worth Detail Screen
  - View credit score → Credit Score Screen  
  - View spending → Spend Tracking Screen
  - Expand AI actions → Inline UI expansion
  - Deep dive AI action → AI Chat Drawer
  - Automate AI action → Activation flow
  - Cancel AI action → Dismissal
  - Switch demographic → State update
  - Access profile → Profile Screen
- **Exit**: Bottom nav or specific card clicks

#### AI Actions Screen (`ai-actions-screen.tsx`)
- **Entry**: Bottom nav "AI Actions"
- **Actions**:
  - Toggle between Suggested/Completed tabs
  - Expand action details → Inline expansion
  - Deep dive into action → AI Chat Drawer opens
  - Automate action → Activation flow
  - Cancel action → Dismissal
- **Exit**: Bottom nav or back action

#### Simulations Screen (`simulations-screen.tsx`)
- **Entry**: Bottom nav "Simulations"
- **Actions**:
  - Select recommended simulation → Simulation Setup Screen
  - Select other simulation → Simulation Setup Screen
- **Available Simulations**:
  - Job Loss Scenario
  - Market Crash Impact
  - Salary Increase
  - Home Purchase
- **Exit**: Bottom nav or simulation selection

#### Simulation Setup Screen (`simulation-setup-screen.tsx`)
- **Entry**: Simulation selection from Simulations Screen
- **Actions**:
  - View loading sequence (5 steps)
  - Adjust parameters via sliders
  - View financial runway calculation
  - Accept AI action plan → (Implementation pending)
  - Learn more about plan → (Implementation pending)
  - Back to simulations → Simulations Screen
- **Exit**: Back button or plan acceptance

#### Spend Tracking Screen (`spend-tracking-screen.tsx`)
- **Entry**: Bottom nav "Spending" or Dashboard spending card
- **Actions**:
  - View spending insights (3 types)
  - View recurring expenses breakdown
  - View category spending vs budget
  - View overall progress percentage
  - "View More" button → (Implementation pending)
- **Exit**: Bottom nav

#### Profile Screen (`profile-screen.tsx`)
- **Entry**: Profile icon from Dashboard
- **Actions**:
  - Edit profile photo → (UI only)
  - Personal Information → (Navigation pending)
  - Connected Accounts → Connect Account Screen
  - Toggle Push Notifications
  - Toggle Email Summaries
  - Toggle Low Balance Alerts
  - Security Settings → (Navigation pending)
  - Help Center → (Navigation pending)
  - Terms of Service → (Navigation pending)
  - Sign Out → (Implementation pending)
- **Exit**: Back navigation or specific settings

#### Net Worth Detail Screen (`net-worth-detail-screen.tsx`)
- **Entry**: Net worth card from Dashboard
- **Actions**:
  - View assets breakdown
  - View liabilities breakdown
  - View trend chart
  - Connect more accounts → Connect Account Screen
- **Exit**: Back navigation

#### Credit Score Screen (`credit-score-screen.tsx`)
- **Entry**: Credit score card from Dashboard
- **Actions**:
  - View score visualization
  - View credit factors (5 types)
  - View score history chart
  - Get personalized tips
- **Exit**: Back navigation

#### Connect Account Screen (`connect-account-screen.tsx`)
- **Entry**: Profile → Connected Accounts or Net Worth → Connect button
- **Actions**:
  - Select from popular institutions (6 options)
  - Manual bank search → (UI only)
  - View security badge information
- **Exit**: Back navigation or account connection

## 2. Authentication Flows

### 2.1 Primary Authentication Path
1. App Launch → Login Screen
2. User taps "Continue with FaceID"
3. `setCurrentScreen("dashboard")` called
4. Dashboard Screen renders
5. Bottom navigation appears
6. User data loads based on demographic (Gen Z or Millennial)

### 2.2 Alternative Authentication Path
1. App Launch → Login Screen
2. User taps "Use Passcode"
3. (Currently UI only - no implementation)

### 2.3 Session Management
- No explicit logout implementation beyond UI
- Demographic switching maintains session
- No token management visible in current implementation

## 3. Dashboard Interactions

### 3.1 Net Worth Card Journey
1. User views total net worth display
2. Sees assets vs liabilities breakdown
3. Clicks card → Net Worth Detail Screen
4. Views detailed account list
5. Can initiate account connection flow

### 3.2 Credit Score Card Journey
1. User views current score (color-coded)
2. Sees monthly change indicator
3. Clicks card → Credit Score Screen
4. Views factor breakdown
5. Reviews score history

### 3.3 AI Actions Card Journey
1. User sees suggested actions (up to 3)
2. Views potential monthly savings
3. Can expand for rationale
4. Options:
   - Dive Deep → AI Chat
   - Automate → Activation
   - Cancel → Dismissal

### 3.4 Spending Insights Journey
1. User sees monthly spending total
2. Views top spending alert
3. Clicks card → Spend Tracking Screen
4. Reviews detailed categories

## 4. Transaction Views

### 4.1 Spending Category Analysis
1. Entry via Spend Tracking Screen
2. View per-category:
   - Current spending
   - Budget limit
   - Progress bar (color-coded)
   - Over-budget indicators
3. No individual transaction view available

### 4.2 Recurring Expenses View
1. Displayed on Spend Tracking Screen
2. Shows total monthly recurring
3. Lists top 3 expenses with icons
4. Shows count of additional expenses

## 5. Subscription Management

Currently, no dedicated subscription management flow exists. Subscription information appears only in:
- Recurring expenses summary (Spend Tracking)
- AI action recommendations (cancel unused subscriptions)

## 6. Goal Tracking

### Current Implementation
- Goals data structure exists in `/lib/data.ts`
- Goal-related screens referenced but not implemented:
  - `goals-screen.tsx`
  - `create-goal-screen.tsx`
  - `goal-detail-screen.tsx`
- Goal feedback drawer component exists

### Planned Goal Flows
Based on code structure:
1. Goals Screen (not accessible via current navigation)
2. Create Goal flow
3. Goal Detail view
4. Goal feedback mechanism

## 7. Simulation Runs

### 7.1 Complete Simulation Flow
1. **Selection Phase**:
   - User navigates to Simulations via bottom nav
   - Views recommended + other simulations
   - Selects simulation (e.g., Job Loss)

2. **Setup Phase**:
   - Loading sequence (5 steps, 5 seconds)
   - Parameter adjustment via sliders
   - Real-time runway calculation
   - AI action plan presentation (3 options)

3. **Execution Phase** (Referenced but not implemented):
   - `simulating-screen.tsx` exists
   - `simulation-results-screen.tsx` exists
   - Current flow ends at setup

### 7.2 Available Simulation Types
1. **Job Loss Scenario** (Recommended)
   - Monthly expenses adjustment
   - Emergency fund configuration
   - Job search duration
   - Unemployment benefits

2. **Market Crash Impact**
3. **Salary Increase**
4. **Home Purchase**

## 8. Automation Setups

### 8.1 AI Action Automation Flow
1. User views AI action (Dashboard or AI Actions screen)
2. Clicks "Automate" button
3. `saveAutomation()` called
4. Toast notification appears with:
   - Confirmation message
   - Undo option
5. Automation appears in active automations list

### 8.2 Active Automation Management
- Displayed on Dashboard when active
- Shows automation status card
- Can be removed via undo action
- No detailed configuration available

## 9. Settings and Configuration

### 9.1 Profile Settings Journey
1. Dashboard → Profile icon
2. Profile Screen displays
3. Available settings:
   - **Account Section**:
     - Personal Information (pending)
     - Connected Accounts → Connect flow
   - **Preferences Section**:
     - Push Notifications toggle
     - Email Summaries toggle
     - Low Balance Alerts toggle
   - **Security & Support**:
     - Security Settings (pending)
     - Help Center (pending)
     - Terms of Service (pending)

### 9.2 Demographic Configuration
1. Available from Dashboard header
2. Dropdown with two options:
   - Gen Z
   - Millennial
3. Changes data throughout app:
   - Account balances
   - Credit score
   - Spending patterns
   - AI recommendations

## 10. Hidden/Conditional Paths

### 10.1 Voice Assistant
- `VoiceAssistantButton` component exists
- Rendered conditionally with bottom nav
- No visible interaction implementation

### 10.2 Chat Interfaces
- `ChatScreen` component rendered at root
- `AIChatDrawer` for AI action deep dives
- Both use `isAIChatOpen` state

### 10.3 Conditional UI Elements
- Bottom nav hidden on:
  - Login screen
  - Simulating screen
  - Simulation results screen
  - When simulation selection active

### 10.4 Drawer Components
- `ThoughtDetailDrawer` (simulation results)
- `GoalFeedbackDrawer` (goal interactions)
- `AIChatDrawer` (AI action details)

## 11. State Dependencies

### 11.1 Central State (useAppState)
Key state affecting navigation:
- `currentScreen`: Controls active screen
- `demographic`: Affects all data displays
- `selectedSimulations`: Simulation flow
- `isAIChatOpen`: Chat drawer visibility
- `activeAutomations`: Automation displays

### 11.2 Data Dependencies
From `/lib/data.ts`:
- Bills data (not actively used in current flows)
- Goals data (structure exists, UI pending)
- Credit score factors
- Connected accounts list
- Alert settings (not implemented)

## 12. Navigation Flow Summary

### Entry Points
1. **Application Start** → Login Screen (only entry)

### Primary Navigation Loops
1. **Main App Loop**: Dashboard ↔ AI Actions ↔ Simulations ↔ Spending
2. **Detail Loops**: Dashboard → Detail Screen → Back
3. **Settings Loop**: Dashboard → Profile → Settings → Back

### Exit Points
1. **Sign Out** (UI only, no implementation)
2. **No browser/app-level exit handling**

### Dead Ends
1. **Simulation Setup** → No progression to results
2. **Connect Account** → No completion flow
3. **Most Profile settings** → Pending implementation

## Technical Navigation Details

### Screen Component Mapping
```
"login" → LoginScreen
"dashboard" → DashboardScreen  
"ai-actions" → AIActionsScreen
"simulations" → SimulationsScreen
"simulation-setup" → SimulationSetupScreen
"spend-tracking" → SpendTrackingScreen
"profile" → ProfileScreen
"connect-account" → ConnectAccountScreen
"credit-score" → CreditScoreScreen
"net-worth-detail" → NetWorthDetailScreen
```

### Navigation Methods
1. **Direct**: `setCurrentScreen(screenName)`
2. **Bottom Nav**: Click nav items
3. **Back Buttons**: Various implementations
4. **Card Clicks**: Dashboard cards
5. **State Changes**: Automation triggers

### Animation Transitions
- Screen transitions use Framer Motion
- Spring animations for nav appearance
- Staggered animations for list items
- Loading sequences for simulations