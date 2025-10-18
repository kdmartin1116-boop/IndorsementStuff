/**
 * Enhanced Type-safe API client with comprehensive backend integration
 */

import { ApiClient, RequestConfig, ApiConfig, isApiError } from '../types/api';
import { ApiResponse, ApiError } from '../types';
import { AppErrorHandler, ErrorCode } from '../utils/errorHandler';

// Enhanced API endpoint definitions
interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requiresAuth: boolean;
  rateLimit?: number;
  timeout?: number;
}

// Real-time connection manager
class RealTimeConnection {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string, token: string): void {
    this.ws = new WebSocket(`${url}?token=${token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(url, token);
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}

class TypedApiClient implements ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${config.url}`;
    const timeout = config.timeout || this.config.timeout;
    
    const requestInit: RequestInit = {
      method: config.method,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    if (config.data) {
      if (config.data instanceof FormData) {
        requestInit.body = config.data;
        // Remove Content-Type header for FormData - browser will set it with boundary
        delete (requestInit.headers as Record<string, string>)['Content-Type'];
      } else {
        requestInit.body = JSON.stringify(config.data);
      }
    }

    try {
      const response = await fetch(url, requestInit);
      const responseData = await response.json();

      if (!response.ok) {
        if (isApiError(responseData)) {
          throw AppErrorHandler.createError(
            responseData.error_code as ErrorCode,
            responseData.message,
            responseData.details
          );
        } else {
          throw AppErrorHandler.handleApiError(response, responseData);
        }
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw AppErrorHandler.createError(
          ErrorCode.NETWORK_ERROR,
          'Request timed out',
          `Timeout: ${timeout}ms`
        );
      }

      if (error.code) {
        // It's already an AppError
        throw error;
      }

      throw AppErrorHandler.handleNetworkError(error);
    }
  }

  async get<T>(url: string, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    const queryString = config.params 
      ? '?' + new URLSearchParams(
          Object.entries(config.params).map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    
    return this.request<T>({
      method: 'GET',
      url: url + queryString,
      ...config,
    });
  }

  async post<T>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  async put<T>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  async patch<T>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  async delete<T>(url: string, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  async upload<T>(url: string, file: File, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // Handle upload progress if callback provided
    if (config.onUploadProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && config.onUploadProgress) {
            const progress = Math.round((event.loaded * 100) / event.total);
            config.onUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ success: true, data });
            } catch (e) {
              reject(AppErrorHandler.createError(
                ErrorCode.PARSE_ERROR,
                'Failed to parse server response',
                xhr.responseText
              ));
            }
          } else {
            let errorData: any = {};
            try {
              errorData = JSON.parse(xhr.responseText);
            } catch (e) {
              // Response is not JSON
            }

            reject(AppErrorHandler.handleApiError(
              new Response(xhr.responseText, { status: xhr.status }),
              errorData
            ));
          }
        });

        xhr.addEventListener('error', () => {
          reject(AppErrorHandler.createError(
            ErrorCode.NETWORK_ERROR,
            'Upload failed due to network error'
          ));
        });

        xhr.addEventListener('timeout', () => {
          reject(AppErrorHandler.createError(
            ErrorCode.NETWORK_ERROR,
            'Upload timed out'
          ));
        });

        const fullUrl = `${this.config.baseURL}${url}`;
        xhr.timeout = config.timeout || this.config.timeout;
        xhr.open('POST', fullUrl);
        
        // Add custom headers
        Object.entries(config.headers || {}).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        
        xhr.send(formData);
      });
    }

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      ...config,
    });
  }
}

// ===========================================
// ENHANCED SOVEREIGN API CLIENT WITH COMPREHENSIVE BACKEND INTEGRATION
// ===========================================

