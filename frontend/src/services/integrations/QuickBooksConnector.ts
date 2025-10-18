// ===========================================
// QUICKBOOKS INTEGRATION
// Accounting & Financial Management
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

interface QBCustomer {
  Id?: string;
  Name: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
}

interface QBInvoice {
  Id?: string;
  CustomerRef: {
    value: string;
  };
  Line: Array<{
    Amount: number;
    DetailType: 'SalesItemLineDetail';
    SalesItemLineDetail: {
      ItemRef: {
        value: string;
      };
      Qty?: number;
      UnitPrice?: number;
    };
  }>;
  DueDate?: string;
  TxnDate?: string;
  DocNumber?: string;
  PrivateNote?: string;
}

interface QBItem {
  Id?: string;
  Name: string;
  Type: 'Service' | 'Inventory' | 'NonInventory';
  UnitPrice?: number;
  IncomeAccountRef?: {
    value: string;
  };
  Description?: string;
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: any[];
  lastSync: string;
  nextSync?: string;
}

export class QuickBooksConnector {
  private credentials: IntegrationCredentials | null = null;
  private companyId: string = '';
  private baseUrl: string = '';
  private readonly config: OAuthConfig;

  constructor(config: OAuthConfig, environment: 'sandbox' | 'production' = 'sandbox') {
    this.config = config;
    this.baseUrl = environment === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';
  }

  // OAuth 2.0 Authentication
  async authenticate(): Promise<string> {
    const state = this.generateRandomState();
    const authParams = new URLSearchParams({
      client_id: this.config.clientId,
      scope: this.config.scopes.join(' '),
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      state: state
    });

    localStorage.setItem('qb_oauth_state', state);
    return `${this.config.authUrl}?${authParams.toString()}`;
  }

  async handleCallback(code: string, state: string, companyId: string): Promise<boolean> {
    const storedState = localStorage.getItem('qb_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state');
    }

