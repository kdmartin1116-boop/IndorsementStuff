// ===========================================
// CODE SPLITTING & LAZY LOADING ENGINE
// Advanced Bundle Optimization & Dynamic Loading
// ===========================================

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';

interface LazyComponentConfig {
  fallback?: React.ComponentType;
  retryCount?: number;
  retryDelay?: number;
  preload?: boolean;
  chunk?: string;
}

interface RouteConfig {
  path: string;
  component: () => Promise<{ default: ComponentType<any> }>;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
    isAsync: boolean;
    loadTime?: number;
  }>;
  duplicatedModules: string[];
  unusedCode: number;
  compressionRatio: number;
}

class CodeSplittingEngine {
  private loadedChunks: Set<string> = new Set();
  private preloadPromises: Map<string, Promise<any>> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private chunkSizes: Map<string, number> = new Map();

  // ===========================================
  // DYNAMIC COMPONENT LOADING
  // ===========================================

  createLazyComponent<P = {}>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    config: LazyComponentConfig = {}
  ): LazyExoticComponent<ComponentType<P>> {
    const {
      fallback: FallbackComponent,
      retryCount = 3,
      retryDelay = 1000,
      preload = false,
      chunk
    } = config;

    // Create enhanced import function with retry logic
    const enhancedImportFn = async (): Promise<{ default: ComponentType<P> }> => {
      const chunkName = chunk || this.extractChunkName(importFn.toString());
      const attemptKey = `${chunkName}_${Date.now()}`;

      try {
        const startTime = performance.now();
        const module = await importFn();
        const loadTime = performance.now() - startTime;

        // Track successful load
        this.loadedChunks.add(chunkName);
        this.chunkSizes.set(chunkName, this.estimateChunkSize());
        this.trackChunkLoad(chunkName, loadTime, true);

        console.log(`✅ Chunk loaded successfully: ${chunkName} (${loadTime.toFixed(2)}ms)`);
        return module;

      } catch (error) {
        const attempts = this.retryAttempts.get(attemptKey) || 0;
        
        if (attempts < retryCount) {
          console.warn(`⚠️ Chunk load failed, retrying (${attempts + 1}/${retryCount}): ${chunkName}`);
          this.retryAttempts.set(attemptKey, attempts + 1);
          
          // Exponential backoff
          await this.delay(retryDelay * Math.pow(2, attempts));
          return enhancedImportFn();
        }

        console.error(`❌ Chunk load failed after ${retryCount} attempts: ${chunkName}`, error);
        this.trackChunkLoad(chunkName, 0, false);
        throw error;
      }
    };

    // Preload if requested
    if (preload) {
      this.preloadChunk(importFn, chunkName || 'unknown');
    }

    const LazyComponent = React.lazy(enhancedImportFn);

    // Return component with basic error handling
    return LazyComponent;
  }

  // ===========================================
  // ROUTE-BASED CODE SPLITTING
  // ===========================================

  createLazyRoutes(routes: RouteConfig[]): Array<{
    path: string;
    component: LazyExoticComponent<ComponentType<any>>;
    preloader?: () => Promise<void>;
  }> {
    return routes.map(route => {
      const lazyComponent = this.createLazyComponent(route.component, {
        preload: route.preload,
        chunk: route.path.replace('/', '_')
      });

      const preloader = route.preload 
        ? () => this.preloadChunk(route.component, route.path)
        : undefined;

      return {
        path: route.path,
        component: lazyComponent,
        preloader
      };
    });
  }

  // ===========================================
  // INTELLIGENT PRELOADING
  // ===========================================

  async preloadChunk(
    importFn: () => Promise<any>,
    chunkName: string
  ): Promise<void> {
    if (this.preloadPromises.has(chunkName)) {
      return this.preloadPromises.get(chunkName);
    }

    const preloadPromise = this.executePreload(importFn, chunkName);
    this.preloadPromises.set(chunkName, preloadPromise);
    
    return preloadPromise;
  }

  private async executePreload(
    importFn: () => Promise<any>,
    chunkName: string
  ): Promise<void> {
    try {
      console.log(`🔄 Preloading chunk: ${chunkName}`);
      const startTime = performance.now();
      
      await importFn();
      
      const loadTime = performance.now() - startTime;
      console.log(`✅ Preloaded chunk: ${chunkName} (${loadTime.toFixed(2)}ms)`);
      
      this.loadedChunks.add(chunkName);
      this.trackChunkLoad(chunkName, loadTime, true);
      
    } catch (error) {
      console.error(`❌ Failed to preload chunk: ${chunkName}`, error);
      this.trackChunkLoad(chunkName, 0, false);
    }
  }

  // Preload on hover/focus
  createPreloadOnHover<P = {}>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    chunkName: string
  ) {
    return {
      onMouseEnter: () => this.preloadChunk(importFn, chunkName),
      onFocus: () => this.preloadChunk(importFn, chunkName)
    };
  }

  // Preload based on user intent
  async preloadByIntent(
    routes: string[],
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<void> {
    const delay = {
      high: 0,
      medium: 1000,
      low: 3000
    }[priority];

    await this.delay(delay);

    const preloadPromises = routes.map(route => {
      const routeConfig = this.getRouteConfig(route);
      if (routeConfig && !this.loadedChunks.has(route)) {
        return this.preloadChunk(routeConfig.component, route);
      }
      return Promise.resolve();
    });

    await Promise.allSettled(preloadPromises);
  }

  // ===========================================
  // BUNDLE ANALYSIS
  // ===========================================

  async analyzeBundlePerformance(): Promise<BundleAnalysis> {
    const chunks: BundleAnalysis['chunks'] = [];
    let totalSize = 0;

    // Analyze loaded chunks
    for (const [chunkName, size] of this.chunkSizes.entries()) {
      chunks.push({
        name: chunkName,
        size,
        modules: await this.getChunkModules(chunkName),
        isAsync: !this.isMainChunk(chunkName),
        loadTime: this.getChunkLoadTime(chunkName)
      });
      totalSize += size;
    }

    // Detect duplicated modules
    const duplicatedModules = this.findDuplicatedModules(chunks);

    // Estimate unused code
    const unusedCode = await this.estimateUnusedCode();

    // Calculate compression ratio
    const compressionRatio = this.calculateCompressionRatio();

    return {
      totalSize,
      chunks,
      duplicatedModules,
      unusedCode,
      compressionRatio
    };
  }

  generateOptimizationRecommendations(analysis: BundleAnalysis): Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    impact: string;
    implementation: string;
  }> {
    const recommendations: any[] = [];

    // Large chunk detection
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 500 * 1024); // > 500KB
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Large Chunks Detected',
        description: `Found ${largeChunks.length} chunks larger than 500KB`,
        impact: 'Medium - May affect initial load time',
        implementation: 'Split large chunks further or optimize dependencies'
      });
    }

    // Duplicated modules
    if (analysis.duplicatedModules.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Duplicated Modules',
        description: `${analysis.duplicatedModules.length} modules are duplicated across chunks`,
        impact: 'High - Unnecessary bundle size increase',
        implementation: 'Use webpack SplitChunksPlugin or similar optimization'
      });
    }

    // Unused code
    if (analysis.unusedCode > 0.2) {
      recommendations.push({
        type: 'warning',
        title: 'High Unused Code Ratio',
        description: `${(analysis.unusedCode * 100).toFixed(1)}% of code appears unused`,
        impact: 'Medium - Bloated bundle size',
        implementation: 'Implement tree shaking and remove dead code'
      });
    }

    // Poor compression
    if (analysis.compressionRatio < 0.7) {
      recommendations.push({
        type: 'info',
        title: 'Poor Compression Ratio',
        description: `Compression ratio is ${(analysis.compressionRatio * 100).toFixed(1)}%`,
        impact: 'Low - Suboptimal transfer size',
        implementation: 'Enable gzip/brotli compression on server'
      });
    }

    return recommendations;
  }

  // ===========================================
  // PERFORMANCE UTILITIES
  // ===========================================

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractChunkName(fnString: string): string {
    // Extract chunk name from dynamic import
    const match = fnString.match(/webpackChunkName:\s*["']([^"']+)["']/);
    return match ? match[1] : `chunk_${Date.now()}`;
  }

  private estimateChunkSize(): number {
    // Estimate based on performance entries
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const recentResource = resources[resources.length - 1];
    return recentResource?.transferSize || 0;
  }

  private trackChunkLoad(chunkName: string, loadTime: number, success: boolean): void {
    // Send telemetry data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chunkLoad', {
        detail: { chunkName, loadTime, success }
      }));
    }
  }

  private async getChunkModules(chunkName: string): Promise<string[]> {
    // This would require integration with your bundler
    // For now, return empty array
    return [];
  }

  private isMainChunk(chunkName: string): boolean {
    return chunkName.includes('main') || chunkName.includes('index');
  }

  private getChunkLoadTime(chunkName: string): number | undefined {
    // Return cached load time
    return 0;
  }

  private findDuplicatedModules(chunks: BundleAnalysis['chunks']): string[] {
    const moduleCount = new Map<string, number>();
    
    chunks.forEach(chunk => {
      chunk.modules.forEach(module => {
        moduleCount.set(module, (moduleCount.get(module) || 0) + 1);
      });
    });

    return Array.from(moduleCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([module]) => module);
  }

  private async estimateUnusedCode(): Promise<number> {
    // This would require more advanced analysis
    // For now, return a placeholder
    return 0.1;
  }

  private calculateCompressionRatio(): number {
    // Calculate based on transfer vs decoded size
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js'));
    
    if (jsResources.length === 0) return 1;

    const totalTransfer = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalDecoded = jsResources.reduce((sum, r) => sum + (r.decodedBodySize || 0), 0);
    
    return totalDecoded > 0 ? totalTransfer / totalDecoded : 1;
  }

  private getRouteConfig(route: string): RouteConfig | undefined {
    // This would be populated from your route configuration
    return undefined;
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  getLoadedChunks(): string[] {
    return Array.from(this.loadedChunks);
  }

  getChunkStats(): Array<{ name: string; size: number; loaded: boolean }> {
    return Array.from(this.chunkSizes.entries()).map(([name, size]) => ({
      name,
      size,
      loaded: this.loadedChunks.has(name)
    }));
  }

  clearCache(): void {
    this.preloadPromises.clear();
    this.retryAttempts.clear();
  }
}

// ===========================================
// UTILITY COMPONENTS
// ===========================================

const ChunkLoadingFallback: React.FC<{ component?: ComponentType }> = ({ 
  component: FallbackComponent 
}) => {
  if (FallbackComponent) {
    return <FallbackComponent />;
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="text-gray-600">Loading...</span>
      </div>
    </div>
  );
};

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
  chunkName?: string;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ChunkErrorBoundary extends React.Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chunk loading error:', error, errorInfo);
    
    // Track error
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chunkError', {
        detail: { 
          chunkName: this.props.chunkName,
          error: error.message,
          stack: error.stack
        }
      }));
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to Load Component
          </h3>
          <p className="text-red-600 mb-4">
            There was an error loading this part of the application.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===========================================
// EXPORTS
// ===========================================

export const codeSplittingEngine = new CodeSplittingEngine();

export {
  CodeSplittingEngine,
  LazyComponentConfig,
  RouteConfig,
  BundleAnalysis,
  ChunkLoadingFallback,
  ChunkErrorBoundary
};