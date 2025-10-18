// ===========================================
// CDN OPTIMIZATION SERVICE
// Content Delivery & Edge Optimization
// ===========================================

interface CDNConfig {
  providers: {
    primary: CDNProvider;
    fallback?: CDNProvider;
  };
  optimization: {
    imageOptimization: boolean;
    compression: boolean;
    minification: boolean;
    bundleOptimization: boolean;
  };
  caching: {
    staticAssets: number; // TTL in seconds
    dynamicContent: number;
    api: number;
  };
  regions: string[];
  analytics: boolean;
}

interface CDNProvider {
  name: string;
  endpoints: {
    primary: string;
    regions: Record<string, string>;
  };
  features: {
    imageOptimization: boolean;
    webp: boolean;
    avif: boolean;
    smartCropping: boolean;
    compression: boolean;
    http2: boolean;
    http3: boolean;
  };
  limits: {
    bandwidth: number; // GB per month
    requests: number; // requests per month
    storage: number; // GB
  };
}

interface AssetOptimization {
  original: {
    url: string;
    size: number;
    format: string;
  };
  optimized: {
    url: string;
    size: number;
    format: string;
    compression: number;
  };
  variants?: {
    webp?: string;
    avif?: string;
    responsive?: Record<string, string>;
  };
}

interface CDNAnalytics {
  bandwidth: {
    total: number;
    byRegion: Record<string, number>;
    byAssetType: Record<string, number>;
  };
  requests: {
    total: number;
    cached: number;
    hitRatio: number;
    byStatus: Record<number, number>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
  topAssets: Array<{
    url: string;
    requests: number;
    bandwidth: number;
  }>;
}

export class CDNOptimizationService {
  private config: CDNConfig;
  private analytics: CDNAnalytics;

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = {
      providers: {
        primary: {
          name: 'CloudFlare',
          endpoints: {
            primary: 'https://cdn.example.com',
            regions: {
              'us-east': 'https://us-east.cdn.example.com',
              'us-west': 'https://us-west.cdn.example.com',
              'eu-central': 'https://eu.cdn.example.com',
              'asia-pacific': 'https://ap.cdn.example.com'
            }
          },
          features: {
            imageOptimization: true,
            webp: true,
            avif: true,
            smartCropping: true,
            compression: true,
            http2: true,
            http3: true
          },
          limits: {
            bandwidth: 1000, // 1TB
            requests: 10000000, // 10M
            storage: 100 // 100GB
          }
        }
      },
      optimization: {
        imageOptimization: true,
        compression: true,
        minification: true,
        bundleOptimization: true
      },
      caching: {
        staticAssets: 86400 * 30, // 30 days
        dynamicContent: 3600, // 1 hour
        api: 300 // 5 minutes
      },
      regions: ['us-east', 'us-west', 'eu-central', 'asia-pacific'],
      analytics: true,
      ...config
    };

    this.analytics = {
      bandwidth: { total: 0, byRegion: {}, byAssetType: {} },
      requests: { total: 0, cached: 0, hitRatio: 0, byStatus: {} },
      performance: { averageResponseTime: 0, p95ResponseTime: 0, errorRate: 0 },
      topAssets: []
    };

    this.initialize();
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  private async initialize(): Promise<void> {
    try {
      await this.setupServiceWorker();
      await this.detectOptimalRegion();
      await this.preloadCriticalAssets();
      console.log('🌐 CDN optimization service initialized');
    } catch (error) {
      console.error('Failed to initialize CDN service:', error);
    }
  }

  private async setupServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const swCode = this.generateServiceWorkerCode();
    const blob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    try {
      const registration = await navigator.serviceWorker.register(swUrl);
      console.log('📦 CDN service worker registered');
      
      registration.addEventListener('updatefound', () => {
        console.log('🔄 CDN service worker update found');
      });
    } catch (error) {
      console.warn('Failed to register CDN service worker:', error);
    }
  }

