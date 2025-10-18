// ===========================================
// MOBILE PUSH NOTIFICATION SERVICE
// Push Notifications & Real-time Messaging
// ===========================================

interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge_count?: number;
  sound?: string;
  category?: string;
  scheduled_time?: number;
  expires_at?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  type: 'system' | 'endorsement' | 'document' | 'reminder' | 'marketing' | 'security';
  user_id?: string;
  created_at: number;
  delivered_at?: number;
  opened_at?: number;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed' | 'expired';
}

interface NotificationSettings {
  enabled: boolean;
  endorsements: boolean;
  documents: boolean;
  reminders: boolean;
  security_alerts: boolean;
  marketing: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string;   // HH:MM format
  sound_enabled: boolean;
  vibration_enabled: boolean;
  badge_enabled: boolean;
  preview_enabled: boolean;
}

interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  requires_auth?: boolean;
  input_placeholder?: string;
  input_button_title?: string;
}

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  actions: NotificationAction[];
  allow_in_car_play?: boolean;
  allow_announcement?: boolean;
  hidden_preview_placeholder?: string;
}

interface PushToken {
  token: string;
  platform: 'ios' | 'android';
  device_id: string;
  app_version: string;
  os_version: string;
  created_at: number;
  last_used: number;
  is_active: boolean;
}

interface NotificationAnalytics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  delivery_rate: number;
  open_rate: number;
  by_type: Record<string, {
    sent: number;
    delivered: number;
    opened: number;
  }>;
  by_hour: Record<string, number>;
  by_day: Record<string, number>;
}

interface ScheduledNotification {
  id: string;
  notification: Omit<PushNotification, 'id' | 'created_at' | 'status'>;
  trigger_time: number;
  repeat_interval?: 'daily' | 'weekly' | 'monthly';
  repeat_count?: number;
  timezone: string;
  is_active: boolean;
}

export class MobilePushNotificationService {
  private static instance: MobilePushNotificationService;
  private pushToken: PushToken | null = null;
  private notificationSettings: NotificationSettings;
  private categories: Map<string, NotificationCategory> = new Map();
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private analytics: NotificationAnalytics;
  private permissionStatus: 'undetermined' | 'granted' | 'denied' = 'undetermined';

  private readonly STORAGE_KEYS = {
    PUSH_TOKEN: '@push_token',
    SETTINGS: '@notification_settings',
    CATEGORIES: '@notification_categories',
    SCHEDULED: '@scheduled_notifications',
    ANALYTICS: '@notification_analytics',
    PERMISSION: '@notification_permission',
  };

  private readonly DEFAULT_SETTINGS: NotificationSettings = {
    enabled: true,
    endorsements: true,
    documents: true,
    reminders: true,
    security_alerts: true,
    marketing: false,
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    sound_enabled: true,
    vibration_enabled: true,
    badge_enabled: true,
    preview_enabled: true,
  };

  private readonly DEFAULT_ANALYTICS: NotificationAnalytics = {
    total_sent: 0,
    total_delivered: 0,
    total_opened: 0,
    delivery_rate: 0,
    open_rate: 0,
    by_type: {},
    by_hour: {},
    by_day: {},
  };

  private readonly API_BASE_URL = 'https://api.indorsement.app';

  private constructor() {
    this.notificationSettings = this.DEFAULT_SETTINGS;
    this.analytics = this.DEFAULT_ANALYTICS;
    this.setupDefaultCategories();
  }

