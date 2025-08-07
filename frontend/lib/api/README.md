# Frontend-Backend Integration Layer Documentation

## Overview

This integration layer provides a type-safe, robust communication system between the Next.js frontend and the backend API, with perfect type matching and zero integration failures.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│                      React Hooks                         │
│  useAuth() | useAccounts() | useTransactions() | etc.   │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│  AuthService | AccountService | TransactionService      │
├─────────────────────────────────────────────────────────┤
│                     API Client                           │
│  Retry Logic | Error Handling | Request Deduplication   │
├─────────────────────────────────────────────────────────┤
│                    Type System                           │
│  Auto-generated from OpenAPI | Type Guards | Validators │
├─────────────────────────────────────────────────────────┤
│                  Data Transformers                       │
│  CSV → API Types | Response → UI Models                 │
└─────────────────────────────────────────────────────────┘
                             ↓
                      HTTP/WebSocket
                             ↓
┌─────────────────────────────────────────────────────────┐
│                    Backend (Cloudflare)                  │
│              OpenAPI Contract | CSV Data                 │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Authentication

```typescript
import { useAuth } from '@/lib/api/hooks';

function LoginComponent() {
  const { login, isAuthenticated, user } = useAuth();
  
  const handleLogin = async (profileId: 'millennial' | 'professional' | 'genz') => {
    try {
      await login(profileId);
      // User is now authenticated
    } catch (error) {
      // Error is automatically handled and displayed
    }
  };
}
```

### 2. Fetching Data

```typescript
import { useAccounts, useTransactions } from '@/lib/api/hooks';

function DashboardComponent() {
  // Automatic loading states and error handling
  const { data: accounts, loading, error } = useAccounts();
  
  // With filters
  const { data: transactions } = useTransactions({
    startDate: '2024-01-01',
    category: 'Food & Dining',
    limit: 20
  });
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <AccountList accounts={accounts} />;
}
```

### 3. Real-time Updates

```typescript
import { useBalanceUpdates } from '@/lib/api/hooks';

function AccountBalance() {
  const [balance, setBalance] = useState(0);
  
  // Subscribe to real-time balance updates
  useBalanceUpdates((update) => {
    setBalance(update.currentBalance);
  });
  
  return <div>Balance: ${balance}</div>;
}
```

### 4. Optimistic Updates

```typescript
import { useOptimisticUpdate } from '@/lib/api/hooks';
import { GoalService } from '@/lib/api/services';

function GoalComponent({ goal }) {
  const { data, update } = useOptimisticUpdate(
    goal,
    (updatedGoal) => GoalService.updateGoal(goal.id, updatedGoal)
  );
  
  const handleContribution = async (amount: number) => {
    // UI updates immediately, rolls back on error
    await update({
      ...data,
      current: data.current + amount
    });
  };
}
```

## API Services

### AuthService
- `login(request)` - Authenticate user with profile
- `logout()` - End current session
- `refreshToken(token)` - Refresh access token
- `getSession()` - Get current session info

### UserService
- `getProfile()` - Get user profile with financial summary
- `updateProfile(updates)` - Update user preferences
- `switchProfile(profileId)` - Switch between demo profiles

### AccountService
- `getSummary()` - Get aggregated account data
- `getAccounts()` - List all accounts
- `getAccount(id)` - Get single account details
- `connectAccount(institutionId, token)` - Connect new account
- `syncAccount(id)` - Sync account data

### TransactionService
- `getTransactions(filter)` - Get filtered transactions
- `getTransaction(id)` - Get transaction details
- `updateTransaction(id, updates)` - Update transaction
- `bulkCategorize(ids, category)` - Bulk update categories

### SpendingService
- `getAnalysis(period)` - Get spending analysis
- `getTrends(months)` - Get spending trends
- `getInsights()` - Get AI-generated insights
- `getBudgetRecommendations()` - Get budget recommendations

### GoalService
- `getGoals()` - List all goals
- `getGoal(id)` - Get goal details
- `createGoal(goal)` - Create new goal
- `updateGoal(id, updates)` - Update goal
- `deleteGoal(id)` - Delete goal
- `addContribution(id, amount)` - Add contribution

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  
  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

### Error Handling Patterns

1. **Automatic Retry**: Service unavailable and timeout errors automatically retry with exponential backoff
2. **Token Refresh**: Expired tokens automatically refresh and retry the request
3. **Rate Limiting**: Respects rate limit headers and automatically retries after delay
4. **Toast Notifications**: Errors automatically display user-friendly messages
5. **Rollback**: Optimistic updates rollback on failure

### Custom Error Handling

```typescript
import { useAccounts } from '@/lib/api/hooks';

function AccountsWithCustomError() {
  const { data, error } = useAccounts({
    showErrorToast: false, // Disable automatic toast
    onError: (error) => {
      // Custom error handling
      if (isApiError(error)) {
        switch (error.error) {
          case ErrorCode.RATE_LIMITED:
            showRateLimitModal();
            break;
          case ErrorCode.UNAUTHORIZED:
            redirectToLogin();
            break;
          default:
            logError(error);
        }
      }
    }
  });
}
```