  private generateServiceWorkerCode(): string {
    return `
      const CDN_CACHE = 'cdn-cache-v1';
      const CDN_CONFIG = ${JSON.stringify(this.config)};
      
      self.addEventListener('install', (event) => {
        event.waitUntil(self.skipWaiting());
      });
      
      self.addEventListener('activate', (event) => {
        event.waitUntil(self.clients.claim());
      });
      
      self.addEventListener('fetch', (event) => {
        if (shouldHandleRequest(event.request)) {
          event.respondWith(handleCDNRequest(event.request));
        }
      });
      
      function shouldHandleRequest(request) {
        const url = new URL(request.url);
        return url.pathname.match(/\\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2)$/);
      }
      
      async function handleCDNRequest(request) {
        const cache = await caches.open(CDN_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
          // Return cached version and update in background
          fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
          }).catch(() => {});
          return cached;
        }
        
        try {
          const response = await fetch(optimizeRequest(request));
          if (response.ok) {
            await cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          // Return offline fallback if available
          return new Response('Resource temporarily unavailable', { status: 503 });
        }
      }
      
      function optimizeRequest(request) {
        const url = new URL(request.url);
        
        // Add optimization parameters
        if (url.pathname.match(/\\.(jpg|jpeg|png|webp)$/)) {
          url.searchParams.set('auto', 'format,compress');
          url.searchParams.set('q', '85');
        }
        
        return new Request(url.toString(), request);
      }
    `;
  }

  // ===========================================
  // ASSET OPTIMIZATION
  // ===========================================

