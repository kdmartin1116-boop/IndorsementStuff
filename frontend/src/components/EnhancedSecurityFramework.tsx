import React, { useState, useEffect } from 'react'
import { 
  Shield, Lock, Key, Eye, EyeOff, AlertTriangle,
  CheckCircle, Users, FileText, Clock, Settings,
  Fingerprint, Smartphone, Globe, Database, Activity
} from 'lucide-react'

interface SecurityPolicy {
  id: string
  name: string
  description: string
  enabled: boolean
  level: 'low' | 'medium' | 'high' | 'critical'
  lastUpdated: Date
}

interface AccessControl {
  id: string
  userId: string
  userName: string
  role: 'admin' | 'attorney' | 'paralegal' | 'client' | 'viewer'
  permissions: string[]
  lastAccess: Date
  isActive: boolean
  mfaEnabled: boolean
}

interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  userName: string
  action: string
  resource: string
  ipAddress: string
  userAgent: string
  success: boolean
  details: string
}

interface SecurityMetrics {
  securityScore: number
  activeThreats: number
  vulnerabilities: number
  complianceStatus: string
  lastSecurityScan: Date
  encryptionStatus: string
}

const EnhancedSecurityFramework: React.FC = () => {
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([])
  const [accessControls, setAccessControls] = useState<AccessControl[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'access' | 'audit' | 'encryption'>('overview')
  const [selectedUser, setSelectedUser] = useState<AccessControl | null>(null)

  useEffect(() => {
    // Initialize security data
    const mockPolicies: SecurityPolicy[] = [
      {
        id: '1',
        name: 'Document Encryption',
        description: 'AES-256 encryption for all Cornell legal documents',
        enabled: true,
        level: 'critical',
        lastUpdated: new Date('2024-01-20')
      },
      {
        id: '2',
        name: 'Multi-Factor Authentication',
        description: 'Required MFA for all legal document access',
        enabled: true,
        level: 'high',
        lastUpdated: new Date('2024-01-18')
      },
      {
        id: '3',
        name: 'Session Timeout',
        description: 'Automatic logout after 30 minutes of inactivity',
        enabled: true,
        level: 'medium',
        lastUpdated: new Date('2024-01-15')
      },
      {
        id: '4',
        name: 'IP Whitelisting',
        description: 'Restrict access to approved IP addresses',
        enabled: false,
        level: 'high',
        lastUpdated: new Date('2024-01-10')
      },
      {
        id: '5',
        name: 'Data Loss Prevention',
        description: 'Monitor and prevent unauthorized data exfiltration',
        enabled: true,
        level: 'critical',
        lastUpdated: new Date('2024-01-22')
      }
    ]

    const mockAccessControls: AccessControl[] = [
      {
        id: '1',
        userId: 'user_001',
        userName: 'Sarah Chen',
        role: 'attorney',
        permissions: ['read', 'write', 'delete', 'admin', 'cornell_access'],
        lastAccess: new Date('2024-01-25T14:30:00'),
        isActive: true,
        mfaEnabled: true
      },
      {
        id: '2',
        userId: 'user_002',
        userName: 'Michael Rodriguez',
        role: 'paralegal',
        permissions: ['read', 'write', 'cornell_access'],
        lastAccess: new Date('2024-01-25T13:45:00'),
        isActive: true,
        mfaEnabled: true
      },
      {
        id: '3',
        userId: 'user_003',
        userName: 'Emily Johnson',
        role: 'client',
        permissions: ['read'],
        lastAccess: new Date('2024-01-24T16:20:00'),
        isActive: true,
        mfaEnabled: false
      },
      {
        id: '4',
        userId: 'user_004',
        userName: 'David Kim',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin', 'security', 'cornell_access'],
        lastAccess: new Date('2024-01-25T15:10:00'),
        isActive: true,
        mfaEnabled: true
      }
    ]

    const mockAuditLogs: AuditLogEntry[] = [
      {
        id: '1',
        timestamp: new Date('2024-01-25T15:30:00'),
        userId: 'user_001',
        userName: 'Sarah Chen',
        action: 'Document Access',
        resource: 'contract_template.pdf',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...',
        success: true,
        details: 'Accessed Cornell legal template for contract review'
      },
      {
        id: '2',
        timestamp: new Date('2024-01-25T15:25:00'),
        userId: 'user_002',
        userName: 'Michael Rodriguez',
        action: 'Login Attempt',
        resource: 'Authentication System',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0...',
        success: false,
        details: 'Failed MFA verification - incorrect code'
      },
      {
        id: '3',
        timestamp: new Date('2024-01-25T15:20:00'),
        userId: 'user_004',
        userName: 'David Kim',
        action: 'Security Policy Update',
        resource: 'Data Loss Prevention',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        success: true,
        details: 'Enabled DLP monitoring for Cornell legal documents'
      }
    ]

    const mockMetrics: SecurityMetrics = {
      securityScore: 94.2,
      activeThreats: 2,
      vulnerabilities: 0,
      complianceStatus: 'Compliant',
      lastSecurityScan: new Date('2024-01-25T12:00:00'),
      encryptionStatus: 'Active - AES-256'
    }

    setSecurityPolicies(mockPolicies)
    setAccessControls(mockAccessControls)
    setAuditLogs(mockAuditLogs)
    setSecurityMetrics(mockMetrics)
  }, [])

  const togglePolicy = (policyId: string) => {
    setSecurityPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, enabled: !policy.enabled, lastUpdated: new Date() }
        : policy
    ))
  }

  const updateUserAccess = (userId: string, isActive: boolean) => {
    setAccessControls(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isActive }
        : user
    ))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc2626'
      case 'attorney': return '#7c3aed'
      case 'paralegal': return '#2563eb'
      case 'client': return '#059669'
      case 'viewer': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#ca8a04'
      case 'low': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 80) return '#f59e0b'
    if (score >= 70) return '#ef4444'
    return '#dc2626'
  }

  return (
    <div className="security-framework">
      <div className="security-header">
        <div className="header-content">
          <div className="header-icon">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1>Enhanced Security Framework</h1>
            <p>Comprehensive security with Cornell Legal data protection</p>
          </div>
        </div>
        
        <div className="security-score">
          <div className="score-circle" style={{ borderColor: getSecurityScoreColor(securityMetrics?.securityScore || 0) }}>
            <span className="score-value">{securityMetrics?.securityScore || 0}%</span>
            <span className="score-label">Security Score</span>
          </div>
        </div>
      </div>

      {/* Security Metrics Dashboard */}
      {securityMetrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon security-score">
              <Shield className="w-6 h-6" />
            </div>
            <div className="metric-content">
              <h3>{securityMetrics.securityScore}%</h3>
              <p>Security Score</p>
              <span className="metric-status positive">Excellent</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon threats">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="metric-content">
              <h3>{securityMetrics.activeThreats}</h3>
              <p>Active Threats</p>
              <span className="metric-status warning">Monitoring</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon vulnerabilities">
              <Eye className="w-6 h-6" />
            </div>
            <div className="metric-content">
              <h3>{securityMetrics.vulnerabilities}</h3>
              <p>Vulnerabilities</p>
              <span className="metric-status positive">Secure</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon compliance">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="metric-content">
              <h3>{securityMetrics.complianceStatus}</h3>
              <p>Compliance Status</p>
              <span className="metric-status positive">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Security Tabs */}
      <div className="security-tabs">
        <div className="tab-nav">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'policies', label: 'Security Policies', icon: Lock },
            { id: 'access', label: 'Access Control', icon: Users },
            { id: 'audit', label: 'Audit Logs', icon: Activity },
            { id: 'encryption', label: 'Encryption', icon: Key }
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
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Security Policies</h3>
                  <div className="overview-stats">
                    <div className="stat">
                      <span className="stat-value">{securityPolicies.filter(p => p.enabled).length}</span>
                      <span className="stat-label">Active Policies</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{securityPolicies.filter(p => p.level === 'critical').length}</span>
                      <span className="stat-label">Critical</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <h3>User Access</h3>
                  <div className="overview-stats">
                    <div className="stat">
                      <span className="stat-value">{accessControls.filter(u => u.isActive).length}</span>
                      <span className="stat-label">Active Users</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{accessControls.filter(u => u.mfaEnabled).length}</span>
                      <span className="stat-label">MFA Enabled</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card">
                  <h3>Recent Activity</h3>
                  <div className="overview-stats">
                    <div className="stat">
                      <span className="stat-value">{auditLogs.filter(l => l.success).length}</span>
                      <span className="stat-label">Successful</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{auditLogs.filter(l => !l.success).length}</span>
                      <span className="stat-label">Failed</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="security-recommendations">
                <h3>Security Recommendations</h3>
                <div className="recommendation-list">
                  <div className="recommendation-item">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h4>Cornell Legal Data Encryption</h4>
                      <p>All Cornell legal documents are encrypted with AES-256</p>
                    </div>
                  </div>
                  <div className="recommendation-item">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h4>Enable IP Whitelisting</h4>
                      <p>Consider enabling IP restrictions for enhanced security</p>
                    </div>
                  </div>
                  <div className="recommendation-item">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h4>MFA Coverage</h4>
                      <p>75% of users have multi-factor authentication enabled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="policies-content">
              <div className="policies-header">
                <h3>Security Policies</h3>
                <button className="add-policy-btn">
                  <Settings className="w-4 h-4" />
                  Add Policy
                </button>
              </div>

              <div className="policies-list">
                {securityPolicies.map(policy => (
                  <div key={policy.id} className="policy-card">
                    <div className="policy-header">
                      <div className="policy-info">
                        <h4>{policy.name}</h4>
                        <p>{policy.description}</p>
                      </div>
                      <div className="policy-controls">
                        <span 
                          className="policy-level"
                          style={{ backgroundColor: getLevelColor(policy.level) }}
                        >
                          {policy.level.toUpperCase()}
                        </span>
                        <label className="policy-toggle">
                          <input
                            type="checkbox"
                            checked={policy.enabled}
                            onChange={() => togglePolicy(policy.id)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                    <div className="policy-footer">
                      <span className="last-updated">
                        Last updated: {policy.lastUpdated.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="access-content">
              <div className="access-header">
                <h3>Access Control Management</h3>
                <button className="add-user-btn">
                  <Users className="w-4 h-4" />
                  Add User
                </button>
              </div>

              <div className="users-grid">
                {accessControls.map(user => (
                  <div 
                    key={user.id} 
                    className={`user-card ${selectedUser?.id === user.id ? 'selected' : ''}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="user-header">
                      <div className="user-info">
                        <h4>{user.userName}</h4>
                        <span 
                          className="user-role"
                          style={{ backgroundColor: getRoleColor(user.role) }}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="user-status">
                        <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                        {user.mfaEnabled && <Fingerprint className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>

                    <div className="user-details">
                      <div className="user-permissions">
                        <span className="permissions-label">Permissions:</span>
                        <div className="permissions-list">
                          {user.permissions.slice(0, 3).map(permission => (
                            <span key={permission} className="permission-tag">
                              {permission}
                            </span>
                          ))}
                          {user.permissions.length > 3 && (
                            <span className="permission-tag more">
                              +{user.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="user-activity">
                        <Clock className="w-4 h-4" />
                        <span>Last access: {user.lastAccess.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="user-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateUserAccess(user.id, !user.isActive)
                        }}
                        className={`access-toggle ${user.isActive ? 'revoke' : 'grant'}`}
                      >
                        {user.isActive ? 'Revoke Access' : 'Grant Access'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="audit-content">
              <div className="audit-header">
                <h3>Security Audit Logs</h3>
                <div className="audit-filters">
                  <select className="filter-select">
                    <option>All Actions</option>
                    <option>Login Attempts</option>
                    <option>Document Access</option>
                    <option>Policy Changes</option>
                  </select>
                  <input type="date" className="filter-date" />
                </div>
              </div>

              <div className="audit-table">
                <div className="table-header">
                  <div className="header-cell">Timestamp</div>
                  <div className="header-cell">User</div>
                  <div className="header-cell">Action</div>
                  <div className="header-cell">Resource</div>
                  <div className="header-cell">Status</div>
                  <div className="header-cell">Details</div>
                </div>

                {auditLogs.map(log => (
                  <div key={log.id} className="table-row">
                    <div className="table-cell">
                      {log.timestamp.toLocaleString()}
                    </div>
                    <div className="table-cell">
                      <strong>{log.userName}</strong>
                      <br />
                      <small>{log.ipAddress}</small>
                    </div>
                    <div className="table-cell">{log.action}</div>
                    <div className="table-cell">{log.resource}</div>
                    <div className="table-cell">
                      <span className={`status-badge ${log.success ? 'success' : 'failure'}`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="table-cell">
                      <span className="details-text">{log.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'encryption' && (
            <div className="encryption-content">
              <div className="encryption-overview">
                <h3>Encryption Status</h3>
                <div className="encryption-cards">
                  <div className="encryption-card">
                    <div className="encryption-icon">
                      <Database className="w-8 h-8" />
                    </div>
                    <div className="encryption-info">
                      <h4>Data at Rest</h4>
                      <p>AES-256 encryption for all Cornell legal documents</p>
                      <span className="encryption-status active">Active</span>
                    </div>
                  </div>

                  <div className="encryption-card">
                    <div className="encryption-icon">
                      <Globe className="w-8 h-8" />
                    </div>
                    <div className="encryption-info">
                      <h4>Data in Transit</h4>
                      <p>TLS 1.3 encryption for all communications</p>
                      <span className="encryption-status active">Active</span>
                    </div>
                  </div>

                  <div className="encryption-card">
                    <div className="encryption-icon">
                      <Key className="w-8 h-8" />
                    </div>
                    <div className="encryption-info">
                      <h4>Key Management</h4>
                      <p>Hardware Security Module (HSM) key storage</p>
                      <span className="encryption-status active">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="encryption-details">
                <h4>Encryption Configuration</h4>
                <div className="config-grid">
                  <div className="config-item">
                    <label>Algorithm</label>
                    <span>AES-256-GCM</span>
                  </div>
                  <div className="config-item">
                    <label>Key Rotation</label>
                    <span>Every 90 days</span>
                  </div>
                  <div className="config-item">
                    <label>Key Storage</label>
                    <span>AWS KMS + HSM</span>
                  </div>
                  <div className="config-item">
                    <label>Last Key Rotation</label>
                    <span>January 15, 2024</span>
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

export default EnhancedSecurityFramework