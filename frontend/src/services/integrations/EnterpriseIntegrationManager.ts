// ===========================================
// ENTERPRISE INTEGRATION MANAGER
// Centralized Integration Orchestration
// ===========================================

import { SalesforceConnector } from './SalesforceConnector';
import { HubSpotConnector } from './HubSpotConnector';
import { GoogleWorkspaceConnector } from './GoogleWorkspaceConnector';
import { SlackConnector } from './SlackConnector';
import { QuickBooksConnector } from './QuickBooksConnector';

interface IntegrationConfig {
  salesforce?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    environment: 'production' | 'sandbox';
  };
  hubspot?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  googleWorkspace?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  slack?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  quickbooks?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    environment: 'production' | 'sandbox';
  };
}

interface IntegrationStatus {
  platform: string;
  connected: boolean;
  lastSync?: string;
  health: 'healthy' | 'warning' | 'error';
  message?: string;
  recordsCount?: number;
}

interface SyncJob {
  id: string;
  platform: string;
  type: 'manual' | 'scheduled' | 'webhook';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  errors: any[];
}

interface WebhookPayload {
  platform: string;
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export class EnterpriseIntegrationManager {
  private config: IntegrationConfig;
  private connectors: Map<string, any> = new Map();
  private syncJobs: Map<string, SyncJob> = new Map();
  private webhookQueue: WebhookPayload[] = [];
  private isProcessingWebhooks = false;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.initializeConnectors();
    this.startWebhookProcessor();
  }

  // ===========================================
  // CONNECTOR INITIALIZATION
  // ===========================================

  private initializeConnectors(): void {
    // Initialize Salesforce
    if (this.config.salesforce) {
      const sfConfig = {
        clientId: this.config.salesforce.clientId,
        clientSecret: this.config.salesforce.clientSecret,
        redirectUri: this.config.salesforce.redirectUri,
        scopes: ['api', 'refresh_token', 'offline_access'],
        authUrl: this.config.salesforce.environment === 'sandbox' 
          ? 'https://test.salesforce.com/services/oauth2/authorize'
          : 'https://login.salesforce.com/services/oauth2/authorize',
        tokenUrl: this.config.salesforce.environment === 'sandbox'
          ? 'https://test.salesforce.com/services/oauth2/token'
          : 'https://login.salesforce.com/services/oauth2/token'
      };
      this.connectors.set('salesforce', new SalesforceConnector(sfConfig));
    }

    // Initialize HubSpot
    if (this.config.hubspot) {
      const hsConfig = {
        clientId: this.config.hubspot.clientId,
        clientSecret: this.config.hubspot.clientSecret,
        redirectUri: this.config.hubspot.redirectUri,
        scopes: ['contacts', 'content', 'reports', 'social', 'automation', 'timeline', 'business-intelligence'],
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        tokenUrl: 'https://api.hubapi.com/oauth/v1/token'
      };
      this.connectors.set('hubspot', new HubSpotConnector(hsConfig));
    }

    // Initialize Google Workspace
    if (this.config.googleWorkspace) {
      const gwConfig = {
        clientId: this.config.googleWorkspace.clientId,
        clientSecret: this.config.googleWorkspace.clientSecret,
        redirectUri: this.config.googleWorkspace.redirectUri,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/calendar'
        ],
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token'
      };
      this.connectors.set('googleWorkspace', new GoogleWorkspaceConnector(gwConfig));
    }

    // Initialize Slack
    if (this.config.slack) {
      const slackConfig = {
        clientId: this.config.slack.clientId,
        clientSecret: this.config.slack.clientSecret,
        redirectUri: this.config.slack.redirectUri,
        scopes: ['channels:read', 'chat:write', 'files:write', 'users:read', 'commands'],
        authUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access'
      };
      this.connectors.set('slack', new SlackConnector(slackConfig));
    }

    // Initialize QuickBooks
    if (this.config.quickbooks) {
      const qbConfig = {
        clientId: this.config.quickbooks.clientId,
        clientSecret: this.config.quickbooks.clientSecret,
        redirectUri: this.config.quickbooks.redirectUri,
        scopes: ['com.intuit.quickbooks.accounting'],
        authUrl: 'https://appcenter.intuit.com/connect/oauth2',
        tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
      };
      this.connectors.set('quickbooks', new QuickBooksConnector(qbConfig, this.config.quickbooks.environment));
    }

