// ===========================================
// SECURITY MONITORING & THREAT DETECTION
// Enterprise Security Framework
// ===========================================

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: 'authentication' | 'authorization' | 'data_access' | 'security_violation' | 'system_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  user?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  threat_indicators?: string[];
  resolved: boolean;
}

interface ThreatSignature {
  id: string;
  name: string;
  pattern: RegExp | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
  category: 'injection' | 'xss' | 'csrf' | 'bruteforce' | 'enumeration' | 'malware' | 'phishing';
}

interface SecurityMetrics {
  events: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    unresolved: number;
  };
  threats: {
    detected: number;
    blocked: number;
    mitigated: number;
    active: number;
  };
  authentication: {
    loginAttempts: number;
    failedLogins: number;
    successfulLogins: number;
    suspiciousActivity: number;
  };
  vulnerabilities: {
    total: number;
    byCategory: Record<string, number>;
    highRisk: number;
    patched: number;
  };
}

interface SecurityAlert {
  id: string;
  timestamp: number;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  event_ids: string[];
  acknowledged: boolean;
  assignee?: string;
  notes?: string;
}

interface SecurityConfig {
  monitoring: {
    enabled: boolean;
    realtime: boolean;
    retention_days: number;
  };
  threat_detection: {
    enabled: boolean;
    auto_block: boolean;
    sensitivity: 'low' | 'medium' | 'high';
  };
  alerts: {
    enabled: boolean;
    email_notifications: boolean;
    slack_webhooks: boolean;
    severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  };
  compliance: {
    gdpr: boolean;
    hipaa: boolean;
    sox: boolean;
    pci_dss: boolean;
  };
}