  public static getInstance(): MobilePushNotificationService {
    if (!MobilePushNotificationService.instance) {
      MobilePushNotificationService.instance = new MobilePushNotificationService();
    }
    return MobilePushNotificationService.instance;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  public static async initialize(): Promise<void> {
    const instance = MobilePushNotificationService.getInstance();
    await instance.loadStoredData();
    await instance.setupNotifications();
    await instance.requestPermissions();
    console.log('🔔 Mobile push notification service initialized');
  }

  private async loadStoredData(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      
      const [tokenData, settingsData, categoriesData, scheduledData, analyticsData, permissionData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.PUSH_TOKEN),
        AsyncStorage.getItem(this.STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(this.STORAGE_KEYS.CATEGORIES),
        AsyncStorage.getItem(this.STORAGE_KEYS.SCHEDULED),
        AsyncStorage.getItem(this.STORAGE_KEYS.ANALYTICS),
        AsyncStorage.getItem(this.STORAGE_KEYS.PERMISSION),
      ]);

      if (tokenData) {
        this.pushToken = JSON.parse(tokenData);
      }

      if (settingsData) {
        this.notificationSettings = { ...this.DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
      }

      if (categoriesData) {
        const categories = JSON.parse(categoriesData);
        categories.forEach((category: NotificationCategory) => {
          this.categories.set(category.id, category);
        });
      }

      if (scheduledData) {
        const scheduled = JSON.parse(scheduledData);
        scheduled.forEach((notification: ScheduledNotification) => {
          this.scheduledNotifications.set(notification.id, notification);
        });
      }

      if (analyticsData) {
        this.analytics = { ...this.DEFAULT_ANALYTICS, ...JSON.parse(analyticsData) };
      }

      if (permissionData) {
        this.permissionStatus = JSON.parse(permissionData);
      }
    } catch (error) {
      console.error('Failed to load notification data:', error);
    }
  }

