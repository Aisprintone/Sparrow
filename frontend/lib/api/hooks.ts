/**
 * React hooks for API integration with automatic error handling and loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AuthService,
  UserService,
  AccountService,
  TransactionService,
  SpendingService,
  GoalService,
  realtimeService,
} from './services';
import {
  UserProfile,
  AccountSummary,
  Account,
  Transaction,
  TransactionFilter,
  SpendingAnalysis,
  SpendingPeriod,
  Goal,
  GoalInput,
  PaginatedResponse,
  ErrorCode,
  isApiError,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  retryOnError?: boolean;
  pollingInterval?: number;
}

// ============================================================================
// Base Hook
// ============================================================================

function useApi<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    onSuccess,
    onError,
    showErrorToast = true,
    retryOnError = false,
    pollingInterval,
  } = options;

  const fetchData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }

      // Set up polling if specified
      if (pollingInterval && pollingInterval > 0) {
        pollingTimeoutRef.current = setTimeout(() => {
          fetchData();
        }, pollingInterval);
      }
    } catch (err: any) {
      // Ignore aborted requests
      if (err.name === 'AbortError') {
        return;
      }

      setError(err);

      if (onError) {
        onError(err);
      }

      // Removed error toast

      // Retry on specific errors
      if (retryOnError && isApiError(err)) {
        if (err.error === ErrorCode.SERVICE_UNAVAILABLE || 
            err.error === ErrorCode.TIMEOUT) {
          setTimeout(() => fetchData(), 3000);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher, onSuccess, onError, showErrorToast, retryOnError, pollingInterval, toast]);

  useEffect(() => {
    fetchData();

    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, deps);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// Authentication Hooks
// ============================================================================

export function useAuth() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      try {
        const profile = await UserService.getProfile();
        setUser(profile);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (profileId: 'millennial' | 'professional' | 'genz') => {
    try {
      const response = await AuthService.login({ profileId });
      setUser(response.user as UserProfile);
      setIsAuthenticated(true);
      
      // Connect to WebSocket
      if (response.tokens.accessToken) {
        realtimeService.connect(response.tokens.accessToken);
      }
      
      // Removed login successful toast
      
      return response;
    } catch (error: any) {
      // Removed login failed toast
      throw error;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      // Disconnect WebSocket
      realtimeService.disconnect();
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
    } catch (error) {
      // Still clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      realtimeService.disconnect();
    }
  }, [toast]);

  const switchProfile = useCallback(async (profileId: 'millennial' | 'professional' | 'genz') => {
    try {
      const response = await UserService.switchProfile(profileId);
      setUser(response.user as UserProfile);
      
      // Removed profile switch toast
      
      return response;
    } catch (error: any) {
      toast({
        title: 'Profile switch failed',
        description: isApiError(error) ? error.message : 'Please try again',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    switchProfile,
  };
}

// ============================================================================
// User Profile Hook
// ============================================================================

export function useUserProfile(options?: UseApiOptions) {
  return useApi(
    () => UserService.getProfile(),
    [],
    options
  );
}

// ============================================================================
// Account Hooks
// ============================================================================

export function useAccountSummary(options?: UseApiOptions) {
  return useApi(
    () => AccountService.getSummary(),
    [],
    options
  );
}

export function useAccounts(options?: UseApiOptions) {
  return useApi(
    () => AccountService.getAccounts(),
    [],
    options
  );
}

export function useAccount(accountId: string, options?: UseApiOptions) {
  return useApi(
    () => AccountService.getAccount(accountId),
    [accountId],
    options
  );
}

// ============================================================================
// Transaction Hooks
// ============================================================================

export function useTransactions(filter?: TransactionFilter, options?: UseApiOptions) {
  return useApi(
    () => TransactionService.getTransactions(filter),
    [JSON.stringify(filter)],
    options
  );
}

export function useTransaction(transactionId: string, options?: UseApiOptions) {
  return useApi(
    () => TransactionService.getTransaction(transactionId),
    [transactionId],
    options
  );
}

// ============================================================================
// Spending Hooks
// ============================================================================

export function useSpendingAnalysis(
  period: SpendingPeriod = 'monthly',
  options?: UseApiOptions
) {
  return useApi(
    () => SpendingService.getAnalysis(period),
    [period],
    options
  );
}

export function useSpendingInsights(options?: UseApiOptions) {
  return useApi(
    () => SpendingService.getInsights(),
    [],
    options
  );
}

// ============================================================================
// Goal Hooks
// ============================================================================

export function useGoals(options?: UseApiOptions) {
  return useApi(
    () => GoalService.getGoals(),
    [],
    options
  );
}

export function useGoal(goalId: string, options?: UseApiOptions) {
  return useApi(
    () => GoalService.getGoal(goalId),
    [goalId],
    options
  );
}

export function useCreateGoal() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createGoal = useCallback(async (goal: GoalInput) => {
    setLoading(true);
    setError(null);

    try {
      const newGoal = await GoalService.createGoal(goal);
      
      toast({
        title: 'Goal created',
        description: `"${newGoal.title}" has been added to your goals`,
      });
      
      return newGoal;
    } catch (err: any) {
      setError(err);
      
      toast({
        title: 'Failed to create goal',
        description: isApiError(err) ? err.message : 'Please try again',
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { createGoal, loading, error };
}

// ============================================================================
// Real-time Hooks
// ============================================================================

export function useRealtimeUpdates() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    // Listen for connection events
    realtimeService.on('connect', handleConnect);
    realtimeService.on('disconnect', handleDisconnect);

    return () => {
      realtimeService.off('connect', handleConnect);
      realtimeService.off('disconnect', handleDisconnect);
    };
  }, []);

  const subscribe = useCallback((event: string, callback: Function) => {
    realtimeService.on(event, callback);
    
    return () => {
      realtimeService.off(event, callback);
    };
  }, []);

  const send = useCallback((type: string, payload: any) => {
    realtimeService.send(type, payload);
  }, []);

  return { connected, subscribe, send };
}

export function useBalanceUpdates(callback: (update: any) => void) {
  const { subscribe } = useRealtimeUpdates();

  useEffect(() => {
    return subscribe('account.balance.updated', callback);
  }, [subscribe, callback]);
}

export function useTransactionUpdates(callback: (transaction: Transaction) => void) {
  const { subscribe } = useRealtimeUpdates();

  useEffect(() => {
    const unsubscribeNew = subscribe('transaction.new', callback);
    const unsubscribeUpdate = subscribe('transaction.updated', callback);

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
    };
  }, [subscribe, callback]);
}

// ============================================================================
// Optimistic Updates Hook
// ============================================================================

export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<T>(initialData);

  const update = useCallback(async (optimisticData: T) => {
    // Store previous data for rollback
    previousDataRef.current = data;
    
    // Apply optimistic update
    setData(optimisticData);
    setLoading(true);
    setError(null);

    try {
      // Perform actual update
      const result = await updateFn(optimisticData);
      setData(result);
      return result;
    } catch (err: any) {
      // Rollback on error
      setData(previousDataRef.current);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data, updateFn]);

  return { data, loading, error, update };
}