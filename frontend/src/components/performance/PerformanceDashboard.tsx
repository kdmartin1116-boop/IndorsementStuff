// ===========================================
// PERFORMANCE MONITORING DASHBOARD
// Real-time Performance Analytics & Insights
// ===========================================

import React, { useState, useEffect, useRef } from 'react';
import { performanceMonitor } from './PerformanceMonitor';
import { cacheEngine } from './CacheEngine';

interface PerformanceMetrics {
  webVitals: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
  navigation: {
    loadTime: number;
    domReady: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  resources: {
    totalSize: number;
    totalCount: number;
    slowResources: Array<{
      name: string;
      duration: number;
      size: number;
    }>;
  };
  cache: {
    hitRatio: number;
    totalSize: number;
    entryCount: number;
    hits: number;
    misses: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  performance: {
    score: number;
    grade: string;
    issues: string[];
    recommendations: string[];
  };
}

interface AlertConfig {
  id: string;
  metric: string;
  threshold: number;
  type: 'warning' | 'critical';
  message: string;
  enabled: boolean;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'cache' | 'alerts' | 'settings'>('overview');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeMonitoring();
    setupDefaultAlerts();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        collectMetrics();
      }, 5000); // Update every 5 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  // ===========================================
  // INITIALIZATION
  // ===========================================

  const initializeMonitoring = async (): Promise<void> => {
    try {
      await performanceMonitor.initialize();
      setIsMonitoring(true);
      await collectMetrics();
      console.log('📊 Performance dashboard initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  };

  const setupDefaultAlerts = (): void => {
    const defaultAlerts: AlertConfig[] = [
      {
        id: 'lcp-warning',
        metric: 'LCP',
        threshold: 2500,
        type: 'warning',
        message: 'Largest Contentful Paint is above 2.5 seconds',
        enabled: true
      },
      {
        id: 'lcp-critical',
        metric: 'LCP',
        threshold: 4000,
        type: 'critical',
        message: 'Largest Contentful Paint is critically slow (>4s)',
        enabled: true
      },
      {
        id: 'fid-warning',
        metric: 'FID',
        threshold: 100,
        type: 'warning',
        message: 'First Input Delay is above 100ms',
        enabled: true
      },
      {
        id: 'cls-warning',
        metric: 'CLS',
        threshold: 0.1,
        type: 'warning',
        message: 'Cumulative Layout Shift is above 0.1',
        enabled: true
      },
      {
        id: 'cache-hit-low',
        metric: 'Cache Hit Ratio',
        threshold: 0.7,
        type: 'warning',
        message: 'Cache hit ratio is below 70%',
        enabled: true
      },
      {
        id: 'memory-high',
        metric: 'Memory Usage',
        threshold: 0.8,
        type: 'critical',
        message: 'Memory usage is above 80%',
        enabled: true
      }
    ];

    setAlerts(defaultAlerts);
  };

  // ===========================================
  // DATA COLLECTION
  // ===========================================

  const collectMetrics = async (): Promise<void> => {
    try {
      const [
        webVitals,
        navigationTiming,
        resourceTiming,
        cacheStats,
        memoryInfo,
        performanceScore
      ] = await Promise.all([
        performanceMonitor.getWebVitals(),
        performanceMonitor.getNavigationTiming(),
        performanceMonitor.getResourceTiming(),
        cacheEngine.getStats(),
        getMemoryInfo(),
        performanceMonitor.calculatePerformanceScore()
      ]);

      const newMetrics: PerformanceMetrics = {
        webVitals: {
          lcp: webVitals.lcp || 0,
          fid: webVitals.fid || 0,
          cls: webVitals.cls || 0,
          ttfb: webVitals.ttfb || 0
        },
        navigation: {
          loadTime: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
          domReady: navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart,
          firstPaint: webVitals.fp || 0,
          firstContentfulPaint: webVitals.fcp || 0
        },
        resources: {
          totalSize: resourceTiming.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
          totalCount: resourceTiming.length,
          slowResources: resourceTiming
            .filter(resource => resource.duration > 1000)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
            .map(resource => ({
              name: resource.name.split('/').pop() || resource.name,
              duration: resource.duration,
              size: resource.transferSize || 0
            }))
        },
        cache: {
          hitRatio: cacheStats.hitRatio,
          totalSize: cacheStats.totalSize,
          entryCount: cacheStats.entryCount,
          hits: cacheStats.hits,
          misses: cacheStats.misses
        },
        memory: memoryInfo,
        performance: {
          score: performanceScore.score,
          grade: getPerformanceGrade(performanceScore.score),
          issues: performanceScore.issues,
          recommendations: performanceScore.recommendations
        }
      };

      setMetrics(newMetrics);
      checkAlerts(newMetrics);
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  };

  const getMemoryInfo = (): any => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
  };

  const getPerformanceGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 45) return 'D';
    return 'F';
  };

  // ===========================================
  // ALERT SYSTEM
  // ===========================================

  const checkAlerts = (currentMetrics: PerformanceMetrics): void => {
    alerts.forEach(alert => {
      if (!alert.enabled) return;

      let currentValue = 0;
      switch (alert.metric) {
        case 'LCP':
          currentValue = currentMetrics.webVitals.lcp;
          break;
        case 'FID':
          currentValue = currentMetrics.webVitals.fid;
          break;
        case 'CLS':
          currentValue = currentMetrics.webVitals.cls;
          break;
        case 'Cache Hit Ratio':
          currentValue = currentMetrics.cache.hitRatio;
          break;
        case 'Memory Usage':
          currentValue = currentMetrics.memory.usedJSHeapSize / currentMetrics.memory.jsHeapSizeLimit;
          break;
      }

      const shouldAlert = alert.metric === 'Cache Hit Ratio' ? 
        currentValue < alert.threshold : 
        currentValue > alert.threshold;

      if (shouldAlert) {
        triggerAlert(alert, currentValue);
      }
    });
  };

  const triggerAlert = (alert: AlertConfig, value: number): void => {
    const notification = {
      title: `Performance Alert: ${alert.metric}`,
      body: `${alert.message} (Current: ${value.toFixed(2)})`,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    };

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, notification);
    }

