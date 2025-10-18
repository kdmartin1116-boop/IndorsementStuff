// ===========================================
// HUBSPOT CRM INTEGRATION
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

export class HubSpotConnector {
  private credentials: IntegrationCredentials | null = null;
  private readonly config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  // OAuth 2.0 Authentication
  async authenticate(): Promise<string> {
    const state = this.generateRandomState();
    const authParams = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state
    });

    localStorage.setItem('hs_oauth_state', state);
    return `${this.config.authUrl}?${authParams.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const storedState = localStorage.getItem('hs_oauth_state');
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
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      };

      await this.storeCredentials();
      localStorage.removeItem('hs_oauth_state');
      return true;

    } catch (error) {
      console.error('HubSpot authentication failed:', error);
      return false;
    }
  }

  // Contact Management
  async createContact(contactData: any): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          firstname: contactData.firstName,
          lastname: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          website: contactData.website,
          lifecyclestage: 'lead',
          lead_source: 'Sovereign Legal Platform',
          hs_analytics_source: 'OFFLINE'
        }
      })
    });

    return response;
  }

  async updateContact(contactId: string, updateData: any): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties: updateData
      })
    });
  }

  async getContacts(filters?: any): Promise<any[]> {
    await this.ensureValidToken();
    
    let url = '/crm/v3/objects/contacts?properties=firstname,lastname,email,phone,company,createdate';
    
    if (filters?.limit) {
      url += `&limit=${filters.limit}`;
    }

    const response = await this.makeApiCall(url);
    return response.results || [];
  }

  // Deal Management
  async createDeal(dealData: any): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          dealname: dealData.dealName,
          amount: dealData.amount,
          dealstage: dealData.stage || 'appointmentscheduled',
          pipeline: 'default',
          closedate: dealData.closeDate,
          dealtype: 'newbusiness',
          description: dealData.description
        }
      })
    });
  }

  async getDeals(filters?: any): Promise<any[]> {
    await this.ensureValidToken();
    
    let url = '/crm/v3/objects/deals?properties=dealname,amount,dealstage,closedate,createdate';
    
    if (filters?.limit) {
      url += `&limit=${filters.limit}`;
    }

    const response = await this.makeApiCall(url);
    return response.results || [];
  }

  // Company Management
  async createCompany(companyData: any): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('/crm/v3/objects/companies', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          name: companyData.name,
          domain: companyData.domain,
          industry: companyData.industry || 'LEGAL',
          phone: companyData.phone,
          city: companyData.city,
          state: companyData.state,
          country: companyData.country,
          description: companyData.description
        }
      })
    });
  }

  // Ticket Management (for support cases)
  async createTicket(ticketData: any): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('/crm/v3/objects/tickets', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          subject: ticketData.subject,
          content: ticketData.content,
          hs_pipeline: 'support_pipeline',
          hs_pipeline_stage: 'new',
          hs_ticket_priority: ticketData.priority || 'MEDIUM',
          source_type: 'CHAT'
        }
      })
    });
  }

  // Sync Operations
  async syncToHubSpot(localData: any[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      errors: [],
      lastSync: new Date().toISOString()
    };

    try {
      for (const record of localData) {
        try {
          switch (record.type) {
            case 'contact':
              await this.createContact(record.data);
              break;
            case 'deal':
              await this.createDeal(record.data);
              break;
            case 'company':
              await this.createCompany(record.data);
              break;
            case 'ticket':
              await this.createTicket(record.data);
              break;
          }
          result.recordsProcessed++;
        } catch (error) {
          result.errors.push({ 
            record: record.id, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push({ 
        general: error instanceof Error ? error.message : String(error) 
      });
    }

    return result;
  }

  // Email Marketing
  async addToEmailList(email: string, listId: string): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall(`/contacts/v1/lists/${listId}/add`, {
      method: 'POST',
      body: JSON.stringify({
        emails: [email]
      })
    });
  }

  // Analytics and Reporting
  async getAnalytics(timeRange?: string): Promise<any> {
    await this.ensureValidToken();
    
    const startDate = timeRange || '2024-01-01';
    const endDate = new Date().toISOString().split('T')[0];
    
    return this.makeApiCall(`/analytics/v2/reports/traffic-analytics?start-date=${startDate}&end-date=${endDate}`);
  }

  // Utility Methods
  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const baseUrl = 'https://api.hubapi.com';
    const url = `${baseUrl}${endpoint}`;
    
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
      throw new Error(`HubSpot API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated with HubSpot');
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
    const encryptedCredentials = btoa(JSON.stringify(this.credentials));
    localStorage.setItem('hs_credentials', encryptedCredentials);
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Webhook Management
  async setupWebhook(config: WebhookConfig): Promise<boolean> {
    try {
      await this.ensureValidToken();
      
      const webhook = await this.makeApiCall('/webhooks/v3/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'contact.creation',
          webhookUrl: config.url,
          active: config.active
        })
      });

      return webhook.id ? true : false;
    } catch (error) {
      console.error('HubSpot webhook setup failed:', error);
      return false;
    }
  }
}