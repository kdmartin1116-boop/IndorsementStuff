// ===========================================
// GOOGLE WORKSPACE INTEGRATION
// Document Management & Collaboration
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

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  downloadUrl?: string;
  parents?: string[];
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: any[];
  lastSync: string;
  nextSync?: string;
}

export class GoogleWorkspaceConnector {
  private credentials: IntegrationCredentials | null = null;
  private readonly config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  // OAuth 2.0 Authentication
  async authenticate(): Promise<string> {
    const state = this.generateRandomState();
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    localStorage.setItem('gw_oauth_state', state);
    return `${this.config.authUrl}?${authParams.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const storedState = localStorage.getItem('gw_oauth_state');
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

      await this.storeCredentials();
      localStorage.removeItem('gw_oauth_state');
      return true;

    } catch (error) {
      console.error('Google Workspace authentication failed:', error);
      return false;
    }
  }

  // ===========================================
  // GOOGLE DRIVE INTEGRATION
  // ===========================================

  async uploadFile(fileData: File, parentFolderId?: string): Promise<DriveFile> {
    await this.ensureValidToken();

    const metadata = {
      name: fileData.name,
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', fileData);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials?.accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Drive upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createFolder(name: string, parentFolderId?: string): Promise<DriveFile> {
    await this.ensureValidToken();

    const response = await this.makeApiCall('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      })
    });

    return response;
  }

  async listFiles(folderId?: string, query?: string): Promise<DriveFile[]> {
    await this.ensureValidToken();

    let searchQuery = '';
    if (folderId) {
      searchQuery += `'${folderId}' in parents`;
    }
    if (query) {
      searchQuery += searchQuery ? ` and ${query}` : query;
    }
    
    const params = new URLSearchParams({
      q: searchQuery,
      fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents)',
      pageSize: '100'
    });

    const response = await this.makeApiCall(`https://www.googleapis.com/drive/v3/files?${params}`);
    return response.files || [];
  }

  async downloadFile(fileId: string): Promise<Blob> {
    await this.ensureValidToken();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${this.credentials?.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'commenter' = 'reader'): Promise<any> {
    await this.ensureValidToken();

    return this.makeApiCall(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({
        role: role,
        type: 'user',
        emailAddress: email
      })
    });
  }

  // ===========================================
  // GOOGLE DOCS INTEGRATION
  // ===========================================

  async createDocument(title: string, content?: string): Promise<any> {
    await this.ensureValidToken();

    const doc = await this.makeApiCall('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      body: JSON.stringify({
        title: title
      })
    });

    if (content) {
      await this.updateDocument(doc.documentId, content);
    }

    return doc;
  }

  async updateDocument(documentId: string, content: string): Promise<any> {
    await this.ensureValidToken();

    return this.makeApiCall(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1
              },
              text: content
            }
          }
        ]
      })
    });
  }

  async getDocument(documentId: string): Promise<any> {
    await this.ensureValidToken();

    return this.makeApiCall(`https://docs.googleapis.com/v1/documents/${documentId}`);
  }

  // ===========================================
  // GOOGLE SHEETS INTEGRATION
  // ===========================================

  async createSpreadsheet(title: string, headers?: string[]): Promise<any> {
    await this.ensureValidToken();

    const spreadsheet = await this.makeApiCall('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          title: title
        }
      })
    });

    if (headers && headers.length > 0) {
      await this.updateSpreadsheet(spreadsheet.spreadsheetId, 'A1', [headers]);
    }

    return spreadsheet;
  }

  async updateSpreadsheet(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    await this.ensureValidToken();

    return this.makeApiCall(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: values
        })
      }
    );
  }

  async getSpreadsheetData(spreadsheetId: string, range: string): Promise<any[][]> {
    await this.ensureValidToken();

    const response = await this.makeApiCall(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`
    );

    return response.values || [];
  }

  // ===========================================
  // GMAIL INTEGRATION
  // ===========================================

  async sendEmail(to: string, subject: string, body: string, attachments?: File[]): Promise<any> {
    await this.ensureValidToken();

    let emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body
    ].join('\n');

    if (attachments && attachments.length > 0) {
      // Handle attachments (simplified for this example)
      emailContent = `Content-Type: multipart/mixed; boundary="boundary123"\n\n${emailContent}`;
    }

    const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return this.makeApiCall('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        raw: encodedEmail
      })
    });
  }

  async getEmails(query?: string, maxResults: number = 10): Promise<any[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      q: query || '',
      maxResults: maxResults.toString()
    });

    const response = await this.makeApiCall(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`);
    return response.messages || [];
  }

  // ===========================================
  // GOOGLE CALENDAR INTEGRATION
  // ===========================================

  async createEvent(eventData: any): Promise<any> {
    await this.ensureValidToken();

    return this.makeApiCall('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'America/New_York'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'America/New_York'
        },
        attendees: eventData.attendees?.map((email: string) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      })
    });
  }

  async getEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    });

    const response = await this.makeApiCall(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`);
    return response.items || [];
  }

  // ===========================================
  // SYNC OPERATIONS
  // ===========================================

  async syncDocuments(localDocuments: any[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      errors: [],
      lastSync: new Date().toISOString()
    };

    try {
      // Create a Sovereign Legal folder if it doesn't exist
      const folders = await this.listFiles(undefined, "name='Sovereign Legal' and mimeType='application/vnd.google-apps.folder'");
      let sovereignFolder = folders[0];
      
      if (!sovereignFolder) {
        sovereignFolder = await this.createFolder('Sovereign Legal');
      }

      for (const doc of localDocuments) {
        try {
          if (doc.file instanceof File) {
            await this.uploadFile(doc.file, sovereignFolder.id);
          } else if (doc.type === 'document' && doc.content) {
            await this.createDocument(doc.title, doc.content);
          } else if (doc.type === 'spreadsheet' && doc.data) {
            const sheet = await this.createSpreadsheet(doc.title);
            await this.updateSpreadsheet(sheet.spreadsheetId, 'A1', doc.data);
          }
          
          result.recordsProcessed++;
        } catch (error) {
          result.errors.push({ 
            document: doc.id, 
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

  private async makeApiCall(url: string, options: RequestInit = {}): Promise<any> {
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
      throw new Error(`Google API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated with Google Workspace');
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
    localStorage.setItem('gw_credentials', encryptedCredentials);
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async loadCredentials(): Promise<void> {
    const stored = localStorage.getItem('gw_credentials');
    if (stored) {
      try {
        this.credentials = JSON.parse(atob(stored));
      } catch (error) {
        console.error('Failed to load Google Workspace credentials:', error);
      }
    }
  }
}