    // Console warning
    console.warn(`🚨 ${alert.type.toUpperCase()}: ${notification.title} - ${notification.body}`);

    // Custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('performance-alert', {
      detail: { alert, value, notification }
    }));
  };

  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (metric: string, value: number): string => {
    switch (metric) {
      case 'LCP':
        if (value <= 2500) return 'text-green-600';
        if (value <= 4000) return 'text-yellow-600';
        return 'text-red-600';
      case 'FID':
        if (value <= 100) return 'text-green-600';
        if (value <= 300) return 'text-yellow-600';
        return 'text-red-600';
      case 'CLS':
        if (value <= 0.1) return 'text-green-600';
        if (value <= 0.25) return 'text-yellow-600';
        return 'text-red-600';
      case 'TTFB':
        if (value <= 600) return 'text-green-600';
        if (value <= 1500) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const exportMetrics = (): void => {
    if (!metrics) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts: alerts.filter(alert => alert.enabled)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===========================================
  // RENDER METHODS
  // ===========================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Performance Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Performance Score</h3>
            <p className="text-sm text-gray-500">Overall application performance</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${metrics?.performance.score && metrics.performance.score >= 75 ? 'text-green-600' : metrics?.performance.score && metrics.performance.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {metrics?.performance.score.toFixed(0) || 0}
            </div>
            <div className="text-sm text-gray-500">
              Grade: {metrics?.performance.grade || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor('LCP', metrics?.webVitals.lcp || 0)}`}>
              {formatMs(metrics?.webVitals.lcp || 0)}
            </div>
            <div className="text-sm text-gray-500">LCP</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor('FID', metrics?.webVitals.fid || 0)}`}>
              {formatMs(metrics?.webVitals.fid || 0)}
            </div>
            <div className="text-sm text-gray-500">FID</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor('CLS', metrics?.webVitals.cls || 0)}`}>
              {(metrics?.webVitals.cls || 0).toFixed(3)}
            </div>
            <div className="text-sm text-gray-500">CLS</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor('TTFB', metrics?.webVitals.ttfb || 0)}`}>
              {formatMs(metrics?.webVitals.ttfb || 0)}
            </div>
            <div className="text-sm text-gray-500">TTFB</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Cache Performance</h4>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">
              {((metrics?.cache.hitRatio || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              Hit Ratio ({metrics?.cache.hits || 0} hits, {metrics?.cache.misses || 0} misses)
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Memory Usage</h4>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.memory.jsHeapSizeLimit ? 
                ((metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-500">
              {formatBytes(metrics?.memory.usedJSHeapSize || 0)} used
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Resource Loading</h4>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.resources.totalCount || 0}
            </div>
            <div className="text-sm text-gray-500">
              Resources ({formatBytes(metrics?.resources.totalSize || 0)})
            </div>
          </div>
        </div>
      </div>

      {/* Issues & Recommendations */}
      {metrics?.performance.issues.length || metrics?.performance.recommendations.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.performance.issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-red-800 mb-3">Performance Issues</h4>
              <ul className="space-y-2">
                {metrics.performance.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {metrics.performance.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-800 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {metrics.performance.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const renderVitals = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Detailed Web Vitals</h3>
        
        {/* Navigation Timing */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-700 mb-4">Navigation Timing</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500">Page Load Time</div>
              <div className="text-lg font-semibold">{formatMs(metrics?.navigation.loadTime || 0)}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500">DOM Ready</div>
              <div className="text-lg font-semibold">{formatMs(metrics?.navigation.domReady || 0)}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500">First Paint</div>
              <div className="text-lg font-semibold">{formatMs(metrics?.navigation.firstPaint || 0)}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-500">First Contentful Paint</div>
              <div className="text-lg font-semibold">{formatMs(metrics?.navigation.firstContentfulPaint || 0)}</div>
            </div>
          </div>
        </div>

        {/* Slow Resources */}
        {metrics?.resources.slowResources.length ? (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Slow Loading Resources</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.resources.slowResources.map((resource, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{resource.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatMs(resource.duration)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBytes(resource.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderCache = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Cache Performance</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {((metrics?.cache.hitRatio || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Hit Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {metrics?.cache.hits || 0}
            </div>
            <div className="text-sm text-gray-500">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {metrics?.cache.misses || 0}
            </div>
            <div className="text-sm text-gray-500">Cache Misses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {metrics?.cache.entryCount || 0}
            </div>
            <div className="text-sm text-gray-500">Entries</div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-700">Cache Storage</h4>
            <button
              onClick={() => cacheEngine.optimize()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Optimize Cache
            </button>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <div className="text-lg font-semibold">{formatBytes(metrics?.cache.totalSize || 0)}</div>
            <div className="text-sm text-gray-500">Total cache size</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Performance Alerts</h3>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
        </div>

        <div className="space-y-4">
          {alerts.map(alert => (
            <div key={alert.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{alert.metric}</h4>
                  <p className="text-sm text-gray-500">{alert.message}</p>
                  <p className="text-xs text-gray-400">
                    Threshold: {alert.threshold} ({alert.type})
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alert.enabled}
                    onChange={(e) => {
                      const updatedAlerts = alerts.map(a => 
                        a.id === alert.id ? { ...a, enabled: e.target.checked } : a
                      );
                      setAlerts(updatedAlerts);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Dashboard Settings</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Auto-refresh metrics</span>
            </label>
          </div>

          <div className="border-t pt-6">
            <div className="flex space-x-4">
              <button
                onClick={collectMetrics}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Now
              </button>
              <button
                onClick={exportMetrics}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export Metrics
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all performance data?')) {
                    performanceMonitor.clearData();
                    setMetrics(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ===========================================
  // MAIN RENDER
  // ===========================================

  if (!isMonitoring) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing performance monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Real-time performance monitoring and optimization insights
        </p>
      </div>

      {/* Status Indicator */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="ml-2 text-sm text-gray-600">Live monitoring active</span>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'vitals', label: 'Web Vitals' },
            { id: 'cache', label: 'Cache' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'vitals' && renderVitals()}
        {activeTab === 'cache' && renderCache()}
        {activeTab === 'alerts' && renderAlerts()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default PerformanceDashboard;