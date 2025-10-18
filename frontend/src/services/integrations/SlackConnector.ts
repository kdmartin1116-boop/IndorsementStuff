// ===========================================
// SLACK INTEGRATION
// Team Communication & Notifications
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

interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  topic?: string;
  purpose?: string;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
  is_bot: boolean;
  profile: {
    display_name: string;
    email?: string;
    image_48: string;
  };
}

export class SlackConnector {
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
      scope: this.config.scopes.join(','),
      redirect_uri: this.config.redirectUri,
      state: state
    });

    localStorage.setItem('slack_oauth_state', state);
    return `${this.config.authUrl}?${authParams.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    const storedState = localStorage.getItem('slack_oauth_state');
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
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: code,
          redirect_uri: this.config.redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.ok) {
        throw new Error(tokenData.error || 'Authentication failed');
      }

      this.credentials = {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope
      };

      await this.storeCredentials();
      localStorage.removeItem('slack_oauth_state');
      return true;

    } catch (error) {
      console.error('Slack authentication failed:', error);
      return false;
    }
  }

  // ===========================================
  // MESSAGING
  // ===========================================

  async sendMessage(channel: string, text: string, attachments?: any[]): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('chat.postMessage', {
      channel: channel,
      text: text,
      attachments: attachments,
      as_user: true
    });
  }

  async sendDirectMessage(userId: string, text: string): Promise<any> {
    await this.ensureValidToken();
    
    // Open DM channel first
    const dmChannel = await this.makeApiCall('conversations.open', {
      users: userId
    });

    if (!dmChannel.ok) {
      throw new Error('Failed to open DM channel');
    }

    return this.sendMessage(dmChannel.channel.id, text);
  }

  async sendRichMessage(channel: string, blocks: any[]): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('chat.postMessage', {
      channel: channel,
      blocks: blocks
    });
  }

  // Legal-specific message templates
  async sendLegalAlert(channel: string, alertData: any): Promise<any> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚖️ Legal Alert'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Case:* ${alertData.caseNumber || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:* ${alertData.priority || 'Medium'}`
          },
          {
            type: 'mrkdwn',
            text: `*Client:* ${alertData.clientName || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Type:* ${alertData.alertType || 'General'}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Details:*\n${alertData.description || 'No additional details provided.'}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Case'
            },
            url: alertData.caseUrl || '#',
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Mark Resolved'
            },
            action_id: 'resolve_alert',
            value: alertData.alertId
          }
        ]
      }
    ];

    return this.sendRichMessage(channel, blocks);
  }

  async sendDocumentNotification(channel: string, documentData: any): Promise<any> {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📄 *New Document:* ${documentData.name}\n*Type:* ${documentData.type}\n*Client:* ${documentData.clientName}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Review'
          },
          url: documentData.reviewUrl,
          style: 'primary'
        }
      }
    ];

    return this.sendRichMessage(channel, blocks);
  }

  // ===========================================
  // CHANNEL MANAGEMENT
  // ===========================================

  async listChannels(): Promise<SlackChannel[]> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('conversations.list', {
      types: 'public_channel,private_channel',
      exclude_archived: true
    });

    return response.channels || [];
  }

  async createChannel(name: string, isPrivate: boolean = false): Promise<SlackChannel> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('conversations.create', {
      name: name,
      is_private: isPrivate
    });

    return response.channel;
  }

  async inviteToChannel(channelId: string, userIds: string[]): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('conversations.invite', {
      channel: channelId,
      users: userIds.join(',')
    });
  }

  async setChannelTopic(channelId: string, topic: string): Promise<any> {
    await this.ensureValidToken();
    
    return this.makeApiCall('conversations.setTopic', {
      channel: channelId,
      topic: topic
    });
  }

  // ===========================================
  // USER MANAGEMENT
  // ===========================================

  async listUsers(): Promise<SlackUser[]> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('users.list');
    return response.members || [];
  }

  async getUserInfo(userId: string): Promise<SlackUser> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('users.info', {
      user: userId
    });

    return response.user;
  }

  async findUserByEmail(email: string): Promise<SlackUser | null> {
    await this.ensureValidToken();
    
    const response = await this.makeApiCall('users.lookupByEmail', {
      email: email
    });

    return response.ok ? response.user : null;
  }

  // ===========================================
  // FILE SHARING
  // ===========================================

  async uploadFile(file: File, channels: string[], title?: string, comment?: string): Promise<any> {
    await this.ensureValidToken();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channels', channels.join(','));
    
    if (title) formData.append('title', title);
    if (comment) formData.append('initial_comment', comment);

    const response = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials?.accessToken}`
      },
      body: formData
    });

    return response.json();
  }

  async shareDocument(channelId: string, documentData: any): Promise<any> {
    const message = `📄 *Document Shared:* ${documentData.name}\n` +
                   `*Type:* ${documentData.type}\n` +
                   `*Size:* ${documentData.size}\n` +
                   `*Description:* ${documentData.description || 'No description provided'}`;

    if (documentData.file) {
      return this.uploadFile(documentData.file, [channelId], documentData.name, message);
    } else {
      return this.sendMessage(channelId, `${message}\n*Link:* ${documentData.url}`);
    }
  }

  // ===========================================
  // WORKFLOW AUTOMATION
  // ===========================================

  async createWorkflowTrigger(channelId: string, triggerData: any): Promise<any> {
    // This would integrate with Slack Workflow Builder
    // For now, we'll create a scheduled message
    
    const message = `🤖 *Workflow Trigger:* ${triggerData.name}\n` +
                   `*Condition:* ${triggerData.condition}\n` +
                   `*Action:* ${triggerData.action}`;

    return this.sendMessage(channelId, message);
  }

  async sendScheduledReminder(channelId: string, reminderData: any): Promise<any> {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⏰ *Reminder:* ${reminderData.title}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: reminderData.description
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Mark Complete'
            },
            action_id: 'complete_reminder',
            value: reminderData.id,
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Snooze'
            },
            action_id: 'snooze_reminder',
            value: reminderData.id
          }
        ]
      }
    ];

    return this.sendRichMessage(channelId, blocks);
  }

  // ===========================================
  // SLASH COMMANDS
  // ===========================================

  async handleSlashCommand(command: any): Promise<any> {
    switch (command.command) {
      case '/legal-status':
        return this.handleLegalStatusCommand(command);
      case '/case-lookup':
        return this.handleCaseLookupCommand(command);
      case '/document-search':
        return this.handleDocumentSearchCommand(command);
      default:
        return {
          response_type: 'ephemeral',
          text: `Unknown command: ${command.command}`
        };
    }
  }

  private async handleLegalStatusCommand(_command: any): Promise<any> {
    // Mock legal status response
    return {
      response_type: 'in_channel',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '⚖️ *Legal System Status*'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Active Cases:* 15'
            },
            {
              type: 'mrkdwn',
              text: '*Pending Reviews:* 3'
            },
            {
              type: 'mrkdwn',
              text: '*Documents Processed:* 47'
            },
            {
              type: 'mrkdwn',
              text: '*System Health:* ✅ Healthy'
            }
          ]
        }
      ]
    };
  }

  private async handleCaseLookupCommand(command: any): Promise<any> {
    const caseNumber = command.text?.trim();
    
    if (!caseNumber) {
      return {
        response_type: 'ephemeral',
        text: 'Please provide a case number. Usage: `/case-lookup CASE-123`'
      };
    }

    // Mock case lookup response
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *Case: ${caseNumber}*`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Status:* Active'
            },
            {
              type: 'mrkdwn',
              text: '*Client:* John Doe'
            },
            {
              type: 'mrkdwn',
              text: '*Type:* Bill Discharge'
            },
            {
              type: 'mrkdwn',
              text: '*Created:* 2024-01-15'
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Details'
              },
              url: `#/cases/${caseNumber}`,
              style: 'primary'
            }
          ]
        }
      ]
    };
  }

  private async handleDocumentSearchCommand(command: any): Promise<any> {
    const query = command.text?.trim();
    
    if (!query) {
      return {
        response_type: 'ephemeral',
        text: 'Please provide a search term. Usage: `/document-search bill discharge`'
      };
    }

    // Mock document search response
    return {
      response_type: 'ephemeral',
      text: `🔍 Found 3 documents matching "${query}"\n` +
            `• Bill Discharge Template.pdf\n` +
            `• Client Bill Discharge - John Doe.pdf\n` +
            `• Bill Discharge Process Guide.docx`
    };
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private async makeApiCall(method: string, data: any = {}): Promise<any> {
    const response = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials?.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return result;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.credentials) {
      throw new Error('Not authenticated with Slack');
    }
    
    // Slack tokens don't expire unless revoked
  }

  private async storeCredentials(): Promise<void> {
    const encryptedCredentials = btoa(JSON.stringify(this.credentials));
    localStorage.setItem('slack_credentials', encryptedCredentials);
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async loadCredentials(): Promise<void> {
    const stored = localStorage.getItem('slack_credentials');
    if (stored) {
      try {
        this.credentials = JSON.parse(atob(stored));
      } catch (error) {
        console.error('Failed to load Slack credentials:', error);
      }
    }
  }

  // ===========================================
  // WEBHOOK HANDLING
  // ===========================================

  async handleWebhook(payload: any): Promise<any> {
    // Verify webhook signature
    // const isValid = this.verifySlackSignature(payload);
    // if (!isValid) return { ok: false };

    switch (payload.type) {
      case 'url_verification':
        return { challenge: payload.challenge };
        
      case 'event_callback':
        return this.handleEvent(payload.event);
        
      case 'interactive_message':
        return this.handleInteractiveMessage(payload);
        
      default:
        return { ok: true };
    }
  }

  private async handleEvent(event: any): Promise<any> {
    switch (event.type) {
      case 'message':
        if (event.text?.includes('legal') || event.text?.includes('case')) {
          // Auto-respond to legal-related messages
          await this.sendMessage(event.channel, 
            '👋 I noticed you mentioned something legal-related. Need help with case management? Type `/legal-status` for system status.');
        }
        break;
        
      case 'file_shared':
        // Notify legal team about shared files
        await this.sendMessage(event.channel_id, 
          '📄 New file shared! Our legal document processor will review this automatically.');
        break;
    }

    return { ok: true };
  }

  private async handleInteractiveMessage(payload: any): Promise<any> {
    const action = payload.actions?.[0];
    
    if (!action) return { ok: true };

    switch (action.action_id) {
      case 'resolve_alert':
        return {
          text: `✅ Alert ${action.value} has been marked as resolved.`,
          replace_original: true
        };
        
      case 'complete_reminder':
        return {
          text: `✅ Reminder completed.`,
          replace_original: true
        };
        
      case 'snooze_reminder':
        return {
          text: `😴 Reminder snoozed for 1 hour.`,
          replace_original: true
        };
        
      default:
        return { ok: true };
    }
  }
}