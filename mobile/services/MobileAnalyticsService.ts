// ===========================================
// MOBILE ANALYTICS SERVICE
// Performance Tracking & User Behavior Analytics
// ===========================================

interface AnalyticsEvent {
  id: string;
  name: string;
  category: 'user_action' | 'navigation' | 'performance' | 'error' | 'engagement' | 'conversion';
  properties: Record<string, any>;
  user_id?: string;
  session_id: string;
  device_id: string;
  timestamp: number;
  app_version: string;
  os_version: string;
  platform: 'ios' | 'android';
  network_type: string;
  battery_level?: number;
  memory_usage?: number;
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

interface UserSession {
  id: string;
  user_id?: string;
  device_id: string;
  start_time: number;
  end_time?: number;
  duration?: number;
  page_views: number;
  events_count: number;
  is_active: boolean;
  app_version: string;
  os_version: string;
  platform: 'ios' | 'android';
  initial_screen: string;
  last_screen: string;
  network_type: string;
  crashed: boolean;
}

interface PerformanceMetric {
  id: string;
  metric_type: 'app_launch' | 'screen_load' | 'api_request' | 'image_load' | 'custom';
  metric_name: string;
  value: number;
  unit: 'ms' | 'seconds' | 'bytes' | 'count' | 'percentage';
  session_id: string;
  timestamp: number;
  context: Record<string, any>;
  threshold_exceeded?: boolean;
  critical?: boolean;
}

interface CrashReport {
  id: string;
  session_id: string;
  user_id?: string;
  error_message: string;
  stack_trace: string;
  error_type: string;
  occurred_at: number;
  app_version: string;
  os_version: string;
  platform: 'ios' | 'android';
  device_model: string;
  memory_usage: number;
  battery_level: number;
  network_status: string;
  user_actions_before_crash: AnalyticsEvent[];
  additional_context: Record<string, any>;
  reported_to_server: boolean;
}

interface UserBehaviorMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  session_duration_avg: number;
  session_count_avg: number;
  screen_views_avg: number;
  retention_rate: {
    day_1: number;
    day_7: number;
    day_30: number;
  };
  conversion_rates: Record<string, number>;
  feature_adoption: Record<string, {
    users_tried: number;
    users_adopted: number;
    adoption_rate: number;
  }>;
}

interface AnalyticsConfig {
  enabled: boolean;
  auto_track_screens: boolean;
  auto_track_crashes: boolean;
  auto_track_performance: boolean;
  track_user_properties: boolean;
  batch_size: number;
  upload_interval_seconds: number;
  offline_storage_limit_mb: number;
  sampling_rate: number; // 0.0 to 1.0
  privacy_mode: boolean;
  debug_mode: boolean;
  custom_user_id?: string;
}

interface AnalyticsBatch {
  id: string;
  events: AnalyticsEvent[];
  performance_metrics: PerformanceMetric[];
  crash_reports: CrashReport[];
  session_updates: Partial<UserSession>[];
  created_at: number;
  upload_attempts: number;
  uploaded: boolean;
}

export class MobileAnalyticsService {
  private static instance: MobileAnalyticsService;
  private currentSession: UserSession | null = null;
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private crashQueue: CrashReport[] = [];
  private pendingBatches: AnalyticsBatch[] = [];
  private uploadTimer: NodeJS.Timeout | null = null;
  private lastScreenName: string = '';
  private screenStartTime: number = 0;
  private deviceInfo: any = {};
  private networkInfo: any = {};

  private readonly STORAGE_KEYS = {
    CONFIG: '@analytics_config',
    SESSION: '@current_session',
    EVENT_QUEUE: '@event_queue',
    PERFORMANCE_QUEUE: '@performance_queue',
    CRASH_QUEUE: '@crash_queue',
    PENDING_BATCHES: '@pending_batches',
    USER_METRICS: '@user_metrics',
    DEVICE_INFO: '@device_info',
  };

  private readonly DEFAULT_CONFIG: AnalyticsConfig = {
    enabled: true,
    auto_track_screens: true,
    auto_track_crashes: true,
    auto_track_performance: true,
    track_user_properties: true,
    batch_size: 20,
    upload_interval_seconds: 30,
    offline_storage_limit_mb: 10,
    sampling_rate: 1.0,
    privacy_mode: false,
    debug_mode: __DEV__ || false,
  };

