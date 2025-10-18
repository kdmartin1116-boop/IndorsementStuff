import React, { useState, useEffect } from 'react'
import { 
  Globe, MapPin, Scale, FileText, CheckCircle, 
  AlertTriangle, Clock, Flag, Search, Filter,
  Download, Upload, Settings, ArrowRight, Info,
  Users, Building, Gavel, BookOpen, Shield
} from 'lucide-react'

interface Jurisdiction {
  id: string
  name: string
  code: string
  type: 'federal' | 'state' | 'international' | 'regional'
  region: string
  language: string
  legalSystem: 'common' | 'civil' | 'mixed' | 'religious' | 'customary'
  cornellIntegration: boolean
  documentsSupported: number
  complianceLevel: 'full' | 'partial' | 'limited'
  lastUpdated: Date
  flag: string
}

interface LegalFramework {
  id: string
  name: string
  jurisdiction: string
  category: 'commercial' | 'contract' | 'corporate' | 'banking' | 'securities'
  description: string
  cornellReference: string
  isActive: boolean
  harmonizedWith: string[]
  conflictsWith: string[]
  requirements: string[]
}

interface CrossBorderRule {
  id: string
  name: string
  fromJurisdiction: string
  toJurisdiction: string
  documentType: string
  requirements: string[]
  processingTime: string
  fees: string
  cornellGuidance: string
  status: 'active' | 'suspended' | 'under-review'
}

interface ComplianceCheck {
  jurisdiction: string
  status: 'compliant' | 'non-compliant' | 'partial' | 'unknown'
  issues: string[]
  recommendations: string[]
  cornellReferences: string[]
  confidence: number
}

