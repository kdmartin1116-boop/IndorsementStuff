// ===========================================
// REAL-TIME CONNECTION MANAGER
// ===========================================

interface ConnectionConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface MessageHandler {
  type: string;
  handler: (data: any) => void;
}

interface SubscriptionCallback {
  channel: string;
  callback: (data: any) => void;
  id: string;
}

export class RealTimeConnectionManager {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private subscriptions: Map<string, SubscriptionCallback[]> = new Map();
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private lastError: string | null = null;

  constructor(config: ConnectionConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config
    };
  }

  // ===========================================
  // CONNECTION MANAGEMENT
  // ===========================================

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.connectionState = 'connecting';
      
      const wsUrl = token ? `${this.config.url}?token=${token}` : this.config.url;
      
      try {
        this.ws = new WebSocket(wsUrl, this.config.protocols);
        
        this.ws.onopen = () => {
          console.log('🔗 WebSocket connection established');
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyStateChange('connected');
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.connectionState = 'disconnected';
          this.stopHeartbeat();
          this.notifyStateChange('disconnected');
          
          if (!event.wasClean && this.shouldReconnect()) {
            this.scheduleReconnect(token);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.connectionState = 'error';
          this.lastError = 'WebSocket connection error';
          this.notifyStateChange('error');
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        this.connectionState = 'error';
        this.lastError = error instanceof Error ? error.message : 'Connection failed';
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
    this.notifyStateChange('disconnected');
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < (this.config.maxReconnectAttempts || 10);
  }

  private scheduleReconnect(token?: string): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.pow(2, Math.min(this.reconnectAttempts - 1, 5));
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect(token).catch(() => {
        // Reconnect failed, will try again if within limits
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  // ===========================================
  // HEARTBEAT MANAGEMENT
  // ===========================================

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval!);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  // ===========================================
  // MESSAGE HANDLING
  // ===========================================

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle pong responses
      if (message.type === 'pong') {
        return;
      }

      // Handle subscription messages
      if (message.channel) {
        this.handleSubscriptionMessage(message);
        return;
      }

      // Handle typed messages
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach(handler => {
        try {
          handler.handler(message.data || message);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleSubscriptionMessage(message: any): void {
    const subscribers = this.subscriptions.get(message.channel) || [];
    subscribers.forEach(subscription => {
      try {
        subscription.callback(message.data || message);
      } catch (error) {
        console.error(`Error handling subscription message for ${message.channel}:`, error);
      }
    });
  }

  // ===========================================
  // SUBSCRIPTION MANAGEMENT
  // ===========================================

  subscribe(channel: string, callback: (data: any) => void): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    
    this.subscriptions.get(channel)!.push({
      channel,
      callback,
      id: subscriptionId
    });

    // Send subscription message to server
    this.send({
      type: 'subscribe',
      channel,
      subscriptionId
    });

    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    for (const [channel, subscribers] of this.subscriptions.entries()) {
      const index = subscribers.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscribers.splice(index, 1);
        
        // Send unsubscribe message to server
        this.send({
          type: 'unsubscribe',
          channel,
          subscriptionId
        });

        // Clean up empty channels
        if (subscribers.length === 0) {
          this.subscriptions.delete(channel);
        }
        
        break;
      }
    }
  }

  unsubscribeFromChannel(channel: string): void {
    const subscribers = this.subscriptions.get(channel) || [];
    subscribers.forEach(sub => {
      this.send({
        type: 'unsubscribe',
        channel,
        subscriptionId: sub.id
      });
    });
    
    this.subscriptions.delete(channel);
  }

  // ===========================================
  // MESSAGE HANDLING REGISTRATION
  // ===========================================

  onMessage(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    const messageHandler = { type, handler };
    this.messageHandlers.get(type)!.push(messageHandler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type) || [];
      const index = handlers.indexOf(messageHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  }

  // ===========================================
  // MESSAGE SENDING
  // ===========================================

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }

  // ===========================================
  // COLLABORATIVE FEATURES
  // ===========================================

  joinWorkspace(workspaceId: string): void {
    this.send({
      type: 'join_workspace',
      workspaceId
    });
  }

  leaveWorkspace(workspaceId: string): void {
    this.send({
      type: 'leave_workspace',
      workspaceId
    });
  }

  sendEdit(workspaceId: string, documentId: string, edit: any): void {
    this.send({
      type: 'document_edit',
      workspaceId,
      documentId,
      edit,
      timestamp: Date.now()
    });
  }

  sendCursorPosition(workspaceId: string, documentId: string, position: any): void {
    this.send({
      type: 'cursor_position',
      workspaceId,
      documentId,
      position,
      timestamp: Date.now()
    });
  }

  sendComment(workspaceId: string, documentId: string, comment: any): void {
    this.send({
      type: 'add_comment',
      workspaceId,
      documentId,
      comment,
      timestamp: Date.now()
    });
  }

  // ===========================================
  // STATE MANAGEMENT
  // ===========================================

  private notifyStateChange(state: string): void {
    const handlers = this.messageHandlers.get('connection_state') || [];
    handlers.forEach(handler => {
      try {
        handler.handler({ state, error: this.lastError });
      } catch (error) {
        console.error('Error notifying state change:', error);
      }
    });
  }

  getConnectionState(): string {
    return this.connectionState;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getSubscriptionCount(): number {
    return Array.from(this.subscriptions.values()).reduce((total, subs) => total + subs.length, 0);
  }

  // ===========================================
  // CLEANUP
  // ===========================================

  destroy(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.subscriptions.clear();
  }
}

// ===========================================
// CONNECTION FACTORY & SINGLETON
// ===========================================

let globalConnection: RealTimeConnectionManager | null = null;

export function createRealTimeConnection(config: ConnectionConfig): RealTimeConnectionManager {
  return new RealTimeConnectionManager(config);
}

export function getGlobalRealTimeConnection(): RealTimeConnectionManager {
  if (!globalConnection) {
    const wsUrl = import.meta.env?.VITE_WS_URL || 'wss://api.sovereignlegal.com/ws';
    globalConnection = new RealTimeConnectionManager({ url: wsUrl });
  }
  return globalConnection;
}

export function destroyGlobalConnection(): void {
  if (globalConnection) {
    globalConnection.destroy();
    globalConnection = null;
  }
}

export default RealTimeConnectionManager;