  private async setupNotifications(): Promise<void> {
    try {
      const { Notifications } = await this.getExpoNotifications();
      
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const shouldShow = await this.shouldShowNotification(notification);
          return {
            shouldShowAlert: shouldShow.alert,
            shouldPlaySound: shouldShow.sound,
            shouldSetBadge: shouldShow.badge,
          };
        },
      });

      // Register notification categories
      await this.registerNotificationCategories();

      // Set up notification listeners
      this.setupNotificationListeners();

      // Start scheduled notification processor
      this.startScheduledNotificationProcessor();
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }

  private async setupNotificationListeners(): Promise<void> {
    const { Notifications } = await this.getExpoNotifications();

    // Listen for received notifications
    Notifications.addNotificationReceivedListener((notification) => {
      this.handleNotificationReceived(notification);
    });

    // Listen for notification responses (user interaction)
    Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationResponse(response);
    });
  }

  private setupDefaultCategories(): void {
    const defaultCategories: NotificationCategory[] = [
      {
        id: 'endorsement',
        title: 'Endorsement',
        description: 'New endorsement notifications',
        actions: [
          {
            id: 'view',
            title: 'View',
            icon: 'eye',
          },
          {
            id: 'approve',
            title: 'Approve',
            icon: 'checkmark',
            requires_auth: true,
          },
          {
            id: 'reject',
            title: 'Reject',
            icon: 'close',
            destructive: true,
            requires_auth: true,
          },
        ],
      },
      {
        id: 'document',
        title: 'Document',
        description: 'Document-related notifications',
        actions: [
          {
            id: 'view',
            title: 'View Document',
            icon: 'document',
          },
          {
            id: 'download',
            title: 'Download',
            icon: 'download',
          },
        ],
      },
      {
        id: 'reminder',
        title: 'Reminder',
        description: 'Reminder notifications',
        actions: [
          {
            id: 'complete',
            title: 'Mark Complete',
            icon: 'checkmark',
          },
          {
            id: 'snooze',
            title: 'Snooze',
            icon: 'time',
          },
        ],
      },
      {
        id: 'security',
        title: 'Security Alert',
        description: 'Security-related notifications',
        actions: [
          {
            id: 'view',
            title: 'View Details',
            icon: 'shield',
            requires_auth: true,
          },
          {
            id: 'dismiss',
            title: 'Dismiss',
            icon: 'close',
          },
        ],
        allow_announcement: true,
      },
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  // ===========================================
  // PERMISSION MANAGEMENT
  // ===========================================

  public async requestPermissions(): Promise<boolean> {
    try {
      const { Notifications } = await this.getExpoNotifications();
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.permissionStatus = finalStatus === 'granted' ? 'granted' : 'denied';
      await this.savePermissionStatus();

      if (finalStatus === 'granted') {
        await this.registerForPushNotifications();
        console.log('✅ Push notification permissions granted');
      } else {
        console.log('❌ Push notification permissions denied');
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    try {
      const { Notifications } = await this.getExpoNotifications();
      const { Constants } = await this.getExpoConstants();
      
      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      const Platform = await this.getPlatform();
      
      const pushToken: PushToken = {
        token: tokenData.data,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        device_id: await this.getDeviceId(),
        app_version: Constants.expoConfig?.version || '1.0.0',
        os_version: Platform.Version.toString(),
        created_at: Date.now(),
        last_used: Date.now(),
        is_active: true,
      };

      this.pushToken = pushToken;
      await this.savePushToken();
      await this.registerTokenWithServer();

      console.log('📱 Push token registered:', tokenData.data);
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
    }
  }

  private async registerTokenWithServer(): Promise<void> {
    if (!this.pushToken) return;

    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch(`${this.API_BASE_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.pushToken),
      });

      if (!response.ok) {
        console.error('Failed to register push token with server:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to register push token with server:', error);
    }
  }

  // ===========================================
  // NOTIFICATION SENDING
  // ===========================================

  public async sendLocalNotification(notification: Omit<PushNotification, 'id' | 'created_at' | 'status'>): Promise<string> {
    try {
      if (!this.shouldSendNotification(notification.type)) {
        console.log(`🔕 Notification blocked by settings: ${notification.type}`);
        return '';
      }

      const { Notifications } = await this.getExpoNotifications();
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          badge: notification.badge_count,
          sound: this.notificationSettings.sound_enabled ? (notification.sound || 'default') : undefined,
          categoryIdentifier: notification.category,
          priority: this.mapPriorityToExpo(notification.priority),
        },
        trigger: notification.scheduled_time ? {
          date: new Date(notification.scheduled_time),
        } : null,
      });

      const fullNotification: PushNotification = {
        id: notificationId,
        ...notification,
        created_at: Date.now(),
        status: 'sent',
      };

      await this.trackNotificationSent(fullNotification);
      
      console.log(`📨 Local notification sent: ${notification.title}`);
      return notificationId;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      return '';
    }
  }

  public async scheduleNotification(
    notification: Omit<PushNotification, 'id' | 'created_at' | 'status'>,
    triggerTime: number,
    options?: {
      repeat?: 'daily' | 'weekly' | 'monthly';
      repeatCount?: number;
      timezone?: string;
    }
  ): Promise<string> {
    try {
      const scheduledId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const scheduledNotification: ScheduledNotification = {
        id: scheduledId,
        notification,
        trigger_time: triggerTime,
        repeat_interval: options?.repeat,
        repeat_count: options?.repeatCount,
        timezone: options?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_active: true,
      };

      this.scheduledNotifications.set(scheduledId, scheduledNotification);
      await this.saveScheduledNotifications();

      console.log(`⏰ Notification scheduled for ${new Date(triggerTime).toLocaleString()}`);
      return scheduledId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return '';
    }
  }

  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      const { Notifications } = await this.getExpoNotifications();
      
      // Cancel local notification
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      // Remove from scheduled notifications
      if (this.scheduledNotifications.has(notificationId)) {
        this.scheduledNotifications.delete(notificationId);
        await this.saveScheduledNotifications();
      }

      console.log(`❌ Notification cancelled: ${notificationId}`);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  public async cancelAllNotifications(): Promise<void> {
    try {
      const { Notifications } = await this.getExpoNotifications();
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      await this.saveScheduledNotifications();

      console.log('🚫 All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  // ===========================================
  // NOTIFICATION HANDLING
  // ===========================================

  private async handleNotificationReceived(notification: any): Promise<void> {
    try {
      // Track delivery
      await this.trackNotificationDelivered(notification.request.identifier);
      
      // Update badge count if needed
      if (this.notificationSettings.badge_enabled) {
        await this.updateBadgeCount();
      }

      console.log('📬 Notification received:', notification.request.content.title);
    } catch (error) {
      console.error('Failed to handle notification received:', error);
    }
  }

  private async handleNotificationResponse(response: any): Promise<void> {
    try {
      const notificationId = response.notification.request.identifier;
      const actionId = response.actionIdentifier;
      const userText = response.userText;

      // Track notification opened
      await this.trackNotificationOpened(notificationId);

      // Handle action
      if (actionId && actionId !== 'default') {
        await this.handleNotificationAction(notificationId, actionId, userText);
      } else {
        // Default action (tap notification)
        await this.handleDefaultNotificationAction(response.notification);
      }

      console.log(`👆 Notification interaction: ${actionId || 'default'}`);
    } catch (error) {
      console.error('Failed to handle notification response:', error);
    }
  }

  private async handleNotificationAction(
    notificationId: string,
    actionId: string,
    userText?: string
  ): Promise<void> {
    // This would integrate with the app's navigation and state management
    switch (actionId) {
      case 'view':
        // Navigate to the relevant screen
        break;
      case 'approve':
        // Handle approval action
        break;
      case 'reject':
        // Handle rejection action
        break;
      case 'complete':
        // Mark as complete
        break;
      case 'snooze':
        // Snooze notification
        await this.snoozeNotification(notificationId);
        break;
      default:
        console.log(`Unknown action: ${actionId}`);
    }
  }

  private async handleDefaultNotificationAction(notification: any): Promise<void> {
    const data = notification.request.content.data;
    
    // Navigate based on notification type and data
    if (data?.screen) {
      // Navigate to specific screen
    } else if (data?.endorsement_id) {
      // Navigate to endorsement
    } else if (data?.document_id) {
      // Navigate to document
    }
  }

  // ===========================================
  // SETTINGS MANAGEMENT
  // ===========================================

  public async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.notificationSettings = { ...this.notificationSettings, ...newSettings };
      await this.saveSettings();
      
      // Re-register categories if needed
      if (newSettings.enabled !== undefined) {
        await this.registerNotificationCategories();
      }

      console.log('⚙️ Notification settings updated');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  public isNotificationTypeEnabled(type: PushNotification['type']): boolean {
    if (!this.notificationSettings.enabled) return false;

    switch (type) {
      case 'endorsement': return this.notificationSettings.endorsements;
      case 'document': return this.notificationSettings.documents;
      case 'reminder': return this.notificationSettings.reminders;
      case 'security': return this.notificationSettings.security_alerts;
      case 'marketing': return this.notificationSettings.marketing;
      case 'system': return true; // System notifications always enabled
      default: return true;
    }
  }

  private shouldSendNotification(type: PushNotification['type']): boolean {
    if (!this.isNotificationTypeEnabled(type)) return false;
    
    // Check quiet hours
    if (this.notificationSettings.quiet_hours_enabled && type !== 'security') {
      return !this.isInQuietHours();
    }

    return true;
  }

  private isInQuietHours(): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = this.notificationSettings.quiet_hours_start;
    const end = this.notificationSettings.quiet_hours_end;
    
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  // ===========================================
  // ANALYTICS & TRACKING
  // ===========================================

  private async trackNotificationSent(notification: PushNotification): Promise<void> {
    this.analytics.total_sent++;
    
    if (!this.analytics.by_type[notification.type]) {
      this.analytics.by_type[notification.type] = { sent: 0, delivered: 0, opened: 0 };
    }
    this.analytics.by_type[notification.type].sent++;

    const hour = new Date().getHours().toString();
    this.analytics.by_hour[hour] = (this.analytics.by_hour[hour] || 0) + 1;

    const day = new Date().toISOString().split('T')[0];
    this.analytics.by_day[day] = (this.analytics.by_day[day] || 0) + 1;

    await this.saveAnalytics();
  }

  private async trackNotificationDelivered(notificationId: string): Promise<void> {
    this.analytics.total_delivered++;
    this.analytics.delivery_rate = this.analytics.total_sent > 0 
      ? (this.analytics.total_delivered / this.analytics.total_sent) * 100 
      : 0;

    await this.saveAnalytics();
  }

  private async trackNotificationOpened(notificationId: string): Promise<void> {
    this.analytics.total_opened++;
    this.analytics.open_rate = this.analytics.total_delivered > 0 
      ? (this.analytics.total_opened / this.analytics.total_delivered) * 100 
      : 0;

    await this.saveAnalytics();
  }

  public getAnalytics(): NotificationAnalytics {
    return { ...this.analytics };
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private async shouldShowNotification(notification: any): Promise<{
    alert: boolean;
    sound: boolean;
    badge: boolean;
  }> {
    const notificationType = notification.request.content.data?.type || 'system';
    
    return {
      alert: this.isNotificationTypeEnabled(notificationType),
      sound: this.notificationSettings.sound_enabled && this.isNotificationTypeEnabled(notificationType),
      badge: this.notificationSettings.badge_enabled,
    };
  }

  private mapPriorityToExpo(priority: PushNotification['priority']): any {
    const { Notifications } = require('expo-notifications');
    
    switch (priority) {
      case 'low': return Notifications.AndroidNotificationPriority.MIN;
      case 'normal': return Notifications.AndroidNotificationPriority.DEFAULT;
      case 'high': return Notifications.AndroidNotificationPriority.HIGH;
      case 'critical': return Notifications.AndroidNotificationPriority.MAX;
      default: return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  private async registerNotificationCategories(): Promise<void> {
    const { Notifications } = await this.getExpoNotifications();
    
    const categories = Array.from(this.categories.values()).map(category => ({
      identifier: category.id,
      actions: category.actions.map(action => ({
        identifier: action.id,
        buttonTitle: action.title,
        options: {
          isDestructive: action.destructive,
          isAuthenticationRequired: action.requires_auth,
        },
      })),
      options: {
        allowInCarPlay: category.allow_in_car_play,
        allowAnnouncement: category.allow_announcement,
        hiddenPreviewsBodyPlaceholder: category.hidden_preview_placeholder,
      },
    }));

    await Notifications.setNotificationCategoryAsync(categories);
  }

  private async snoozeNotification(notificationId: string): Promise<void> {
    // Reschedule notification for 10 minutes later
    const snoozeTime = Date.now() + (10 * 60 * 1000);
    
    // This would need to be implemented based on the original notification data
    console.log(`😴 Notification snoozed until ${new Date(snoozeTime).toLocaleString()}`);
  }

  private async updateBadgeCount(): Promise<void> {
    try {
      const { Notifications } = await this.getExpoNotifications();
      
      // Get unread count from your app's data
      const unreadCount = await this.getUnreadNotificationCount();
      
      await Notifications.setBadgeCountAsync(unreadCount);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  private async getUnreadNotificationCount(): Promise<number> {
    // This would integrate with your app's unread notification logic
    return 0;
  }

  private async startScheduledNotificationProcessor(): Promise<void> {
    setInterval(async () => {
      await this.processScheduledNotifications();
    }, 60000); // Check every minute
  }

  private async processScheduledNotifications(): Promise<void> {
    const now = Date.now();
    
    for (const [id, scheduled] of this.scheduledNotifications) {
      if (scheduled.is_active && scheduled.trigger_time <= now) {
        try {
          await this.sendLocalNotification(scheduled.notification);
          
          // Handle repeating notifications
          if (scheduled.repeat_interval && (scheduled.repeat_count === undefined || scheduled.repeat_count > 0)) {
            const nextTrigger = this.calculateNextTriggerTime(scheduled.trigger_time, scheduled.repeat_interval);
            scheduled.trigger_time = nextTrigger;
            
            if (scheduled.repeat_count !== undefined) {
              scheduled.repeat_count--;
            }
          } else {
            // Remove one-time or completed repeating notification
            this.scheduledNotifications.delete(id);
          }
        } catch (error) {
          console.error(`Failed to process scheduled notification ${id}:`, error);
        }
      }
    }

    await this.saveScheduledNotifications();
  }

  private calculateNextTriggerTime(currentTime: number, interval: 'daily' | 'weekly' | 'monthly'): number {
    const date = new Date(currentTime);
    
    switch (interval) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    
    return date.getTime();
  }

  // Dynamic imports for React Native dependencies
  private async getExpoNotifications(): Promise<any> {
    return await import('expo-notifications');
  }

  private async getExpoConstants(): Promise<any> {
    return await import('expo-constants');
  }

  private async getPlatform(): Promise<any> {
    const RN = await import('react-native');
    return RN.Platform;
  }

  private async getAsyncStorage(): Promise<any> {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default;
  }

  private async getDeviceId(): Promise<string> {
    // This would integrate with your device ID service
    return `device_${Date.now()}`;
  }

  private async getAuthToken(): Promise<string | null> {
    // This would integrate with your auth service
    return null;
  }

  // ===========================================
  // DATA PERSISTENCE
  // ===========================================

  private async savePushToken(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.PUSH_TOKEN, JSON.stringify(this.pushToken));
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(this.notificationSettings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      const scheduled = Array.from(this.scheduledNotifications.values());
      await AsyncStorage.setItem(this.STORAGE_KEYS.SCHEDULED, JSON.stringify(scheduled));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  private async saveAnalytics(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(this.analytics));
    } catch (error) {
      console.error('Failed to save notification analytics:', error);
    }
  }

  private async savePermissionStatus(): Promise<void> {
    try {
      const AsyncStorage = await this.getAsyncStorage();
      await AsyncStorage.setItem(this.STORAGE_KEYS.PERMISSION, JSON.stringify(this.permissionStatus));
    } catch (error) {
      console.error('Failed to save permission status:', error);
    }
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  public static async requestPermissions(): Promise<boolean> {
    const instance = MobilePushNotificationService.getInstance();
    return instance.requestPermissions();
  }

  public static async sendNotification(notification: Omit<PushNotification, 'id' | 'created_at' | 'status'>): Promise<string> {
    const instance = MobilePushNotificationService.getInstance();
    return instance.sendLocalNotification(notification);
  }

  public static async scheduleNotification(
    notification: Omit<PushNotification, 'id' | 'created_at' | 'status'>,
    triggerTime: number,
    options?: any
  ): Promise<string> {
    const instance = MobilePushNotificationService.getInstance();
    return instance.scheduleNotification(notification, triggerTime, options);
  }

  public static async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    const instance = MobilePushNotificationService.getInstance();
    return instance.updateSettings(settings);
  }

  public static getSettings(): NotificationSettings {
    const instance = MobilePushNotificationService.getInstance();
    return instance.getSettings();
  }

  public static getAnalytics(): NotificationAnalytics {
    const instance = MobilePushNotificationService.getInstance();
    return instance.getAnalytics();
  }

  public static getPushToken(): PushToken | null {
    const instance = MobilePushNotificationService.getInstance();
    return instance.pushToken;
  }

  public static getPermissionStatus(): 'undetermined' | 'granted' | 'denied' {
    const instance = MobilePushNotificationService.getInstance();
    return instance.permissionStatus;
  }
}

export { MobilePushNotificationService };