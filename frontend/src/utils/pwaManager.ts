// Cornell Legal PWA Registration and Mobile Optimization
// Advanced PWA capabilities with offline Cornell legal access

class CornellLegalPWA {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline: boolean = navigator.onLine;
  private cornellLegalCache: Map<string, any> = new Map();

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    console.log('🏛️ Cornell Legal PWA: Initializing...');
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup offline detection
    this.setupOfflineDetection();
    
    // Initialize Cornell legal caching
    await this.initializeCornellLegalCache();
    
    // Setup push notifications
    await this.setupPushNotifications();
    
    // Handle PWA installation
    this.setupPWAInstallation();
    
    // Mobile optimization
    this.setupMobileOptimizations();
    
    console.log('✅ Cornell Legal PWA: Initialization complete');
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('✅ Cornell Legal PWA: Service Worker registered');

        // Handle updates
        this.registration.addEventListener('updatefound', () => {
          console.log('🔄 Cornell Legal PWA: Update found, installing...');
          const newWorker = this.registration?.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
              }
            });
          }
        });

        // Background sync for Cornell legal updates
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          await (this.registration as any).sync.register('cornell-legal-sync');
        }

      } catch (error) {
        console.error('❌ Cornell Legal PWA: Service Worker registration failed:', error);
      }
    }
  }

  private setupOfflineDetection(): void {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      this.displayOfflineStatus();
      
      if (this.isOnline) {
        this.syncWhenOnline();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial status
    updateOnlineStatus();
  }

  private displayOfflineStatus(): void {
    const existingBanner = document.querySelector('.cornell-offline-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    if (!this.isOnline) {
      const banner = document.createElement('div');
      banner.className = 'cornell-offline-banner';
      banner.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f39c12;
          color: white;
          padding: 8px 16px;
          text-align: center;
          z-index: 10000;
          font-size: 14px;
        ">
          🔌 You're offline. Cornell legal knowledge is cached and available.
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            margin-left: 10px;
            cursor: pointer;
          ">✕</button>
        </div>
      `;
      document.body.appendChild(banner);
    }
  }

  private async initializeCornellLegalCache(): Promise<void> {
    // Cache critical Cornell legal knowledge for offline access
    const criticalLegalKnowledge = [
      {
        id: 'ucc-3-104',
        title: 'UCC § 3-104 - Negotiable Instrument Requirements',
        content: 'Comprehensive requirements for negotiable instruments under UCC Article 3',
        url: 'https://www.law.cornell.edu/ucc/3/3-104'
      },
      {
        id: 'ucc-3-302',
        title: 'UCC § 3-302 - Holder in Due Course',
        content: 'Requirements and protections for holder in due course status',
        url: 'https://www.law.cornell.edu/ucc/3/3-302'
      },
      {
        id: 'ucc-3-205',
        title: 'UCC § 3-205 - Indorsement Rules',
        content: 'Special, blank, and restrictive indorsement requirements',
        url: 'https://www.law.cornell.edu/ucc/3/3-205'
      }
    ];

    for (const knowledge of criticalLegalKnowledge) {
      this.cornellLegalCache.set(knowledge.id, knowledge);
    }

    console.log('📚 Cornell Legal PWA: Legal knowledge cached for offline access');
  }

  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.log('📱 Cornell Legal PWA: Push notifications not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted' && this.registration) {
        console.log('✅ Cornell Legal PWA: Push notifications enabled');
        
        // Subscribe to legal alerts
        const subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa40HI80Y4TSxKjgZKBTLSkLRAGLNKZnOoLt88KU5TqJm4TpAGDCJEL0HXNKd8Y'
          ) as BufferSource
        });

        // Send subscription to server for legal alerts
        await this.sendSubscriptionToServer(subscription);
      }
    } catch (error) {
      console.error('❌ Cornell Legal PWA: Push notification setup failed:', error);
    }
  }

  private setupPWAInstallation(): void {
    let deferredPrompt: any = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 Cornell Legal PWA: Install prompt available');
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallButton(deferredPrompt);
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ Cornell Legal PWA: App installed successfully');
      deferredPrompt = null;
      this.hideInstallButton();
      
      // Track installation
      this.trackPWAInstallation();
    });
  }

  private showInstallButton(deferredPrompt: any): void {
    const installButton = document.createElement('div');
    installButton.id = 'cornell-pwa-install';
    installButton.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2a5298;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 14px;
        max-width: 280px;
      ">
        📱 Install Cornell Legal App for offline access
        <div style="margin-top: 8px;">
          <button id="install-cornell-app" style="
            background: white;
            color: #2a5298;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
          ">Install</button>
          <button id="dismiss-cornell-install" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
          ">Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(installButton);

    document.getElementById('install-cornell-app')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Cornell Legal PWA: Install ${outcome}`);
      }
    });

    document.getElementById('dismiss-cornell-install')?.addEventListener('click', () => {
      this.hideInstallButton();
    });
  }

  private hideInstallButton(): void {
    const installButton = document.getElementById('cornell-pwa-install');
    if (installButton) {
      installButton.remove();
    }
  }

  private setupMobileOptimizations(): void {
    // Mobile-specific optimizations
    if (this.isMobileDevice()) {
      console.log('📱 Cornell Legal PWA: Applying mobile optimizations');
      
      // Optimize for mobile viewport
      this.optimizeMobileViewport();
      
      // Add mobile-specific styles
      this.addMobileStyles();
      
      // Setup mobile gestures
      this.setupMobileGestures();
      
      // Optimize touch interactions
      this.optimizeTouchInteractions();
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && 'ontouchstart' in window);
  }

  private optimizeMobileViewport(): void {
    // Ensure proper mobile viewport
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, user-scalable=yes, viewport-fit=cover';

    // Add mobile-web-app-capable
    const webAppMeta = document.createElement('meta');
    webAppMeta.name = 'mobile-web-app-capable';
    webAppMeta.content = 'yes';
    document.head.appendChild(webAppMeta);

    // Add apple-mobile-web-app optimizations
    const appleMeta = document.createElement('meta');
    appleMeta.name = 'apple-mobile-web-app-capable';
    appleMeta.content = 'yes';
    document.head.appendChild(appleMeta);

    const appleStatusBar = document.createElement('meta');
    appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
    appleStatusBar.content = 'default';
    document.head.appendChild(appleStatusBar);
  }

  private addMobileStyles(): void {
    const mobileStyles = document.createElement('style');
    mobileStyles.innerHTML = `
      /* Cornell Legal PWA Mobile Optimizations */
      @media (max-width: 768px) {
        .component-card {
          margin: 8px !important;
          padding: 16px !important;
          border-radius: 12px !important;
        }
        
        .btn {
          padding: 12px 16px !important;
          font-size: 16px !important;
          border-radius: 8px !important;
          min-height: 44px !important; /* Apple HIG minimum touch target */
        }
        
        .tabs-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        .tab-button {
          min-width: 120px !important;
          white-space: nowrap !important;
        }
        
        /* Cornell legal content mobile optimization */
        .cornell-legal-content {
          font-size: 16px !important;
          line-height: 1.6 !important;
        }
        
        .cornell-reference-link {
          display: block !important;
          padding: 8px !important;
          margin: 4px 0 !important;
          background: #f0f8ff !important;
          border-radius: 6px !important;
        }
        
        /* Touch-friendly file upload area */
        .upload-area {
          min-height: 200px !important;
          touch-action: manipulation !important;
        }
        
        /* Safe areas for notched devices */
        .container {
          padding-left: env(safe-area-inset-left) !important;
          padding-right: env(safe-area-inset-right) !important;
          padding-top: env(safe-area-inset-top) !important;
          padding-bottom: env(safe-area-inset-bottom) !important;
        }
        
        /* Mobile navigation improvements */
        header {
          position: sticky !important;
          top: env(safe-area-inset-top) !important;
          z-index: 1000 !important;
          background: rgba(255,255,255,0.95) !important;
          backdrop-filter: blur(10px) !important;
        }
      }
      
      /* Dark mode support for mobile */
      @media (prefers-color-scheme: dark) and (max-width: 768px) {
        .component-card {
          background: #1a1a1a !important;
          color: #ffffff !important;
          border: 1px solid #333 !important;
        }
        
        header {
          background: rgba(26,26,26,0.95) !important;
        }
      }
    `;
    document.head.appendChild(mobileStyles);
  }

  private setupMobileGestures(): void {
    // Add pull-to-refresh functionality
    let startY = 0;
    let currentY = 0;
    let pulling = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        pulling = true;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (pulling) {
        currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 100 && window.scrollY === 0) {
          // Show refresh indicator
          this.showRefreshIndicator();
        }
      }
    });

    document.addEventListener('touchend', () => {
      if (pulling && currentY - startY > 100) {
        // Trigger refresh
        this.refreshCornellLegalData();
      }
      pulling = false;
      this.hideRefreshIndicator();
    });
  }

  private optimizeTouchInteractions(): void {
    // Add touch feedback for interactive elements
    const addTouchFeedback = (element: Element) => {
      element.addEventListener('touchstart', () => {
        element.classList.add('touch-active');
      });
      
      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.classList.remove('touch-active');
        }, 150);
      });
    };

    // Apply to buttons and interactive elements
    document.querySelectorAll('.btn, button, .tab-button, .cornell-reference-link').forEach(addTouchFeedback);
    
    // Add touch feedback styles
    const touchStyles = document.createElement('style');
    touchStyles.innerHTML = `
      .touch-active {
        transform: scale(0.98) !important;
        opacity: 0.8 !important;
        transition: all 0.1s ease !important;
      }
    `;
    document.head.appendChild(touchStyles);
  }

  private showRefreshIndicator(): void {
    if (!document.querySelector('.pull-refresh-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'pull-refresh-indicator';
      indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #2a5298;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          z-index: 10001;
          font-size: 14px;
        ">
          🔄 Release to refresh Cornell legal data
        </div>
      `;
      document.body.appendChild(indicator);
    }
  }

  private hideRefreshIndicator(): void {
    const indicator = document.querySelector('.pull-refresh-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  private async refreshCornellLegalData(): Promise<void> {
    console.log('🔄 Cornell Legal PWA: Refreshing legal data...');
    
    try {
      // Trigger background sync if available
      if (this.registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
        await this.registration.sync.register('cornell-legal-sync');
      }
      
      // Show success message
      this.showMessage('✅ Cornell legal data refreshed');
    } catch (error) {
      console.error('❌ Cornell Legal PWA: Refresh failed:', error);
      this.showMessage('❌ Refresh failed - using cached data');
    }
  }

  private showMessage(message: string): void {
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10002;
        font-size: 16px;
      ">
        ${message}
      </div>
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  private showUpdateAvailable(): void {
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #2a5298;
        color: white;
        padding: 16px;
        text-align: center;
        z-index: 10000;
      ">
        🆕 New Cornell Legal features available!
        <button onclick="window.location.reload()" style="
          background: white;
          color: #2a5298;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          margin-left: 12px;
          cursor: pointer;
        ">Update Now</button>
      </div>
    `;
    document.body.appendChild(updateBanner);
  }

  // Utility methods
  private async syncWhenOnline(): Promise<void> {
    if (this.isOnline && this.registration) {
      try {
        await this.registration.sync.register('cornell-legal-sync');
        console.log('🔄 Cornell Legal PWA: Background sync triggered');
      } catch (error) {
        console.error('❌ Cornell Legal PWA: Background sync failed:', error);
      }
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }),
      });
      console.log('✅ Cornell Legal PWA: Push subscription sent to server');
    } catch (error) {
      console.error('❌ Cornell Legal PWA: Failed to send subscription:', error);
    }
  }

  private trackPWAInstallation(): void {
    // Track PWA installation for analytics
    if ('gtag' in window) {
      (window as any).gtag('event', 'pwa_install', {
        event_category: 'Cornell Legal PWA',
        event_label: 'App Installation'
      });
    }
  }

  // Public API methods
  public async getCornellLegalKnowledge(id: string): Promise<any> {
    // Try cache first for offline access
    if (this.cornellLegalCache.has(id)) {
      return this.cornellLegalCache.get(id);
    }

    // Try network if online
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/cornell-legal/${id}`);
        if (response.ok) {
          const knowledge = await response.json();
          this.cornellLegalCache.set(id, knowledge);
          return knowledge;
        }
      } catch (error) {
        console.error('Cornell Legal PWA: Network request failed:', error);
      }
    }

    // Return null if not available
    return null;
  }

  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  public getConnectionStatus(): { online: boolean; type?: string } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: this.isOnline,
      type: connection?.effectiveType || 'unknown'
    };
  }
}

// Initialize Cornell Legal PWA
const cornellLegalPWA = new CornellLegalPWA();

// Export for global access
(window as any).CornellLegalPWA = cornellLegalPWA;

export default CornellLegalPWA;