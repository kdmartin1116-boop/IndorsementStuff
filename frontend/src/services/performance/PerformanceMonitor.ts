// ===========================================
// PERFORMANCE MONITORING ENGINE
// Real-time Performance Analytics & Optimization
// ===========================================

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  category: 'timing' | 'memory' | 'network' | 'user' | 'bundle';
}

interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType: string;
  metrics: {
    core: {
      // Core Web Vitals
      LCP: number; // Largest Contentful Paint
      FID: number; // First Input Delay
      CLS: number; // Cumulative Layout Shift
      TTFB: number; // Time to First Byte
    };
    timing: {
      domContentLoaded: number;
      loadComplete: number;
      firstPaint: number;
      firstContentfulPaint: number;
    };
    memory: {
      usedHeapSize: number;
      totalHeapSize: number;
      heapSizeLimit: number;
    };
    bundle: {
      totalSize: number;
      loadedChunks: string[];
      asyncChunks: string[];
    };
    network: {
      resourceCount: number;
      transferSize: number;
      cacheHitRatio: number;
    };
  };
  issues: PerformanceIssue[];
  score: number; // 0-100 performance score
}

interface PerformanceIssue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  impact: number;
  suggestion: string;
  resource?: string;
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: 'bundle' | 'network' | 'rendering' | 'memory';
  implementation: string;
  estimatedImprovement: string;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private isMonitoring: boolean = false;
  private reportingEndpoint: string = '';
  private thresholds: Map<string, { warning: number; critical: number }> = new Map();

  constructor(config?: {
    reportingEndpoint?: string;
    enableAutoReporting?: boolean;
    customThresholds?: Record<string, { warning: number; critical: number }>;
  }) {
    this.reportingEndpoint = config?.reportingEndpoint || '/api/performance';
    
    // Set default thresholds
    this.setDefaultThresholds();
    
    // Apply custom thresholds
    if (config?.customThresholds) {
      Object.entries(config.customThresholds).forEach(([key, threshold]) => {
        this.thresholds.set(key, threshold);
      });
    }

    // Auto-start monitoring if in browser
    if (typeof window !== 'undefined') {
      this.startMonitoring();
      
      if (config?.enableAutoReporting !== false) {
        this.setupAutoReporting();
      }
    }
  }

  // ===========================================
  // CORE WEB VITALS MONITORING
  // ===========================================

  private setDefaultThresholds(): void {
    this.thresholds.set('LCP', { warning: 2500, critical: 4000 });
    this.thresholds.set('FID', { warning: 100, critical: 300 });
    this.thresholds.set('CLS', { warning: 0.1, critical: 0.25 });
    this.thresholds.set('TTFB', { warning: 800, critical: 1800 });
    this.thresholds.set('domContentLoaded', { warning: 1500, critical: 3000 });
    this.thresholds.set('loadComplete', { warning: 3000, critical: 5000 });
    this.thresholds.set('memoryUsage', { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 });
  }

  async measureCoreWebVitals(): Promise<{
    LCP: number;
    FID: number;
    CLS: number;
    TTFB: number;
  }> {
    return new Promise((resolve) => {
      const vitals = { LCP: 0, FID: 0, CLS: 0, TTFB: 0 };
      let resolveCount = 0;
      const totalVitals = 4;

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = lastEntry.startTime;
        this.recordMetric('LCP', vitals.LCP, 'ms', 'timing');
        resolveCount++;
        if (resolveCount === totalVitals) resolve(vitals);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          vitals.FID = entry.processingStart - entry.startTime;
          this.recordMetric('FID', vitals.FID, 'ms', 'timing');
          resolveCount++;
          if (resolveCount === totalVitals) resolve(vitals);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        vitals.CLS = clsValue;
        this.recordMetric('CLS', vitals.CLS, 'score', 'timing');
        resolveCount++;
        if (resolveCount === totalVitals) resolve(vitals);
      }).observe({ entryTypes: ['layout-shift'] });

      // Time to First Byte
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navTiming) {
        vitals.TTFB = navTiming.responseStart - navTiming.requestStart;
        this.recordMetric('TTFB', vitals.TTFB, 'ms', 'timing');
        resolveCount++;
        if (resolveCount === totalVitals) resolve(vitals);
      }

      // Fallback timeout
      setTimeout(() => {
        if (resolveCount < totalVitals) {
          resolve(vitals);
        }
      }, 5000);
    });
  }

  // ===========================================
  // PERFORMANCE MONITORING
  // ===========================================

  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;

    this.isMonitoring = true;

    // Monitor navigation timing
    this.monitorNavigationTiming();

    // Monitor resource loading
    this.monitorResourceTiming();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor bundle size
    this.monitorBundleMetrics();

    // Monitor user interactions
    this.monitorUserMetrics();

    console.log('🚀 Performance monitoring started');
  }

  stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  private monitorNavigationTiming(): void {
    window.addEventListener('load', () => {
      const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navTiming) {
        this.recordMetric('domContentLoaded', navTiming.domContentLoadedEventEnd - navTiming.navigationStart, 'ms', 'timing');
        this.recordMetric('loadComplete', navTiming.loadEventEnd - navTiming.navigationStart, 'ms', 'timing');
        this.recordMetric('firstPaint', navTiming.responseStart - navTiming.navigationStart, 'ms', 'timing');
      }
    });
  }

  private monitorResourceTiming(): void {
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track large resources
          if (resourceEntry.transferSize > 100 * 1024) { // > 100KB
            this.recordMetric(
              `largeResource_${resourceEntry.name.split('/').pop()}`,
              resourceEntry.transferSize,
              'bytes',
              'network'
            );
          }

          // Track slow resources
          if (resourceEntry.duration > 1000) { // > 1s
            this.recordMetric(
              `slowResource_${resourceEntry.name.split('/').pop()}`,
              resourceEntry.duration,
              'ms',
              'network'
            );
          }
        }
      });
    });

    this.observer.observe({ entryTypes: ['resource'] });
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memoryUsed', memory.usedJSHeapSize, 'bytes', 'memory');
        this.recordMetric('memoryTotal', memory.totalJSHeapSize, 'bytes', 'memory');
        this.recordMetric('memoryLimit', memory.jsHeapSizeLimit, 'bytes', 'memory');
      }, 30000); // Every 30 seconds
    }
  }

  private monitorBundleMetrics(): void {
    // Monitor loaded chunks
    if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
      const webpackRequire = (window as any).__webpack_require__;
      
      setInterval(() => {
        const cache = webpackRequire.cache || {};
        const loadedModules = Object.keys(cache).length;
        
        this.recordMetric('loadedModules', loadedModules, 'count', 'bundle');
      }, 60000); // Every minute
    }
  }

  private monitorUserMetrics(): void {
    // Time to Interactive approximation
    let interactionCount = 0;
    const startTime = Date.now();
    
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
        if (interactionCount === 1) {
          this.recordMetric('timeToInteractive', Date.now() - startTime, 'ms', 'user');
        }
      }, { once: true });
    });
  }

  // ===========================================
  // METRICS RECORDING & ANALYSIS
  // ===========================================

  recordMetric(name: string, value: number, unit: string, category: PerformanceMetric['category']): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      threshold: this.thresholds.get(name),
      category
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check thresholds and trigger alerts
    this.checkThresholds(metric);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    if (metric.value > metric.threshold.critical) {
      console.error(`🔴 Critical performance issue: ${metric.name} = ${metric.value}${metric.unit}`);
      this.triggerAlert('critical', metric);
    } else if (metric.value > metric.threshold.warning) {
      console.warn(`🟡 Performance warning: ${metric.name} = ${metric.value}${metric.unit}`);
      this.triggerAlert('warning', metric);
    }
  }

  private triggerAlert(level: 'warning' | 'critical', metric: PerformanceMetric): void {
    // Emit custom event for alert handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performanceAlert', {
        detail: { level, metric }
      }));
    }
  }

  // ===========================================
  // PERFORMANCE REPORTING
  // ===========================================

  async generatePerformanceReport(): Promise<PerformanceReport> {
    const now = Date.now();
    const coreVitals = await this.measureCoreWebVitals();
    
    // Calculate timing metrics
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const timing = {
      domContentLoaded: navTiming ? navTiming.domContentLoadedEventEnd - navTiming.navigationStart : 0,
      loadComplete: navTiming ? navTiming.loadEventEnd - navTiming.navigationStart : 0,
      firstPaint: navTiming ? navTiming.responseStart - navTiming.navigationStart : 0,
      firstContentfulPaint: this.getMetricValue('firstContentfulPaint') || 0
    };

    // Calculate memory metrics
    const memory = {
      usedHeapSize: this.getMetricValue('memoryUsed') || 0,
      totalHeapSize: this.getMetricValue('memoryTotal') || 0,
      heapSizeLimit: this.getMetricValue('memoryLimit') || 0
    };

    // Calculate bundle metrics
    const bundle = {
      totalSize: this.calculateBundleSize(),
      loadedChunks: this.getLoadedChunks(),
      asyncChunks: this.getAsyncChunks()
    };

    // Calculate network metrics
    const network = {
      resourceCount: performance.getEntriesByType('resource').length,
      transferSize: this.calculateTransferSize(),
      cacheHitRatio: this.calculateCacheHitRatio()
    };

    // Analyze issues
    const issues = this.analyzePerformanceIssues();

    // Calculate performance score
    const score = this.calculatePerformanceScore(coreVitals, timing, memory, network);

    const report: PerformanceReport = {
      timestamp: now,
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      metrics: {
        core: coreVitals,
        timing,
        memory,
        bundle,
        network
      },
      issues,
      score
    };

    return report;
  }

  private setupAutoReporting(): void {
    // Report on page load
    window.addEventListener('load', () => {
      setTimeout(async () => {
        const report = await this.generatePerformanceReport();
        this.sendReport(report);
      }, 2000);
    });

    // Report on page unload
    window.addEventListener('beforeunload', async () => {
      const report = await this.generatePerformanceReport();
      this.sendReport(report, true); // Use sendBeacon for unload
    });

    // Report periodically
    setInterval(async () => {
      const report = await this.generatePerformanceReport();
      this.sendReport(report);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async sendReport(report: PerformanceReport, useBeacon: boolean = false): Promise<void> {
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          this.reportingEndpoint,
          JSON.stringify(report)
        );
      } else {
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(report)
        });
      }
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  // ===========================================
  // PERFORMANCE ANALYSIS
  // ===========================================

  private analyzePerformanceIssues(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Check Core Web Vitals
    const lcp = this.getMetricValue('LCP');
    if (lcp > 4000) {
      issues.push({
        type: 'critical',
        category: 'Core Web Vitals',
        message: `Largest Contentful Paint is ${lcp}ms (> 4000ms)`,
        impact: 9,
        suggestion: 'Optimize images, remove render-blocking resources, improve server response times'
      });
    }

    const fid = this.getMetricValue('FID');
    if (fid > 300) {
      issues.push({
        type: 'critical',
        category: 'Core Web Vitals',
        message: `First Input Delay is ${fid}ms (> 300ms)`,
        impact: 8,
        suggestion: 'Reduce JavaScript execution time, split long tasks, use web workers'
      });
    }

    const cls = this.getMetricValue('CLS');
    if (cls > 0.25) {
      issues.push({
        type: 'critical',
        category: 'Core Web Vitals',
        message: `Cumulative Layout Shift is ${cls} (> 0.25)`,
        impact: 7,
        suggestion: 'Add size attributes to images and videos, avoid inserting content above existing content'
      });
    }

    // Check memory usage
    const memoryUsed = this.getMetricValue('memoryUsed');
    const memoryLimit = this.getMetricValue('memoryLimit');
    if (memoryUsed && memoryLimit && memoryUsed > memoryLimit * 0.8) {
      issues.push({
        type: 'warning',
        category: 'Memory',
        message: `High memory usage: ${Math.round(memoryUsed / 1024 / 1024)}MB`,
        impact: 6,
        suggestion: 'Review memory leaks, optimize data structures, implement lazy loading'
      });
    }

    // Check bundle size
    const bundleSize = this.calculateBundleSize();
    if (bundleSize > 2 * 1024 * 1024) { // > 2MB
      issues.push({
        type: 'warning',
        category: 'Bundle Size',
        message: `Large bundle size: ${Math.round(bundleSize / 1024 / 1024)}MB`,
        impact: 5,
        suggestion: 'Implement code splitting, tree shaking, and dynamic imports'
      });
    }

    return issues;
  }

  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [
      {
        id: 'code-splitting',
        title: 'Implement Code Splitting',
        description: 'Split your bundle into smaller chunks that load on demand',
        impact: 'high',
        effort: 'medium',
        category: 'bundle',
        implementation: 'Use React.lazy() and dynamic imports for route-based code splitting',
        estimatedImprovement: '30-50% reduction in initial bundle size'
      },
      {
        id: 'image-optimization',
        title: 'Optimize Images',
        description: 'Compress and serve images in modern formats like WebP',
        impact: 'high',
        effort: 'low',
        category: 'network',
        implementation: 'Use next/image or similar optimization tools',
        estimatedImprovement: '40-70% reduction in image size'
      },
      {
        id: 'lazy-loading',
        title: 'Implement Lazy Loading',
        description: 'Load components and images only when they enter the viewport',
        impact: 'medium',
        effort: 'low',
        category: 'rendering',
        implementation: 'Use React.lazy() and Intersection Observer API',
        estimatedImprovement: '20-40% faster initial page load'
      },
      {
        id: 'caching-strategy',
        title: 'Optimize Caching Strategy',
        description: 'Implement aggressive caching for static assets',
        impact: 'high',
        effort: 'medium',
        category: 'network',
        implementation: 'Configure service worker and HTTP cache headers',
        estimatedImprovement: '60-80% faster repeat visits'
      },
      {
        id: 'memory-optimization',
        title: 'Memory Usage Optimization',
        description: 'Reduce memory footprint and prevent memory leaks',
        impact: 'medium',
        effort: 'high',
        category: 'memory',
        implementation: 'Profile and optimize React components, cleanup event listeners',
        estimatedImprovement: '30-50% reduction in memory usage'
      }
    ];

    return suggestions;
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private getMetricValue(name: string): number | null {
    const metric = this.metrics.find(m => m.name === name);
    return metric ? metric.value : null;
  }

  private calculateBundleSize(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources
      .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
      .reduce((total, resource) => total + (resource.transferSize || 0), 0);
  }

  private getLoadedChunks(): string[] {
    // This would need integration with your bundler
    return [];
  }

  private getAsyncChunks(): string[] {
    // This would need integration with your bundler
    return [];
  }

  private calculateTransferSize(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources.reduce((total, resource) => total + (resource.transferSize || 0), 0);
  }

  private calculateCacheHitRatio(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cachedResources = resources.filter(resource => resource.transferSize === 0);
    return resources.length > 0 ? cachedResources.length / resources.length : 0;
  }

  private getConnectionType(): string {
    return (navigator as any).connection?.effectiveType || 'unknown';
  }

  private calculatePerformanceScore(
    coreVitals: any,
    timing: any,
    memory: any,
    network: any
  ): number {
    let score = 100;

    // Core Web Vitals impact (40% of score)
    if (coreVitals.LCP > 2500) score -= Math.min(20, (coreVitals.LCP - 2500) / 100);
    if (coreVitals.FID > 100) score -= Math.min(10, (coreVitals.FID - 100) / 20);
    if (coreVitals.CLS > 0.1) score -= Math.min(10, (coreVitals.CLS - 0.1) * 100);

    // Timing impact (30% of score)
    if (timing.loadComplete > 3000) score -= Math.min(15, (timing.loadComplete - 3000) / 200);
    if (timing.domContentLoaded > 1500) score -= Math.min(15, (timing.domContentLoaded - 1500) / 100);

    // Memory impact (15% of score)
    const memoryUsageRatio = memory.usedHeapSize / memory.heapSizeLimit;
    if (memoryUsageRatio > 0.7) score -= Math.min(15, (memoryUsageRatio - 0.7) * 50);

    // Network impact (15% of score)
    if (network.transferSize > 2 * 1024 * 1024) score -= Math.min(15, (network.transferSize - 2 * 1024 * 1024) / (100 * 1024));

    return Math.max(0, Math.round(score));
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.category === category);
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  async getDetailedReport(): Promise<{
    report: PerformanceReport;
    suggestions: OptimizationSuggestion[];
  }> {
    const report = await this.generatePerformanceReport();
    const suggestions = this.generateOptimizationSuggestions();
    
    return { report, suggestions };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor({
  enableAutoReporting: true,
  customThresholds: {
    'LCP': { warning: 2000, critical: 3500 }, // Stricter thresholds for legal platform
    'FID': { warning: 80, critical: 200 },
    'CLS': { warning: 0.08, critical: 0.2 }
  }
});

export { PerformanceMetric, PerformanceReport, PerformanceIssue, OptimizationSuggestion };