const MultiJurisdictionSupport: React.FC = () => {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([])
  const [legalFrameworks, setLegalFrameworks] = useState<LegalFramework[]>([])
  const [crossBorderRules, setCrossBorderRules] = useState<CrossBorderRule[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'jurisdictions' | 'frameworks' | 'cross-border' | 'compliance'>('overview')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState('')

  useEffect(() => {
    // Initialize jurisdictions data
    const mockJurisdictions: Jurisdiction[] = [
      {
        id: 'us',
        name: 'United States',
        code: 'US',
        type: 'federal',
        region: 'North America',
        language: 'English',
        legalSystem: 'common',
        cornellIntegration: true,
        documentsSupported: 1247,
        complianceLevel: 'full',
        lastUpdated: new Date('2024-01-25'),
        flag: '🇺🇸'
      },
      {
        id: 'uk',
        name: 'United Kingdom',
        code: 'GB',
        type: 'federal',
        region: 'Europe',
        language: 'English',
        legalSystem: 'common',
        cornellIntegration: true,
        documentsSupported: 892,
        complianceLevel: 'full',
        lastUpdated: new Date('2024-01-24'),
        flag: '🇬🇧'
      },
      {
        id: 'de',
        name: 'Germany',
        code: 'DE',
        type: 'federal',
        region: 'Europe',
        language: 'German',
        legalSystem: 'civil',
        cornellIntegration: true,
        documentsSupported: 567,
        complianceLevel: 'full',
        lastUpdated: new Date('2024-01-23'),
        flag: '🇩🇪'
      },
      {
        id: 'fr',
        name: 'France',
        code: 'FR',
        type: 'federal',
        region: 'Europe',
        language: 'French',
        legalSystem: 'civil',
        cornellIntegration: true,
        documentsSupported: 445,
        complianceLevel: 'partial',
        lastUpdated: new Date('2024-01-22'),
        flag: '🇫🇷'
      },
      {
        id: 'sg',
        name: 'Singapore',
        code: 'SG',
        type: 'federal',
        region: 'Asia-Pacific',
        language: 'English',
        legalSystem: 'common',
        cornellIntegration: true,
        documentsSupported: 334,
        complianceLevel: 'full',
        lastUpdated: new Date('2024-01-21'),
        flag: '🇸🇬'
      },
      {
        id: 'jp',
        name: 'Japan',
        code: 'JP',
        type: 'federal',
        region: 'Asia-Pacific',
        language: 'Japanese',
        legalSystem: 'civil',
        cornellIntegration: false,
        documentsSupported: 156,
        complianceLevel: 'limited',
        lastUpdated: new Date('2024-01-20'),
        flag: '🇯🇵'
      }
    ]

    const mockFrameworks: LegalFramework[] = [
      {
        id: '1',
        name: 'Uniform Commercial Code (UCC)',
        jurisdiction: 'US',
        category: 'commercial',
        description: 'Comprehensive commercial law framework governing sales, negotiable instruments, and secured transactions',
        cornellReference: 'cornell.edu/ucc',
        isActive: true,
        harmonizedWith: ['CISG', 'UK-SGA'],
        conflictsWith: [],
        requirements: ['Article 3 compliance', 'Good faith dealings', 'Commercial reasonableness']
      },
      {
        id: '2',
        name: 'Bills of Exchange Act',
        jurisdiction: 'UK',
        category: 'commercial',
        description: 'British legislation governing negotiable instruments and commercial paper',
        cornellReference: 'cornell.edu/uk-bills',
        isActive: true,
        harmonizedWith: ['UCC-Article-3'],
        conflictsWith: ['French-Commercial-Code'],
        requirements: ['Proper endorsement', 'Value consideration', 'Good faith holder']
      },
      {
        id: '3',
        name: 'German Commercial Code (HGB)',
        jurisdiction: 'DE',
        category: 'commercial',
        description: 'German commercial law including negotiable instruments provisions',
        cornellReference: 'cornell.edu/german-hgb',
        isActive: true,
        harmonizedWith: ['EU-Directive-2000'],
        conflictsWith: [],
        requirements: ['Written form', 'Proper signatures', 'Commercial purpose']
      },
      {
        id: '4',
        name: 'UNCITRAL Model Law',
        jurisdiction: 'international',
        category: 'commercial',
        description: 'International framework for commercial transactions and dispute resolution',
        cornellReference: 'cornell.edu/uncitral',
        isActive: true,
        harmonizedWith: ['UCC', 'CISG'],
        conflictsWith: [],
        requirements: ['International standards', 'Cross-border recognition', 'Dispute resolution']
      }
    ]

    const mockCrossBorderRules: CrossBorderRule[] = [
      {
        id: '1',
        name: 'US-UK Commercial Paper Recognition',
        fromJurisdiction: 'US',
        toJurisdiction: 'UK',
        documentType: 'Bills of Exchange',
        requirements: [
          'Apostille authentication',
          'English language or certified translation',
          'Compliance with both UCC and Bills of Exchange Act',
          'Proper endorsement chain'
        ],
        processingTime: '5-10 business days',
        fees: '$150-300 USD',
        cornellGuidance: 'See Cornell International Commercial Law Guide Section 4.2',
        status: 'active'
      },
      {
        id: '2',
        name: 'EU Internal Market Recognition',
        fromJurisdiction: 'DE',
        toJurisdiction: 'FR',
        documentType: 'Commercial Documents',
        requirements: [
          'EU directive compliance',
          'Digital signature recognition',
          'VAT registration proof',
          'Cross-border notification'
        ],
        processingTime: '2-5 business days',
        fees: '€50-150 EUR',
        cornellGuidance: 'Cornell EU Commercial Law Database',
        status: 'active'
      }
    ]

    setJurisdictions(mockJurisdictions)
    setLegalFrameworks(mockFrameworks)
    setCrossBorderRules(mockCrossBorderRules)
  }, [])

  const filteredJurisdictions = jurisdictions.filter(jurisdiction => {
    const matchesSearch = jurisdiction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jurisdiction.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = !filterRegion || jurisdiction.region === filterRegion
    return matchesSearch && matchesRegion
  })

  const getComplianceColor = (level: string) => {
    switch (level) {
      case 'full': return '#10b981'
      case 'partial': return '#f59e0b'
      case 'limited': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getLegalSystemIcon = (system: string) => {
    switch (system) {
      case 'common': return <Scale className="w-4 h-4" />
      case 'civil': return <BookOpen className="w-4 h-4" />
      case 'mixed': return <Globe className="w-4 h-4" />
      case 'religious': return <Building className="w-4 h-4" />
      case 'customary': return <Users className="w-4 h-4" />
      default: return <Gavel className="w-4 h-4" />
    }
  }

  const performComplianceCheck = (documentType: string): ComplianceCheck[] => {
    // Mock compliance check results
    return [
      {
        jurisdiction: 'US',
        status: 'compliant',
        issues: [],
        recommendations: ['Consider adding dispute resolution clause'],
        cornellReferences: ['UCC Article 3', 'Restatement of Contracts'],
        confidence: 95
      },
      {
        jurisdiction: 'UK',
        status: 'compliant',
        issues: [],
        recommendations: ['Verify proper endorsement format'],
        cornellReferences: ['Bills of Exchange Act 1882'],
        confidence: 92
      },
      {
        jurisdiction: 'DE',
        status: 'partial',
        issues: ['Translation required for German courts'],
        recommendations: ['Obtain certified German translation', 'Add German law governing clause'],
        cornellReferences: ['HGB Section 363', 'German Civil Code'],
        confidence: 78
      }
    ]
  }

  const regions = [...new Set(jurisdictions.map(j => j.region))]

  return (
    <div className="multi-jurisdiction">
      <div className="jurisdiction-header">
        <div className="header-content">
          <div className="header-icon">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h1>Multi-Jurisdiction Support</h1>
            <p>International legal frameworks with Cornell integration</p>
          </div>
        </div>
        
        <div className="jurisdiction-stats">
          <div className="stat-item">
            <span className="stat-value">{jurisdictions.filter(j => j.cornellIntegration).length}</span>
            <span className="stat-label">Cornell Integrated</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{jurisdictions.filter(j => j.complianceLevel === 'full').length}</span>
            <span className="stat-label">Full Compliance</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-icon jurisdictions">
            <Flag className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{jurisdictions.length}</h3>
            <p>Jurisdictions</p>
            <div className="card-detail">
              {regions.length} regions covered
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon frameworks">
            <Scale className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{legalFrameworks.length}</h3>
            <p>Legal Frameworks</p>
            <div className="card-detail">
              {legalFrameworks.filter(f => f.isActive).length} active
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon cross-border">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{crossBorderRules.length}</h3>
            <p>Cross-Border Rules</p>
            <div className="card-detail">
              {crossBorderRules.filter(r => r.status === 'active').length} active
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon documents">
            <FileText className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{jurisdictions.reduce((sum, j) => sum + j.documentsSupported, 0)}</h3>
            <p>Documents Supported</p>
            <div className="card-detail">
              Across all jurisdictions
            </div>
          </div>
        </div>
      </div>

      {/* Jurisdiction Tabs */}
      <div className="jurisdiction-tabs">
        <div className="tab-nav">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'jurisdictions', label: 'Jurisdictions', icon: Flag },
            { id: 'frameworks', label: 'Legal Frameworks', icon: Scale },
            { id: 'cross-border', label: 'Cross-Border', icon: ArrowRight },
            { id: 'compliance', label: 'Compliance Check', icon: Shield }
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
                <h3>Global Coverage Map</h3>
                <div className="coverage-map">
                  <div className="region-coverage">
                    {regions.map(region => {
                      const regionJurisdictions = jurisdictions.filter(j => j.region === region)
                      const cornellIntegrated = regionJurisdictions.filter(j => j.cornellIntegration).length
                      return (
                        <div key={region} className="region-item">
                          <div className="region-header">
                            <h4>{region}</h4>
                            <span className="region-count">{regionJurisdictions.length} jurisdictions</span>
                          </div>
                          <div className="region-details">
                            <div className="detail-metric">
                              <span>Cornell Integration:</span>
                              <span>{cornellIntegrated}/{regionJurisdictions.length}</span>
                            </div>
                            <div className="detail-metric">
                              <span>Documents:</span>
                              <span>{regionJurisdictions.reduce((sum, j) => sum + j.documentsSupported, 0)}</span>
                            </div>
                          </div>
                          <div className="region-flags">
                            {regionJurisdictions.map(j => (
                              <span key={j.id} className="flag-emoji" title={j.name}>
                                {j.flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="overview-section">
                <h3>Integration Status</h3>
                <div className="integration-status">
                  <div className="status-chart">
                    <div className="chart-item full">
                      <div className="chart-bar" style={{ width: `${jurisdictions.filter(j => j.complianceLevel === 'full').length / jurisdictions.length * 100}%` }}></div>
                      <span>Full Compliance ({jurisdictions.filter(j => j.complianceLevel === 'full').length})</span>
                    </div>
                    <div className="chart-item partial">
                      <div className="chart-bar" style={{ width: `${jurisdictions.filter(j => j.complianceLevel === 'partial').length / jurisdictions.length * 100}%` }}></div>
                      <span>Partial Compliance ({jurisdictions.filter(j => j.complianceLevel === 'partial').length})</span>
                    </div>
                    <div className="chart-item limited">
                      <div className="chart-bar" style={{ width: `${jurisdictions.filter(j => j.complianceLevel === 'limited').length / jurisdictions.length * 100}%` }}></div>
                      <span>Limited Support ({jurisdictions.filter(j => j.complianceLevel === 'limited').length})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jurisdictions' && (
            <div className="jurisdictions-content">
              <div className="jurisdictions-header">
                <h3>Supported Jurisdictions</h3>
                <div className="search-filters">
                  <div className="search-box">
                    <Search className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search jurisdictions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="region-filter"
                  >
                    <option value="">All Regions</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="jurisdictions-grid">
                {filteredJurisdictions.map(jurisdiction => (
                  <div key={jurisdiction.id} className="jurisdiction-card">
                    <div className="jurisdiction-header">
                      <div className="jurisdiction-flag">
                        {jurisdiction.flag}
                      </div>
                      <div className="jurisdiction-info">
                        <h4>{jurisdiction.name}</h4>
                        <p>{jurisdiction.region} • {jurisdiction.code}</p>
                      </div>
                      <div className="cornell-badge">
                        {jurisdiction.cornellIntegration ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="jurisdiction-details">
                      <div className="detail-row">
                        <span>Legal System:</span>
                        <div className="legal-system">
                          {getLegalSystemIcon(jurisdiction.legalSystem)}
                          <span>{jurisdiction.legalSystem}</span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <span>Language:</span>
                        <span>{jurisdiction.language}</span>
                      </div>
                      <div className="detail-row">
                        <span>Documents:</span>
                        <span>{jurisdiction.documentsSupported}</span>
                      </div>
                      <div className="detail-row">
                        <span>Compliance:</span>
                        <span className="compliance-level" style={{ color: getComplianceColor(jurisdiction.complianceLevel) }}>
                          {jurisdiction.complianceLevel}
                        </span>
                      </div>
                    </div>

                    <div className="jurisdiction-actions">
                      <button className="action-btn primary">
                        <Settings className="w-4 h-4" />
                        Configure
                      </button>
                      <button className="action-btn">
                        <FileText className="w-4 h-4" />
                        Documents
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'frameworks' && (
            <div className="frameworks-content">
              <div className="frameworks-header">
                <h3>Legal Frameworks</h3>
                <button className="add-framework-btn">
                  <Settings className="w-4 h-4" />
                  Manage Frameworks
                </button>
              </div>

              <div className="frameworks-list">
                {legalFrameworks.map(framework => (
                  <div key={framework.id} className="framework-card">
                    <div className="framework-header">
                      <div className="framework-info">
                        <h4>{framework.name}</h4>
                        <div className="framework-meta">
                          <span className="framework-jurisdiction">
                            {jurisdictions.find(j => j.id === framework.jurisdiction)?.name || framework.jurisdiction}
                          </span>
                          <span className="framework-category">{framework.category}</span>
                        </div>
                      </div>
                      <div className="framework-status">
                        {framework.isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="framework-description">
                      <p>{framework.description}</p>
                    </div>

                    <div className="framework-details">
                      <div className="framework-section">
                        <h5>Cornell Reference</h5>
                        <a href={`https://${framework.cornellReference}`} className="cornell-link">
                          {framework.cornellReference}
                        </a>
                      </div>

                      <div className="framework-section">
                        <h5>Requirements</h5>
                        <ul className="requirements-list">
                          {framework.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      {framework.harmonizedWith.length > 0 && (
                        <div className="framework-section">
                          <h5>Harmonized With</h5>
                          <div className="related-frameworks">
                            {framework.harmonizedWith.map(related => (
                              <span key={related} className="related-tag harmonized">{related}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {framework.conflictsWith.length > 0 && (
                        <div className="framework-section">
                          <h5>Conflicts With</h5>
                          <div className="related-frameworks">
                            {framework.conflictsWith.map(conflict => (
                              <span key={conflict} className="related-tag conflict">{conflict}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cross-border' && (
            <div className="cross-border-content">
              <div className="cross-border-header">
                <h3>Cross-Border Processing Rules</h3>
                <button className="add-rule-btn">
                  <ArrowRight className="w-4 h-4" />
                  Add Rule
                </button>
              </div>

              <div className="cross-border-list">
                {crossBorderRules.map(rule => (
                  <div key={rule.id} className="cross-border-card">
                    <div className="rule-header">
                      <div className="rule-flow">
                        <span className="jurisdiction-from">
                          {jurisdictions.find(j => j.id === rule.fromJurisdiction)?.flag}
                          {jurisdictions.find(j => j.id === rule.fromJurisdiction)?.name}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="jurisdiction-to">
                          {jurisdictions.find(j => j.id === rule.toJurisdiction)?.flag}
                          {jurisdictions.find(j => j.id === rule.toJurisdiction)?.name}
                        </span>
                      </div>
                      <div className="rule-status">
                        <span className={`status-badge ${rule.status}`}>{rule.status}</span>
                      </div>
                    </div>

                    <div className="rule-details">
                      <h4>{rule.name}</h4>
                      <div className="rule-meta">
                        <span>Document Type: {rule.documentType}</span>
                        <span>Processing Time: {rule.processingTime}</span>
                        <span>Fees: {rule.fees}</span>
                      </div>

                      <div className="rule-requirements">
                        <h5>Requirements</h5>
                        <ul>
                          {rule.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="cornell-guidance">
                        <div className="guidance-header">
                          <Info className="w-4 h-4" />
                          <span>Cornell Guidance</span>
                        </div>
                        <p>{rule.cornellGuidance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="compliance-content">
              <div className="compliance-header">
                <h3>Multi-Jurisdiction Compliance Check</h3>
                <div className="compliance-actions">
                  <button className="upload-btn">
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>
                  <button className="check-btn">
                    <Shield className="w-4 h-4" />
                    Run Check
                  </button>
                </div>
              </div>

              <div className="compliance-results">
                <h4>Compliance Analysis Results</h4>
                <p>Document Type: Commercial Bill of Exchange</p>
                
                <div className="compliance-grid">
                  {performComplianceCheck('bill-of-exchange').map((check, index) => (
                    <div key={index} className="compliance-card">
                      <div className="compliance-header">
                        <div className="jurisdiction-info">
                          <span className="jurisdiction-flag">
                            {jurisdictions.find(j => j.id.toLowerCase() === check.jurisdiction.toLowerCase())?.flag}
                          </span>
                          <span className="jurisdiction-name">{check.jurisdiction}</span>
                        </div>
                        <div className="compliance-status">
                          <span className={`status-indicator ${check.status}`}>
                            {check.status === 'compliant' && <CheckCircle className="w-4 h-4" />}
                            {check.status === 'non-compliant' && <AlertTriangle className="w-4 h-4" />}
                            {check.status === 'partial' && <Clock className="w-4 h-4" />}
                            {check.status}
                          </span>
                          <span className="confidence-score">{check.confidence}% confidence</span>
                        </div>
                      </div>

                      {check.issues.length > 0 && (
                        <div className="compliance-section">
                          <h5>Issues Found</h5>
                          <ul className="issues-list">
                            {check.issues.map((issue, i) => (
                              <li key={i} className="issue-item">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="compliance-section">
                        <h5>Recommendations</h5>
                        <ul className="recommendations-list">
                          {check.recommendations.map((rec, i) => (
                            <li key={i} className="recommendation-item">{rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="compliance-section">
                        <h5>Cornell Legal References</h5>
                        <div className="references-list">
                          {check.cornellReferences.map((ref, i) => (
                            <a key={i} href="#" className="reference-link">{ref}</a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="compliance-actions">
                  <button className="action-btn primary">
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                  <button className="action-btn">
                    <FileText className="w-4 h-4" />
                    Generate Summary
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MultiJurisdictionSupport