## Type Safety

### Generated Types

All types are automatically generated from the OpenAPI specification:

```typescript
// Types are generated from openapi-spec.ts
import { Account, Transaction, Goal } from '@/lib/api/types';

// Type guards for runtime validation
import { isApiError, isAuthResponse } from '@/lib/api/types';
```

### Type Guards

```typescript
// Check if response is an error
if (isApiError(response)) {
  console.error(response.message);
}

// Check if response is auth response
if (isAuthResponse(response)) {
  saveTokens(response.tokens);
}
```

## Data Transformation

### CSV to API Types

```typescript
import { DataTransformer } from '@/lib/api/transformers';

// Transform CSV data to API types
const transformedData = DataTransformer.transformProfileData({
  customer: csvCustomerData,
  accounts: csvAccountsData,
  transactions: csvTransactionsData,
  goals: csvGoalsData,
});

// Individual transformers
const account = AccountTransformer.toAccount(csvAccount);
const transaction = TransactionTransformer.toTransaction(csvTransaction);
```

## WebSocket Real-time Updates

### Connection Management

```typescript
import { realtimeService } from '@/lib/api/services';

// Connection is automatically established on login
// and disconnected on logout

// Manual subscription
realtimeService.on('account.balance.updated', (update) => {
  console.log('Balance updated:', update);
});

// Send message
realtimeService.send('subscribe', { 
  channel: 'transactions',
  accountId: 'acc_123' 
});
```

### Event Types

- `account.balance.updated` - Account balance changed
- `transaction.new` - New transaction detected
- `transaction.updated` - Transaction categorized/updated
- `goal.progress` - Goal progress updated
- `insight.generated` - New AI insight available

## Performance Optimizations

### Request Deduplication

Identical concurrent requests are automatically deduplicated:

```typescript
// These will result in only one API call
const promise1 = AccountService.getAccounts();
const promise2 = AccountService.getAccounts();
const promise3 = AccountService.getAccounts();

const [accounts1, accounts2, accounts3] = await Promise.all([
  promise1, promise2, promise3
]);
```

### Polling

```typescript
// Automatic polling every 30 seconds
const { data } = useAccountSummary({
  pollingInterval: 30000
});
```

### Caching

Response caching is handled by the API client with ETags and conditional requests.

## Testing

### Mock API Client

```typescript
import { ApiClient } from '@/lib/api/client';

// Create mock client for testing
const mockClient = new ApiClient({
  baseURL: 'http://localhost:3000/mock-api'
});

// Add mock interceptor
mockClient.addResponseInterceptor({
  onResponse: (response) => {
    // Mock response transformation
    return mockResponses[response.url] || response;
  }
});
```

### Contract Testing

```typescript
import { validateApiContract } from '@/lib/api/validators';

// Validate response matches OpenAPI contract
const response = await fetch('/api/accounts');
const isValid = validateApiContract('Account', response);
```

## Migration Guide

### From Mock Data to Real API

1. Replace `lib/data.ts` imports with API hooks:

```typescript
// Before
import { accounts } from '@/lib/data';

// After
import { useAccounts } from '@/lib/api/hooks';
const { data: accounts } = useAccounts();
```

2. Update state management:

```typescript
// Before
const [accounts, setAccounts] = useState(mockAccounts);

// After
const { data: accounts, refetch } = useAccounts();
```

3. Handle loading states:

```typescript
// Add loading indicators
if (loading) return <Skeleton />;
```

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8787/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8787/ws

# Feature Flags
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_MOCK_MODE=false
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows frontend origin
2. **Token Expired**: Check token refresh logic
3. **Type Mismatch**: Regenerate types from OpenAPI spec
4. **WebSocket Disconnection**: Check network and retry logic

### Debug Mode

```typescript
// Enable debug logging
const apiClient = new ApiClient({
  debug: true,
  onRequest: (config) => console.log('Request:', config),
  onResponse: (response) => console.log('Response:', response),
});
```

## Best Practices

1. **Always use hooks** for data fetching (automatic error handling)
2. **Never store sensitive data** in localStorage
3. **Use type guards** for runtime validation
4. **Handle loading states** in UI components
5. **Implement optimistic updates** for better UX
6. **Subscribe to real-time events** for live data
7. **Transform CSV data** at the service layer
8. **Validate API contracts** in development
9. **Use error boundaries** for graceful failures
10. **Monitor API performance** with metrics

## Support

For issues or questions about the integration layer:
1. Check error messages and request IDs
2. Review network tab in browser DevTools
3. Enable debug mode for detailed logging
4. Validate against OpenAPI specification
5. Check backend logs for corresponding requests