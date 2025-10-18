import React, { useState, useEffect } from 'react'
import { 
  Link, Shield, FileCheck, Users, Zap, Clock,
  CheckCircle, AlertTriangle, Info, Star, Copy,
  Download, Upload, Eye, Settings, Edit3,
  Key, Database, Award, TrendingUp, Building,
  Verified, Search
} from 'lucide-react'

interface BlockchainDocument {
  id: string
  name: string
  hash: string
  blockNumber: number
  timestamp: Date
  size: string
  type: 'contract' | 'agreement' | 'certificate' | 'notice' | 'report'
  status: 'verified' | 'pending' | 'failed'
  cornellValidated: boolean
  immutable: boolean
  signatures: number
  network: 'ethereum' | 'polygon' | 'avalanche' | 'bsc'
}

interface SmartContract {
  id: string
  name: string
  address: string
  network: string
  type: 'escrow' | 'validation' | 'identity' | 'compliance' | 'audit'
  status: 'deployed' | 'pending' | 'failed'
  cornellCompliant: boolean
  gasUsed: number
  transactions: number
  lastActivity: Date
  abi: any[]
}

interface AuditTrail {
  id: string
  documentId: string
  action: 'created' | 'signed' | 'verified' | 'transferred' | 'updated'
  actor: string
  timestamp: Date
  blockHash: string
  transactionHash: string
  gasUsed: number
  cornellReference?: string
}

interface DigitalIdentity {
  id: string
  did: string
  name: string
  type: 'individual' | 'organization' | 'notary' | 'validator'
  publicKey: string
  verificationLevel: 'basic' | 'enhanced' | 'premium'
  cornellCertified: boolean
  documentsVerified: number
  trustScore: number
  lastActive: Date
}

interface BlockchainMetrics {
  totalDocuments: number
  verifiedDocuments: number
  activeContracts: number
  identitiesManaged: number
  gasOptimization: number
  cornellIntegration: number
}

