import React, { useState, useEffect } from 'react'
import { 
  Building, CreditCard, Shield, Home, Factory, 
  Truck, Plane, Heart, GraduationCap, Briefcase,
  CheckCircle, AlertTriangle, Clock, Star, Zap,
  FileText, Users, TrendingUp, BarChart3, Settings,
  Download, Upload, Search, Filter, Eye, Edit3,
  Globe, Scale, Book, Award, Target, Lightbulb
} from 'lucide-react'

interface IndustryModule {
  id: string
  name: string
  category: 'finance' | 'insurance' | 'corporate' | 'realestate' | 'healthcare' | 'transport' | 'education' | 'manufacturing'
  icon: React.ComponentType<{ className?: string }>
  description: string
  cornellIntegration: boolean
  compliance: string[]
  features: string[]
  documentsSupported: number
  activeUsers: number
  status: 'active' | 'beta' | 'coming-soon'
  lastUpdated: Date
  color: string
}

interface ComplianceRequirement {
  id: string
  industry: string
  regulation: string
  description: string
  cornellReference: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  automationLevel: number
  lastCheck: Date
}

interface IndustryTemplate {
  id: string
  name: string
  industry: string
  type: 'contract' | 'agreement' | 'notice' | 'report' | 'certificate'
  description: string
  cornellBased: boolean
  downloadCount: number
  rating: number
}

interface AnalyticsData {
  industry: string
  usage: number
  compliance: number
  efficiency: number
  satisfaction: number
}

