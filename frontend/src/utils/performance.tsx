/**
 * Performance-optimized component wrappers and utilities
 */

import React, { Suspense, lazy } from 'react';
import { Spinner } from '../components/UI/UIComponents';

// Higher-order component for memo with custom comparison
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, areEqual);
}

// Optimized form field comparison
export const formFieldComparison = <P extends { value?: any; error?: string; touched?: boolean }>(
  prevProps: P,
  nextProps: P
) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.touched === nextProps.touched
  );
};

// Lazy loading wrapper with error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class LazyErrorBoundary extends React.Component<
  LazyWrapperProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: LazyWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorFallback = this.props.errorFallback;
      if (ErrorFallback) {
        return <ErrorFallback error={this.state.error} retry={this.retry} />;
      }
      return (
        <div className="lazy-error">
          <p>Failed to load component. <button onClick={this.retry}>Retry</button></p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback: Fallback = () => <Spinner />,
  errorFallback,
}) => (
  <LazyErrorBoundary errorFallback={errorFallback}>
    <Suspense fallback={<Fallback />}>
      {children}
    </Suspense>
  </LazyErrorBoundary>
);

// Lazy component factory
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFn);
  
  return (props: P) => (
    <LazyWrapper fallback={fallback}>
      <LazyComponent {...props} />
    </LazyWrapper>
  );
}

// Preloader for lazy components
export const preloadComponent = (importFn: () => Promise<any>) => {
  // Start loading the component but don't wait for it
  importFn().catch(error => {
    console.error('Preload error:', error);
  });
};

// Performance observer for measuring component render times
export class PerformanceMonitor {
  private static observers = new Map<string, PerformanceObserver>();

  static startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  static endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  static observeComponent(componentName: string) {
    if (this.observers.has(componentName)) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes(componentName)) {
          console.log(`${componentName} render time:`, entry.duration.toFixed(2), 'ms');
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    this.observers.set(componentName, observer);
  }

  static stopObserving(componentName: string) {
    const observer = this.observers.get(componentName);
    if (observer) {
      observer.disconnect();
      this.observers.delete(componentName);
    }
  }

  static clearMeasures() {
    performance.clearMeasures();
    performance.clearMarks();
  }
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string, enabled = false) {
  React.useEffect(() => {
    if (!enabled) return;

    PerformanceMonitor.observeComponent(componentName);
    PerformanceMonitor.startMeasure(componentName);

    return () => {
      PerformanceMonitor.endMeasure(componentName);
      PerformanceMonitor.stopObserving(componentName);
    };
  }, [componentName, enabled]);
}

// Debounced value hook for performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttleRef = React.useRef<NodeJS.Timeout>();
  const callbackRef = React.useRef(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  });

  return React.useMemo(() => {
    const throttledCallback = (...args: Parameters<T>) => {
      if (throttleRef.current) {
        return;
      }

      callbackRef.current(...args);
      throttleRef.current = setTimeout(() => {
        throttleRef.current = undefined;
      }, delay);
    };

    return throttledCallback as T;
  }, [delay]);
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling(
  items: any[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleItems = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    setScrollTop,
  };
}

// Image lazy loading component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = '',
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const { hasIntersected } = useIntersectionObserver(imgRef);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={`lazy-image ${className}`.trim()}>
      {hasIntersected && !hasError && (
        <img
          {...props}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            ...props.style,
          }}
        />
      )}
      {(!hasIntersected || (!isLoaded && !hasError)) && placeholder && (
        <div className="lazy-image-placeholder">
          <img src={placeholder} alt="" />
        </div>
      )}
      {hasError && (
        <div className="lazy-image-error">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};