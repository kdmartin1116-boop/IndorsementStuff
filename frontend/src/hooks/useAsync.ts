/**
 * Generic async state management hook
 */

import { useState, useCallback, useRef } from 'react';
import { UseAsyncState } from '../types';
import { AppError, AppErrorHandler } from '../utils/errorHandler';

export function useAsync<T = any, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>
): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track the latest promise to handle race conditions
  const cancelRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      // Cancel previous request if still pending
      if (cancelRef.current) {
        cancelRef.current.abort();
      }

      // Create new cancel controller for this request
      const controller = new AbortController();
      cancelRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const result = await asyncFunction(...args);

        // Only update state if this request wasn't cancelled
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err: any) {
        // Only update error state if this request wasn't cancelled
        if (!controller.signal.aborted) {
          if (err instanceof Error) {
            setError(err.message);
          } else if (typeof err === 'string') {
            setError(err);
          } else if (err && typeof err === 'object' && 'message' in err) {
            setError(err.message);
          } else {
            setError('An unknown error occurred');
          }
          setData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
        // Clear the cancel ref if this was the latest request
        if (cancelRef.current === controller) {
          cancelRef.current = null;
        }
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    // Cancel any pending request
    if (cancelRef.current) {
      cancelRef.current.abort();
      cancelRef.current = null;
    }
    
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

// Specialized hook for API calls
export function useApiCall<T = any, Args extends any[] = any[]>(
  apiFunction: (...args: Args) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  
  const cancelRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (...args: Args) => {
      if (cancelRef.current) {
        cancelRef.current.abort();
      }

      const controller = new AbortController();
      cancelRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          // Convert error to AppError if it isn't already
          let appError: AppError;
          if (err.code && err.message) {
            appError = err;
          } else {
            appError = AppErrorHandler.handleNetworkError(err);
          }
          
          setError(appError);
          AppErrorHandler.logError(appError);
          setData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
        if (cancelRef.current === controller) {
          cancelRef.current = null;
        }
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.abort();
      cancelRef.current = null;
    }
    
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { data, loading, error, execute, reset, clearError };
}

// Hook for debounced async calls
export function useDebouncedAsync<T = any, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  delay: number = 300
) {
  const asyncState = useAsync(asyncFunction);
  const timeoutRef = useRef<number | null>(null);

  const debouncedExecute = useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        asyncState.execute(...args);
      }, delay);
    },
    [asyncState.execute, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    ...asyncState,
    execute: debouncedExecute,
    cancel,
  };
}