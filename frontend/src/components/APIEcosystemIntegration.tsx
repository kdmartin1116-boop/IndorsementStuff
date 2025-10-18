import React, { useState, useEffect } from 'react'
import { 
  Globe, Link, Webhook, Key, Code, Database, 
  CheckCircle, AlertCircle, Clock, Settings,
  Copy, Eye, EyeOff, Plus, Trash2, Edit3,
  Zap, Shield, Activity, BarChart3
} from 'lucide-react'

interface APIEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  isActive: boolean
  authRequired: boolean
  rateLimit: number
  lastUsed: Date
  totalCalls: number
}

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  secret: string
  retryAttempts: number
  lastTriggered?: Date
  successRate: number
}

interface Integration {
  id: string
  name: string
  type: 'legal' | 'document' | 'signature' | 'storage' | 'crm'
  status: 'connected' | 'disconnected' | 'error'
  provider: string
  icon: string
  description: string
  lastSync: Date
  config: any
}

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  isActive: boolean
  createdAt: Date
  lastUsed?: Date
  expiresAt?: Date
}

const APIEcosystemIntegration: React.FC = () => {
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([])
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [activeTab, setActiveTab] = useState<'endpoints' | 'webhooks' | 'integrations' | 'keys' | 'docs'>('endpoints')
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    // Initialize API data
    const mockEndpoints: APIEndpoint[] = [
      {
        id: '1',
        name: 'Document Analysis',
        method: 'POST',
        path: '/api/v1/documents/analyze',
        description: 'Analyze legal documents using Cornell AI framework',
        isActive: true,
        authRequired: true,
        rateLimit: 100,
        lastUsed: new Date('2024-01-25T14:30:00'),
        totalCalls: 1247
      },
      {
        id: '2',
        name: 'Cornell Legal Search',
        method: 'GET',
        path: '/api/v1/cornell/search',
        description: 'Search Cornell Legal Information Institute database',
        isActive: true,
        authRequired: true,
        rateLimit: 200,
        lastUsed: new Date('2024-01-25T15:20:00'),
        totalCalls: 3456
      },
      {
        id: '3',
        name: 'Compliance Check',
        method: 'POST',
        path: '/api/v1/compliance/check',
        description: 'Validate document compliance against Cornell standards',
        isActive: true,
        authRequired: true,
        rateLimit: 150,
        lastUsed: new Date('2024-01-25T13:45:00'),
        totalCalls: 892
      },
      {
        id: '4',
        name: 'Workflow Trigger',
        method: 'POST',
        path: '/api/v1/workflows/trigger',
        description: 'Trigger automated legal workflows',
        isActive: true,
        authRequired: true,
        rateLimit: 50,
        lastUsed: new Date('2024-01-25T12:15:00'),
        totalCalls: 234
      }
    ]

    const mockWebhooks: WebhookConfig[] = [
      {
        id: '1',
        name: 'Document Processed',
        url: 'https://client-app.com/webhooks/document-processed',
        events: ['document.analyzed', 'document.approved', 'document.rejected'],
        isActive: true,
        secret: 'whsec_abcd1234567890',
        retryAttempts: 3,
        lastTriggered: new Date('2024-01-25T14:30:00'),
        successRate: 98.5
      },
      {
        id: '2',
        name: 'Compliance Alert',
        url: 'https://legal-system.com/api/compliance-alerts',
        events: ['compliance.violation', 'compliance.warning'],
        isActive: true,
        secret: 'whsec_xyz9876543210',
        retryAttempts: 5,
        lastTriggered: new Date('2024-01-25T13:20:00'),
        successRate: 96.2
      },
      {
        id: '3',
        name: 'Workflow Status',
        url: 'https://dashboard.example.com/webhooks/workflow',
        events: ['workflow.started', 'workflow.completed', 'workflow.failed'],
        isActive: false,
        secret: 'whsec_def4567890123',
        retryAttempts: 2,
        successRate: 89.7
      }
    ]

    const mockIntegrations: Integration[] = [
      {
        id: '1',
        name: 'DocuSign',
        type: 'signature',
        status: 'connected',
        provider: 'DocuSign Inc.',
        icon: '📝',
        description: 'Electronic signature integration for legal documents',
        lastSync: new Date('2024-01-25T12:00:00'),
        config: { apiKey: 'ds_***', environment: 'production' }
      },
      {
        id: '2',
        name: 'Salesforce Legal Cloud',
        type: 'crm',
        status: 'connected',
        provider: 'Salesforce',
        icon: '☁️',
        description: 'CRM integration for client and case management',
        lastSync: new Date('2024-01-25T11:30:00'),
        config: { instanceUrl: 'https://example.salesforce.com', clientId: 'sf_***' }
      },
      {
        id: '3',
        name: 'Microsoft Graph',
        type: 'document',
        status: 'error',
        provider: 'Microsoft',
        icon: '📊',
        description: 'Office 365 document and email integration',
        lastSync: new Date('2024-01-24T16:45:00'),
        config: { tenantId: 'ms_***', clientId: 'graph_***' }
      },
      {
        id: '4',
        name: 'Box Legal Hold',
        type: 'storage',
        status: 'connected',
        provider: 'Box Inc.',
        icon: '📦',
        description: 'Secure document storage with legal hold capabilities',
        lastSync: new Date('2024-01-25T13:15:00'),
        config: { enterpriseId: 'box_***', keyId: 'key_***' }
      }
    ]

    const mockApiKeys: APIKey[] = [
      {
        id: '1',
        name: 'Production API Key',
        key: 'ck_live_abcd1234567890ABCDEF1234567890ab',
        permissions: ['documents:read', 'documents:write', 'cornell:search', 'workflows:execute'],
        isActive: true,
        createdAt: new Date('2024-01-10'),
        lastUsed: new Date('2024-01-25T14:30:00'),
        expiresAt: new Date('2025-01-10')
      },
      {
        id: '2',
        name: 'Development API Key',
        key: 'ck_test_xyz9876543210FEDCBA0987654321zy',
        permissions: ['documents:read', 'cornell:search'],
        isActive: true,
        createdAt: new Date('2024-01-15'),
        lastUsed: new Date('2024-01-25T10:15:00')
      },
      {
        id: '3',
        name: 'Legacy Integration Key',
        key: 'ck_legacy_def4567890123456789ABCDEF123',
        permissions: ['documents:read'],
        isActive: false,
        createdAt: new Date('2023-12-01'),
        lastUsed: new Date('2024-01-20T09:30:00'),
        expiresAt: new Date('2024-12-01')
      }
    ]

    setApiEndpoints(mockEndpoints)
    setWebhooks(mockWebhooks)
    setIntegrations(mockIntegrations)
    setApiKeys(mockApiKeys)
  }, [])

  const toggleApiKey = (keyId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Show success message (would implement toast notification)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#10b981'
      case 'POST': return '#3b82f6'
      case 'PUT': return '#f59e0b'
      case 'DELETE': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981'
      case 'disconnected': return '#6b7280'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />
      case 'disconnected': return <Clock className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="api-ecosystem">
      <div className="api-header">
        <div className="header-content">
          <div className="header-icon">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h1>API Ecosystem & Integration</h1>
            <p>Comprehensive REST/GraphQL APIs with Cornell Legal endpoints</p>
          </div>
        </div>
        
        <div className="api-stats">
          <div className="stat-item">
            <span className="stat-value">{apiEndpoints.filter(e => e.isActive).length}</span>
            <span className="stat-label">Active Endpoints</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{integrations.filter(i => i.status === 'connected').length}</span>
            <span className="stat-label">Connected</span>
          </div>
        </div>
      </div>

      {/* API Overview Cards */}
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-icon endpoints">
            <Code className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{apiEndpoints.length}</h3>
            <p>API Endpoints</p>
            <div className="card-detail">
              {apiEndpoints.filter(e => e.isActive).length} active
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon webhooks">
            <Webhook className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{webhooks.length}</h3>
            <p>Webhooks</p>
            <div className="card-detail">
              {webhooks.filter(w => w.isActive).length} configured
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon integrations">
            <Link className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{integrations.length}</h3>
            <p>Integrations</p>
            <div className="card-detail">
              {integrations.filter(i => i.status === 'connected').length} connected
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon api-keys">
            <Key className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{apiKeys.filter(k => k.isActive).length}</h3>
            <p>Active API Keys</p>
            <div className="card-detail">
              {apiKeys.length} total keys
            </div>
          </div>
        </div>
      </div>

      {/* API Tabs */}
      <div className="api-tabs">
        <div className="tab-nav">
          {[
            { id: 'endpoints', label: 'API Endpoints', icon: Code },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'integrations', label: 'Integrations', icon: Link },
            { id: 'keys', label: 'API Keys', icon: Key },
            { id: 'docs', label: 'Documentation', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'endpoints' && (
            <div className="endpoints-content">
              <div className="endpoints-header">
                <h3>API Endpoints</h3>
                <button className="add-endpoint-btn">
                  <Plus className="w-4 h-4" />
                  Add Endpoint
                </button>
              </div>

              <div className="endpoints-list">
                {apiEndpoints.map(endpoint => (
                  <div key={endpoint.id} className="endpoint-card">
                    <div className="endpoint-header">
                      <div className="endpoint-method" style={{ backgroundColor: getMethodColor(endpoint.method) }}>
                        {endpoint.method}
                      </div>
                      <div className="endpoint-path">
                        <code>{endpoint.path}</code>
                      </div>
                      <div className="endpoint-status">
                        <span className={`status-indicator ${endpoint.isActive ? 'active' : 'inactive'}`}>
                          {endpoint.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="endpoint-details">
                      <h4>{endpoint.name}</h4>
                      <p>{endpoint.description}</p>

                      <div className="endpoint-metrics">
                        <div className="metric">
                          <span className="metric-label">Rate Limit</span>
                          <span className="metric-value">{endpoint.rateLimit}/min</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Total Calls</span>
                          <span className="metric-value">{endpoint.totalCalls.toLocaleString()}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Last Used</span>
                          <span className="metric-value">{endpoint.lastUsed.toLocaleString()}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Auth Required</span>
                          <span className="metric-value">{endpoint.authRequired ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="endpoint-actions">
                      <button className="action-btn">
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="action-btn">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                      <button className="action-btn danger">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="webhooks-content">
              <div className="webhooks-header">
                <h3>Webhook Configuration</h3>
                <button className="add-webhook-btn">
                  <Plus className="w-4 h-4" />
                  Add Webhook
                </button>
              </div>

              <div className="webhooks-list">
                {webhooks.map(webhook => (
                  <div key={webhook.id} className="webhook-card">
                    <div className="webhook-header">
                      <div className="webhook-info">
                        <h4>{webhook.name}</h4>
                        <code className="webhook-url">{webhook.url}</code>
                      </div>
                      <div className="webhook-status">
                        <span className={`status-badge ${webhook.isActive ? 'active' : 'inactive'}`}>
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="webhook-events">
                      <div className="events-label">Events:</div>
                      <div className="events-list">
                        {webhook.events.map(event => (
                          <span key={event} className="event-tag">{event}</span>
                        ))}
                      </div>
                    </div>

                    <div className="webhook-metrics">
                      <div className="metric">
                        <span className="metric-label">Success Rate</span>
                        <span className="metric-value">{webhook.successRate}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Retry Attempts</span>
                        <span className="metric-value">{webhook.retryAttempts}</span>
                      </div>
                      {webhook.lastTriggered && (
                        <div className="metric">
                          <span className="metric-label">Last Triggered</span>
                          <span className="metric-value">{webhook.lastTriggered.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="webhook-actions">
                      <button className="action-btn">
                        <Settings className="w-4 h-4" />
                        Configure
                      </button>
                      <button className="action-btn">
                        <Zap className="w-4 h-4" />
                        Test
                      </button>
                      <button className="action-btn danger">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="integrations-content">
              <div className="integrations-header">
                <h3>Third-Party Integrations</h3>
                <button className="add-integration-btn">
                  <Plus className="w-4 h-4" />
                  Add Integration
                </button>
              </div>

              <div className="integrations-grid">
                {integrations.map(integration => (
                  <div key={integration.id} className="integration-card">
                    <div className="integration-header">
                      <div className="integration-icon">
                        {integration.icon}
                      </div>
                      <div className="integration-info">
                        <h4>{integration.name}</h4>
                        <p>{integration.provider}</p>
                      </div>
                      <div className="integration-status" style={{ color: getStatusColor(integration.status) }}>
                        {getStatusIcon(integration.status)}
                      </div>
                    </div>

                    <div className="integration-description">
                      <p>{integration.description}</p>
                    </div>

                    <div className="integration-details">
                      <div className="detail-item">
                        <span className="detail-label">Type</span>
                        <span className="detail-value">{integration.type}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span className="detail-value" style={{ color: getStatusColor(integration.status) }}>
                          {integration.status}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Sync</span>
                        <span className="detail-value">{integration.lastSync.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="integration-actions">
                      {integration.status === 'connected' ? (
                        <button className="action-btn primary">
                          <Settings className="w-4 h-4" />
                          Configure
                        </button>
                      ) : (
                        <button className="action-btn success">
                          <Link className="w-4 h-4" />
                          Connect
                        </button>
                      )}
                      <button className="action-btn">
                        <Activity className="w-4 h-4" />
                        Logs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="keys-content">
              <div className="keys-header">
                <h3>API Key Management</h3>
                <button className="generate-key-btn">
                  <Plus className="w-4 h-4" />
                  Generate API Key
                </button>
              </div>

              <div className="keys-list">
                {apiKeys.map(apiKey => (
                  <div key={apiKey.id} className="key-card">
                    <div className="key-header">
                      <div className="key-info">
                        <h4>{apiKey.name}</h4>
                        <div className="key-display">
                          <code className="api-key">
                            {showApiKey[apiKey.id] 
                              ? apiKey.key 
                              : apiKey.key.substring(0, 8) + '•'.repeat(24) + apiKey.key.slice(-4)
                            }
                          </code>
                          <button 
                            className="key-toggle"
                            onClick={() => toggleApiKey(apiKey.id)}
                          >
                            {showApiKey[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            className="key-copy"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="key-status">
                        <span className={`status-badge ${apiKey.isActive ? 'active' : 'inactive'}`}>
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="key-permissions">
                      <div className="permissions-label">Permissions:</div>
                      <div className="permissions-tags">
                        {apiKey.permissions.map(permission => (
                          <span key={permission} className="permission-tag">{permission}</span>
                        ))}
                      </div>
                    </div>

                    <div className="key-metadata">
                      <div className="metadata-item">
                        <span className="metadata-label">Created</span>
                        <span className="metadata-value">{apiKey.createdAt.toLocaleDateString()}</span>
                      </div>
                      {apiKey.lastUsed && (
                        <div className="metadata-item">
                          <span className="metadata-label">Last Used</span>
                          <span className="metadata-value">{apiKey.lastUsed.toLocaleString()}</span>
                        </div>
                      )}
                      {apiKey.expiresAt && (
                        <div className="metadata-item">
                          <span className="metadata-label">Expires</span>
                          <span className="metadata-value">{apiKey.expiresAt.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="key-actions">
                      <button className="action-btn">
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="action-btn">
                        <Shield className="w-4 h-4" />
                        Regenerate
                      </button>
                      <button className="action-btn danger">
                        <Trash2 className="w-4 h-4" />
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="docs-content">
              <div className="docs-header">
                <h3>API Documentation</h3>
                <div className="docs-actions">
                  <button className="docs-btn">
                    <Globe className="w-4 h-4" />
                    Interactive Docs
                  </button>
                  <button className="docs-btn">
                    <Code className="w-4 h-4" />
                    OpenAPI Spec
                  </button>
                </div>
              </div>

              <div className="docs-sections">
                <div className="doc-section">
                  <h4>Quick Start</h4>
                  <div className="code-block">
                    <pre>{`// Cornell Legal API Example
const response = await fetch('/api/v1/cornell/search', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  params: {
    query: 'UCC Article 3',
    jurisdiction: 'federal'
  }
});

const legalData = await response.json();`}</pre>
                  </div>
                </div>

                <div className="doc-section">
                  <h4>Document Analysis</h4>
                  <div className="code-block">
                    <pre>{`// Analyze legal document
const analysis = await fetch('/api/v1/documents/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    document: base64Document,
    options: {
      cornellValidation: true,
      complianceCheck: true,
      riskAssessment: true
    }
  })
});`}</pre>
                  </div>
                </div>

                <div className="doc-section">
                  <h4>Webhook Events</h4>
                  <div className="event-list">
                    <div className="event-item">
                      <code>document.analyzed</code>
                      <span>Triggered when document analysis is complete</span>
                    </div>
                    <div className="event-item">
                      <code>compliance.violation</code>
                      <span>Triggered when compliance issues are detected</span>
                    </div>
                    <div className="event-item">
                      <code>workflow.completed</code>
                      <span>Triggered when automated workflow finishes</span>
                    </div>
                  </div>
                </div>

                <div className="doc-section">
                  <h4>Rate Limits</h4>
                  <div className="rate-limits">
                    <div className="limit-item">
                      <span className="limit-endpoint">Cornell Legal Search</span>
                      <span className="limit-value">200 requests/minute</span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-endpoint">Document Analysis</span>
                      <span className="limit-value">100 requests/minute</span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-endpoint">Workflow Triggers</span>
                      <span className="limit-value">50 requests/minute</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default APIEcosystemIntegration