class SovereignApiService extends TypedApiClient {
  private realTimeConnection: RealTimeConnection;
  private authToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: ApiConfig) {
    super(config);
    this.realTimeConnection = new RealTimeConnection();
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    this.authToken = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  // ===========================================
  // AUTHENTICATION & SECURITY
  // ===========================================

  async authenticate(credentials: { username: string; password: string }): Promise<{ token: string; refreshToken: string }> {
    const response = await this.post<{ token: string; refreshToken: string }>('/auth/login', credentials);
    
    this.authToken = response.data.token;
    this.refreshToken = response.data.refreshToken;
    
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('refresh_token', response.data.refreshToken);
    
    // Establish real-time connection
    this.realTimeConnection.connect('wss://api.sovereignlegal.com/ws', response.data.token);
    
    return response.data;
  }

  async refreshAuthToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post<{ token: string }>('/auth/refresh', {
      refreshToken: this.refreshToken
    });

    this.authToken = response.data.token;
    localStorage.setItem('auth_token', response.data.token);
    
    return response.data.token;
  }

  logout(): void {
    this.authToken = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.realTimeConnection.disconnect();
  }

  // ===========================================
  // DOCUMENT PROCESSING & OCR
  // ===========================================

  async uploadDocument(file: File, metadata?: Record<string, any>): Promise<{ documentId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await this.post<{ documentId: string; url: string }>('/api/documents/upload', formData);
    return response.data;
  }

  async processDocument(documentId: string, options: {
    ocr?: boolean;
    classification?: boolean;
    endorsement?: boolean;
    extraction?: boolean;
  }): Promise<any> {
    const response = await this.post(`/api/documents/${documentId}/process`, options);
    return response.data;
  }

  async getDocumentAnalysis(documentId: string): Promise<any> {
    const response = await this.get(`/api/documents/${documentId}/analysis`);
    return response.data;
  }

  async extractDocumentFields(documentId: string): Promise<any> {
    const response = await this.post(`/api/documents/${documentId}/extract-fields`);
    return response.data;
  }

  // ===========================================
  // BILL DISCHARGE & ENDORSEMENT
  // ===========================================

  async scanContract(documentId: string): Promise<any> {
    const response = await this.post('/api/scan-contract', { documentId });
    return response.data;
  }

  async endorseBill(billData: any): Promise<any> {
    const response = await this.post('/api/endorse-bill', billData);
    return response.data;
  }

  async generateTenderLetter(data: any): Promise<any> {
    const response = await this.post('/api/generate-tender-letter', data);
    return response.data;
  }

  async generatePtpLetter(data: any): Promise<any> {
    const response = await this.post('/api/generate-ptp-letter', data);
    return response.data;
  }

  async getBillData(billId: string): Promise<any> {
    const response = await this.get(`/api/get-bill-data/${billId}`);
    return response.data;
  }

  async scanForTerms(documentId: string, terms: string[]): Promise<any> {
    const response = await this.post('/api/scan-for-terms', { documentId, terms });
    return response.data;
  }

  async generateRemedy(data: any): Promise<any> {
    const response = await this.post('/api/generate-remedy', data);
    return response.data;
  }

  // ===========================================
  // AI-POWERED LEGAL ANALYSIS
  // ===========================================

  async analyzeDocument(documentId: string, analysisType: 'risk' | 'compliance' | 'precedent' | 'summary'): Promise<any> {
    const response = await this.post('/api/ai/analyze', { documentId, analysisType });
    return response.data;
  }

  async searchLegalPrecedents(query: string, filters?: {
    jurisdiction?: string;
    dateRange?: { from: string; to: string };
    caseType?: string;
  }): Promise<any> {
    const response = await this.post('/api/ai/search-precedents', { query, filters });
    return response.data;
  }

  async getRiskAssessment(contractId: string): Promise<any> {
    const response = await this.get(`/api/ai/risk-assessment/${contractId}`);
    return response.data;
  }

  async getPredictiveAnalysis(caseData: any): Promise<any> {
    const response = await this.post('/api/ai/predictive-analysis', caseData);
    return response.data;
  }

  async generateLegalSummary(documentId: string): Promise<any> {
    const response = await this.post(`/api/ai/generate-summary/${documentId}`);
    return response.data;
  }

  // ===========================================
  // STATE NATIONAL STATUS & NATIONALITY
  // ===========================================

  async checkNationalityStatus(data: {
    fullName: string;
    birthLocation: string;
    birthDate: string;
  }): Promise<any> {
    const response = await this.post('/api/nationality/check-status', data);
    return response.data;
  }

  async generateNationalityPacket(data: any): Promise<any> {
    const response = await this.post('/api/nationality/generate-packet', data);
    return response.data;
  }

  async validateStateNationalClaim(claimData: any): Promise<any> {
    const response = await this.post('/api/nationality/validate-claim', claimData);
    return response.data;
  }

  // ===========================================
  // COLLABORATIVE WORKSPACES
  // ===========================================

  async createWorkspace(data: { name: string; description?: string; type: string }): Promise<{ workspaceId: string }> {
    const response = await this.post<{ workspaceId: string }>('/api/workspaces', data);
    return response.data;
  }

  async inviteToWorkspace(workspaceId: string, email: string, role: 'viewer' | 'editor' | 'admin'): Promise<any> {
    const response = await this.post(`/api/workspaces/${workspaceId}/invite`, { email, role });
    return response.data;
  }

  async getWorkspaceActivity(workspaceId: string, limit = 50): Promise<any> {
    const response = await this.get(`/api/workspaces/${workspaceId}/activity?limit=${limit}`);
    return response.data;
  }

  async updateWorkspaceDocument(workspaceId: string, documentId: string, changes: any): Promise<any> {
    const response = await this.put(`/api/workspaces/${workspaceId}/documents/${documentId}`, changes);
    return response.data;
  }

  async addWorkspaceComment(workspaceId: string, documentId: string, comment: {
    text: string;
    position?: { x: number; y: number };
  }): Promise<any> {
    const response = await this.post(`/api/workspaces/${workspaceId}/documents/${documentId}/comments`, comment);
    return response.data;
  }

  // ===========================================
  // SMART NOTIFICATIONS
  // ===========================================

  async getNotifications(filters?: {
    type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    
    const response = await this.get(`/api/notifications?${params.toString()}`);
    return response.data;
  }

  async markNotificationRead(notificationId: string): Promise<any> {
    const response = await this.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  }

  async updateNotificationSettings(settings: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    deadlineReminders?: boolean;
    collaborationUpdates?: boolean;
  }): Promise<any> {
    const response = await this.put('/api/notifications/settings', settings);
    return response.data;
  }

  async createSmartReminder(data: {
    title: string;
    message: string;
    scheduleDate: string;
    type: 'deadline' | 'meeting' | 'filing' | 'review';
  }): Promise<any> {
    const response = await this.post('/api/notifications/reminders', data);
    return response.data;
  }

  // ===========================================
  // ADVANCED SEARCH & DISCOVERY
  // ===========================================

  async performSemanticSearch(query: string, options?: {
    documentTypes?: string[];
    dateRange?: { from: string; to: string };
    similarity?: number;
    limit?: number;
  }): Promise<any> {
    const response = await this.post('/api/search/semantic', { query, options });
    return response.data;
  }

  async findSimilarDocuments(documentId: string, threshold = 0.7): Promise<any> {
    const response = await this.get(`/api/search/similar/${documentId}?threshold=${threshold}`);
    return response.data;
  }

  async getSearchSuggestions(partialQuery: string): Promise<string[]> {
    const response = await this.get(`/api/search/suggestions?q=${encodeURIComponent(partialQuery)}`);
    return response.data;
  }

  async saveSearch(query: string, name: string, filters?: any): Promise<any> {
    const response = await this.post('/api/search/saved', { query, name, filters });
    return response.data;
  }

  // ===========================================
  // ANALYTICS & REPORTING
  // ===========================================

  async getAnalytics(timeRange = '30d', metrics?: string[]): Promise<any> {
    const params = new URLSearchParams({ timeRange });
    if (metrics) {
      params.append('metrics', metrics.join(','));
    }
    
    const response = await this.get(`/api/analytics?${params.toString()}`);
    return response.data;
  }

  async trackEvent(event: string, data?: Record<string, any>): Promise<any> {
    const response = await this.post('/api/analytics/track', {
      event,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    return response.data;
  }

  async getUserActivity(userId?: string, timeRange = '7d'): Promise<any> {
    const response = await this.get(`/api/analytics/user-activity?timeRange=${timeRange}${userId ? `&userId=${userId}` : ''}`);
    return response.data;
  }

  async generateReport(reportType: 'usage' | 'performance' | 'compliance', options?: any): Promise<any> {
    const response = await this.post('/api/analytics/reports', { reportType, options });
    return response.data;
  }

  // ===========================================
  // HEALTH & MONITORING
  // ===========================================

  async getSystemHealth(): Promise<{ status: string; services: Record<string, any> }> {
    const response = await this.get<{ status: string; services: Record<string, any> }>('/api/health', {
      timeout: 5000
    });
    return response.data;
  }

  async getPerformanceMetrics(): Promise<any> {
    const response = await this.get('/api/metrics');
    return response.data;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.get('/api/ping', { timeout: 3000 });
      return response.success;
    } catch {
      return false;
    }
  }

  // ===========================================
  // REAL-TIME FEATURES
  // ===========================================

  subscribeToWorkspaceUpdates(workspaceId: string, callback: (update: any) => void): void {
    this.realTimeConnection.send({
      type: 'subscribe',
      channel: `workspace:${workspaceId}`,
      callback
    });
  }

  subscribeToNotifications(callback: (notification: any) => void): void {
    this.realTimeConnection.send({
      type: 'subscribe',
      channel: 'notifications',
      callback
    });
  }

  sendCollaborativeEdit(workspaceId: string, documentId: string, edit: any): void {
    this.realTimeConnection.send({
      type: 'collaborative_edit',
      workspaceId,
      documentId,
      edit,
      timestamp: Date.now()
    });
  }
}

// Create and export singleton instance
const apiConfig: ApiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': 'v1',
    'X-Client-Version': import.meta.env.VITE_APP_VERSION || '2.0.0'
  }
};

export const sovereignApi = new SovereignApiService(apiConfig);
export { TypedApiClient, SovereignApiService };
export type { ApiEndpoint };