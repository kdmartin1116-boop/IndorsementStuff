// ===========================================
// ADVANCED CACHING ENGINE
// Multi-layer Caching & Cache Optimization
// ===========================================

interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  priority: 'low' | 'medium' | 'high';
  size: number;
  metadata?: Record<string, any>;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  maxEntries: number;
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  persistToDisk?: boolean;
  compression?: boolean;
  encryptionKey?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
  memoryPressure: number;
  averageAccessTime: number;
}

interface NetworkCacheStrategy {
  strategy: 'cache-first' | 'network-first' | 'cache-only' | 'network-only' | 'stale-while-revalidate';
  maxAge: number;
  staleWhileRevalidate?: number;
  updateInBackground?: boolean;
}

export class AdvancedCacheEngine {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRatio: 0,
    totalSize: 0,
    entryCount: 0,
    evictions: 0,
    memoryPressure: 0,
    averageAccessTime: 0
  };

  private config: CacheConfig;
  private compressionWorker?: Worker;
  private persistenceDB?: IDBDatabase;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 60 * 60 * 1000, // 1 hour
      maxEntries: 1000,
      evictionPolicy: 'LRU',
      persistToDisk: true,
      compression: true,
      ...config
    };

    this.initialize();
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Initialize compression worker
    if (this.config.compression) {
      this.initializeCompressionWorker();
    }

    // Initialize persistent storage
    if (this.config.persistToDisk) {
      await this.initializePersistentStorage();
    }

    // Set up periodic cleanup
    this.setupPeriodicCleanup();

    // Monitor memory pressure
    this.monitorMemoryPressure();

    console.log('🗄️ Advanced cache engine initialized');
  }

  private initializeCompressionWorker(): void {
    try {
      const workerCode = `
        importScripts('https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js');
        
        self.onmessage = function(e) {
          const { action, data, id } = e.data;
          
          try {
            if (action === 'compress') {
              const compressed = pako.deflate(data);
              self.postMessage({ id, result: compressed, action: 'compress' });
            } else if (action === 'decompress') {
              const decompressed = pako.inflate(data, { to: 'string' });
              self.postMessage({ id, result: decompressed, action: 'decompress' });
            }
          } catch (error) {
            self.postMessage({ id, error: error.message, action });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Failed to initialize compression worker:', error);
      this.config.compression = false;
    }
  }

  private async initializePersistentStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AdvancedCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.persistenceDB = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  // ===========================================
  // CORE CACHE OPERATIONS
  // ===========================================

  async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
      metadata?: Record<string, any>;
      persist?: boolean;
    } = {}
  ): Promise<void> {
    const {
      ttl = this.config.defaultTTL,
      priority = 'medium',
      metadata,
      persist = this.config.persistToDisk
    } = options;

    // Compress value if enabled
    let processedValue = value;
    if (this.config.compression && typeof value === 'string') {
      processedValue = await this.compressValue(value);
    }

    const size = this.calculateSize(processedValue);
    const entry: CacheEntry<T> = {
      key,
      value: processedValue,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      priority,
      size,
      metadata
    };

    // Check if we need to evict entries
    await this.ensureCapacity(size);

    // Add to memory cache
    this.memoryCache.set(key, entry);
    this.updateAccessOrder(key);
    this.updateStats('set', entry);

    // Persist to disk if enabled
    if (persist && this.persistenceDB) {
      await this.persistEntry(entry);
    }

    console.log(`📦 Cached: ${key} (${this.formatSize(size)})`);
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    // Check memory cache first
    let entry = this.memoryCache.get(key);
    
    // If not in memory, try persistent storage
    if (!entry && this.persistenceDB) {
      const persistedEntry = await this.getPersistedEntry(key);
      if (persistedEntry) {
        entry = persistedEntry;
        this.memoryCache.set(key, entry);
      }
    }

    if (!entry) {
      this.stats.misses++;
      this.updateHitRatio();
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      await this.delete(key);
      this.stats.misses++;
      this.updateHitRatio();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    // Decompress if needed
    let value = entry.value;
    if (this.config.compression && this.isCompressed(value)) {
      value = await this.decompressValue(value);
    }

    const accessTime = performance.now() - startTime;
    this.updateAccessTime(accessTime);

    this.stats.hits++;
    this.updateHitRatio();

    return value;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key);
    const deleted = this.memoryCache.delete(key);
    
    if (deleted && entry) {
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
      this.removeFromAccessOrder(key);
    }

    // Delete from persistent storage
    if (this.persistenceDB) {
      await this.deletePersistedEntry(key);
    }

    return deleted;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.accessOrder = [];
    this.resetStats();

    // Clear persistent storage
    if (this.persistenceDB) {
      await this.clearPersistedEntries();
    }
  }

  // ===========================================
  // NETWORK CACHING
  // ===========================================

  async fetchWithCache(
    url: string,
    options: RequestInit & { cacheStrategy?: NetworkCacheStrategy } = {}
  ): Promise<Response> {
    const {
      cacheStrategy = {
        strategy: 'cache-first',
        maxAge: 5 * 60 * 1000 // 5 minutes
      },
      ...fetchOptions
    } = options;

    const cacheKey = this.generateCacheKey(url, fetchOptions);

    switch (cacheStrategy.strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(url, fetchOptions, cacheKey, cacheStrategy);
      
      case 'network-first':
        return this.networkFirstStrategy(url, fetchOptions, cacheKey, cacheStrategy);
      
      case 'cache-only':
        return this.cacheOnlyStrategy(cacheKey);
      
      case 'network-only':
        return this.networkOnlyStrategy(url, fetchOptions);
      
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(url, fetchOptions, cacheKey, cacheStrategy);
      
      default:
        return fetch(url, fetchOptions);
    }
  }

  private async cacheFirstStrategy(
    url: string,
    options: RequestInit,
    cacheKey: string,
    strategy: NetworkCacheStrategy
  ): Promise<Response> {
    // Try cache first
    const cachedResponse = await this.getCachedResponse(cacheKey);
    if (cachedResponse && !this.isResponseExpired(cachedResponse, strategy.maxAge)) {
      console.log(`📥 Cache hit: ${url}`);
      return cachedResponse;
    }

    // Fallback to network
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        await this.cacheResponse(cacheKey, response.clone(), strategy);
      }
      return response;
    } catch (error) {
      // Return stale cache if available
      if (cachedResponse) {
        console.log(`📥 Returning stale cache for: ${url}`);
        return cachedResponse;
      }
      throw error;
    }
  }

  private async networkFirstStrategy(
    url: string,
    options: RequestInit,
    cacheKey: string,
    strategy: NetworkCacheStrategy
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        await this.cacheResponse(cacheKey, response.clone(), strategy);
      }
      return response;
    } catch (error) {
      // Fallback to cache
      const cachedResponse = await this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log(`📥 Network failed, using cache: ${url}`);
        return cachedResponse;
      }
      throw error;
    }
  }

  private async cacheOnlyStrategy(cacheKey: string): Promise<Response> {
    const cachedResponse = await this.getCachedResponse(cacheKey);
    if (!cachedResponse) {
      throw new Error('No cached response available');
    }
    return cachedResponse;
  }

  private async networkOnlyStrategy(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, options);
  }

  private async staleWhileRevalidateStrategy(
    url: string,
    options: RequestInit,
    cacheKey: string,
    strategy: NetworkCacheStrategy
  ): Promise<Response> {
    const cachedResponse = await this.getCachedResponse(cacheKey);
    
    // Always revalidate in background
    const revalidatePromise = fetch(url, options).then(async (response) => {
      if (response.ok) {
        await this.cacheResponse(cacheKey, response.clone(), strategy);
      }
      return response;
    }).catch(error => {
      console.warn('Background revalidation failed:', error);
    });

    // Return cached response immediately if available
    if (cachedResponse) {
      // Don't await revalidation
      revalidatePromise;
      return cachedResponse;
    }

    // No cache available, wait for network
    return await revalidatePromise as Response;
  }

  // ===========================================
  // CACHE MANAGEMENT
  // ===========================================

  private async ensureCapacity(requiredSize: number): Promise<void> {
    while (
      this.stats.totalSize + requiredSize > this.config.maxSize ||
      this.stats.entryCount >= this.config.maxEntries
    ) {
      await this.evictEntry();
    }
  }

  private async evictEntry(): Promise<void> {
    let keyToEvict: string | null = null;

    switch (this.config.evictionPolicy) {
      case 'LRU':
        keyToEvict = this.accessOrder[0];
        break;
      
      case 'LFU':
        keyToEvict = this.findLeastFrequentlyUsed();
        break;
      
      case 'FIFO':
        keyToEvict = this.findOldestEntry();
        break;
      
      case 'TTL':
        keyToEvict = this.findExpiredEntry();
        break;
    }

    if (keyToEvict) {
      await this.delete(keyToEvict);
      this.stats.evictions++;
      console.log(`🗑️ Evicted: ${keyToEvict}`);
    }
  }

  private findLeastFrequentlyUsed(): string | null {
    let minAccess = Infinity;
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.accessCount < minAccess) {
        minAccess = entry.accessCount;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  private findOldestEntry(): string | null {
    let oldestTime = Infinity;
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        keyToEvict = key;
      }
    }

    return keyToEvict;
  }

  private findExpiredEntry(): string | null {
    const now = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        return key;
      }
    }

    return null;
  }

  // ===========================================
  // COMPRESSION & PERSISTENCE
  // ===========================================

  private async compressValue(value: string): Promise<any> {
    if (!this.compressionWorker) return value;

    return new Promise((resolve) => {
      const id = Date.now().toString();
      
      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker?.removeEventListener('message', handler);
          resolve(event.data.result || value);
        }
      };

      this.compressionWorker?.addEventListener('message', handler);
      this.compressionWorker?.postMessage({ action: 'compress', data: value, id });
    });
  }

  private async decompressValue(value: any): Promise<any> {
    if (!this.compressionWorker || !this.isCompressed(value)) return value;

    return new Promise((resolve) => {
      const id = Date.now().toString();
      
      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.compressionWorker?.removeEventListener('message', handler);
          resolve(event.data.result || value);
        }
      };

      this.compressionWorker?.addEventListener('message', handler);
      this.compressionWorker?.postMessage({ action: 'decompress', data: value, id });
    });
  }

  private async persistEntry(entry: CacheEntry<any>): Promise<void> {
    if (!this.persistenceDB) return;

    const transaction = this.persistenceDB.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getPersistedEntry(key: string): Promise<CacheEntry<any> | null> {
    if (!this.persistenceDB) return null;

    const transaction = this.persistenceDB.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  private async deletePersistedEntry(key: string): Promise<void> {
    if (!this.persistenceDB) return;

    const transaction = this.persistenceDB.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    await new Promise<void>((resolve) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private async clearPersistedEntries(): Promise<void> {
    if (!this.persistenceDB) return;

    const transaction = this.persistenceDB.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    await new Promise<void>((resolve) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private isCompressed(value: any): boolean {
    return value instanceof Uint8Array;
  }

  private calculateSize(value: any): number {
    if (value instanceof Uint8Array) return value.length;
    return new Blob([JSON.stringify(value)]).size;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  private generateCacheKey(url: string, options: RequestInit): string {
    const sortedOptions = JSON.stringify(options, Object.keys(options).sort());
    return `${url}:${btoa(sortedOptions)}`;
  }

  private async getCachedResponse(cacheKey: string): Promise<Response | null> {
    const cached = await this.get<{ 
      url: string; 
      status: number; 
      statusText: string; 
      headers: [string, string][]; 
      body: string;
    }>(cacheKey);
    
    if (!cached) return null;

    return new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers: new Headers(cached.headers)
    });
  }

  private async cacheResponse(
    cacheKey: string, 
    response: Response, 
    strategy: NetworkCacheStrategy
  ): Promise<void> {
    const body = await response.text();
    const headers = Array.from(response.headers.entries());
    
    await this.set(cacheKey, {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      headers,
      body
    }, {
      ttl: strategy.maxAge,
      priority: 'medium'
    });
  }

  private isResponseExpired(response: any, maxAge: number): boolean {
    const entry = this.memoryCache.get(response.url);
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAge;
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private updateStats(operation: string, entry: CacheEntry<any>): void {
    if (operation === 'set') {
      this.stats.totalSize += entry.size;
      this.stats.entryCount++;
    }
  }

  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
  }

  private updateAccessTime(time: number): void {
    // Simple moving average
    this.stats.averageAccessTime = (this.stats.averageAccessTime + time) / 2;
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      totalSize: 0,
      entryCount: 0,
      evictions: 0,
      memoryPressure: 0,
      averageAccessTime: 0
    };
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  private monitorMemoryPressure(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.stats.memoryPressure = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        // Aggressive cleanup if memory pressure is high
        if (this.stats.memoryPressure > 0.8) {
          this.emergencyCleanup();
        }
      }, 30000); // Every 30 seconds
    }
  }

  private async emergencyCleanup(): Promise<void> {
    console.warn('🚨 High memory pressure, performing emergency cleanup');
    
    // Remove low priority entries first
    const lowPriorityKeys = Array.from(this.memoryCache.entries())
      .filter(([_, entry]) => entry.priority === 'low')
      .map(([key]) => key);
    
    for (const key of lowPriorityKeys.slice(0, Math.floor(lowPriorityKeys.length / 2))) {
      await this.delete(key);
    }
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async optimize(): Promise<void> {
    await this.cleanupExpiredEntries();
    console.log('🔧 Cache optimization complete');
  }

  async export(): Promise<any> {
    const entries: any[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      entries.push({
        key,
        value: entry.value,
        metadata: entry.metadata,
        timestamp: entry.timestamp
      });
    }
    
    return { entries, stats: this.stats };
  }

  async import(data: any): Promise<void> {
    for (const entry of data.entries) {
      await this.set(entry.key, entry.value, {
        metadata: entry.metadata
      });
    }
  }
}

// Export singleton instance
export const cacheEngine = new AdvancedCacheEngine();

export type { 
  CacheEntry, 
  CacheConfig, 
  CacheStats, 
  NetworkCacheStrategy 
};