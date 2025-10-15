/**
 * Web Vitals monitoring and performance tracking
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

// Performance thresholds based on Google's recommendations
const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, needs_improvement: 0.25 }, // Cumulative Layout Shift
  FID: { good: 100, needs_improvement: 300 },  // First Input Delay (ms)
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint (ms)
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint (ms)
  TTFB: { good: 800, needs_improvement: 1800 }, // Time to First Byte (ms)
};

// Performance rating helper
function getPerformanceRating(metricName: keyof typeof PERFORMANCE_THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metricName];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needs_improvement) return 'needs-improvement';
  return 'poor';
}

// Analytics reporting (replace with your analytics service)
function sendToAnalytics(metric: Metric) {
  const rating = getPerformanceRating(metric.name as keyof typeof PERFORMANCE_THRESHOLDS, metric.value);
  
  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`%c${metric.name}: ${metric.value.toFixed(2)}ms (${rating})`, 
      `color: ${rating === 'good' ? 'green' : rating === 'needs-improvement' ? 'orange' : 'red'}`
    );
  }

  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: rating,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating,
        id: metric.id,
        delta: metric.delta,
        navigationType: metric.navigationType,
      }),
    }).catch(console.error);
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  // Core Web Vitals
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);

  // Additional performance observers
  if ('PerformanceObserver' in window) {
    // Long tasks observer (tasks > 50ms)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
          
          // Send long task data
          sendToAnalytics({
            name: 'LongTask',
            value: entry.duration,
            id: `long-task-${Date.now()}`,
            delta: entry.duration,
            navigationType: 'navigate',
          } as Metric);
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Long task observer not supported');
    }

    // Layout shift observer
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput && entry.value > 0.001) {
            console.log(`Layout shift: ${entry.value.toFixed(4)}`, entry);
          }
        }
      });
      
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Layout shift observer not supported');
    }
  }
}

// Performance mark helpers
export class PerformanceTracker {
  private static marks = new Map<string, number>();

  static mark(name: string) {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    performance.mark(name);
    return timestamp;
  }

  static measure(name: string, startMark?: string, endMark?: string) {
    try {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else if (startMark) {
        performance.measure(name, startMark);
      } else {
        performance.measure(name);
      }
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure?.duration || 0;
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error);
      return 0;
    }
  }

  static getDuration(startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) return 0;
    return performance.now() - startTime;
  }

  static clear() {
    performance.clearMarks();
    performance.clearMeasures();
    this.marks.clear();
  }
}

// React component performance wrapper
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    React.useEffect(() => {
      PerformanceTracker.mark(`${componentName}-mount-start`);
      
      return () => {
        const duration = PerformanceTracker.getDuration(`${componentName}-mount-start`);
        console.log(`${componentName} mount duration: ${duration.toFixed(2)}ms`);
      };
    }, []);

    PerformanceTracker.mark(`${componentName}-render-start`);
    
    React.useLayoutEffect(() => {
      const duration = PerformanceTracker.getDuration(`${componentName}-render-start`);
      if (duration > 16.67) { // > 60fps threshold
        console.warn(`${componentName} slow render: ${duration.toFixed(2)}ms`);
      }
    });

    return <Component {...props} />;
  });
}

// Network performance tracking
export function trackNetworkPerformance() {
  if ('PerformanceObserver' in window) {
    const networkObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        const duration = entry.responseEnd - entry.requestStart;
        
        if (duration > 1000) { // Slow request > 1s
          console.warn(`Slow network request: ${entry.name} (${duration.toFixed(2)}ms)`);
        }

        // Track specific endpoints
        if (entry.name.includes('/api/')) {
          sendToAnalytics({
            name: 'API_Response_Time',
            value: duration,
            id: `api-${Date.now()}`,
            delta: duration,
            navigationType: 'navigate',
          } as Metric);
        }
      }
    });

    networkObserver.observe({ entryTypes: ['resource'] });
  }
}

// Memory usage tracking
export function trackMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    // Log memory usage periodically
    console.log('Memory usage:', {
      used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });

    return memoryInfo;
  }
  
  return null;
}

// Initialize all performance tracking
export function initAllPerformanceTracking() {
  initPerformanceMonitoring();
  trackNetworkPerformance();
  
  // Track memory usage every 30 seconds
  if (process.env.NODE_ENV === 'development') {
    setInterval(trackMemoryUsage, 30000);
  }
}

// Export for use in app initialization
export { sendToAnalytics, getPerformanceRating };