  private readonly API_BASE_URL = 'https://api.indorsement.app';

  private constructor() {
    this.config = this.DEFAULT_CONFIG;
  }

  public static getInstance(): MobileAnalyticsService {
    if (!MobileAnalyticsService.instance) {
      MobileAnalyticsService.instance = new MobileAnalyticsService();
    }
    return MobileAnalyticsService.instance;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  public static async initialize(customConfig?: Partial<AnalyticsConfig>): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    await instance.initializeService(customConfig);
    console.log('📊 Mobile analytics service initialized');
  }

  private async initializeService(customConfig?: Partial<AnalyticsConfig>): Promise<void> {
    try {
      await this.loadStoredData();
      
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
        await this.saveConfig();
      }

      await this.setupDeviceInfo();
      await this.setupNetworkMonitoring();
      await this.startNewSession();
      
      if (this.config.auto_track_crashes) {
        this.setupCrashReporting();
      }

      this.startUploadTimer();
      
      // Track app launch
      await this.trackPerformance('app_launch', 'App Launch Time', Date.now() - this.currentSession!.start_time);
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  private async loadStoredData(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      
      const [configData, sessionData, eventQueueData, performanceQueueData, crashQueueData, batchesData, deviceInfoData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(this.STORAGE_KEYS.SESSION),
        AsyncStorage.getItem(this.STORAGE_KEYS.EVENT_QUEUE),
        AsyncStorage.getItem(this.STORAGE_KEYS.PERFORMANCE_QUEUE),
        AsyncStorage.getItem(this.STORAGE_KEYS.CRASH_QUEUE),
        AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_BATCHES),
        AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_INFO),
      ]);

      if (configData) {
        this.config = { ...this.DEFAULT_CONFIG, ...JSON.parse(configData) };
      }

      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Resume session if it was active recently (less than 30 minutes ago)
        if (session.is_active && Date.now() - session.start_time < 30 * 60 * 1000) {
          this.currentSession = session;
        }
      }

      if (eventQueueData) {
        this.eventQueue = JSON.parse(eventQueueData);
      }

      if (performanceQueueData) {
        this.performanceQueue = JSON.parse(performanceQueueData);
      }

      if (crashQueueData) {
        this.crashQueue = JSON.parse(crashQueueData);
      }

      if (batchesData) {
        this.pendingBatches = JSON.parse(batchesData);
      }

      if (deviceInfoData) {
        this.deviceInfo = JSON.parse(deviceInfoData);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  private async setupDeviceInfo(): Promise<void> {
    try {
      const Platform = await this.getPlatform();
      const DeviceInfo = await this.getDeviceInfo();
      
      this.deviceInfo = {
        platform: Platform.OS,
        os_version: Platform.Version.toString(),
        device_model: await DeviceInfo.getModel(),
        device_id: await DeviceInfo.getUniqueId(),
        app_version: await DeviceInfo.getVersion(),
        build_number: await DeviceInfo.getBuildNumber(),
        system_name: await DeviceInfo.getSystemName(),
        system_version: await DeviceInfo.getSystemVersion(),
        bundle_id: await DeviceInfo.getBundleId(),
        device_name: await DeviceInfo.getDeviceName(),
        brand: await DeviceInfo.getBrand(),
        manufacturer: await DeviceInfo.getManufacturer(),
        total_memory: await DeviceInfo.getTotalMemory(),
        is_tablet: await DeviceInfo.isTablet(),
        has_notch: await DeviceInfo.hasNotch(),
        is_emulator: await DeviceInfo.isEmulator(),
      };

      await this.saveDeviceInfo();
    } catch (error) {
      console.error('Failed to setup device info:', error);
      // Fallback device info
      const Platform = await this.getPlatform();
      this.deviceInfo = {
        platform: Platform.OS,
        os_version: Platform.Version.toString(),
        device_id: `fallback_${Date.now()}`,
        app_version: '1.0.0',
      };
    }
  }

  private async setupNetworkMonitoring(): Promise<void> {
    try {
      const NetInfo = await this.getNetInfo();
      
      // Get initial network state
      const state = await NetInfo.fetch();
      this.updateNetworkInfo(state);

      // Listen for network changes
      NetInfo.addEventListener((state: any) => {
        this.updateNetworkInfo(state);
      });
    } catch (error) {
      console.error('Failed to setup network monitoring:', error);
    }
  }

  private updateNetworkInfo(state: any): void {
    this.networkInfo = {
      type: state.type || 'unknown',
      is_connected: state.isConnected || false,
      is_internet_reachable: state.isInternetReachable || false,
      details: state.details || {},
    };
  }

  // ===========================================
  // SESSION MANAGEMENT
  // ===========================================

  private async startNewSession(): Promise<void> {
    try {
      // End current session if exists
      if (this.currentSession) {
        await this.endSession();
      }

      // Create new session
      this.currentSession = {
        id: this.generateSessionId(),
        user_id: this.config.custom_user_id,
        device_id: this.deviceInfo.device_id,
        start_time: Date.now(),
        page_views: 0,
        events_count: 0,
        is_active: true,
        app_version: this.deviceInfo.app_version,
        os_version: this.deviceInfo.os_version,
        platform: this.deviceInfo.platform,
        initial_screen: 'App Launch',
        last_screen: 'App Launch',
        network_type: this.networkInfo.type,
        crashed: false,
      };

      await this.saveSession();
      
      // Track session start event
      await this.trackEvent('session_start', 'engagement', {
        session_id: this.currentSession.id,
        app_version: this.deviceInfo.app_version,
        device_model: this.deviceInfo.device_model,
        os_version: this.deviceInfo.os_version,
        network_type: this.networkInfo.type,
      });

      if (this.config.debug_mode) {
        console.log('📱 New analytics session started:', this.currentSession.id);
      }
    } catch (error) {
      console.error('Failed to start new session:', error);
    }
  }

  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.currentSession.end_time = Date.now();
      this.currentSession.duration = this.currentSession.end_time - this.currentSession.start_time;
      this.currentSession.is_active = false;

      await this.saveSession();

      // Track session end event
      await this.trackEvent('session_end', 'engagement', {
        session_id: this.currentSession.id,
        duration: this.currentSession.duration,
        page_views: this.currentSession.page_views,
        events_count: this.currentSession.events_count,
      });

      if (this.config.debug_mode) {
        console.log('📱 Analytics session ended:', this.currentSession.id, `Duration: ${this.currentSession.duration}ms`);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // ===========================================
  // EVENT TRACKING
  // ===========================================

  public async trackEvent(
    name: string,
    category: AnalyticsEvent['category'],
    properties: Record<string, any> = {}
  ): Promise<void> {
    if (!this.config.enabled || !this.shouldSample()) {
      return;
    }

    try {
      const event: AnalyticsEvent = {
        id: this.generateEventId(),
        name,
        category,
        properties: this.sanitizeProperties(properties),
        user_id: this.config.custom_user_id,
        session_id: this.currentSession?.id || '',
        device_id: this.deviceInfo.device_id,
        timestamp: Date.now(),
        app_version: this.deviceInfo.app_version,
        os_version: this.deviceInfo.os_version,
        platform: this.deviceInfo.platform,
        network_type: this.networkInfo.type,
        battery_level: await this.getBatteryLevel(),
        memory_usage: await this.getMemoryUsage(),
      };

      this.eventQueue.push(event);
      
      if (this.currentSession) {
        this.currentSession.events_count++;
        await this.saveSession();
      }

      await this.saveEventQueue();

      if (this.config.debug_mode) {
        console.log('📊 Event tracked:', name, properties);
      }

      // Trigger batch upload if queue is full
      if (this.eventQueue.length >= this.config.batch_size) {
        await this.uploadBatch();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  public async trackScreen(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    if (!this.config.auto_track_screens) return;

    try {
      // Track previous screen time if exists
      if (this.lastScreenName && this.screenStartTime) {
        const timeOnScreen = Date.now() - this.screenStartTime;
        await this.trackPerformance('screen_load', `${this.lastScreenName} View Time`, timeOnScreen);
      }

      // Track new screen view
      await this.trackEvent('screen_view', 'navigation', {
        screen_name: screenName,
        previous_screen: this.lastScreenName,
        ...properties,
      });

      // Update session data
      if (this.currentSession) {
        this.currentSession.page_views++;
        this.currentSession.last_screen = screenName;
        await this.saveSession();
      }

      this.lastScreenName = screenName;
      this.screenStartTime = Date.now();

      if (this.config.debug_mode) {
        console.log('📱 Screen tracked:', screenName);
      }
    } catch (error) {
      console.error('Failed to track screen:', error);
    }
  }

  public async trackPerformance(
    metricType: PerformanceMetric['metric_type'],
    metricName: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    context: Record<string, any> = {}
  ): Promise<void> {
    if (!this.config.auto_track_performance) return;

    try {
      const metric: PerformanceMetric = {
        id: this.generateMetricId(),
        metric_type: metricType,
        metric_name: metricName,
        value,
        unit,
        session_id: this.currentSession?.id || '',
        timestamp: Date.now(),
        context: this.sanitizeProperties(context),
        threshold_exceeded: this.checkPerformanceThreshold(metricType, value),
        critical: this.isPerformanceCritical(metricType, value),
      };

      this.performanceQueue.push(metric);
      await this.savePerformanceQueue();

      if (this.config.debug_mode) {
        console.log('⚡ Performance tracked:', metricName, `${value}${unit}`);
      }

      // Track as event if critical
      if (metric.critical) {
        await this.trackEvent('performance_critical', 'performance', {
          metric_type: metricType,
          metric_name: metricName,
          value,
          unit,
        });
      }
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  public async trackError(
    error: Error,
    context: Record<string, any> = {},
    isFatal: boolean = false
  ): Promise<void> {
    try {
      await this.trackEvent('error_occurred', 'error', {
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack?.substring(0, 1000), // Limit stack trace length
        is_fatal: isFatal,
        ...context,
      });

      if (isFatal) {
        await this.trackCrash(error, context);
      }

      if (this.config.debug_mode) {
        console.log('❌ Error tracked:', error.message);
      }
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }

  private async trackCrash(error: Error, context: Record<string, any> = {}): Promise<void> {
    if (!this.config.auto_track_crashes) return;

    try {
      const crashReport: CrashReport = {
        id: this.generateCrashId(),
        session_id: this.currentSession?.id || '',
        user_id: this.config.custom_user_id,
        error_message: error.message,
        stack_trace: error.stack || '',
        error_type: error.name,
        occurred_at: Date.now(),
        app_version: this.deviceInfo.app_version,
        os_version: this.deviceInfo.os_version,
        platform: this.deviceInfo.platform,
        device_model: this.deviceInfo.device_model,
        memory_usage: await this.getMemoryUsage(),
        battery_level: await this.getBatteryLevel(),
        network_status: this.networkInfo.type,
        user_actions_before_crash: this.getRecentEvents(10),
        additional_context: this.sanitizeProperties(context),
        reported_to_server: false,
      };

      this.crashQueue.push(crashReport);
      await this.saveCrashQueue();

      // Mark session as crashed
      if (this.currentSession) {
        this.currentSession.crashed = true;
        await this.saveSession();
      }

      // Immediately try to upload crash report
      await this.uploadCrashReports();

      if (this.config.debug_mode) {
        console.log('💥 Crash tracked:', error.message);
      }
    } catch (reportError) {
      console.error('Failed to track crash:', reportError);
    }
  }

  // ===========================================
  // USER PROPERTIES
  // ===========================================

  public async setUserProperty(key: string, value: any): Promise<void> {
    if (!this.config.track_user_properties) return;

    try {
      await this.trackEvent('user_property_set', 'user_action', {
        property_name: key,
        property_value: value,
      });

      if (this.config.debug_mode) {
        console.log('👤 User property set:', key, value);
      }
    } catch (error) {
      console.error('Failed to set user property:', error);
    }
  }

  public async setUserId(userId: string): Promise<void> {
    try {
      this.config.custom_user_id = userId;
      await this.saveConfig();

      if (this.currentSession) {
        this.currentSession.user_id = userId;
        await this.saveSession();
      }

      await this.trackEvent('user_identified', 'user_action', {
        user_id: userId,
      });

      if (this.config.debug_mode) {
        console.log('👤 User ID set:', userId);
      }
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  // ===========================================
  // BATCH UPLOAD
  // ===========================================

  private async uploadBatch(): Promise<void> {
    if (this.eventQueue.length === 0 && this.performanceQueue.length === 0 && this.crashQueue.length === 0) {
      return;
    }

    try {
      const batch: AnalyticsBatch = {
        id: this.generateBatchId(),
        events: [...this.eventQueue],
        performance_metrics: [...this.performanceQueue],
        crash_reports: [...this.crashQueue],
        session_updates: this.currentSession ? [this.currentSession] : [],
        created_at: Date.now(),
        upload_attempts: 0,
        uploaded: false,
      };

      // Clear queues
      this.eventQueue = [];
      this.performanceQueue = [];
      this.crashQueue = [];

      await Promise.all([
        this.saveEventQueue(),
        this.savePerformanceQueue(),
        this.saveCrashQueue(),
      ]);

      // Try to upload
      const uploaded = await this.uploadBatchToServer(batch);
      
      if (uploaded) {
        if (this.config.debug_mode) {
          console.log('📤 Analytics batch uploaded successfully');
        }
      } else {
        // Store for retry
        this.pendingBatches.push(batch);
        await this.savePendingBatches();
        
        if (this.config.debug_mode) {
          console.log('📦 Analytics batch queued for retry');
        }
      }
    } catch (error) {
      console.error('Failed to upload batch:', error);
    }
  }

  private async uploadBatchToServer(batch: AnalyticsBatch): Promise<boolean> {
    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch(`${this.API_BASE_URL}/analytics/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'X-Analytics-Version': '1.0',
          'X-Device-ID': this.deviceInfo.device_id,
        },
        body: JSON.stringify({
          batch_id: batch.id,
          device_info: this.deviceInfo,
          network_info: this.networkInfo,
          events: batch.events,
          performance_metrics: batch.performance_metrics,
          crash_reports: batch.crash_reports,
          session_updates: batch.session_updates,
        }),
        timeout: 30000,
      });

      batch.upload_attempts++;
      
      if (response.ok) {
        batch.uploaded = true;
        return true;
      } else {
        console.error('Analytics upload failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      batch.upload_attempts++;
      console.error('Analytics upload error:', error);
      return false;
    }
  }

  private async uploadCrashReports(): Promise<void> {
    const unsentCrashes = this.crashQueue.filter(crash => !crash.reported_to_server);
    
    for (const crash of unsentCrashes) {
      try {
        const uploaded = await this.uploadBatchToServer({
          id: this.generateBatchId(),
          events: [],
          performance_metrics: [],
          crash_reports: [crash],
          session_updates: [],
          created_at: Date.now(),
          upload_attempts: 0,
          uploaded: false,
        });

        if (uploaded) {
          crash.reported_to_server = true;
        }
      } catch (error) {
        console.error('Failed to upload crash report:', error);
      }
    }

    await this.saveCrashQueue();
  }

  private async retryPendingBatches(): Promise<void> {
    const retryableBatches = this.pendingBatches.filter(
      batch => !batch.uploaded && batch.upload_attempts < 3
    );

    for (const batch of retryableBatches) {
      const uploaded = await this.uploadBatchToServer(batch);
      if (uploaded) {
        this.pendingBatches = this.pendingBatches.filter(b => b.id !== batch.id);
      }
    }

    // Clean up old failed batches (older than 7 days)
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.pendingBatches = this.pendingBatches.filter(
      batch => batch.created_at > cutoffTime
    );

    await this.savePendingBatches();
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private shouldSample(): boolean {
    return Math.random() < this.config.sampling_rate;
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    if (this.config.privacy_mode) {
      // Remove or hash sensitive data in privacy mode
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(properties)) {
        if (!this.isSensitiveProperty(key)) {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return properties;
  }

  private isSensitiveProperty(key: string): boolean {
    const sensitiveKeys = ['password', 'email', 'phone', 'ssn', 'credit_card', 'token', 'secret'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }

  private checkPerformanceThreshold(metricType: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'app_launch': 3000, // 3 seconds
      'screen_load': 2000, // 2 seconds
      'api_request': 5000, // 5 seconds
      'image_load': 3000,  // 3 seconds
    };
    return value > (thresholds[metricType] || 10000);
  }

  private isPerformanceCritical(metricType: string, value: number): boolean {
    const criticalThresholds: Record<string, number> = {
      'app_launch': 10000, // 10 seconds
      'screen_load': 8000,  // 8 seconds
      'api_request': 15000, // 15 seconds
      'image_load': 10000,  // 10 seconds
    };
    return value > (criticalThresholds[metricType] || 30000);
  }

  private getRecentEvents(count: number): AnalyticsEvent[] {
    return this.eventQueue.slice(-count);
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      const DeviceInfo = await this.getDeviceInfo();
      return await DeviceInfo.getBatteryLevel();
    } catch {
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      const DeviceInfo = await this.getDeviceInfo();
      const usedMemory = await DeviceInfo.getUsedMemory();
      const totalMemory = await DeviceInfo.getTotalMemory();
      return (usedMemory / totalMemory) * 100;
    } catch {
      return 0;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startUploadTimer(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }

    this.uploadTimer = setInterval(async () => {
      await this.uploadBatch();
      await this.retryPendingBatches();
    }, this.config.upload_interval_seconds * 1000);
  }

  private async getAuthToken(): Promise<string | null> {
    // This would integrate with your auth service
    return null;
  }

  // Dynamic imports for React Native dependencies
  private async getPlatform(): Promise<any> {
    const RN = await import('react-native');
    return RN.Platform;
  }

  private async getDeviceInfo(): Promise<any> {
    return await import('react-native-device-info');
  }

  private async getNetInfo(): Promise<any> {
    const NetInfo = await import('@react-native-netinfo/netinfo');
    return NetInfo.default;
  }

  private async getAsyncStorage(): Promise<any> {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default;
  }

  // ===========================================
  // DATA PERSISTENCE
  // ===========================================

  private async saveConfig(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save analytics config:', error);
    }
  }

  private async saveSession(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  private async saveEventQueue(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Failed to save event queue:', error);
    }
  }

  private async savePerformanceQueue(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.PERFORMANCE_QUEUE, JSON.stringify(this.performanceQueue));
    } catch (error) {
      console.error('Failed to save performance queue:', error);
    }
  }

  private async saveCrashQueue(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.CRASH_QUEUE, JSON.stringify(this.crashQueue));
    } catch (error) {
      console.error('Failed to save crash queue:', error);
    }
  }

  private async savePendingBatches(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.PENDING_BATCHES, JSON.stringify(this.pendingBatches));
    } catch (error) {
      console.error('Failed to save pending batches:', error);
    }
  }

  private async saveDeviceInfo(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICE_INFO, JSON.stringify(this.deviceInfo));
    } catch (error) {
      console.error('Failed to save device info:', error);
    }
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  public static async trackEvent(
    name: string,
    category: AnalyticsEvent['category'],
    properties?: Record<string, any>
  ): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    return instance.trackEvent(name, category, properties);
  }

  public static async trackScreen(screenName: string, properties?: Record<string, any>): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    return instance.trackScreen(screenName, properties);
  }

  public static async trackPerformance(
    metricType: PerformanceMetric['metric_type'],
    metricName: string,
    value: number,
    unit?: PerformanceMetric['unit'],
    context?: Record<string, any>
  ): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    return instance.trackPerformance(metricType, metricName, value, unit, context);
  }

  public static async trackError(
    error: Error,
    context?: Record<string, any>,
    isFatal?: boolean
  ): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    return instance.trackError(error, context, isFatal);
  }

  public static async setUserProperty(key: string, value: any): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    return instance.setUserProperty(key, value);
  }

  public static async setUserId(userId: string): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    return instance.setUserId(userId);
  }

  public static async updateConfig(newConfig: Partial<AnalyticsConfig>): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    instance.config = { ...instance.config, ...newConfig };
    await instance.saveConfig();
  }

  public static getConfig(): AnalyticsConfig {
    const instance = MobileAnalyticsService.getInstance();
    return { ...instance.config };
  }

  public static getCurrentSession(): UserSession | null {
    const instance = MobileAnalyticsService.getInstance();
    return instance.currentSession;
  }

  public static async flush(): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    await instance.uploadBatch();
  }

  public static async endSession(): Promise<void> {
    const instance = MobileAnalyticsService.getInstance();
    await instance.endSession();
  }
}

export { MobileAnalyticsService };