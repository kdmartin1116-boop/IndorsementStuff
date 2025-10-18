// ===========================================
// PWA MANAGER - COMPREHENSIVE PWA CAPABILITIES
// ===========================================

interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NotificationPermissionResult {
  permission: NotificationPermission;
  subscription?: PushSubscription;
}

class PWAManager {
  private installPrompt: PWAInstallPrompt | null = null;
  private isInstalled: boolean = false;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private offlineQueue: any[] = [];

  constructor() {
    this.init();
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  private async init() {
    this.setupEventListeners();
    await this.registerServiceWorker();
    this.checkInstallationStatus();
    this.setupNetworkMonitoring();
    await this.setupNotifications();
    this.loadOfflineQueue();
  }

  private setupEventListeners() {
    // Install prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as any;
      this.showInstallButton();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      this.trackEvent('pwa_installed');
    });

    // Online/offline detection
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Visibility change (app focus/blur)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.handleAppFocus();
      }
    });

    // Service Worker messages
    navigator.serviceWorker?.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  // ===========================================
  // SERVICE WORKER REGISTRATION
  // ===========================================

  private async registerServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registered successfully');

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      return true;

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  // ===========================================
  // INSTALLATION MANAGEMENT
  // ===========================================

  public async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      this.trackEvent('pwa_install_prompt', { outcome });
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
        return true;
      } else {
        console.log('ℹ️ User dismissed PWA installation');
        return false;
      }
    } catch (error) {
      console.error('❌ Install prompt failed:', error);
      return false;
    }
  }

  private checkInstallationStatus() {
    // Check if app is installed
    this.isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true;

    if (this.isInstalled) {
      console.log('✅ PWA is installed');
      this.trackEvent('pwa_running_installed');
    }
  }

  // ===========================================
  // OFFLINE FUNCTIONALITY
  // ===========================================

  private setupNetworkMonitoring() {
    // Initial state
    this.updateOnlineStatus();

    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.updateOnlineStatus();
      });
    }
  }

  private updateOnlineStatus() {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;

    if (wasOnline !== this.isOnline) {
      if (this.isOnline) {
        this.handleOnline();
      } else {
        this.handleOffline();
      }
    }
  }

  private handleOnline() {
    console.log('🌐 Connection restored');
    this.isOnline = true;
    this.showNetworkStatus('online');
    this.processPendingSync();
  }

  private handleOffline() {
    console.log('📶 Connection lost - Offline mode activated');
    this.isOnline = false;
    this.showNetworkStatus('offline');
  }

  public async queueOfflineAction(action: any): Promise<void> {
    // Add to offline queue
    const queueItem = {
      id: Date.now() + Math.random(),
      action,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();

    // Try to sync if online
    if (this.isOnline && !this.syncInProgress) {
      await this.processPendingSync();
    }
  }

  private async processPendingSync() {
    if (this.syncInProgress || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Processing offline queue...');

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const item of this.offlineQueue) {
      try {
        await this.processOfflineAction(item.action);
        successfulSyncs.push(item.id);
      } catch (error) {
        console.error('❌ Sync failed for item:', item.id, error);
        item.retryCount++;
        
        // Remove items that have failed too many times
        if (item.retryCount > 3) {
          failedSyncs.push(item.id);
        }
      }
    }

    // Remove successfully synced and permanently failed items
    this.offlineQueue = this.offlineQueue.filter(
      item => !successfulSyncs.includes(item.id) && !failedSyncs.includes(item.id)
    );

    this.saveOfflineQueue();
    this.syncInProgress = false;

    if (successfulSyncs.length > 0) {
      console.log(`✅ Synced ${successfulSyncs.length} offline actions`);
      this.showSyncNotification(successfulSyncs.length);
    }
  }

  private async processOfflineAction(action: any): Promise<void> {
    // Implement action processing based on action type
    switch (action.type) {
      case 'document_upload':
        await this.syncDocumentUpload(action.data);
        break;
      case 'comment_add':
        await this.syncComment(action.data);
        break;
      case 'profile_update':
        await this.syncProfileUpdate(action.data);
        break;
      default:
        console.warn('Unknown offline action type:', action.type);
    }
  }

  private saveOfflineQueue() {
    localStorage.setItem('pwa_offline_queue', JSON.stringify(this.offlineQueue));
  }

  private loadOfflineQueue() {
    const saved = localStorage.getItem('pwa_offline_queue');
    if (saved) {
      try {
        this.offlineQueue = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load offline queue:', error);
        this.offlineQueue = [];
      }
    }
  }

  // ===========================================
  // PUSH NOTIFICATIONS
  // ===========================================

  private async setupNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('Push notifications not supported');
      return;
    }

    // Check existing permission
    if (Notification.permission === 'granted') {
      await this.setupPushSubscription();
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermissionResult> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    const result: NotificationPermissionResult = { permission };

    if (permission === 'granted') {
      result.subscription = await this.setupPushSubscription();
    }

    this.trackEvent('notification_permission_requested', { permission });
    return result;
  }

  private async setupPushSubscription(): Promise<PushSubscription | undefined> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = this.getVapidPublicKey();
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;

    } catch (error) {
      console.error('❌ Push subscription setup failed:', error);
      return undefined;
    }
  }

  public async showNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'sovereign-legal',
      ...options
    });
  }

  // ===========================================
  // APP UPDATE MANAGEMENT
  // ===========================================

  private showUpdateAvailable() {
    // Create update notification
    const updateBanner = this.createUpdateBanner();
    document.body.appendChild(updateBanner);

    // Auto-hide after 10 seconds if not interacted with
    setTimeout(() => {
      if (updateBanner.parentNode) {
        updateBanner.remove();
      }
    }, 10000);
  }

  public async applyUpdate(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      // Tell the waiting SW to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Reload the page to activate the new service worker
    window.location.reload();
  }

  // ===========================================
  // BACKGROUND SYNC
  // ===========================================

  public async scheduleBackgroundSync(tag: string): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if ('sync' in registration) {
        await (registration as any).sync.register(tag);
        console.log(`📅 Background sync scheduled: ${tag}`);
      } else {
        console.warn('Background sync not supported');
        // Fallback to manual sync
        await this.processPendingSync();
      }
    } catch (error) {
      console.error('❌ Background sync scheduling failed:', error);
    }
  }

  // ===========================================
  // SHARE TARGET HANDLING
  // ===========================================

  public handleSharedFiles(files: FileList): void {
    console.log('📄 Handling shared files:', files);
    
    // Process shared files
    Array.from(files).forEach((file) => {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        this.processSharedDocument(file);
      }
    });
  }

  private async processSharedDocument(file: File): Promise<void> {
    // If offline, queue the action
    if (!this.isOnline) {
      await this.queueOfflineAction({
        type: 'document_upload',
        data: { file: await this.fileToBase64(file), fileName: file.name }
      });
      return;
    }

    // Process immediately if online
    try {
      await this.uploadDocument(file);
    } catch (error) {
      console.error('❌ Shared document processing failed:', error);
      // Queue for later if upload fails
      await this.queueOfflineAction({
        type: 'document_upload',
        data: { file: await this.fileToBase64(file), fileName: file.name }
      });
    }
  }

  // ===========================================
  // UI MANAGEMENT
  // ===========================================

  private showInstallButton() {
    const existingButton = document.getElementById('pwa-install-button');
    if (existingButton) return;

    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-button';
    installButton.className = 'pwa-install-button';
    installButton.innerHTML = '📱 Install App';
    installButton.onclick = () => this.promptInstall();

    document.body.appendChild(installButton);
  }

  private hideInstallButton() {
    const button = document.getElementById('pwa-install-button');
    button?.remove();
  }

  private showNetworkStatus(status: 'online' | 'offline') {
    // Remove existing status
    const existing = document.getElementById('network-status');
    existing?.remove();

    const statusElement = document.createElement('div');
    statusElement.id = 'network-status';
    statusElement.className = `network-status ${status}`;
    statusElement.innerHTML = status === 'online' 
      ? '🌐 Back online' 
      : '📶 Working offline';

    document.body.appendChild(statusElement);

    // Auto-hide online status after 3 seconds
    if (status === 'online') {
      setTimeout(() => statusElement.remove(), 3000);
    }
  }

  private showSyncNotification(count: number) {
    this.showNotification('Sync Complete', {
      body: `${count} offline action${count > 1 ? 's' : ''} synced successfully`,
      icon: '/icons/icon-192x192.png',
      tag: 'sync-complete'
    });
  }

  private createUpdateBanner(): HTMLElement {
    const banner = document.createElement('div');
    banner.className = 'pwa-update-banner';
    banner.innerHTML = `
      <div class="update-content">
        <span>🚀 New version available!</span>
        <button onclick="window.pwaManager.applyUpdate()" class="update-button">
          Update Now
        </button>
        <button onclick="this.parentNode.parentNode.remove()" class="dismiss-button">
          ✕
        </button>
      </div>
    `;
    return banner;
  }

  // ===========================================
  // SERVICE WORKER COMMUNICATION
  // ===========================================

  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'SW_ACTIVATED':
        console.log('✅ Service Worker activated, version:', data.version);
        break;
      case 'SYNC_COMPLETE':
        if (data.success) {
          this.showSyncNotification(1);
        }
        break;
      case 'CACHE_UPDATED':
        console.log('📦 Cache updated:', data.cacheName);
        break;
      default:
        console.log('Unknown SW message:', data);
    }
  }

  public async sendMessageToServiceWorker(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      navigator.serviceWorker.controller?.postMessage(message, [messageChannel.port2]);
    });
  }

  // ===========================================
  // UTILITIES
  // ===========================================

  private handleAppFocus() {
    // Check for updates when app gains focus
    if (this.isOnline && !this.syncInProgress) {
      this.processPendingSync();
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getVapidPublicKey(): string {
    // In production, get this from environment variables
    return import.meta.env?.VITE_VAPID_PUBLIC_KEY || 'demo-vapid-key';
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Send to your backend API
    console.log('📨 Sending push subscription to server:', subscription);
  }

  private async syncDocumentUpload(data: any): Promise<void> {
    console.log('📄 Syncing document upload:', data);
  }

  private async syncComment(data: any): Promise<void> {
    console.log('💬 Syncing comment:', data);
  }

  private async syncProfileUpdate(data: any): Promise<void> {
    console.log('👤 Syncing profile update:', data);
  }

  private async uploadDocument(file: File): Promise<void> {
    console.log('📤 Uploading document:', file);
  }

  private trackEvent(eventName: string, data?: any): void {
    console.log('📊 Tracking event:', eventName, data);
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  public getStatus() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      hasInstallPrompt: !!this.installPrompt,
      queueLength: this.offlineQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  public async clearCache(): Promise<void> {
    await this.sendMessageToServiceWorker({ type: 'CLEAR_CACHE' });
  }

  public async getCacheStatus(): Promise<any> {
    return this.sendMessageToServiceWorker({ type: 'GET_CACHE_STATUS' });
  }
}

// ===========================================
// INITIALIZATION
// ===========================================

let pwaManager: PWAManager;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pwaManager = new PWAManager();
    (window as any).pwaManager = pwaManager;
  });
} else {
  pwaManager = new PWAManager();
  (window as any).pwaManager = pwaManager;
}

export { PWAManager };
export default pwaManager;