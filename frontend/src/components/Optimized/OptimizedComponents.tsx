/**
 * Performance-optimized component implementations
 */

import React from 'react';
import { withMemo, formFieldComparison, usePerformanceMonitor } from '../utils/performance';
import { Button as BaseButton, Input as BaseInput, Card as BaseCard } from './UI/UIComponents';
import { ButtonProps, InputProps, CardProps } from '../types';

// Optimized Button with memo
export const Button = withMemo<ButtonProps>(
  (props) => {
    usePerformanceMonitor('Button', process.env.NODE_ENV === 'development');
    return <BaseButton {...props} />;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.variant === nextProps.variant &&
      prevProps.children === nextProps.children &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

// Optimized Input with memo and form-specific comparison
export const Input = withMemo<InputProps>(
  (props) => {
    usePerformanceMonitor('Input', process.env.NODE_ENV === 'development');
    return <BaseInput {...props} />;
  },
  formFieldComparison
);

// Optimized Card with memo
export const Card = withMemo<CardProps>(
  (props) => {
    usePerformanceMonitor('Card', process.env.NODE_ENV === 'development');
    return <BaseCard {...props} />;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.children === nextProps.children &&
      prevProps.className === nextProps.className
    );
  }
);

// Expensive computation hook with memoization
export function useExpensiveComputation<T, R>(
  data: T,
  computeFn: (data: T) => R,
  deps: React.DependencyList = []
): R {
  return React.useMemo(() => {
    console.log('Computing expensive operation...');
    return computeFn(data);
  }, [data, ...deps]);
}

// Optimized list renderer with virtualization
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  itemHeight = 50,
  containerHeight = 400,
  className = '',
}: OptimizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = React.useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length,
      startIndex + Math.ceil(containerHeight / itemHeight) + 1
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={`optimized-list ${className}`.trim()}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item, visibleRange.startIndex + index)}>
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoized list item component
export const OptimizedListItem = withMemo<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}>(
  ({ children, onClick, className = '' }) => (
    <div className={`list-item ${className}`.trim()} onClick={onClick}>
      {children}
    </div>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.children === nextProps.children &&
      prevProps.onClick === nextProps.onClick &&
      prevProps.className === nextProps.className
    );
  }
);

// Optimized form field wrapper
interface OptimizedFieldProps {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  children: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const OptimizedField = withMemo<OptimizedFieldProps>(
  ({ children, onFocus, onBlur, ...props }) => {
    const handleFocus = React.useCallback(() => {
      onFocus?.();
    }, [onFocus]);

    const handleBlur = React.useCallback(() => {
      onBlur?.();
    }, [onBlur]);

    return (
      <div 
        className="optimized-field"
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>
    );
  },
  formFieldComparison
);

// Heavy computation component with worker
export interface HeavyComputationProps {
  data: number[];
  onResult: (result: number) => void;
  className?: string;
}

export const HeavyComputation = withMemo<HeavyComputationProps>(
  ({ data, onResult, className = '' }) => {
    const [isComputing, setIsComputing] = React.useState(false);
    const workerRef = React.useRef<Worker>();

    React.useEffect(() => {
      // Create worker for heavy computation
      if (!workerRef.current && typeof Worker !== 'undefined') {
        const workerCode = `
          self.onmessage = function(e) {
            const data = e.data;
            // Simulate heavy computation
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              sum += data[i] * data[i];
            }
            self.postMessage(sum);
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerRef.current = new Worker(URL.createObjectURL(blob));
      }

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
        }
      };
    }, []);

    React.useEffect(() => {
      if (!workerRef.current || !data.length) return;

      setIsComputing(true);
      
      workerRef.current.onmessage = (e) => {
        setIsComputing(false);
        onResult(e.data);
      };

      workerRef.current.postMessage(data);
    }, [data, onResult]);

    if (isComputing) {
      return <div className={className}>Computing...</div>;
    }

    return null;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.onResult === nextProps.onResult
    );
  }
);

// Batch state updates hook
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = React.useState(initialState);
  const batchedUpdates = React.useRef<Partial<T>[]>([]);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const batchedSetState = React.useCallback((updates: Partial<T>) => {
    batchedUpdates.current.push(updates);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        let newState = { ...prevState };
        batchedUpdates.current.forEach(update => {
          newState = { ...newState, ...update };
        });
        batchedUpdates.current = [];
        return newState;
      });
    }, 0);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState] as const;
}

// Preload component on hover
export function usePreloadOnHover<T>(
  importFn: () => Promise<T>,
  delay = 200
) {
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const preloadedRef = React.useRef(false);

  const handleMouseEnter = React.useCallback(() => {
    if (preloadedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      importFn().then(() => {
        preloadedRef.current = true;
      }).catch(console.error);
    }, delay);
  }, [importFn, delay]);

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { handleMouseEnter, handleMouseLeave };
}