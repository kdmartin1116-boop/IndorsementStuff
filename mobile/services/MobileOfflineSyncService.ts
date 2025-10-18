// ===========================================
// MOBILE OFFLINE SYNC SERVICE
// Data Synchronization & Offline Capabilities
// ===========================================

interface SyncableEntity {
  id: string;
  type: 'endorsement' | 'document' | 'user' | 'position' | 'notification';
  data: any;
  created_at: number;
  updated_at: number;
  last_synced?: number;
  sync_status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';
  device_id: string;
  version: number;
  checksum: string;
}

interface SyncConflict {
  entity_id: string;
  local_data: any;
  remote_data: any;
  conflict_type: 'update_conflict' | 'delete_conflict' | 'create_conflict';
  resolution?: 'keep_local' | 'keep_remote' | 'merge' | 'manual';
  resolved_at?: number;
}

interface SyncResult {
  success: boolean;
  entities_synced: number;
  conflicts: SyncConflict[];
  errors: string[];
  sync_duration: number;
  last_sync_time: number;
}

interface OfflineQueue {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity_type: string;
  entity_id: string;
  data: any;
  timestamp: number;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

interface NetworkStatus {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none';
  isInternetReachable: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'unknown';
}

interface SyncSettings {
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  wifi_only: boolean;
  max_offline_storage_mb: number;
  conflict_resolution_strategy: 'ask_user' | 'keep_local' | 'keep_remote' | 'merge_smart';
  max_retry_attempts: number;
  sync_timeout_seconds: number;
}

interface CacheEntry<T = any> {
  key: string;
  data: T;
  expires_at: number;
  size_bytes: number;
  access_count: number;
  last_accessed: number;
  tags: string[];
}

export class MobileOfflineSyncService {
  private static instance: MobileOfflineSyncService;
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private syncSettings: SyncSettings;
  private offlineQueue: OfflineQueue[] = [];
  private conflictQueue: SyncConflict[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private currentNetworkStatus: NetworkStatus;

  private readonly STORAGE_KEYS = {
    ENTITIES: '@offline_entities',
    QUEUE: '@offline_queue',
    CONFLICTS: '@sync_conflicts',
    SETTINGS: '@sync_settings',
    LAST_SYNC: '@last_sync',
    CACHE: '@offline_cache',
  };

  private readonly API_BASE_URL = 'https://api.indorsement.app';
  private readonly DEFAULT_SETTINGS: SyncSettings = {
    auto_sync_enabled: true,
    sync_interval_minutes: 15,
    wifi_only: false,
    max_offline_storage_mb: 100,
    conflict_resolution_strategy: 'ask_user',
    max_retry_attempts: 3,
    sync_timeout_seconds: 30,
  };

  private constructor() {
    this.syncSettings = this.DEFAULT_SETTINGS;
    this.currentNetworkStatus = {
      isConnected: false,
      connectionType: 'none',
      isInternetReachable: false,
      connectionQuality: 'unknown',
    };
  }

  public static getInstance(): MobileOfflineSyncService {
    if (!MobileOfflineSyncService.instance) {
      MobileOfflineSyncService.instance = new MobileOfflineSyncService();
    }
    return MobileOfflineSyncService.instance;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  public static async initialize(): Promise<void> {
    const instance = MobileOfflineSyncService.getInstance();
    await instance.loadStoredData();
    await instance.setupNetworkMonitoring();
    await instance.startAutoSync();
    console.log('📱 Mobile offline sync service initialized');
  }

  private async loadStoredData(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      
      const [queueData, conflictsData, settingsData, cacheData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.QUEUE),
        AsyncStorage.getItem(this.STORAGE_KEYS.CONFLICTS),
        AsyncStorage.getItem(this.STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(this.STORAGE_KEYS.CACHE),
      ]);

      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }

      if (conflictsData) {
        this.conflictQueue = JSON.parse(conflictsData);
      }

      if (settingsData) {
        this.syncSettings = { ...this.DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
      }

      if (cacheData) {
        const cacheEntries = JSON.parse(cacheData);
        cacheEntries.forEach((entry: CacheEntry) => {
          this.cache.set(entry.key, entry);
        });
        await this.cleanExpiredCache();
      }
    } catch (error) {
      console.error('Failed to load offline sync data:', error);
    }
  }