const BlockchainIntegration: React.FC = () => {
  const [documents, setDocuments] = useState<BlockchainDocument[]>([])
  const [contracts, setContracts] = useState<SmartContract[]>([])
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([])
  const [identities, setIdentities] = useState<DigitalIdentity[]>([])
  const [metrics, setMetrics] = useState<BlockchainMetrics>({
    totalDocuments: 0,
    verifiedDocuments: 0,
    activeContracts: 0,
    identitiesManaged: 0,
    gasOptimization: 0,
    cornellIntegration: 0
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'contracts' | 'audit' | 'identity' | 'analytics'>('overview')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Initialize blockchain data
    const mockDocuments: BlockchainDocument[] = [
      {
        id: '1',
        name: 'Commercial Loan Agreement - ABC Corp',
        hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
        blockNumber: 18956742,
        timestamp: new Date('2024-01-25T14:30:00'),
        size: '2.4 MB',
        type: 'agreement',
        status: 'verified',
        cornellValidated: true,
        immutable: true,
        signatures: 3,
        network: 'ethereum'
      },
      {
        id: '2',
        name: 'Insurance Policy Certificate - XYZ Insurance',
        hash: '0xfedcba0987654321fedcba0987654321fedcba09',
        blockNumber: 45678923,
        timestamp: new Date('2024-01-24T11:20:00'),
        size: '1.8 MB',
        type: 'certificate',
        status: 'verified',
        cornellValidated: true,
        immutable: true,
        signatures: 2,
        network: 'polygon'
      },
      {
        id: '3',
        name: 'Corporate Board Resolution - DEF Inc',
        hash: '0x9876543210abcdef9876543210abcdef98765432',
        blockNumber: 7834561,
        timestamp: new Date('2024-01-23T09:45:00'),
        size: '3.1 MB',
        type: 'contract',
        status: 'pending',
        cornellValidated: false,
        immutable: false,
        signatures: 1,
        network: 'avalanche'
      },
      {
        id: '4',
        name: 'Real Estate Purchase Contract - Property LLC',
        hash: '0xabcdef1234567890abcdef1234567890abcdef12',
        blockNumber: 12345678,
        timestamp: new Date('2024-01-22T16:15:00'),
        size: '4.2 MB',
        type: 'contract',
        status: 'verified',
        cornellValidated: true,
        immutable: true,
        signatures: 4,
        network: 'bsc'
      }
    ]

    const mockContracts: SmartContract[] = [
      {
        id: '1',
        name: 'Cornell Legal Validation Contract',
        address: '0x742d35Cc6634C0532925a3b8D4c192cc72E749B8',
        network: 'Ethereum',
        type: 'validation',
        status: 'deployed',
        cornellCompliant: true,
        gasUsed: 2156743,
        transactions: 1247,
        lastActivity: new Date('2024-01-25T14:30:00'),
        abi: []
      },
      {
        id: '2',
        name: 'Document Escrow Service',
        address: '0x8ba1f109551bD432803012645Hac136c1dd6e821',
        network: 'Polygon',
        type: 'escrow',
        status: 'deployed',
        cornellCompliant: true,
        gasUsed: 987654,
        transactions: 892,
        lastActivity: new Date('2024-01-24T12:45:00'),
        abi: []
      },
      {
        id: '3',
        name: 'Identity Verification System',
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        network: 'Avalanche',
        type: 'identity',
        status: 'deployed',
        cornellCompliant: false,
        gasUsed: 1456789,
        transactions: 567,
        lastActivity: new Date('2024-01-23T08:20:00'),
        abi: []
      },
      {
        id: '4',
        name: 'Audit Trail Recorder',
        address: '0xA0b86a33E6411F1C34c0f3E1B6b7f3A5e8976543',
        network: 'BSC',
        type: 'audit',
        status: 'pending',
        cornellCompliant: true,
        gasUsed: 0,
        transactions: 0,
        lastActivity: new Date('2024-01-22T10:30:00'),
        abi: []
      }
    ]

    const mockAuditTrails: AuditTrail[] = [
      {
        id: '1',
        documentId: '1',
        action: 'verified',
        actor: '0x742d35Cc6634C0532925a3b8D4c192cc72E749B8',
        timestamp: new Date('2024-01-25T14:30:00'),
        blockHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        gasUsed: 21587,
        cornellReference: 'cornell.edu/verification/ucc-article-3'
      },
      {
        id: '2',
        documentId: '2',
        action: 'signed',
        actor: '0x8ba1f109551bD432803012645Hac136c1dd6e821',
        timestamp: new Date('2024-01-24T11:20:00'),
        blockHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        transactionHash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
        gasUsed: 18743,
        cornellReference: 'cornell.edu/insurance/naic-compliance'
      },
      {
        id: '3',
        documentId: '3',
        action: 'created',
        actor: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        timestamp: new Date('2024-01-23T09:45:00'),
        blockHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        gasUsed: 32156
      }
    ]

    const mockIdentities: DigitalIdentity[] = [
      {
        id: '1',
        did: 'did:cornell:0x742d35Cc6634C0532925a3b8D4c192cc72E749B8',
        name: 'Cornell Legal Validator',
        type: 'validator',
        publicKey: '0x04a34b99f22c790c4e36b2b3c2c35a36db06226e41c692fc82b8b56ac1c540c5bd',
        verificationLevel: 'premium',
        cornellCertified: true,
        documentsVerified: 1247,
        trustScore: 98.5,
        lastActive: new Date('2024-01-25T14:30:00')
      },
      {
        id: '2',
        did: 'did:ethereum:0x8ba1f109551bD432803012645Hac136c1dd6e821',
        name: 'ABC Corporation',
        type: 'organization',
        publicKey: '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753',
        verificationLevel: 'enhanced',
        cornellCertified: true,
        documentsVerified: 892,
        trustScore: 94.2,
        lastActive: new Date('2024-01-24T12:00:00')
      },
      {
        id: '3',
        did: 'did:polygon:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        name: 'John Smith - Legal Notary',
        type: 'notary',
        publicKey: '0x047db227d7094ce215a4c237f2b5934ad3ab4b43f3e0b1a3b0d5d5b2d1234567',
        verificationLevel: 'enhanced',
        cornellCertified: false,
        documentsVerified: 567,
        trustScore: 87.8,
        lastActive: new Date('2024-01-23T16:45:00')
      }
    ]

    const calculatedMetrics: BlockchainMetrics = {
      totalDocuments: mockDocuments.length,
      verifiedDocuments: mockDocuments.filter(d => d.status === 'verified').length,
      activeContracts: mockContracts.filter(c => c.status === 'deployed').length,
      identitiesManaged: mockIdentities.length,
      gasOptimization: 87.5,
      cornellIntegration: 92.3
    }

    setDocuments(mockDocuments)
    setContracts(mockContracts)
    setAuditTrails(mockAuditTrails)
    setIdentities(mockIdentities)
    setMetrics(calculatedMetrics)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'deployed': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'failed': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case 'ethereum': return '#627eea'
      case 'polygon': return '#8247e5'
      case 'avalanche': return '#e84142'
      case 'bsc': return '#f3ba2f'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'deployed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      default: return <Info className="w-4 h-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Show success message (would implement toast notification)
  }

  const truncateHash = (hash: string, length: number = 12) => {
    return `${hash.slice(0, length)}...${hash.slice(-8)}`
  }

  const networks = ['ethereum', 'polygon', 'avalanche', 'bsc']

  return (
    <div className="blockchain-integration">
      <div className="blockchain-header">
        <div className="header-content">
          <div className="header-icon">
            <Link className="w-8 h-8" />
          </div>
          <div>
            <h1>Blockchain Integration</h1>
            <p>Immutable document verification with Cornell legal validation</p>
          </div>
        </div>
        
        <div className="blockchain-stats">
          <div className="stat-item">
            <span className="stat-value">{metrics.verifiedDocuments}</span>
            <span className="stat-label">Verified Docs</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{metrics.activeContracts}</span>
            <span className="stat-label">Active Contracts</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-icon documents">
            <FileCheck className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{metrics.totalDocuments}</h3>
            <p>Blockchain Documents</p>
            <div className="card-detail">
              {metrics.verifiedDocuments} verified
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon contracts">
            <Zap className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{contracts.length}</h3>
            <p>Smart Contracts</p>
            <div className="card-detail">
              {metrics.activeContracts} deployed
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon identities">
            <Users className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{metrics.identitiesManaged}</h3>
            <p>Digital Identities</p>
            <div className="card-detail">
              Cornell certified
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon optimization">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{metrics.gasOptimization}%</h3>
            <p>Gas Optimization</p>
            <div className="card-detail">
              Cornell integration: {metrics.cornellIntegration}%
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Tabs */}
      <div className="blockchain-tabs">
        <div className="tab-nav">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'documents', label: 'Documents', icon: FileCheck },
            { id: 'contracts', label: 'Smart Contracts', icon: Zap },
            { id: 'audit', label: 'Audit Trail', icon: Database },
            { id: 'identity', label: 'Digital Identity', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
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
              <div className="overview-section">
                <h3>Blockchain Network Distribution</h3>
                <div className="network-distribution">
                  <div className="network-grid">
                    {networks.map(network => {
                      const networkDocs = documents.filter(d => d.network === network)
                      const networkContracts = contracts.filter(c => c.network.toLowerCase() === network)
                      return (
                        <div key={network} className="network-card" style={{ borderLeftColor: getNetworkColor(network) }}>
                          <div className="network-header">
                            <div className="network-icon" style={{ backgroundColor: getNetworkColor(network) }}>
                              <Link className="w-5 h-5" />
                            </div>
                            <div className="network-info">
                              <h4>{network.charAt(0).toUpperCase() + network.slice(1)}</h4>
                              <p>Blockchain Network</p>
                            </div>
                          </div>
                          <div className="network-stats">
                            <div className="network-stat">
                              <span>Documents:</span>
                              <span>{networkDocs.length}</span>
                            </div>
                            <div className="network-stat">
                              <span>Contracts:</span>
                              <span>{networkContracts.length}</span>
                            </div>
                            <div className="network-stat">
                              <span>Verified:</span>
                              <span>{networkDocs.filter(d => d.status === 'verified').length}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="overview-section">
                <h3>Cornell Integration Status</h3>
                <div className="cornell-status">
                  <div className="status-metrics">
                    <div className="metric-item">
                      <div className="metric-header">
                        <span>Document Validation</span>
                        <span>{Math.round((documents.filter(d => d.cornellValidated).length / documents.length) * 100)}%</span>
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-fill validation" 
                          style={{ width: `${(documents.filter(d => d.cornellValidated).length / documents.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="metric-item">
                      <div className="metric-header">
                        <span>Contract Compliance</span>
                        <span>{Math.round((contracts.filter(c => c.cornellCompliant).length / contracts.length) * 100)}%</span>
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-fill compliance" 
                          style={{ width: `${(contracts.filter(c => c.cornellCompliant).length / contracts.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="metric-item">
                      <div className="metric-header">
                        <span>Identity Certification</span>
                        <span>{Math.round((identities.filter(i => i.cornellCertified).length / identities.length) * 100)}%</span>
                      </div>
                      <div className="metric-bar">
                        <div 
                          className="metric-fill certification" 
                          style={{ width: `${(identities.filter(i => i.cornellCertified).length / identities.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="documents-content">
              <div className="documents-header">
                <h3>Blockchain Documents</h3>
                <div className="document-actions">
                  <button className="action-btn primary">
                    <Upload className="w-4 h-4" />
                    Upload to Blockchain
                  </button>
                  <button className="action-btn">
                    <Settings className="w-4 h-4" />
                    Verification Settings
                  </button>
                </div>
              </div>

              <div className="documents-list">
                {documents.map(doc => (
                  <div key={doc.id} className="document-card">
                    <div className="document-header">
                      <div className="document-info">
                        <div className="document-title">
                          <h4>{doc.name}</h4>
                          <div className="document-badges">
                            {doc.cornellValidated && (
                              <span className="cornell-badge">Cornell Validated</span>
                            )}
                            {doc.immutable && (
                              <span className="immutable-badge">Immutable</span>
                            )}
                          </div>
                        </div>
                        <div className="document-meta">
                          <span className="network-tag" style={{ backgroundColor: getNetworkColor(doc.network) }}>
                            {doc.network}
                          </span>
                          <span className="document-type">{doc.type}</span>
                          <span className="document-size">{doc.size}</span>
                        </div>
                      </div>
                      <div className="document-status">
                        <div className="status-indicator" style={{ color: getStatusColor(doc.status) }}>
                          {getStatusIcon(doc.status)}
                          <span>{doc.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="document-details">
                      <div className="detail-row">
                        <span className="detail-label">Hash:</span>
                        <div className="hash-display">
                          <code className="hash-value">{truncateHash(doc.hash)}</code>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(doc.hash)}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Block:</span>
                        <span className="detail-value">#{doc.blockNumber.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Timestamp:</span>
                        <span className="detail-value">{doc.timestamp.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Signatures:</span>
                        <span className="detail-value">{doc.signatures}</span>
                      </div>
                    </div>

                    <div className="document-actions">
                      <button className="action-btn">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button className="action-btn">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button className="action-btn">
                        <Verified className="w-4 h-4" />
                        Verify
                      </button>
                      <button className="action-btn">
                        <Database className="w-4 h-4" />
                        Audit Trail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="contracts-content">
              <div className="contracts-header">
                <h3>Smart Contracts</h3>
                <div className="contract-actions">
                  <button className="action-btn primary">
                    <Zap className="w-4 h-4" />
                    Deploy Contract
                  </button>
                  <button className="action-btn">
                    <Settings className="w-4 h-4" />
                    Contract Templates
                  </button>
                </div>
              </div>

              <div className="contracts-list">
                {contracts.map(contract => (
                  <div key={contract.id} className="contract-card">
                    <div className="contract-header">
                      <div className="contract-info">
                        <h4>{contract.name}</h4>
                        <div className="contract-meta">
                          <span className="contract-type">{contract.type}</span>
                          <span className="network-tag" style={{ backgroundColor: getNetworkColor(contract.network.toLowerCase()) }}>
                            {contract.network}
                          </span>
                        </div>
                      </div>
                      <div className="contract-badges">
                        {contract.cornellCompliant && (
                          <span className="cornell-badge">Cornell Compliant</span>
                        )}
                        <div className="status-indicator" style={{ color: getStatusColor(contract.status) }}>
                          {getStatusIcon(contract.status)}
                          <span>{contract.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="contract-details">
                      <div className="detail-row">
                        <span className="detail-label">Address:</span>
                        <div className="address-display">
                          <code className="address-value">{truncateHash(contract.address)}</code>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(contract.address)}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Gas Used:</span>
                        <span className="detail-value">{contract.gasUsed.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Transactions:</span>
                        <span className="detail-value">{contract.transactions.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Last Activity:</span>
                        <span className="detail-value">{contract.lastActivity.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="contract-actions">
                      <button className="action-btn primary">
                        <Zap className="w-4 h-4" />
                        Interact
                      </button>
                      <button className="action-btn">
                        <Eye className="w-4 h-4" />
                        View Code
                      </button>
                      <button className="action-btn">
                        <TrendingUp className="w-4 h-4" />
                        Analytics
                      </button>
                      <button className="action-btn">
                        <Settings className="w-4 h-4" />
                        Configure
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
                <h3>Immutable Audit Trail</h3>
                <div className="audit-filters">
                  <div className="search-box">
                    <Search className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search audit logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="audit-timeline">
                {auditTrails.map(trail => (
                  <div key={trail.id} className="audit-item">
                    <div className="audit-icon">
                      {trail.action === 'created' && <FileCheck className="w-4 h-4" />}
                      {trail.action === 'signed' && <Edit3 className="w-4 h-4" />}
                      {trail.action === 'verified' && <CheckCircle className="w-4 h-4" />}
                      {trail.action === 'transferred' && <Users className="w-4 h-4" />}
                      {trail.action === 'updated' && <Settings className="w-4 h-4" />}
                    </div>
                    
                    <div className="audit-content">
                      <div className="audit-header">
                        <div className="audit-action">
                          <span className="action-type">{trail.action}</span>
                          <span className="document-ref">Document #{trail.documentId}</span>
                        </div>
                        <div className="audit-timestamp">
                          {trail.timestamp.toLocaleString()}
                        </div>
                      </div>

                      <div className="audit-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span>Actor:</span>
                            <code>{truncateHash(trail.actor)}</code>
                          </div>
                          <div className="detail-item">
                            <span>Gas Used:</span>
                            <span>{trail.gasUsed.toLocaleString()}</span>
                          </div>
                          <div className="detail-item">
                            <span>Block Hash:</span>
                            <code>{truncateHash(trail.blockHash)}</code>
                          </div>
                          <div className="detail-item">
                            <span>Transaction:</span>
                            <code>{truncateHash(trail.transactionHash)}</code>
                          </div>
                        </div>

                        {trail.cornellReference && (
                          <div className="cornell-reference">
                            <div className="reference-header">
                              <Award className="w-4 h-4" />
                              <span>Cornell Legal Reference</span>
                            </div>
                            <a href={`https://${trail.cornellReference}`} className="reference-link">
                              {trail.cornellReference}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="identity-content">
              <div className="identity-header">
                <h3>Digital Identity Management</h3>
                <div className="identity-actions">
                  <button className="action-btn primary">
                    <Users className="w-4 h-4" />
                    Create Identity
                  </button>
                  <button className="action-btn">
                    <Award className="w-4 h-4" />
                    Cornell Certification
                  </button>
                </div>
              </div>

              <div className="identity-grid">
                {identities.map(identity => (
                  <div key={identity.id} className="identity-card">
                    <div className="identity-header">
                      <div className="identity-avatar">
                        {identity.type === 'validator' && <Shield className="w-6 h-6" />}
                        {identity.type === 'organization' && <Building className="w-6 h-6" />}
                        {identity.type === 'notary' && <Award className="w-6 h-6" />}
                        {identity.type === 'individual' && <Users className="w-6 h-6" />}
                      </div>
                      <div className="identity-info">
                        <h4>{identity.name}</h4>
                        <p>{identity.type}</p>
                      </div>
                      <div className="identity-badges">
                        {identity.cornellCertified && (
                          <span className="cornell-badge">Cornell Certified</span>
                        )}
                        <div className="verification-level">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{identity.verificationLevel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="identity-details">
                      <div className="detail-row">
                        <span className="detail-label">DID:</span>
                        <div className="did-display">
                          <code className="did-value">{truncateHash(identity.did, 16)}</code>
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(identity.did)}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Trust Score:</span>
                        <div className="trust-score">
                          <div className="score-bar">
                            <div 
                              className="score-fill" 
                              style={{ width: `${identity.trustScore}%` }}
                            ></div>
                          </div>
                          <span className="score-value">{identity.trustScore}%</span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Documents Verified:</span>
                        <span className="detail-value">{identity.documentsVerified.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Last Active:</span>
                        <span className="detail-value">{identity.lastActive.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="identity-actions">
                      <button className="action-btn primary">
                        <Eye className="w-4 h-4" />
                        View Profile
                      </button>
                      <button className="action-btn">
                        <Key className="w-4 h-4" />
                        Manage Keys
                      </button>
                      <button className="action-btn">
                        <Settings className="w-4 h-4" />
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-content">
              <div className="analytics-header">
                <h3>Blockchain Analytics</h3>
                <button className="analytics-btn">
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="card-header">
                    <h4>Network Performance</h4>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="performance-metrics">
                    {networks.map(network => {
                      const networkDocs = documents.filter(d => d.network === network)
                      const verifiedDocs = networkDocs.filter(d => d.status === 'verified')
                      const verificationRate = networkDocs.length > 0 ? (verifiedDocs.length / networkDocs.length) * 100 : 0
                      
                      return (
                        <div key={network} className="network-performance">
                          <div className="network-name">{network.charAt(0).toUpperCase() + network.slice(1)}</div>
                          <div className="performance-bar">
                            <div 
                              className="performance-fill" 
                              style={{ 
                                width: `${verificationRate}%`,
                                backgroundColor: getNetworkColor(network)
                              }}
                            ></div>
                          </div>
                          <div className="performance-value">{Math.round(verificationRate)}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h4>Gas Optimization</h4>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="gas-metrics">
                    <div className="gas-chart">
                      <div className="chart-center">
                        <span className="chart-value">{metrics.gasOptimization}%</span>
                        <span className="chart-label">Optimized</span>
                      </div>
                      <svg className="chart-svg" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray={`${metrics.gasOptimization}, 100`}
                        />
                      </svg>
                    </div>
                    <div className="gas-details">
                      <div className="gas-item">
                        <span>Average Gas:</span>
                        <span>21,547 gwei</span>
                      </div>
                      <div className="gas-item">
                        <span>Optimized:</span>
                        <span>18,734 gwei</span>
                      </div>
                      <div className="gas-item">
                        <span>Savings:</span>
                        <span>2,813 gwei</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h4>Cornell Integration</h4>
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="cornell-metrics">
                    <div className="cornell-stats">
                      <div className="stat-row">
                        <span>Validated Documents:</span>
                        <span>{documents.filter(d => d.cornellValidated).length}/{documents.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>Compliant Contracts:</span>
                        <span>{contracts.filter(c => c.cornellCompliant).length}/{contracts.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>Certified Identities:</span>
                        <span>{identities.filter(i => i.cornellCertified).length}/{identities.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>Integration Score:</span>
                        <span className="score-highlight">{metrics.cornellIntegration}%</span>
                      </div>
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

export default BlockchainIntegration