    try {
      const tokenResponse = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.config.redirectUri
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

      this.companyId = companyId;
      
      await this.storeCredentials();
      localStorage.removeItem('qb_oauth_state');
      return true;

    } catch (error) {
      console.error('QuickBooks authentication failed:', error);
      return false;
    }
  }

  // ===========================================
  // CUSTOMER MANAGEMENT
  // ===========================================

  async createCustomer(customerData: QBCustomer): Promise<QBCustomer> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('POST', 'customer', customerData);
    return response.QueryResponse?.Customer?.[0] || response.Customer;
  }

  async updateCustomer(customerId: string, customerData: QBCustomer): Promise<QBCustomer> {
    await this.ensureValidToken();
    
    // First get the current customer to get the SyncToken
    const existingCustomer = await this.getCustomer(customerId);
    
    const updateData = {
      ...customerData,
      Id: customerId,
      SyncToken: existingCustomer.SyncToken
    };
    
    const response = await this.makeApiCall('POST', 'customer', updateData);
    return response.QueryResponse?.Customer?.[0] || response.Customer;
  }

  async getCustomer(customerId: string): Promise<QBCustomer> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('GET', `customer/${customerId}`);
    return response.QueryResponse?.Customer?.[0];
  }

  async getCustomers(filter?: string): Promise<QBCustomer[]> {
    await this.ensureValidToken();
    
    let query = "SELECT * FROM Customer";
    if (filter) {
      query += ` WHERE ${filter}`;
    }
    query += " MAXRESULTS 100";
    
    const response = await this.makeApiCall('GET', `query?query=${encodeURIComponent(query)}`);
    return response.QueryResponse?.Customer || [];
  }

  async findCustomerByEmail(email: string): Promise<QBCustomer | null> {
    const customers = await this.getCustomers(`PrimaryEmailAddr = '${email}'`);
    return customers.length > 0 ? customers[0] : null;
  }

  // ===========================================
  // INVOICE MANAGEMENT
  // ===========================================

  async createInvoice(invoiceData: QBInvoice): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('POST', 'invoice', invoiceData);
    return response.QueryResponse?.Invoice?.[0] || response.Invoice;
  }

  async getInvoice(invoiceId: string): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('GET', `invoice/${invoiceId}`);
    return response.QueryResponse?.Invoice?.[0];
  }

  async getInvoices(customerId?: string): Promise<any[]> {
    await this.ensureValidToken();
    
    let query = "SELECT * FROM Invoice";
    if (customerId) {
      query += ` WHERE CustomerRef = '${customerId}'`;
    }
    query += " ORDER BY TxnDate DESC MAXRESULTS 100";
    
    const response = await this.makeApiCall('GET', `query?query=${encodeURIComponent(query)}`);
    return response.QueryResponse?.Invoice || [];
  }

  async sendInvoice(invoiceId: string, email: string): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('POST', `invoice/${invoiceId}/send?sendTo=${email}`);
  }

  // Legal-specific invoice creation
  async createLegalInvoice(clientData: any, servicesData: any[]): Promise<any> {
    // First ensure customer exists
    let customer = await this.findCustomerByEmail(clientData.email);
    
    if (!customer) {
      customer = await this.createCustomer({
        Name: `${clientData.firstName} ${clientData.lastName}`,
        GivenName: clientData.firstName,
        FamilyName: clientData.lastName,
        CompanyName: clientData.company,
        PrimaryEmailAddr: {
          Address: clientData.email
        },
        PrimaryPhone: clientData.phone ? {
          FreeFormNumber: clientData.phone
        } : undefined
      });
    }

    // Create invoice lines for legal services
    const lines = servicesData.map(service => ({
      Amount: service.amount,
      DetailType: 'SalesItemLineDetail' as const,
      SalesItemLineDetail: {
        ItemRef: {
          value: service.itemId || '1' // Default service item
        },
        Qty: service.quantity || 1,
        UnitPrice: service.rate || service.amount
      }
    }));

    const invoiceData: QBInvoice = {
      CustomerRef: {
        value: customer.Id!
      },
      Line: lines,
      TxnDate: new Date().toISOString().split('T')[0],
      DueDate: servicesData[0]?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      PrivateNote: `Legal services invoice for case: ${clientData.caseNumber || 'N/A'}`
    };

    return this.createInvoice(invoiceData);
  }

  // ===========================================
  // ITEM MANAGEMENT
  // ===========================================

  async createItem(itemData: QBItem): Promise<QBItem> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('POST', 'item', itemData);
    return response.QueryResponse?.Item?.[0] || response.Item;
  }

  async getItems(type?: string): Promise<QBItem[]> {
    await this.ensureValidToken();
    
    let query = "SELECT * FROM Item";
    if (type) {
      query += ` WHERE Type = '${type}'`;
    }
    query += " MAXRESULTS 100";
    
    const response = await this.makeApiCall('GET', `query?query=${encodeURIComponent(query)}`);
    return response.QueryResponse?.Item || [];
  }

  async setupLegalServiceItems(): Promise<QBItem[]> {
    const legalServices = [
      {
        Name: 'Legal Consultation',
        Type: 'Service' as const,
        UnitPrice: 250.00,
        Description: 'Legal consultation and advisory services'
      },
      {
        Name: 'Document Review',
        Type: 'Service' as const,
        UnitPrice: 150.00,
        Description: 'Legal document review and analysis'
      },
      {
        Name: 'Bill Discharge Service',
        Type: 'Service' as const,
        UnitPrice: 500.00,
        Description: 'Administrative bill discharge process'
      },
      {
        Name: 'Court Representation',
        Type: 'Service' as const,
        UnitPrice: 400.00,
        Description: 'Legal representation in court proceedings'
      },
      {
        Name: 'Contract Drafting',
        Type: 'Service' as const,
        UnitPrice: 300.00,
        Description: 'Legal contract drafting and preparation'
      }
    ];

    const createdItems = [];
    
    for (const service of legalServices) {
      try {
        const item = await this.createItem(service);
        createdItems.push(item);
      } catch (error) {
        console.warn(`Service item ${service.Name} may already exist:`, error);
      }
    }

    return createdItems;
  }

  // ===========================================
  // PAYMENT TRACKING
  // ===========================================

  async getPayments(customerId?: string): Promise<any[]> {
    await this.ensureValidToken();
    
    let query = "SELECT * FROM Payment";
    if (customerId) {
      query += ` WHERE CustomerRef = '${customerId}'`;
    }
    query += " ORDER BY TxnDate DESC MAXRESULTS 100";
    
    const response = await this.makeApiCall('GET', `query?query=${encodeURIComponent(query)}`);
    return response.QueryResponse?.Payment || [];
  }

  async recordPayment(paymentData: any): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('POST', 'payment', paymentData);
    return response.QueryResponse?.Payment?.[0] || response.Payment;
  }

  // ===========================================
  // REPORTING
  // ===========================================

  async getProfitAndLoss(startDate: string, endDate: string): Promise<any> {
    await this.ensureValidToken();
    
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      summarize_column_by: 'Month'
    });
    
    return this.makeApiCall('GET', `reports/ProfitAndLoss?${params}`);
  }

  async getAgedReceivables(): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('GET', 'reports/AgedReceivables');
  }

  async getIncomeStatement(startDate: string, endDate: string): Promise<any> {
    await this.ensureValidToken();
    
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    
    return this.makeApiCall('GET', `reports/ProfitAndLoss?${params}`);
  }

  // ===========================================
  // EXPENSE TRACKING
  // ===========================================

  async createExpense(expenseData: any): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('POST', 'purchase', expenseData);
    return response.QueryResponse?.Purchase?.[0] || response.Purchase;
  }

  async getExpenses(startDate?: string, endDate?: string): Promise<any[]> {
    await this.ensureValidToken();
    
    let query = "SELECT * FROM Purchase WHERE PaymentType = 'Cash'";
    
    if (startDate && endDate) {
      query += ` AND TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`;
    }
    
    query += " ORDER BY TxnDate DESC MAXRESULTS 100";
    
    const response = await this.makeApiCall('GET', `query?query=${encodeURIComponent(query)}`);
    return response.QueryResponse?.Purchase || [];
  }

  // ===========================================
  // SYNC OPERATIONS
  // ===========================================

  async syncToQuickBooks(localData: any[]): Promise<SyncResult> {
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
            case 'customer':
              await this.createCustomer(record.data);
              break;
            case 'invoice':
              await this.createLegalInvoice(record.clientData, record.servicesData);
              break;
            case 'expense':
              await this.createExpense(record.data);
              break;
            case 'payment':
              await this.recordPayment(record.data);
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

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private async makeApiCall(method: 'GET' | 'POST', endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}/v3/company/${this.companyId}/${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.credentials?.accessToken}`,
        'Accept': 'application/json'
      }
    };

    if (method === 'POST' && data) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`QuickBooks API error: ${response.status} - ${errorData.Fault?.Error?.[0]?.Detail || response.statusText}`);
    }

    return response.json();
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated with QuickBooks');
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
        'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken
      })
    });

    const tokenData = await response.json();
    
    if (tokenData.error) {
      throw new Error(`Token refresh failed: ${tokenData.error_description}`);
    }

    this.credentials.accessToken = tokenData.access_token;
    this.credentials.refreshToken = tokenData.refresh_token;
    this.credentials.expiresAt = Date.now() + (tokenData.expires_in * 1000);
    
    await this.storeCredentials();
  }

  private async storeCredentials(): Promise<void> {
    const encryptedCredentials = btoa(JSON.stringify({
      credentials: this.credentials,
      companyId: this.companyId
    }));
    localStorage.setItem('qb_credentials', encryptedCredentials);
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async loadCredentials(): Promise<void> {
    const stored = localStorage.getItem('qb_credentials');
    if (stored) {
      try {
        const data = JSON.parse(atob(stored));
        this.credentials = data.credentials;
        this.companyId = data.companyId;
      } catch (error) {
        console.error('Failed to load QuickBooks credentials:', error);
      }
    }
  }

  // ===========================================
  // COMPANY INFO
  // ===========================================

  async getCompanyInfo(): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('GET', `companyinfo/${this.companyId}`);
    return response.QueryResponse?.CompanyInfo?.[0];
  }

  async getPreferences(): Promise<any> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('GET', 'preferences');
    return response.QueryResponse?.Preferences?.[0];
  }

  // ===========================================
  // WEBHOOK HANDLING
  // ===========================================

  async setupWebhook(webhookUrl: string): Promise<boolean> {
    try {
      // QuickBooks webhooks are set up through the developer dashboard
      // This is a placeholder for webhook configuration
      console.log(`Webhook URL configured: ${webhookUrl}`);
      return true;
    } catch (error) {
      console.error('Webhook setup failed:', error);
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<any> {
    // Handle QuickBooks webhook notifications
    for (const event of payload.eventNotifications || []) {
      for (const entity of event.dataChangeEvent?.entities || []) {
        console.log(`QuickBooks ${entity.name} ${entity.operation}: ${entity.id}`);
        
        // Trigger sync based on entity changes
        switch (entity.name) {
          case 'Customer':
          case 'Invoice':
          case 'Payment':
            // Trigger relevant sync operations
            break;
        }
      }
    }

    return { success: true };
  }
}