  private async setupNetworkMonitoring(): Promise<void> {
    try {
      const NetInfo = await this.getNetInfo();
      
      // Initial network state
      const state = await NetInfo.fetch();
      this.updateNetworkStatus(state);

      // Listen for network changes
      NetInfo.addEventListener((state: any) => {
        this.updateNetworkStatus(state);
        
        if (state.isConnected && !this.isOnline) {
          console.log('📶 Network connection restored, starting sync...');
          this.triggerSync();
        }
      });
    } catch (error) {
      console.error('Failed to setup network monitoring:', error);
    }
  }

  private updateNetworkStatus(state: any): void {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected && state.isInternetReachable;
    
    this.currentNetworkStatus = {
      isConnected: state.isConnected,
      connectionType: state.type || 'none',
      isInternetReachable: state.isInternetReachable,
      connectionQuality: this.determineConnectionQuality(state),
    };

    if (!wasOnline && this.isOnline) {
      this.onNetworkReconnect();
    }
  }

  private determineConnectionQuality(state: any): NetworkStatus['connectionQuality'] {
    if (!state.isConnected) return 'unknown';
    
    if (state.type === 'wifi') {
      return 'excellent';
    } else if (state.type === 'cellular') {
      const details = state.details;
      if (details?.cellularGeneration === '5g') return 'excellent';
      if (details?.cellularGeneration === '4g') return 'good';
      return 'poor';
    }
    
    return 'unknown';
  }

  private async onNetworkReconnect(): Promise<void> {
    console.log('🔄 Network reconnected, processing offline queue...');
    await this.processOfflineQueue();
    
    if (this.syncSettings.auto_sync_enabled) {
      await this.triggerSync();
    }
  }

  // ===========================================
  // OFFLINE DATA MANAGEMENT
  // ===========================================

  public async saveOffline<T>(
    type: SyncableEntity['type'],
    id: string,
    data: T
  ): Promise<void> {
    try {
      const entity: SyncableEntity = {
        id,
        type,
        data,
        created_at: Date.now(),
        updated_at: Date.now(),
        sync_status: 'pending',
        device_id: await this.getDeviceId(),
        version: 1,
        checksum: this.calculateChecksum(data),
      };

      await this.storeEntity(entity);
      
      // Add to offline queue for sync
      await this.addToOfflineQueue('create', type, id, data);
      
      console.log(`💾 Saved ${type} offline: ${id}`);
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw error;
    }
  }

  public async updateOffline<T>(
    type: SyncableEntity['type'],
    id: string,
    data: T
  ): Promise<void> {
    try {
      const existingEntity = await this.getEntity(id);
      
      if (existingEntity) {
        existingEntity.data = data;
        existingEntity.updated_at = Date.now();
        existingEntity.sync_status = 'pending';
        existingEntity.version += 1;
        existingEntity.checksum = this.calculateChecksum(data);
        
        await this.storeEntity(existingEntity);
      } else {
        await this.saveOffline(type, id, data);
      }
      
      // Add to offline queue for sync
      await this.addToOfflineQueue('update', type, id, data);
      
      console.log(`📝 Updated ${type} offline: ${id}`);
    } catch (error) {
      console.error('Failed to update offline data:', error);
      throw error;
    }
  }

  public async deleteOffline(
    type: SyncableEntity['type'],
    id: string
  ): Promise<void> {
    try {
      await this.removeEntity(id);
      
      // Add to offline queue for sync
      await this.addToOfflineQueue('delete', type, id, null);
      
      console.log(`🗑️ Deleted ${type} offline: ${id}`);
    } catch (error) {
      console.error('Failed to delete offline data:', error);
      throw error;
    }
  }