const IndustrySpecificModules: React.FC = () => {
  const [industryModules, setIndustryModules] = useState<IndustryModule[]>([])
  const [complianceRequirements, setComplianceRequirements] = useState<ComplianceRequirement[]>([])
  const [templates, setTemplates] = useState<IndustryTemplate[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'compliance' | 'templates' | 'analytics'>('overview')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    // Initialize industry modules data
    const mockModules: IndustryModule[] = [
      {
        id: 'banking',
        name: 'Banking & Financial Services',
        category: 'finance',
        icon: CreditCard,
        description: 'Comprehensive banking compliance with UCC Article 3, Regulation CC, and Cornell commercial law integration',
        cornellIntegration: true,
        compliance: ['UCC Article 3', 'Regulation CC', 'FFIEC Guidelines', 'Basel III', 'Dodd-Frank'],
        features: ['Check processing', 'Wire transfers', 'Commercial lending', 'Trade finance', 'Risk assessment'],
        documentsSupported: 247,
        activeUsers: 1543,
        status: 'active',
        lastUpdated: new Date('2024-01-25'),
        color: '#3b82f6'
      },
      {
        id: 'insurance',
        name: 'Insurance & Risk Management',
        category: 'insurance',
        icon: Shield,
        description: 'Insurance policy management with state regulations and Cornell insurance law framework',
        cornellIntegration: true,
        compliance: ['State Insurance Codes', 'NAIC Standards', 'Solvency II', 'IFRS 17'],
        features: ['Policy underwriting', 'Claims processing', 'Regulatory reporting', 'Risk modeling', 'Reinsurance'],
        documentsSupported: 189,
        activeUsers: 892,
        status: 'active',
        lastUpdated: new Date('2024-01-24'),
        color: '#10b981'
      },
      {
        id: 'corporate',
        name: 'Corporate & Securities',
        category: 'corporate',
        icon: Building,
        description: 'Corporate governance and securities compliance with Delaware law and Cornell corporate framework',
        cornellIntegration: true,
        compliance: ['Delaware Corporate Law', 'SEC Regulations', 'SOX Compliance', 'GAAP Standards'],
        features: ['Board resolutions', 'Securities filings', 'M&A documents', 'Governance policies', 'IPO support'],
        documentsSupported: 334,
        activeUsers: 1247,
        status: 'active',
        lastUpdated: new Date('2024-01-23'),
        color: '#f59e0b'
      },
      {
        id: 'realestate',
        name: 'Real Estate & Property',
        category: 'realestate',
        icon: Home,
        description: 'Real estate transactions with state property laws and Cornell real estate legal framework',
        cornellIntegration: true,
        compliance: ['State Property Laws', 'RESPA', 'TILA', 'Fair Housing Act', 'Local Zoning'],
        features: ['Property deeds', 'Mortgage documents', 'Lease agreements', 'Title insurance', 'Zoning compliance'],
        documentsSupported: 156,
        activeUsers: 687,
        status: 'active',
        lastUpdated: new Date('2024-01-22'),
        color: '#ef4444'
      },
      {
        id: 'healthcare',
        name: 'Healthcare & Medical',
        category: 'healthcare',
        icon: Heart,
        description: 'Healthcare compliance with HIPAA, FDA regulations, and Cornell health law integration',
        cornellIntegration: true,
        compliance: ['HIPAA', 'FDA Regulations', 'CMS Rules', 'State Medical Laws', 'Joint Commission'],
        features: ['Patient consent', 'Medical records', 'Drug approvals', 'Device regulations', 'Privacy compliance'],
        documentsSupported: 123,
        activeUsers: 445,
        status: 'beta',
        lastUpdated: new Date('2024-01-21'),
        color: '#ec4899'
      },
      {
        id: 'transportation',
        name: 'Transportation & Logistics',
        category: 'transport',
        icon: Truck,
        description: 'Transportation compliance with DOT regulations and Cornell transportation law framework',
        cornellIntegration: false,
        compliance: ['DOT Regulations', 'FMCSA Rules', 'ICC Termination Act', 'International Shipping'],
        features: ['Bills of lading', 'Shipping contracts', 'Carrier agreements', 'Insurance docs', 'Customs forms'],
        documentsSupported: 89,
        activeUsers: 234,
        status: 'beta',
        lastUpdated: new Date('2024-01-20'),
        color: '#8b5cf6'
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing & Industrial',
        category: 'manufacturing',
        icon: Factory,
        description: 'Manufacturing compliance with OSHA, EPA, and Cornell industrial law integration',
        cornellIntegration: false,
        compliance: ['OSHA Standards', 'EPA Regulations', 'ISO Certifications', 'Product Safety'],
        features: ['Safety protocols', 'Quality standards', 'Environmental compliance', 'Labor agreements', 'Supply chain'],
        documentsSupported: 67,
        activeUsers: 178,
        status: 'coming-soon',
        lastUpdated: new Date('2024-01-19'),
        color: '#6b7280'
      },
      {
        id: 'education',
        name: 'Education & Academic',
        category: 'education',
        icon: GraduationCap,
        description: 'Educational institution compliance with FERPA and Cornell education law framework',
        cornellIntegration: false,
        compliance: ['FERPA', 'Title IX', 'ADA Compliance', 'State Education Laws'],
        features: ['Student records', 'Academic policies', 'Research compliance', 'Grant management', 'Accreditation'],
        documentsSupported: 45,
        activeUsers: 123,
        status: 'coming-soon',
        lastUpdated: new Date('2024-01-18'),
        color: '#14b8a6'
      }
    ]

    const mockCompliance: ComplianceRequirement[] = [
      {
        id: '1',
        industry: 'Banking',
        regulation: 'UCC Article 3 - Negotiable Instruments',
        description: 'Compliance with uniform commercial code for negotiable instruments processing',
        cornellReference: 'cornell.edu/ucc/article3',
        severity: 'critical',
        automationLevel: 95,
        lastCheck: new Date('2024-01-25T14:30:00')
      },
      {
        id: '2',
        industry: 'Insurance',
        regulation: 'NAIC Model Laws',
        description: 'National Association of Insurance Commissioners model law compliance',
        cornellReference: 'cornell.edu/insurance/naic',
        severity: 'high',
        automationLevel: 87,
        lastCheck: new Date('2024-01-25T13:45:00')
      },
      {
        id: '3',
        industry: 'Corporate',
        regulation: 'SOX Section 404',
        description: 'Sarbanes-Oxley Act internal control reporting requirements',
        cornellReference: 'cornell.edu/securities/sox',
        severity: 'critical',
        automationLevel: 92,
        lastCheck: new Date('2024-01-25T12:20:00')
      },
      {
        id: '4',
        industry: 'Real Estate',
        regulation: 'RESPA Requirements',
        description: 'Real Estate Settlement Procedures Act compliance for mortgage transactions',
        cornellReference: 'cornell.edu/realestate/respa',
        severity: 'high',
        automationLevel: 78,
        lastCheck: new Date('2024-01-25T11:15:00')
      }
    ]

    const mockTemplates: IndustryTemplate[] = [
      {
        id: '1',
        name: 'Commercial Loan Agreement',
        industry: 'Banking',
        type: 'agreement',
        description: 'Cornell UCC-compliant commercial lending agreement template',
        cornellBased: true,
        downloadCount: 1247,
        rating: 4.8
      },
      {
        id: '2',
        name: 'Insurance Policy Certificate',
        industry: 'Insurance',
        type: 'certificate',
        description: 'NAIC-compliant insurance policy certificate with Cornell legal framework',
        cornellBased: true,
        downloadCount: 892,
        rating: 4.6
      },
      {
        id: '3',
        name: 'Corporate Board Resolution',
        industry: 'Corporate',
        type: 'contract',
        description: 'Delaware law compliant board resolution template with Cornell references',
        cornellBased: true,
        downloadCount: 756,
        rating: 4.9
      },
      {
        id: '4',
        name: 'Property Purchase Agreement',
        industry: 'Real Estate',
        type: 'agreement',
        description: 'State law compliant real estate purchase agreement with Cornell integration',
        cornellBased: true,
        downloadCount: 634,
        rating: 4.7
      }
    ]

    const mockAnalytics: AnalyticsData[] = [
      { industry: 'Banking', usage: 85, compliance: 94, efficiency: 78, satisfaction: 4.8 },
      { industry: 'Insurance', usage: 72, compliance: 89, efficiency: 82, satisfaction: 4.6 },
      { industry: 'Corporate', usage: 91, compliance: 96, efficiency: 88, satisfaction: 4.9 },
      { industry: 'Real Estate', usage: 68, compliance: 85, efficiency: 75, satisfaction: 4.7 },
      { industry: 'Healthcare', usage: 45, compliance: 78, efficiency: 65, satisfaction: 4.2 },
      { industry: 'Transportation', usage: 32, compliance: 71, efficiency: 58, satisfaction: 3.9 }
    ]

    setIndustryModules(mockModules)
    setComplianceRequirements(mockCompliance)
    setTemplates(mockTemplates)
    setAnalytics(mockAnalytics)
  }, [])

  const filteredModules = industryModules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || module.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'beta': return '#f59e0b'
      case 'coming-soon': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'high': return '#f59e0b'
      case 'medium': return '#3b82f6'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const categories = [...new Set(industryModules.map(m => m.category))]

  return (
    <div className="industry-modules">
      <div className="industry-header">
        <div className="header-content">
          <div className="header-icon">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <h1>Industry-Specific Modules</h1>
            <p>Specialized compliance solutions with Cornell legal integration</p>
          </div>
        </div>
        
        <div className="industry-stats">
          <div className="stat-item">
            <span className="stat-value">{industryModules.filter(m => m.status === 'active').length}</span>
            <span className="stat-label">Active Modules</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{industryModules.filter(m => m.cornellIntegration).length}</span>
            <span className="stat-label">Cornell Integrated</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-icon modules">
            <Building className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{industryModules.length}</h3>
            <p>Industry Modules</p>
            <div className="card-detail">
              {categories.length} categories
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon users">
            <Users className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{industryModules.reduce((sum, m) => sum + m.activeUsers, 0).toLocaleString()}</h3>
            <p>Active Users</p>
            <div className="card-detail">
              Across all industries
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon documents">
            <FileText className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{industryModules.reduce((sum, m) => sum + m.documentsSupported, 0)}</h3>
            <p>Documents Supported</p>
            <div className="card-detail">
              Industry-specific templates
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon compliance">
            <Scale className="w-6 h-6" />
          </div>
          <div className="card-content">
            <h3>{complianceRequirements.length}</h3>
            <p>Compliance Rules</p>
            <div className="card-detail">
              Automated monitoring
            </div>
          </div>
        </div>
      </div>

      {/* Industry Tabs */}
      <div className="industry-tabs">
        <div className="tab-nav">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'modules', label: 'Modules', icon: Building },
            { id: 'compliance', label: 'Compliance', icon: Scale },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
                <h3>Industry Coverage Matrix</h3>
                <div className="coverage-matrix">
                  <div className="matrix-grid">
                    {industryModules.map(module => {
                      const ModuleIcon = module.icon
                      return (
                        <div key={module.id} className="matrix-item" style={{ borderLeftColor: module.color }}>
                          <div className="matrix-header">
                            <div className="matrix-icon" style={{ backgroundColor: module.color }}>
                              <ModuleIcon className="w-5 h-5" />
                            </div>
                            <div className="matrix-info">
                              <h4>{module.name}</h4>
                              <p>{module.category}</p>
                            </div>
                            <div className="matrix-status">
                              <span className="status-dot" style={{ backgroundColor: getStatusColor(module.status) }}></span>
                            </div>
                          </div>
                          <div className="matrix-metrics">
                            <div className="metric">
                              <span>Users:</span>
                              <span>{module.activeUsers.toLocaleString()}</span>
                            </div>
                            <div className="metric">
                              <span>Documents:</span>
                              <span>{module.documentsSupported}</span>
                            </div>
                            <div className="metric">
                              <span>Cornell:</span>
                              <span>{module.cornellIntegration ? '✓' : '○'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="overview-section">
                <h3>Compliance Automation Levels</h3>
                <div className="automation-chart">
                  {complianceRequirements.map(req => (
                    <div key={req.id} className="automation-item">
                      <div className="automation-header">
                        <span className="regulation-name">{req.regulation}</span>
                        <span className="automation-percentage">{req.automationLevel}%</span>
                      </div>
                      <div className="automation-bar">
                        <div 
                          className="automation-progress" 
                          style={{ 
                            width: `${req.automationLevel}%`,
                            backgroundColor: getSeverityColor(req.severity)
                          }}
                        ></div>
                      </div>
                      <div className="automation-details">
                        <span className="industry-tag">{req.industry}</span>
                        <span className={`severity-tag ${req.severity}`}>{req.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="modules-content">
              <div className="modules-header">
                <h3>Industry Modules</h3>
                <div className="search-filters">
                  <div className="search-box">
                    <Search className="w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search modules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="category-filter"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modules-grid">
                {filteredModules.map(module => {
                  const ModuleIcon = module.icon
                  return (
                    <div key={module.id} className="module-card">
                      <div className="module-header">
                        <div className="module-icon" style={{ backgroundColor: module.color }}>
                          <ModuleIcon className="w-6 h-6" />
                        </div>
                        <div className="module-info">
                          <h4>{module.name}</h4>
                          <p>{module.category}</p>
                        </div>
                        <div className="module-badges">
                          {module.cornellIntegration && (
                            <span className="cornell-badge">Cornell</span>
                          )}
                          <span className={`status-badge ${module.status}`}>
                            {module.status}
                          </span>
                        </div>
                      </div>

                      <div className="module-description">
                        <p>{module.description}</p>
                      </div>

                      <div className="module-stats">
                        <div className="stat">
                          <Users className="w-4 h-4" />
                          <span>{module.activeUsers.toLocaleString()} users</span>
                        </div>
                        <div className="stat">
                          <FileText className="w-4 h-4" />
                          <span>{module.documentsSupported} documents</span>
                        </div>
                      </div>

                      <div className="module-features">
                        <h5>Key Features</h5>
                        <div className="features-list">
                          {module.features.slice(0, 3).map(feature => (
                            <span key={feature} className="feature-tag">{feature}</span>
                          ))}
                          {module.features.length > 3 && (
                            <span className="feature-more">+{module.features.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      <div className="module-compliance">
                        <h5>Compliance Coverage</h5>
                        <div className="compliance-list">
                          {module.compliance.slice(0, 2).map(comp => (
                            <span key={comp} className="compliance-tag">{comp}</span>
                          ))}
                          {module.compliance.length > 2 && (
                            <span className="compliance-more">+{module.compliance.length - 2} more</span>
                          )}
                        </div>
                      </div>

                      <div className="module-actions">
                        {module.status === 'active' ? (
                          <button className="action-btn primary">
                            <Zap className="w-4 h-4" />
                            Launch Module
                          </button>
                        ) : module.status === 'beta' ? (
                          <button className="action-btn beta">
                            <Target className="w-4 h-4" />
                            Join Beta
                          </button>
                        ) : (
                          <button className="action-btn disabled">
                            <Clock className="w-4 h-4" />
                            Coming Soon
                          </button>
                        )}
                        <button className="action-btn secondary">
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="compliance-content">
              <div className="compliance-header">
                <h3>Compliance Requirements</h3>
                <button className="compliance-btn">
                  <Settings className="w-4 h-4" />
                  Manage Rules
                </button>
              </div>

              <div className="compliance-list">
                {complianceRequirements.map(req => (
                  <div key={req.id} className="compliance-card">
                    <div className="compliance-header">
                      <div className="compliance-info">
                        <h4>{req.regulation}</h4>
                        <div className="compliance-meta">
                          <span className="industry-name">{req.industry}</span>
                          <span className={`severity-indicator ${req.severity}`}>
                            {req.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="automation-level">
                        <div className="automation-circle">
                          <span>{req.automationLevel}%</span>
                        </div>
                        <span className="automation-label">Automated</span>
                      </div>
                    </div>

                    <div className="compliance-description">
                      <p>{req.description}</p>
                    </div>

                    <div className="compliance-details">
                      <div className="detail-item">
                        <Book className="w-4 h-4" />
                        <a href={`https://${req.cornellReference}`} className="cornell-link">
                          Cornell Legal Reference
                        </a>
                      </div>
                      <div className="detail-item">
                        <Clock className="w-4 h-4" />
                        <span>Last Check: {req.lastCheck.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="compliance-actions">
                      <button className="action-btn primary">
                        <CheckCircle className="w-4 h-4" />
                        Run Check
                      </button>
                      <button className="action-btn">
                        <Edit3 className="w-4 h-4" />
                        Configure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="templates-content">
              <div className="templates-header">
                <h3>Industry Document Templates</h3>
                <div className="template-actions">
                  <button className="template-btn">
                    <Upload className="w-4 h-4" />
                    Upload Template
                  </button>
                  <button className="template-btn primary">
                    <Lightbulb className="w-4 h-4" />
                    AI Generator
                  </button>
                </div>
              </div>

              <div className="templates-grid">
                {templates.map(template => (
                  <div key={template.id} className="template-card">
                    <div className="template-header">
                      <div className="template-info">
                        <h4>{template.name}</h4>
                        <div className="template-meta">
                          <span className="template-industry">{template.industry}</span>
                          <span className="template-type">{template.type}</span>
                        </div>
                      </div>
                      <div className="template-badges">
                        {template.cornellBased && (
                          <span className="cornell-badge">Cornell</span>
                        )}
                        <div className="rating-badge">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{template.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="template-description">
                      <p>{template.description}</p>
                    </div>

                    <div className="template-stats">
                      <div className="stat">
                        <Download className="w-4 h-4" />
                        <span>{template.downloadCount.toLocaleString()} downloads</span>
                      </div>
                      <div className="stat">
                        <Award className="w-4 h-4" />
                        <span>{template.rating}/5.0 rating</span>
                      </div>
                    </div>

                    <div className="template-actions">
                      <button className="action-btn primary">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button className="action-btn">
                        <Eye className="w-4 h-4" />
                        Preview
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
                <h3>Industry Performance Analytics</h3>
                <button className="analytics-btn">
                  <TrendingUp className="w-4 h-4" />
                  Generate Report
                </button>
              </div>

              <div className="analytics-grid">
                {analytics.map(data => (
                  <div key={data.industry} className="analytics-card">
                    <div className="analytics-header">
                      <h4>{data.industry}</h4>
                      <div className="satisfaction-score">
                        <Star className="w-4 h-4 fill-current text-yellow-500" />
                        <span>{data.satisfaction}/5.0</span>
                      </div>
                    </div>

                    <div className="metrics-grid">
                      <div className="metric-item">
                        <div className="metric-label">Usage</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill usage" 
                            style={{ width: `${data.usage}%` }}
                          ></div>
                        </div>
                        <div className="metric-value">{data.usage}%</div>
                      </div>

                      <div className="metric-item">
                        <div className="metric-label">Compliance</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill compliance" 
                            style={{ width: `${data.compliance}%` }}
                          ></div>
                        </div>
                        <div className="metric-value">{data.compliance}%</div>
                      </div>

                      <div className="metric-item">
                        <div className="metric-label">Efficiency</div>
                        <div className="metric-bar">
                          <div 
                            className="metric-fill efficiency" 
                            style={{ width: `${data.efficiency}%` }}
                          ></div>
                        </div>
                        <div className="metric-value">{data.efficiency}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="analytics-summary">
                <h4>Performance Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-icon usage">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="summary-content">
                      <h5>Average Usage</h5>
                      <p>{Math.round(analytics.reduce((sum, a) => sum + a.usage, 0) / analytics.length)}%</p>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon compliance">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div className="summary-content">
                      <h5>Compliance Rate</h5>
                      <p>{Math.round(analytics.reduce((sum, a) => sum + a.compliance, 0) / analytics.length)}%</p>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon efficiency">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="summary-content">
                      <h5>Efficiency Score</h5>
                      <p>{Math.round(analytics.reduce((sum, a) => sum + a.efficiency, 0) / analytics.length)}%</p>
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-icon satisfaction">
                      <Star className="w-5 h-5" />
                    </div>
                    <div className="summary-content">
                      <h5>Satisfaction</h5>
                      <p>{(analytics.reduce((sum, a) => sum + a.satisfaction, 0) / analytics.length).toFixed(1)}/5.0</p>
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

export default IndustrySpecificModules