  async optimizeImage(
    imageUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
      crop?: 'smart' | 'center' | 'top' | 'bottom';
    } = {}
  ): Promise<AssetOptimization> {
    const {
      width,
      height,
      quality = 85,
      format = 'auto',
      crop = 'smart'
    } = options;

    const originalUrl = imageUrl;
    const cdnUrl = this.buildCDNUrl(imageUrl);
    
    // Build optimization parameters
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 85) params.set('q', quality.toString());
    if (format !== 'auto') params.set('f', format);
    if (crop !== 'smart') params.set('c', crop);
    
    // Auto format detection
    if (format === 'auto') {
      params.set('f', 'auto');
    }

    const optimizedUrl = `${cdnUrl}?${params.toString()}`;

    // Generate responsive variants
    const variants: Record<string, string> = {};
    if (width) {
      [480, 768, 1024, 1920].forEach(w => {
        if (w <= width) {
          const variantParams = new URLSearchParams(params);
          variantParams.set('w', w.toString());
          variants[`${w}w`] = `${cdnUrl}?${variantParams.toString()}`;
        }
      });
    }

    // Estimate compression (this would typically come from CDN analytics)
    const estimatedCompression = this.estimateCompression(imageUrl, format, quality);

    return {
      original: {
        url: originalUrl,
        size: 0, // Would be fetched from metadata
        format: this.getImageFormat(originalUrl)
      },
      optimized: {
        url: optimizedUrl,
        size: 0, // Would be calculated after optimization
        format: format === 'auto' ? 'webp' : format,
        compression: estimatedCompression
      },
      variants: Object.keys(variants).length > 0 ? variants : undefined
    };
  }

  async optimizeCSS(cssContent: string): Promise<string> {
    if (!this.config.optimization.minification) return cssContent;

    try {
      // Basic CSS minification
      return cssContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
        .replace(/\s*{\s*/g, '{') // Clean braces
        .replace(/;\s*/g, ';') // Clean semicolons
        .replace(/:\s*/g, ':') // Clean colons
        .trim();
    } catch (error) {
      console.warn('CSS optimization failed:', error);
      return cssContent;
    }
  }

  async optimizeJS(jsContent: string): Promise<string> {
    if (!this.config.optimization.minification) return jsContent;

    try {
      // Basic JS minification (in production, use proper minifier)
      return jsContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/;\s*}/g, '}') // Clean semicolons before braces
        .trim();
    } catch (error) {
      console.warn('JS optimization failed:', error);
      return jsContent;
    }
  }

  // ===========================================
  // CDN MANAGEMENT
  // ===========================================

  buildCDNUrl(assetPath: string): string {
    const region = this.getOptimalRegion();
    const provider = this.config.providers.primary;
    
    if (region && provider.endpoints.regions[region]) {
      return `${provider.endpoints.regions[region]}${assetPath}`;
    }
    
    return `${provider.endpoints.primary}${assetPath}`;
  }

  async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      '/css/critical.css',
      '/js/main.js',
      '/images/logo.svg',
      '/fonts/main.woff2'
    ];

    const preloadPromises = criticalAssets.map(async (asset) => {
      const optimizedUrl = this.buildCDNUrl(asset);
      
      // Use different preload types based on asset type
      let rel = 'preload';
      let as = '';
      let type = '';

      if (asset.endsWith('.css')) {
        rel = 'preload';
        as = 'style';
      } else if (asset.endsWith('.js')) {
        rel = 'preload';
        as = 'script';
      } else if (asset.match(/\.(woff|woff2|ttf|otf)$/)) {
        rel = 'preload';
        as = 'font';
        type = 'font/woff2';
      } else if (asset.match(/\.(jpg|jpeg|png|webp|avif|svg)$/)) {
        rel = 'preload';
        as = 'image';
      }

      if (typeof document !== 'undefined') {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = optimizedUrl;
        if (as) link.as = as;
        if (type) link.type = type;
        if (as === 'font') link.crossOrigin = 'anonymous';
        
        document.head.appendChild(link);
      }

      // Also prefetch the resource
      try {
        await fetch(optimizedUrl, { mode: 'no-cors' });
      } catch (error) {
        console.warn(`Failed to preload ${asset}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log('🚀 Critical assets preloaded');
  }

  async invalidateCache(patterns: string[]): Promise<void> {
    // In a real implementation, this would call the CDN provider's purge API
    console.log('🗑️ Invalidating CDN cache for patterns:', patterns);
    
    // Clear service worker cache
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const url = new URL(request.url);
          if (patterns.some(pattern => url.pathname.includes(pattern))) {
            await cache.delete(request);
          }
        }
      }
    }
  }

  // ===========================================
  // PERFORMANCE OPTIMIZATION
  // ===========================================

  private async detectOptimalRegion(): Promise<string | null> {
    const regions = this.config.regions;
    const provider = this.config.providers.primary;
    
    if (regions.length === 0) return null;

    const latencyTests = await Promise.allSettled(
      regions.map(async (region) => {
        const endpoint = provider.endpoints.regions[region];
        if (!endpoint) return { region, latency: Infinity };

        const start = performance.now();
        try {
          await fetch(`${endpoint}/ping`, { method: 'HEAD', mode: 'no-cors' });
          const latency = performance.now() - start;
          return { region, latency };
        } catch (error) {
          return { region, latency: Infinity };
        }
      })
    );

    const validResults = latencyTests
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value)
      .filter(result => result.latency !== Infinity);

    if (validResults.length === 0) return null;

    const optimal = validResults.reduce((best, current) =>
      current.latency < best.latency ? current : best
    );

    console.log(`🌍 Optimal CDN region: ${optimal.region} (${optimal.latency.toFixed(0)}ms)`);
    return optimal.region;
  }

  private getOptimalRegion(): string | null {
    // This would typically be cached from detectOptimalRegion
    // For now, return a default based on user location
    if (typeof navigator !== 'undefined' && 'language' in navigator) {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('en-us')) return 'us-east';
      if (lang.startsWith('en-gb') || lang.startsWith('de') || lang.startsWith('fr')) return 'eu-central';
      if (lang.startsWith('ja') || lang.startsWith('ko') || lang.startsWith('zh')) return 'asia-pacific';
    }
    return 'us-east'; // Default fallback
  }

  private estimateCompression(_url: string, format: string, quality: number): number {
    const baseCompression = {
      'webp': 0.75,
      'avif': 0.65,
      'jpg': 0.85,
      'png': 0.95
    };

    const qualityFactor = quality / 100;
    const base = baseCompression[format as keyof typeof baseCompression] || 0.85;
    
    return Math.max(0.3, base * qualityFactor);
  }

  private getImageFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  // ===========================================
  // ANALYTICS & MONITORING
  // ===========================================

  trackRequest(url: string, size: number, cached: boolean, responseTime: number): void {
    if (!this.config.analytics) return;

    this.analytics.requests.total++;
    if (cached) this.analytics.requests.cached++;
    
    this.analytics.requests.hitRatio = this.analytics.requests.cached / this.analytics.requests.total;
    this.analytics.bandwidth.total += size;
    
    // Update performance metrics
    this.analytics.performance.averageResponseTime = 
      (this.analytics.performance.averageResponseTime + responseTime) / 2;
    
    // Track by asset type
    const extension = url.split('.').pop()?.toLowerCase() || 'other';
    this.analytics.bandwidth.byAssetType[extension] = 
      (this.analytics.bandwidth.byAssetType[extension] || 0) + size;

    // Update top assets
    const existingAsset = this.analytics.topAssets.find(asset => asset.url === url);
    if (existingAsset) {
      existingAsset.requests++;
      existingAsset.bandwidth += size;
    } else {
      this.analytics.topAssets.push({ url, requests: 1, bandwidth: size });
    }

    // Keep only top 10 assets
    this.analytics.topAssets = this.analytics.topAssets
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  }

  getAnalytics(): CDNAnalytics {
    return { ...this.analytics };
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => {
        const optimizedUrl = this.buildCDNUrl(baseUrl);
        const url = new URL(optimizedUrl);
        url.searchParams.set('w', size.toString());
        url.searchParams.set('f', 'auto');
        return `${url.toString()} ${size}w`;
      })
      .join(', ');
  }

  generatePictureElement(baseUrl: string, alt: string): string {
    const cdnUrl = this.buildCDNUrl(baseUrl);
    
    return `
      <picture>
        <source media="(min-width: 1200px)" srcset="${cdnUrl}?w=1200&f=avif" type="image/avif">
        <source media="(min-width: 1200px)" srcset="${cdnUrl}?w=1200&f=webp" type="image/webp">
        <source media="(min-width: 800px)" srcset="${cdnUrl}?w=800&f=avif" type="image/avif">
        <source media="(min-width: 800px)" srcset="${cdnUrl}?w=800&f=webp" type="image/webp">
        <source media="(min-width: 400px)" srcset="${cdnUrl}?w=400&f=avif" type="image/avif">
        <source media="(min-width: 400px)" srcset="${cdnUrl}?w=400&f=webp" type="image/webp">
        <img src="${cdnUrl}?w=800&f=auto" alt="${alt}" loading="lazy">
      </picture>
    `;
  }

  async compress(content: string, algorithm: 'gzip' | 'deflate' = 'gzip'): Promise<ArrayBuffer> {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream(algorithm as CompressionFormat);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(content));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    }
    
    // Fallback for environments without CompressionStream
    return new TextEncoder().encode(content).buffer;
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  updateConfig(newConfig: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ CDN configuration updated');
  }

  async optimizeAsset(url: string, type: 'image' | 'css' | 'js', options: any = {}): Promise<string> {
    switch (type) {
      case 'image':
        const imageOpt = await this.optimizeImage(url, options);
        return imageOpt.optimized.url;
      
      case 'css':
        // For CSS, we'd typically fetch and optimize
        return this.buildCDNUrl(url);
      
      case 'js':
        // For JS, we'd typically fetch and optimize
        return this.buildCDNUrl(url);
      
      default:
        return this.buildCDNUrl(url);
    }
  }

  async purgeCache(urls: string[]): Promise<void> {
    await this.invalidateCache(urls);
  }

  getUsageStats(): any {
    const provider = this.config.providers.primary;
    const usage = {
      bandwidth: {
        used: this.analytics.bandwidth.total / (1024 * 1024 * 1024), // GB
        limit: provider.limits.bandwidth,
        percentage: (this.analytics.bandwidth.total / (1024 * 1024 * 1024)) / provider.limits.bandwidth * 100
      },
      requests: {
        used: this.analytics.requests.total,
        limit: provider.limits.requests,
        percentage: this.analytics.requests.total / provider.limits.requests * 100
      }
    };

    return usage;
  }
}

// Export singleton instance
export const cdnService = new CDNOptimizationService();

export type {
  CDNConfig,
  CDNProvider,
  AssetOptimization,
  CDNAnalytics
};