  public async getOffline<T>(id: string): Promise<T | null> {
    try {
      const entity = await this.getEntity(id);
      return entity?.data || null;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  public async getAllOffline<T>(type: SyncableEntity['type']): Promise<T[]> {
    try {
      const entities = await this.getAllEntities();
      return entities
        .filter(entity => entity.type === type)
        .map(entity => entity.data);
    } catch (error) {
      console.error('Failed to get all offline data:', error);
      return [];
    }
  }

  // ===========================================
  // SYNC OPERATIONS
  // ===========================================

  public async triggerSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return {
        success: false,
        entities_synced: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
        sync_duration: 0,
        last_sync_time: Date.now(),
      };
    }

    if (!this.canSync()) {
      console.log('❌ Cannot sync - network conditions not met');
      return {
        success: false,
        entities_synced: 0,
        conflicts: [],
        errors: ['Network conditions not met for sync'],
        sync_duration: 0,
        last_sync_time: Date.now(),
      };
    }

    console.log('🔄 Starting sync operation...');
    const startTime = Date.now();
    this.syncInProgress = true;

    try {
      const result = await this.performSync();
      console.log(`✅ Sync completed in ${result.sync_duration}ms`);
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        entities_synced: 0,
        conflicts: [],
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
        sync_duration: Date.now() - startTime,
        last_sync_time: Date.now(),
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async performSync(): Promise<SyncResult> {
    const startTime = Date.now();
    const conflicts: SyncConflict[] = [];
    const errors: string[] = [];
    let entitiesSynced = 0;

    try {
      // Step 1: Download remote changes
      const remoteChanges = await this.fetchRemoteChanges();
      const downloadResult = await this.applyRemoteChanges(remoteChanges);
      entitiesSynced += downloadResult.applied;
      conflicts.push(...downloadResult.conflicts);
      errors.push(...downloadResult.errors);

      // Step 2: Upload local changes
      const localChanges = await this.getLocalChanges();
      const uploadResult = await this.uploadLocalChanges(localChanges);
      entitiesSynced += uploadResult.uploaded;
      conflicts.push(...uploadResult.conflicts);
      errors.push(...uploadResult.errors);

      // Step 3: Process offline queue
      await this.processOfflineQueue();

      // Step 4: Update sync timestamps
      await this.updateSyncTimestamps();

      return {
        success: errors.length === 0,
        entities_synced: entitiesSynced,
        conflicts,
        errors,
        sync_duration: Date.now() - startTime,
        last_sync_time: Date.now(),
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Sync operation failed');
      return {
        success: false,
        entities_synced: entitiesSynced,
        conflicts,
        errors,
        sync_duration: Date.now() - startTime,
        last_sync_time: Date.now(),
      };
    }
  }

  private async fetchRemoteChanges(): Promise<SyncableEntity[]> {
    const lastSync = await this.getLastSyncTime();
    const authToken = await this.getAuthToken();

    const response = await fetch(`${this.API_BASE_URL}/sync/changes?since=${lastSync}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      timeout: this.syncSettings.sync_timeout_seconds * 1000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch remote changes: ${response.statusText}`);
    }

    const data = await response.json();
    return data.entities || [];
  }

  private async applyRemoteChanges(remoteEntities: SyncableEntity[]): Promise<{
    applied: number;
    conflicts: SyncConflict[];
    errors: string[];
  }> {
    let applied = 0;
    const conflicts: SyncConflict[] = [];
    const errors: string[] = [];

    for (const remoteEntity of remoteEntities) {
      try {
        const localEntity = await this.getEntity(remoteEntity.id);

        if (!localEntity) {
          // New remote entity - apply directly
          await this.storeEntity(remoteEntity);
          applied++;
        } else if (localEntity.version < remoteEntity.version) {
          // Remote is newer
          if (localEntity.sync_status === 'pending') {
            // Conflict: local changes not synced yet
            conflicts.push({
              entity_id: remoteEntity.id,
              local_data: localEntity.data,
              remote_data: remoteEntity.data,
              conflict_type: 'update_conflict',
            });
          } else {
            // Safe to apply remote changes
            await this.storeEntity(remoteEntity);
            applied++;
          }
        }
        // If local version >= remote version, skip (local is up to date or newer)
      } catch (error) {
        errors.push(`Failed to apply remote change for ${remoteEntity.id}: ${error}`);
      }
    }

    return { applied, conflicts, errors };
  }

  private async getLocalChanges(): Promise<SyncableEntity[]> {
    const entities = await this.getAllEntities();
    return entities.filter(entity => entity.sync_status === 'pending');
  }

  private async uploadLocalChanges(localEntities: SyncableEntity[]): Promise<{
    uploaded: number;
    conflicts: SyncConflict[];
    errors: string[];
  }> {
    let uploaded = 0;
    const conflicts: SyncConflict[] = [];
    const errors: string[] = [];
    const authToken = await this.getAuthToken();

    for (const localEntity of localEntities) {
      try {
        const response = await fetch(`${this.API_BASE_URL}/sync/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(localEntity),
          timeout: this.syncSettings.sync_timeout_seconds * 1000,
        });

        if (response.ok) {
          const result = await response.json();
          localEntity.sync_status = 'synced';
          localEntity.last_synced = Date.now();
          if (result.version) {
            localEntity.version = result.version;
          }
          await this.storeEntity(localEntity);
          uploaded++;
        } else if (response.status === 409) {
          // Conflict
          const conflictData = await response.json();
          conflicts.push({
            entity_id: localEntity.id,
            local_data: localEntity.data,
            remote_data: conflictData.remote_data,
            conflict_type: 'update_conflict',
          });
        } else {
          errors.push(`Failed to upload ${localEntity.id}: ${response.statusText}`);
        }
      } catch (error) {
        errors.push(`Network error uploading ${localEntity.id}: ${error}`);
      }
    }

    return { uploaded, conflicts, errors };
  }

  // ===========================================
  // OFFLINE QUEUE MANAGEMENT
  // ===========================================

  private async addToOfflineQueue(
    operation: OfflineQueue['operation'],
    entityType: string,
    entityId: string,
    data: any
  ): Promise<void> {
    const queueItem: OfflineQueue = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      entity_type: entityType,
      entity_id: entityId,
      data,
      timestamp: Date.now(),
      retry_count: 0,
      max_retries: this.syncSettings.max_retry_attempts,
      status: 'pending',
    };

    this.offlineQueue.push(queueItem);
    await this.saveOfflineQueue();
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    console.log(`📤 Processing ${this.offlineQueue.length} offline operations...`);
    const authToken = await this.getAuthToken();

    for (let i = this.offlineQueue.length - 1; i >= 0; i--) {
      const item = this.offlineQueue[i];
      
      if (item.status === 'completed' || item.retry_count >= item.max_retries) {
        this.offlineQueue.splice(i, 1);
        continue;
      }

      try {
        item.status = 'processing';
        item.retry_count++;

        let endpoint = `${this.API_BASE_URL}/${item.entity_type}`;
        let method = 'POST';
        let body = JSON.stringify(item.data);

        switch (item.operation) {
          case 'create':
            method = 'POST';
            break;
          case 'update':
            method = 'PUT';
            endpoint += `/${item.entity_id}`;
            break;
          case 'delete':
            method = 'DELETE';
            endpoint += `/${item.entity_id}`;
            body = undefined;
            break;
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body,
          timeout: this.syncSettings.sync_timeout_seconds * 1000,
        });

        if (response.ok) {
          item.status = 'completed';
          console.log(`✅ Offline operation completed: ${item.operation} ${item.entity_type} ${item.entity_id}`);
        } else {
          item.status = 'failed';
          console.error(`❌ Offline operation failed: ${response.statusText}`);
        }
      } catch (error) {
        item.status = 'failed';
        console.error(`❌ Offline operation error:`, error);
      }
    }

    // Remove completed and failed items
    this.offlineQueue = this.offlineQueue.filter(
      item => item.status !== 'completed' && item.retry_count < item.max_retries
    );

    await this.saveOfflineQueue();
  }

  // ===========================================
  // CACHE MANAGEMENT
  // ===========================================

  public async cacheData<T>(
    key: string,
    data: T,
    ttlMinutes: number = 60,
    tags: string[] = []
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      data,
      expires_at: Date.now() + (ttlMinutes * 60 * 1000),
      size_bytes: this.calculateDataSize(data),
      access_count: 0,
      last_accessed: Date.now(),
      tags,
    };

    this.cache.set(key, entry);
    await this.saveCache();
  }

  public async getCachedData<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (entry.expires_at < Date.now()) {
      this.cache.delete(key);
      await this.saveCache();
      return null;
    }

    entry.access_count++;
    entry.last_accessed = Date.now();
    this.cache.set(key, entry);

    return entry.data;
  }

  public async invalidateCache(key?: string, tags?: string[]): Promise<void> {
    if (key) {
      this.cache.delete(key);
    } else if (tags && tags.length > 0) {
      for (const [cacheKey, entry] of this.cache.entries()) {
        if (entry.tags.some(tag => tags.includes(tag))) {
          this.cache.delete(cacheKey);
        }
      }
    } else {
      this.cache.clear();
    }

    await this.saveCache();
  }

  private async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires_at < now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      await this.saveCache();
      console.log(`🗑️ Cleaned ${expiredKeys.length} expired cache entries`);
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private canSync(): boolean {
    if (!this.isOnline) {
      return false;
    }

    if (this.syncSettings.wifi_only && this.currentNetworkStatus.connectionType !== 'wifi') {
      return false;
    }

    return true;
  }

  private calculateChecksum(data: any): string {
    const CryptoJS = require('crypto-js');
    const dataString = JSON.stringify(data);
    return CryptoJS.MD5(dataString).toString();
  }

  private calculateDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private async getDeviceId(): Promise<string> {
    const AsyncStorage = await this.getAsyncStorage();
    let deviceId = await AsyncStorage.getItem('@device_id');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('@device_id', deviceId);
    }
    
    return deviceId;
  }

  private async getAuthToken(): Promise<string | null> {
    // This would integrate with the MobileAuthService
    return null; // Placeholder
  }

  private async getLastSyncTime(): Promise<number> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      const lastSync = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      return lastSync ? parseInt(lastSync, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async updateSyncTimestamps(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Failed to update sync timestamp:', error);
    }
  }

  // ===========================================
  // DATA PERSISTENCE
  // ===========================================

  private async storeEntity(entity: SyncableEntity): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      const key = `${this.STORAGE_KEYS.ENTITIES}_${entity.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(entity));
    } catch (error) {
      console.error('Failed to store entity:', error);
      throw error;
    }
  }

  private async getEntity(id: string): Promise<SyncableEntity | null> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      const key = `${this.STORAGE_KEYS.ENTITIES}_${id}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get entity:', error);
      return null;
    }
  }

  private async removeEntity(id: string): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      const key = `${this.STORAGE_KEYS.ENTITIES}_${id}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove entity:', error);
    }
  }

  private async getAllEntities(): Promise<SyncableEntity[]> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      const keys = await AsyncStorage.getAllKeys();
      const entityKeys = keys.filter(key => key.startsWith(this.STORAGE_KEYS.ENTITIES));
      
      const entities: SyncableEntity[] = [];
      for (const key of entityKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          entities.push(JSON.parse(data));
        }
      }
      
      return entities;
    } catch (error) {
      console.error('Failed to get all entities:', error);
      return [];
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.QUEUE, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      const cacheArray = Array.from(this.cache.values());
      await AsyncStorage.setItem(this.STORAGE_KEYS.CACHE, JSON.stringify(cacheArray));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  private async startAutoSync(): Promise<void> {
    if (this.syncSettings.auto_sync_enabled && !this.syncInterval) {
      const intervalMs = this.syncSettings.sync_interval_minutes * 60 * 1000;
      
      this.syncInterval = setInterval(async () => {
        if (this.canSync() && !this.syncInProgress) {
          await this.triggerSync();
        }
      }, intervalMs);
      
      console.log(`⏰ Auto-sync enabled (${this.syncSettings.sync_interval_minutes} min intervals)`);
    }
  }

  private async stopAutoSync(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Auto-sync stopped');
    }
  }