    console.log(`🔧 Initialized ${this.connectors.size} enterprise connectors`);
  }

  // ===========================================
  // AUTHENTICATION MANAGEMENT
  // ===========================================

  async authenticatePlatform(platform: string): Promise<string> {
    const connector = this.connectors.get(platform);
    if (!connector) {
      throw new Error(`Platform ${platform} not configured`);
    }

    if (!connector.authenticate) {
      throw new Error(`Platform ${platform} does not support authentication`);
    }

    return connector.authenticate();
  }

  async handleAuthCallback(platform: string, code: string, state: string): Promise<boolean> {
    const connector = this.connectors.get(platform);
    if (!connector) {
      throw new Error(`Platform ${platform} not configured`);
    }

    const success = await connector.handleCallback(code, state);
    
    if (success) {
      console.log(`✅ Successfully authenticated with ${platform}`);
      // Trigger initial sync
      await this.schedulePlatformSync(platform, 'manual');
    }

    return success;
  }

  async disconnectPlatform(platform: string): Promise<boolean> {
    try {
      // Clear stored credentials
      localStorage.removeItem(`${platform.toLowerCase()}_credentials`);
      
      // Update status
      this.updateIntegrationStatus(platform, {
        platform,
        connected: false,
        health: 'warning',
        message: 'Disconnected by user'
      });

      console.log(`🔌 Disconnected from ${platform}`);
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from ${platform}:`, error);
      return false;
    }
  }

  // ===========================================
  // SYNC OPERATIONS
  // ===========================================

  async syncAllPlatforms(): Promise<Map<string, SyncJob>> {
    const syncJobs = new Map<string, SyncJob>();

    for (const [platform] of this.connectors) {
      try {
        const job = await this.schedulePlatformSync(platform, 'manual');
        syncJobs.set(platform, job);
      } catch (error) {
        console.error(`Failed to sync ${platform}:`, error);
      }
    }

    return syncJobs;
  }

  async schedulePlatformSync(platform: string, type: 'manual' | 'scheduled' | 'webhook' = 'manual'): Promise<SyncJob> {
    const jobId = `${platform}-${Date.now()}`;
    const job: SyncJob = {
      id: jobId,
      platform,
      type,
      status: 'pending',
      startTime: new Date().toISOString(),
      recordsProcessed: 0,
      errors: []
    };

    this.syncJobs.set(jobId, job);

    // Execute sync in background
    this.executePlatformSync(job);

    return job;
  }

  private async executePlatformSync(job: SyncJob): Promise<void> {
    try {
      job.status = 'running';
      const connector = this.connectors.get(job.platform);
      
      if (!connector) {
        throw new Error(`Connector for ${job.platform} not found`);
      }

      // Get local data that needs syncing
      const localData = await this.getLocalDataForSync(job.platform);
      
      // Execute platform-specific sync
      let syncResult;
      switch (job.platform) {
        case 'salesforce':
          syncResult = await connector.syncToSalesforce(localData);
          break;
        case 'hubspot':
          syncResult = await connector.syncToHubSpot(localData);
          break;
        case 'googleWorkspace':
          syncResult = await connector.syncDocuments(localData);
          break;
        default:
          throw new Error(`Sync not implemented for ${job.platform}`);
      }

      job.recordsProcessed = syncResult.recordsProcessed;
      job.errors = syncResult.errors;
      job.status = syncResult.success ? 'completed' : 'failed';
      job.endTime = new Date().toISOString();

      // Update integration status
      this.updateIntegrationStatus(job.platform, {
        platform: job.platform,
        connected: true,
        lastSync: job.endTime,
        health: syncResult.success ? 'healthy' : 'warning',
        message: syncResult.success 
          ? `Synced ${job.recordsProcessed} records` 
          : `Sync completed with ${job.errors.length} errors`,
        recordsCount: job.recordsProcessed
      });

      console.log(`✅ Sync completed for ${job.platform}: ${job.recordsProcessed} records processed`);

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date().toISOString();
      job.errors.push({ 
        general: error instanceof Error ? error.message : String(error) 
      });

      this.updateIntegrationStatus(job.platform, {
        platform: job.platform,
        connected: false,
        health: 'error',
        message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`
      });

      console.error(`❌ Sync failed for ${job.platform}:`, error);
    }
  }

  private async getLocalDataForSync(platform: string): Promise<any[]> {
    // This would typically fetch from your local database
    // For demonstration, returning mock data
    const mockData = {
      salesforce: [
        {
          id: '1',
          type: 'lead',
          data: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            company: 'Example Corp',
            caseType: 'Bill Discharge'
          }
        }
      ],
      hubspot: [
        {
          id: '1',
          type: 'contact',
          data: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            company: 'Smith & Associates'
          }
        }
      ],
      googleWorkspace: [
        {
          id: '1',
          type: 'document',
          title: 'Legal Case Summary',
          content: 'Summary of legal case proceedings...'
        }
      ]
    };

    return mockData[platform as keyof typeof mockData] || [];
  }

  // ===========================================
  // WEBHOOK PROCESSING
  // ===========================================

  async processWebhook(payload: WebhookPayload): Promise<boolean> {
    try {
      // Validate webhook signature if provided
      if (payload.signature) {
        const isValid = await this.validateWebhookSignature(payload);
        if (!isValid) {
          console.error('Invalid webhook signature');
          return false;
        }
      }

      // Add to processing queue
      this.webhookQueue.push(payload);
      
      console.log(`📨 Webhook received from ${payload.platform}: ${payload.event}`);
      return true;

    } catch (error) {
      console.error('Webhook processing failed:', error);
      return false;
    }
  }

  private async validateWebhookSignature(_payload: WebhookPayload): Promise<boolean> {
    // Implementation would depend on the platform's signature method
    // For now, returning true for demonstration
    return true;
  }

  private startWebhookProcessor(): void {
    setInterval(async () => {
      if (this.isProcessingWebhooks || this.webhookQueue.length === 0) {
        return;
      }

      this.isProcessingWebhooks = true;

      try {
        while (this.webhookQueue.length > 0) {
          const webhook = this.webhookQueue.shift();
          if (webhook) {
            await this.handleWebhookEvent(webhook);
          }
        }
      } catch (error) {
        console.error('Webhook processor error:', error);
      } finally {
        this.isProcessingWebhooks = false;
      }
    }, 5000); // Process every 5 seconds
  }

  private async handleWebhookEvent(webhook: WebhookPayload): Promise<void> {
    try {
      switch (webhook.platform) {
        case 'salesforce':
          await this.handleSalesforceWebhook(webhook);
          break;
        case 'hubspot':
          await this.handleHubSpotWebhook(webhook);
          break;
        default:
          console.log(`Unhandled webhook from ${webhook.platform}: ${webhook.event}`);
      }
    } catch (error) {
      console.error(`Webhook handling failed for ${webhook.platform}:`, error);
    }
  }

  private async handleSalesforceWebhook(webhook: WebhookPayload): Promise<void> {
    switch (webhook.event) {
      case 'lead.created':
      case 'case.updated':
        // Trigger sync to pull latest data
        await this.schedulePlatformSync('salesforce', 'webhook');
        break;
      default:
        console.log(`Unhandled Salesforce event: ${webhook.event}`);
    }
  }

  private async handleHubSpotWebhook(webhook: WebhookPayload): Promise<void> {
    switch (webhook.event) {
      case 'contact.creation':
      case 'deal.propertyChange':
        // Trigger sync to pull latest data
        await this.schedulePlatformSync('hubspot', 'webhook');
        break;
      default:
        console.log(`Unhandled HubSpot event: ${webhook.event}`);
    }
  }

  // ===========================================
  // STATUS AND MONITORING
  // ===========================================

  getIntegrationStatus(): IntegrationStatus[] {
    const statuses: IntegrationStatus[] = [];
    
    for (const [platform] of this.connectors) {
      const stored = localStorage.getItem(`${platform}_status`);
      if (stored) {
        try {
          statuses.push(JSON.parse(stored));
        } catch (error) {
          statuses.push({
            platform,
            connected: false,
            health: 'error',
            message: 'Status data corrupted'
          });
        }
      } else {
        statuses.push({
          platform,
          connected: false,
          health: 'warning',
          message: 'Not configured'
        });
      }
    }

    return statuses;
  }

  private updateIntegrationStatus(platform: string, status: IntegrationStatus): void {
    localStorage.setItem(`${platform}_status`, JSON.stringify(status));
  }

  getSyncJobs(platform?: string): SyncJob[] {
    const jobs = Array.from(this.syncJobs.values());
    
    if (platform) {
      return jobs.filter(job => job.platform === platform);
    }
    
    return jobs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getSyncJobById(jobId: string): SyncJob | undefined {
    return this.syncJobs.get(jobId);
  }

  // ===========================================
  // CONFIGURATION MANAGEMENT
  // ===========================================

  updateConfiguration(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize connectors with new config
    this.connectors.clear();
    this.initializeConnectors();
    
    console.log('🔄 Integration configuration updated');
  }

  getAvailablePlatforms(): string[] {
    return Array.from(this.connectors.keys());
  }

  isPlatformConnected(platform: string): boolean {
    const status = this.getIntegrationStatus().find(s => s.platform === platform);
    return status?.connected || false;
  }

  // ===========================================
  // BATCH OPERATIONS
  // ===========================================

  async batchCreateRecords(platform: string, records: any[]): Promise<any> {
    const connector = this.connectors.get(platform);
    if (!connector) {
      throw new Error(`Platform ${platform} not configured`);
    }

    const results = [];
    const batchSize = 10; // Process in batches to avoid rate limits

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          let result;
          switch (platform) {
            case 'salesforce':
              result = record.type === 'lead' 
                ? await connector.createLead(record.data)
                : await connector.createCase(record.data);
              break;
            case 'hubspot':
              switch (record.type) {
                case 'contact':
                  result = await connector.createContact(record.data);
                  break;
                case 'deal':
                  result = await connector.createDeal(record.data);
                  break;
                case 'company':
                  result = await connector.createCompany(record.data);
                  break;
              }
              break;
            default:
              throw new Error(`Batch operations not supported for ${platform}`);
          }
          
          results.push({ success: true, id: record.id, result });
        } catch (error) {
          results.push({ 
            success: false, 
            id: record.id, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // Add delay between batches to respect rate limits
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // ===========================================
  // CLEANUP AND MAINTENANCE
  // ===========================================

  async cleanup(): Promise<void> {
    // Clear old sync jobs (keep last 100)
    const allJobs = Array.from(this.syncJobs.entries());
    if (allJobs.length > 100) {
      const sorted = allJobs.sort((a, b) => 
        new Date(b[1].startTime).getTime() - new Date(a[1].startTime).getTime()
      );
      
      // Keep only the most recent 100 jobs
      const toKeep = sorted.slice(0, 100);
      this.syncJobs.clear();
      toKeep.forEach(([id, job]) => this.syncJobs.set(id, job));
    }

    // Clear old webhook queue items
    this.webhookQueue = this.webhookQueue.slice(-50); // Keep last 50 webhooks

    console.log('🧹 Integration manager cleanup completed');
  }
}

// ===========================================
// INTEGRATION FACTORY
// ===========================================

export class IntegrationFactory {
  static createManager(config: IntegrationConfig): EnterpriseIntegrationManager {
    return new EnterpriseIntegrationManager(config);
  }

  static getDefaultConfig(): IntegrationConfig {
    return {
      salesforce: {
        clientId: process.env.VITE_SALESFORCE_CLIENT_ID || '',
        clientSecret: process.env.VITE_SALESFORCE_CLIENT_SECRET || '',
        redirectUri: `${window.location.origin}/auth/salesforce/callback`,
        environment: 'sandbox'
      },
      hubspot: {
        clientId: process.env.VITE_HUBSPOT_CLIENT_ID || '',
        clientSecret: process.env.VITE_HUBSPOT_CLIENT_SECRET || '',
        redirectUri: `${window.location.origin}/auth/hubspot/callback`
      },
      googleWorkspace: {
        clientId: process.env.VITE_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET || '',
        redirectUri: `${window.location.origin}/auth/google/callback`
      }
    };
  }
}

export default EnterpriseIntegrationManager;