export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private threats: ThreatSignature[] = [];
  private alerts: SecurityAlert[] = [];
  private metrics: SecurityMetrics;
  private config: SecurityConfig;
  private blockedIPs: Set<string> = new Set();
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  private encryptionKey?: CryptoKey;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      monitoring: {
        enabled: true,
        realtime: true,
        retention_days: 90
      },
      threat_detection: {
        enabled: true,
        auto_block: true,
        sensitivity: 'medium'
      },
      alerts: {
        enabled: true,
        email_notifications: true,
        slack_webhooks: false,
        severity_threshold: 'medium'
      },
      compliance: {
        gdpr: true,
        hipaa: false,
        sox: false,
        pci_dss: false
      },
      ...config
    };

    this.metrics = {
      events: { total: 0, byType: {}, bySeverity: {}, resolved: 0, unresolved: 0 },
      threats: { detected: 0, blocked: 0, mitigated: 0, active: 0 },
      authentication: { loginAttempts: 0, failedLogins: 0, successfulLogins: 0, suspiciousActivity: 0 },
      vulnerabilities: { total: 0, byCategory: {}, highRisk: 0, patched: 0 }
    };

    this.initialize();
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  private async initialize(): Promise<void> {
    try {
      await this.setupEncryption();
      await this.loadThreatSignatures();
      this.setupEventListeners();
      this.startRealTimeMonitoring();
      console.log('🛡️ Security monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize security monitor:', error);
    }
  }

  private async setupEncryption(): Promise<void> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('Failed to setup encryption:', error);
      }
    }
  }

  private async loadThreatSignatures(): Promise<void> {
    this.threats = [
      // SQL Injection Patterns
      {
        id: 'sql-injection-1',
        name: 'SQL Injection - UNION Attack',
        pattern: /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/i,
        severity: 'high',
        description: 'SQL injection attempt using UNION statements',
        mitigation: 'Sanitize input parameters and use parameterized queries',
        category: 'injection'
      },
      {
        id: 'sql-injection-2',
        name: 'SQL Injection - OR 1=1',
        pattern: /(\bor\b\s*['"]?\s*1\s*=\s*1)|(\bor\b\s*['"]?\s*true\b)/i,
        severity: 'high',
        description: 'SQL injection attempt using OR 1=1 pattern',
        mitigation: 'Implement input validation and parameterized queries',
        category: 'injection'
      },

      // XSS Patterns
      {
        id: 'xss-script-injection',
        name: 'Cross-Site Scripting',
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        severity: 'high',
        description: 'XSS attempt detected in input',
        mitigation: 'Encode user input and implement CSP headers',
        category: 'xss'
      },
      {
        id: 'xss-event-handler',
        name: 'XSS Event Handler Injection',
        pattern: /\bon\w+\s*=|javascript:/i,
        severity: 'high',
        description: 'XSS attempt using event handlers or javascript: protocol',
        mitigation: 'Sanitize HTML attributes and disable inline scripts',
        category: 'xss'
      },

      // Command Injection
      {
        id: 'command-injection',
        name: 'Command Injection',
        pattern: /[;&|`$(){}[\]<>]/,
        severity: 'critical',
        description: 'Command injection attempt detected',
        mitigation: 'Validate and sanitize system command inputs',
        category: 'injection'
      },

      // Path Traversal
      {
        id: 'path-traversal',
        name: 'Path Traversal Attack',
        pattern: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
        severity: 'medium',
        description: 'Path traversal attempt detected',
        mitigation: 'Validate file paths and restrict directory access',
        category: 'enumeration'
      },

      // Brute Force Detection
      {
        id: 'brute-force-rapid',
        name: 'Rapid Login Attempts',
        pattern: 'rapid_login_attempts',
        severity: 'medium',
        description: 'Multiple rapid login attempts detected',
        mitigation: 'Implement account lockout and CAPTCHA',
        category: 'bruteforce'
      }
    ];
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Monitor form submissions for injection attempts
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.scanFormData(form);
    });

    // Monitor DOM mutations for potential XSS
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node as Element);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Monitor network requests
    this.interceptFetch();
    this.interceptXHR();
  }

  // ===========================================
  // THREAT DETECTION
  // ===========================================

  private scanFormData(form: HTMLFormElement): void {
    const formData = new FormData(form);
    const threats: string[] = [];

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        const detectedThreats = this.detectThreats(value);
        if (detectedThreats.length > 0) {
          threats.push(...detectedThreats.map(t => t.id));
          this.logSecurityEvent({
            type: 'security_violation',
            severity: 'high',
            source: 'form_submission',
            details: {
              field: key,
              value: this.sanitizeForLog(value),
              threats: detectedThreats.map(t => t.name)
            }
          });
        }
      }
    });

    if (threats.length > 0 && this.config.threat_detection.auto_block) {
      event?.preventDefault();
      this.createAlert({
        title: 'Malicious Form Submission Blocked',
        message: `Form submission blocked due to detected threats: ${threats.join(', ')}`,
        severity: 'high',
        category: 'threat_detection'
      });
    }
  }

  private scanElement(element: Element): void {
    const innerHTML = element.innerHTML;
    const detectedThreats = this.detectThreats(innerHTML);

    if (detectedThreats.length > 0) {
      this.logSecurityEvent({
        type: 'security_violation',
        severity: 'high',
        source: 'dom_manipulation',
        details: {
          tagName: element.tagName,
          threats: detectedThreats.map(t => t.name),
          content: this.sanitizeForLog(innerHTML)
        }
      });

      if (this.config.threat_detection.auto_block) {
        element.remove();
        this.createAlert({
          title: 'Malicious DOM Content Removed',
          message: `Dangerous content automatically removed from page`,
          severity: 'high',
          category: 'xss_prevention'
        });
      }
    }
  }

  private detectThreats(input: string): ThreatSignature[] {
    const detected: ThreatSignature[] = [];

    for (const threat of this.threats) {
      let matches = false;

      if (threat.pattern instanceof RegExp) {
        matches = threat.pattern.test(input);
      } else if (typeof threat.pattern === 'string') {
        // Custom pattern matching logic
        matches = this.customPatternMatch(threat.pattern, input);
      }

      if (matches) {
        detected.push(threat);
      }
    }

    return detected;
  }

  private customPatternMatch(pattern: string, input: string): boolean {
    switch (pattern) {
      case 'rapid_login_attempts':
        // This would be checked in authentication context
        return false;
      default:
        return false;
    }
  }

  // ===========================================
  // NETWORK MONITORING
  // ===========================================

  private interceptFetch(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = performance.now();

      try {
        this.logSecurityEvent({
          type: 'system_event',
          severity: 'low',
          source: 'network_request',
          details: {
            method: options?.method || 'GET',
            url: typeof url === 'string' ? url : url.toString(),
            headers: options?.headers || {}
          }
        });

        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        // Check for suspicious response patterns
        if (!response.ok) {
          this.logSecurityEvent({
            type: 'system_event',
            severity: response.status >= 500 ? 'medium' : 'low',
            source: 'network_error',
            details: {
              status: response.status,
              statusText: response.statusText,
              url: typeof url === 'string' ? url : url.toString(),
              duration
            }
          });
        }

        return response;
      } catch (error) {
        this.logSecurityEvent({
          type: 'system_event',
          severity: 'medium',
          source: 'network_failure',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            url: typeof url === 'string' ? url : url.toString()
          }
        });
        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._securityMethod = method;
      this._securityUrl = url;
      return originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(data) {
      const startTime = performance.now();

      this.addEventListener('loadend', () => {
        const duration = performance.now() - startTime;
        
        securityMonitor.logSecurityEvent({
          type: 'system_event',
          severity: 'low',
          source: 'xhr_request',
          details: {
            method: this._securityMethod,
            url: this._securityUrl,
            status: this.status,
            duration
          }
        });
      });

      return originalSend.apply(this, [data]);
    };
  }

  // ===========================================
  // RATE LIMITING & IP BLOCKING
  // ===========================================

  checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimiter.has(identifier)) {
      this.rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    const entry = this.rateLimiter.get(identifier)!;
    
    if (now > entry.resetTime) {
      // Reset the window
      entry.count = 1;
      entry.resetTime = now + windowMs;
      return true;
    }

    if (entry.count >= limit) {
      this.logSecurityEvent({
        type: 'security_violation',
        severity: 'medium',
        source: 'rate_limit',
        details: {
          identifier,
          limit,
          current_count: entry.count,
          window_ms: windowMs
        }
      });
      return false;
    }

    entry.count++;
    return true;
  }

  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    this.logSecurityEvent({
      type: 'security_violation',
      severity: 'high',
      source: 'ip_blocking',
      details: {
        ip,
        reason,
        blocked_at: Date.now()
      }
    });

    this.createAlert({
      title: 'IP Address Blocked',
      message: `IP ${ip} has been blocked: ${reason}`,
      severity: 'high',
      category: 'ip_blocking'
    });
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // ===========================================
  // AUTHENTICATION MONITORING
  // ===========================================

  logAuthenticationAttempt(
    username: string,
    success: boolean,
    ip?: string,
    userAgent?: string,
    additional?: Record<string, any>
  ): void {
    this.metrics.authentication.loginAttempts++;
    
    if (success) {
      this.metrics.authentication.successfulLogins++;
    } else {
      this.metrics.authentication.failedLogins++;
      
      // Check for brute force patterns
      this.checkBruteForcePattern(username, ip);
    }

    this.logSecurityEvent({
      type: 'authentication',
      severity: success ? 'low' : 'medium',
      source: 'login_attempt',
      user: username,
      ip,
      userAgent,
      details: {
        success,
        timestamp: Date.now(),
        ...additional
      }
    });
  }

  private checkBruteForcePattern(username: string, ip?: string): void {
    const recentFailures = this.events
      .filter(event => 
        event.type === 'authentication' &&
        event.user === username &&
        !event.details.success &&
        Date.now() - event.timestamp < 300000 // Last 5 minutes
      )
      .length;

    if (recentFailures >= 5) {
      this.metrics.authentication.suspiciousActivity++;
      
      this.logSecurityEvent({
        type: 'security_violation',
        severity: 'high',
        source: 'brute_force_detection',
        user: username,
        ip,
        details: {
          failed_attempts: recentFailures,
          time_window: '5 minutes'
        }
      });

      this.createAlert({
        title: 'Brute Force Attack Detected',
        message: `Multiple failed login attempts for user: ${username}`,
        severity: 'high',
        category: 'brute_force'
      });

      if (ip && this.config.threat_detection.auto_block) {
        this.blockIP(ip, `Brute force attack on account: ${username}`);
      }
    }
  }

  // ===========================================
  // EVENT LOGGING & MANAGEMENT
  // ===========================================

  logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): string {
    if (!this.config.monitoring.enabled) return '';

    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      resolved: false,
      ...eventData
    };

    this.events.push(event);
    this.updateMetrics(event);

    // Auto-create alerts for high severity events
    if (['high', 'critical'].includes(event.severity) && this.config.alerts.enabled) {
      this.createAlert({
        title: `Security Event: ${event.type}`,
        message: `${event.severity.toUpperCase()} severity event from ${event.source}`,
        severity: event.severity as any,
        category: event.type,
        event_ids: [event.id]
      });
    }

    // Real-time processing
    if (this.config.monitoring.realtime) {
      this.processEventRealtime(event);
    }

    // Cleanup old events
    this.cleanupOldEvents();

    console.log(`🔍 Security event logged: ${event.type} (${event.severity})`);
    return event.id;
  }

  private processEventRealtime(event: SecurityEvent): void {
    // Send to external SIEM systems
    this.sendToSIEM(event);

    // Trigger webhooks
    this.triggerWebhooks(event);

    // Update real-time dashboard
    this.updateRealTimeDashboard(event);
  }

  private updateMetrics(event: SecurityEvent): void {
    this.metrics.events.total++;
    this.metrics.events.byType[event.type] = (this.metrics.events.byType[event.type] || 0) + 1;
    this.metrics.events.bySeverity[event.severity] = (this.metrics.events.bySeverity[event.severity] || 0) + 1;
    this.metrics.events.unresolved++;
  }

  // ===========================================
  // ALERT MANAGEMENT
  // ===========================================

  createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>): string {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Send notifications
    if (this.shouldNotify(alert.severity)) {
      this.sendNotifications(alert);
    }

    console.log(`🚨 Security alert created: ${alert.title} (${alert.severity})`);
    return alert.id;
  }

  acknowledgeAlert(alertId: string, assignee?: string, notes?: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.assignee = assignee;
    alert.notes = notes;

    this.logSecurityEvent({
      type: 'system_event',
      severity: 'low',
      source: 'alert_management',
      details: {
        alert_id: alertId,
        action: 'acknowledged',
        assignee,
        notes
      }
    });

    return true;
  }

  private shouldNotify(severity: string): boolean {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const thresholdIndex = severityLevels.indexOf(this.config.alerts.severity_threshold);
    const eventIndex = severityLevels.indexOf(severity);
    
    return eventIndex >= thresholdIndex;
  }

  private async sendNotifications(alert: SecurityAlert): Promise<void> {
    // Email notifications
    if (this.config.alerts.email_notifications) {
      await this.sendEmailAlert(alert);
    }

    // Slack webhooks
    if (this.config.alerts.slack_webhooks) {
      await this.sendSlackAlert(alert);
    }

    // Browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Security Alert: ${alert.title}`, {
        body: alert.message,
        icon: '/security-icon.png',
        badge: '/security-badge.png'
      });
    }
  }

  // ===========================================
  // DATA ENCRYPTION & SECURITY
  // ===========================================

  async encryptSensitiveData(data: string): Promise<string> {
    if (!this.encryptionKey) return data;

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) return encryptedData;

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeForLog(input: string, maxLength: number = 200): string {
    return input.length > maxLength ? 
      input.substring(0, maxLength) + '...' : 
      input.replace(/[<>'"&]/g, '');
  }

  private cleanupOldEvents(): void {
    const retentionMs = this.config.monitoring.retention_days * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    
    const oldEventCount = this.events.length;
    this.events = this.events.filter(event => event.timestamp > cutoff);
    
    if (this.events.length < oldEventCount) {
      console.log(`🧹 Cleaned up ${oldEventCount - this.events.length} old security events`);
    }
  }

  private startRealTimeMonitoring(): void {
    if (!this.config.monitoring.realtime) return;

    setInterval(() => {
      this.analyzeSecurityTrends();
    }, 60000); // Every minute
  }

  private analyzeSecurityTrends(): void {
    const recentEvents = this.events.filter(
      event => Date.now() - event.timestamp < 300000 // Last 5 minutes
    );

    if (recentEvents.length > 50) {
      this.createAlert({
        title: 'High Security Event Volume',
        message: `${recentEvents.length} security events in the last 5 minutes`,
        severity: 'medium',
        category: 'trend_analysis'
      });
    }

    const criticalEvents = recentEvents.filter(event => event.severity === 'critical');
    if (criticalEvents.length > 0) {
      this.createAlert({
        title: 'Critical Security Events Detected',
        message: `${criticalEvents.length} critical security events require immediate attention`,
        severity: 'critical',
        category: 'critical_events'
      });
    }
  }

  // External integration methods (would be implemented based on specific services)
  private async sendToSIEM(event: SecurityEvent): Promise<void> {
    // Implementation for SIEM integration
    console.log('📊 Event sent to SIEM:', event.id);
  }

  private async triggerWebhooks(event: SecurityEvent): Promise<void> {
    // Implementation for webhook triggers
    console.log('🔗 Webhooks triggered for event:', event.id);
  }

  private updateRealTimeDashboard(event: SecurityEvent): void {
    // Implementation for real-time dashboard updates
    window.dispatchEvent(new CustomEvent('security-event', { detail: event }));
  }

  private async sendEmailAlert(alert: SecurityAlert): Promise<void> {
    // Implementation for email alerts
    console.log('📧 Email alert sent:', alert.id);
  }

  private async sendSlackAlert(alert: SecurityAlert): Promise<void> {
    // Implementation for Slack alerts
    console.log('💬 Slack alert sent:', alert.id);
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  getEvents(filters?: {
    type?: string;
    severity?: string;
    dateRange?: { start: number; end: number };
    limit?: number;
  }): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (filters?.type) {
      filteredEvents = filteredEvents.filter(event => event.type === filters.type);
    }

    if (filters?.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
    }

    if (filters?.dateRange) {
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp >= filters.dateRange!.start && 
        event.timestamp <= filters.dateRange!.end
      );
    }

    if (filters?.limit) {
      filteredEvents = filteredEvents.slice(0, filters.limit);
    }

    return filteredEvents.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAlerts(acknowledged?: boolean): SecurityAlert[] {
    let alerts = [...this.alerts];
    
    if (acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === acknowledged);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  resolveEvent(eventId: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (!event || event.resolved) return false;

    event.resolved = true;
    this.metrics.events.resolved++;
    this.metrics.events.unresolved--;

    this.logSecurityEvent({
      type: 'system_event',
      severity: 'low',
      source: 'event_resolution',
      details: {
        resolved_event_id: eventId,
        resolved_at: Date.now()
      }
    });

    return true;
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Security configuration updated');
  }

  exportSecurityData(): any {
    return {
      events: this.events,
      alerts: this.alerts,
      metrics: this.metrics,
      config: this.config,
      export_timestamp: Date.now()
    };
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

export type {
  SecurityEvent,
  ThreatSignature,
  SecurityMetrics,
  SecurityAlert,
  SecurityConfig
};