  // Dynamic imports for React Native dependencies
  private async getAsyncStorage(): Promise<any> {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default;
  }

  private async getNetInfo(): Promise<any> {
    const NetInfo = await import('@react-native-netinfo/netinfo');
    return NetInfo.default;
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  public static async saveOffline<T>(
    type: SyncableEntity['type'],
    id: string,
    data: T
  ): Promise<void> {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.saveOffline(type, id, data);
  }

  public static async getOffline<T>(id: string): Promise<T | null> {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.getOffline<T>(id);
  }

  public static async getAllOffline<T>(type: SyncableEntity['type']): Promise<T[]> {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.getAllOffline<T>(type);
  }

  public static async sync(): Promise<SyncResult> {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.triggerSync();
  }

  public static async cacheData<T>(
    key: string,
    data: T,
    ttlMinutes?: number,
    tags?: string[]
  ): Promise<void> {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.cacheData(key, data, ttlMinutes, tags);
  }

  public static async getCachedData<T>(key: string): Promise<T | null> {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.getCachedData<T>(key);
  }

  public static isOnline(): boolean {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.isOnline;
  }

  public static getNetworkStatus(): NetworkStatus {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.currentNetworkStatus;
  }

  public static getPendingOperationsCount(): number {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.offlineQueue.filter(item => item.status === 'pending').length;
  }

  public static getConflictsCount(): number {
    const instance = MobileOfflineSyncService.getInstance();
    return instance.conflictQueue.length;
  }
}

export { MobileOfflineSyncService };