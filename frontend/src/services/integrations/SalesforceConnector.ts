// ===========================================
// ENTERPRISE INTEGRATION SUITE
// Comprehensive Business System Connectors
// ===========================================

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

interface IntegrationCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: any[];
  lastSync: string;
  nextSync?: string;
}

// ===========================================
// SALESFORCE CRM INTEGRATION
// ===========================================

export class SalesforceConnector {
  private credentials: IntegrationCredentials | null = null;
  private instanceUrl: string = '';
  private readonly config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  // OAuth 2.0 Authentication Flow
  async authenticate(): Promise<string> {
    const state = this.generateRandomState();
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state
    });

    localStorage.setItem('sf_oauth_state', state);
    return `${this.config.authUrl}?${authParams.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const storedState = localStorage.getItem('sf_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state');
    }

    try {
      const tokenResponse = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code: code
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description);
      }

      this.credentials = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      };

      this.instanceUrl = tokenData.instance_url;
      
      // Store credentials securely
      await this.storeCredentials();
      
      localStorage.removeItem('sf_oauth_state');
      return true;

    } catch (error) {
      console.error('Salesforce authentication failed:', error);
      return false;
    }
  }

  // Lead Management
  async createLead(leadData: any): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('/services/data/v58.0/sobjects/Lead/', {
      method: 'POST',
      body: JSON.stringify({
        FirstName: leadData.firstName,
        LastName: leadData.lastName,
        Email: leadData.email,
        Company: leadData.company || 'Sovereign Legal Client',
        LeadSource: 'Sovereign Legal Platform',
        Status: 'New',
        Industry: 'Legal Services',
        Description: `Legal case inquiry: ${leadData.caseType || 'General'}`
      })
    });

    return response;
  }

  async updateLead(leadId: string, updateData: any): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall(`/services/data/v58.0/sobjects/Lead/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }

  async getLeads(filters?: any): Promise<any[]> {
    await this.ensureValidToken();
    
    let query = `SELECT Id, FirstName, LastName, Email, Company, Status, CreatedDate 
                 FROM Lead WHERE LeadSource = 'Sovereign Legal Platform'`;
    
    if (filters?.status) {
      query += ` AND Status = '${filters.status}'`;
    }
    
    if (filters?.dateRange) {
      query += ` AND CreatedDate >= ${filters.dateRange.start}`;
    }
    
    query += ' ORDER BY CreatedDate DESC LIMIT 100';
    
    const response = await this.makeApiCall(`/services/data/v58.0/query/?q=${encodeURIComponent(query)}`);
    return response.records || [];
  }

  // Case Management
  async createCase(caseData: any): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('/services/data/v58.0/sobjects/Case/', {
      method: 'POST',
      body: JSON.stringify({
        Subject: caseData.subject,
        Description: caseData.description,
        Status: 'New',
        Priority: caseData.priority || 'Medium',
        Origin: 'Sovereign Legal Platform',
        Type: caseData.caseType || 'Legal Consultation',
        ContactEmail: caseData.contactEmail
      })
    });
  }

  async getCases(filters?: any): Promise<any[]> {
    await this.ensureValidToken();
    
    let query = `SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate, ContactEmail 
                 FROM Case WHERE Origin = 'Sovereign Legal Platform'`;
    
    if (filters?.status) {
      query += ` AND Status = '${filters.status}'`;
    }
    
    query += ' ORDER BY CreatedDate DESC LIMIT 100';
    
    const response = await this.makeApiCall(`/services/data/v58.0/query/?q=${encodeURIComponent(query)}`);
    return response.records || [];
  }

  // Sync Operations
  async syncToSalesforce(localData: any[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      errors: [],
      lastSync: new Date().toISOString()
    };

    try {
      for (const record of localData) {
        try {
          if (record.type === 'lead') {
            await this.createLead(record.data);
          } else if (record.type === 'case') {
            await this.createCase(record.data);
          }
          result.recordsProcessed++;
        } catch (error) {
          result.errors.push({ record: record.id, error: error.message });
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({ general: error.message });
    }

    return result;
  }

  // Utility Methods
  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.instanceUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.credentials?.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Salesforce API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated with Salesforce');
    }

    if (this.credentials.expiresAt && Date.now() >= this.credentials.expiresAt) {
      await this.refreshToken();
    }
  }

  private async refreshToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.credentials.refreshToken
      })
    });

    const tokenData = await response.json();
    
    if (tokenData.error) {
      throw new Error(`Token refresh failed: ${tokenData.error_description}`);
    }

    this.credentials.accessToken = tokenData.access_token;
    this.credentials.expiresAt = Date.now() + (tokenData.expires_in * 1000);
    
    await this.storeCredentials();
  }

  private async storeCredentials(): Promise<void> {
    // In a real implementation, encrypt and store securely
    const encryptedCredentials = btoa(JSON.stringify({
      credentials: this.credentials,
      instanceUrl: this.instanceUrl
    }));
    
    localStorage.setItem('sf_credentials', encryptedCredentials);
  }

  private async loadCredentials(): Promise<void> {
    const stored = localStorage.getItem('sf_credentials');
    if (stored) {
      try {
        const data = JSON.parse(atob(stored));
        this.credentials = data.credentials;
        this.instanceUrl = data.instanceUrl;
      } catch (error) {
        console.error('Failed to load Salesforce credentials:', error);
      }
    }
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Setup webhook for real-time updates
  async setupWebhook(config: WebhookConfig): Promise<boolean> {
    try {
      await this.ensureValidToken();
      
      // Create Platform Event for real-time notifications
      const platformEvent = await this.makeApiCall('/services/data/v58.0/sobjects/Sovereign_Legal_Event__e/', {
        method: 'POST',
        body: JSON.stringify({
          Event_Type__c: 'sync_request',
          Data__c: JSON.stringify(config)
        })
      });

      return platformEvent.success;
    } catch (error) {
      console.error('Webhook setup failed:', error);
      return false;
    }
  }
}