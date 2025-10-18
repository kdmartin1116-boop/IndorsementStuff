import React, { useState, useEffect } from 'react';
import { 
    BarChart3, FileText, TrendingUp, AlertTriangle, Clock, 
    Target, Filter, Download, Calendar, Users, Globe,
    PieChart, Activity, Briefcase, Shield, CheckCircle,
    XCircle, AlertCircle, Search, MoreHorizontal, Eye,
    Building, Scale, Gavel, BookOpen, Award, Star
} from 'lucide-react';

interface LegalMetric {
    id: string;
    name: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    format: 'number' | 'percentage' | 'currency' | 'time';
}

interface ComplianceReport {
    id: string;
    title: string;
    status: 'compliant' | 'warning' | 'critical';
    score: number;
    lastUpdated: string;
    jurisdiction: string;
    framework: string;
    recommendations: string[];
}

interface LegalTrend {
    period: string;
    casesProcessed: number;
    complianceScore: number;
    riskLevel: number;
    cornellValidations: number;
}

interface ExecutiveInsight {
    id: string;
    title: string;
    summary: string;
    priority: 'high' | 'medium' | 'low';
    category: 'compliance' | 'risk' | 'efficiency' | 'quality';
    impact: string;
    recommendation: string;
    cornellReference?: string;
}

const LegalIntelligenceReporting: React.FC = () => {
    const [activeView, setActiveView] = useState<'overview' | 'reports' | 'trends' | 'insights' | 'export'>('overview');
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all');
    const [metrics, setMetrics] = useState<LegalMetric[]>([]);
    const [reports, setReports] = useState<ComplianceReport[]>([]);
    const [trends, setTrends] = useState<LegalTrend[]>([]);
    const [insights, setInsights] = useState<ExecutiveInsight[]>([]);

    useEffect(() => {
        loadMetrics();
        loadReports();
        loadTrends();
        loadInsights();
    }, [selectedPeriod, selectedJurisdiction]);

    const loadMetrics = () => {
        const mockMetrics: LegalMetric[] = [
            {
                id: 'documents_processed',
                name: 'Documents Processed',
                value: 2847,
                change: 12.5,
                trend: 'up',
                format: 'number'
            },
            {
                id: 'compliance_score',
                name: 'Compliance Score',
                value: 94.8,
                change: 2.1,
                trend: 'up',
                format: 'percentage'
            },
            {
                id: 'risk_reduction',
                name: 'Risk Reduction',
                value: 87.3,
                change: -1.2,
                trend: 'down',
                format: 'percentage'
            },
            {
                id: 'processing_time',
                name: 'Avg Processing Time',
                value: 24.5,
                change: -15.8,
                trend: 'up',
                format: 'time'
            },
            {
                id: 'cornell_validations',
                name: 'Cornell Validations',
                value: 1893,
                change: 18.7,
                trend: 'up',
                format: 'number'
            },
            {
                id: 'cost_savings',
                name: 'Cost Savings',
                value: 284750,
                change: 23.4,
                trend: 'up',
                format: 'currency'
            }
        ];
        setMetrics(mockMetrics);
    };

    const loadReports = () => {
        const mockReports: ComplianceReport[] = [
            {
                id: 'ucc_compliance',
                title: 'UCC Article 3 Compliance',
                status: 'compliant',
                score: 96.2,
                lastUpdated: '2024-01-15',
                jurisdiction: 'Federal',
                framework: 'Uniform Commercial Code',
                recommendations: [
                    'Maintain current endorsement procedures',
                    'Update signature verification protocols',
                    'Enhanced digital certificate management'
                ]
            },
            {
                id: 'cfr_compliance',
                title: 'CFR Title 12 Banking',
                status: 'warning',
                score: 78.5,
                lastUpdated: '2024-01-14',
                jurisdiction: 'Federal',
                framework: 'Code of Federal Regulations',
                recommendations: [
                    'Update customer identification procedures',
                    'Strengthen anti-money laundering controls',
                    'Implement enhanced due diligence'
                ]
            },
            {
                id: 'state_compliance',
                title: 'State Commercial Paper Law',
                status: 'compliant',
                score: 91.8,
                lastUpdated: '2024-01-15',
                jurisdiction: 'Multi-State',
                framework: 'State Commercial Codes',
                recommendations: [
                    'Monitor interstate commerce regulations',
                    'Update cross-border processing protocols'
                ]
            },
            {
                id: 'international_compliance',
                title: 'International Bills of Exchange',
                status: 'critical',
                score: 64.3,
                lastUpdated: '2024-01-13',
                jurisdiction: 'International',
                framework: 'Geneva Convention',
                recommendations: [
                    'Urgent: Update international processing procedures',
                    'Implement multi-currency validation',
                    'Strengthen cross-border documentation'
                ]
            }
        ];
        setReports(mockReports);
    };

    const loadTrends = () => {
        const mockTrends: LegalTrend[] = [
            { period: 'Week 1', casesProcessed: 387, complianceScore: 92.1, riskLevel: 8.7, cornellValidations: 245 },
            { period: 'Week 2', casesProcessed: 423, complianceScore: 93.4, riskLevel: 7.9, cornellValidations: 289 },
            { period: 'Week 3', casesProcessed: 391, complianceScore: 94.2, riskLevel: 6.8, cornellValidations: 267 },
            { period: 'Week 4', casesProcessed: 456, complianceScore: 94.8, riskLevel: 6.2, cornellValidations: 312 }
        ];
        setTrends(mockTrends);
    };

    const loadInsights = () => {
        const mockInsights: ExecutiveInsight[] = [
            {
                id: 'compliance_improvement',
                title: 'Compliance Score Improvement',
                summary: 'Overall compliance has increased by 2.1% this month, driven by enhanced Cornell legal framework integration.',
                priority: 'medium',
                category: 'compliance',
                impact: 'Reduced regulatory risk by 15% and potential fines by $125,000',
                recommendation: 'Continue current compliance enhancement initiatives and expand to international frameworks',
                cornellReference: 'UCC Article 3, Section 3-104'
            },
            {
                id: 'risk_pattern',
                title: 'Risk Pattern Analysis',
                summary: 'Identified recurring risk patterns in international bill processing that require immediate attention.',
                priority: 'high',
                category: 'risk',
                impact: 'Potential exposure of $500,000 in international transactions',
                recommendation: 'Implement enhanced due diligence protocols for cross-border transactions',
                cornellReference: 'Geneva Convention on Bills of Exchange'
            },
            {
                id: 'efficiency_gains',
                title: 'Processing Efficiency Gains',
                summary: 'AI-powered analysis has reduced average processing time by 15.8% while maintaining quality standards.',
                priority: 'medium',
                category: 'efficiency',
                impact: 'Cost savings of $47,500 per month in operational expenses',
                recommendation: 'Scale AI implementation to additional document types and jurisdictions'
            },
            {
                id: 'quality_metrics',
                title: 'Document Quality Enhancement',
                summary: 'Cornell legal validation has improved document accuracy by 18.7% with fewer processing errors.',
                priority: 'low',
                category: 'quality',
                impact: 'Reduced error correction costs by $23,000 and improved client satisfaction',
                recommendation: 'Expand Cornell integration to cover additional legal frameworks and precedents'
            }
        ];
        setInsights(mockInsights);
    };

    const formatValue = (value: number, format: string) => {
        switch (format) {
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'currency':
                return `$${value.toLocaleString()}`;
            case 'time':
                return `${value.toFixed(1)}h`;
            default:
                return value.toLocaleString();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'compliant':
                return '#10b981';
            case 'warning':
                return '#f59e0b';
            case 'critical':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return '#ef4444';
            case 'medium':
                return '#f59e0b';
            case 'low':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    const renderOverview = () => (
        <div className="overview-content">
            <div className="metrics-grid">
                {metrics.map((metric) => (
                    <div key={metric.id} className="metric-card">
                        <div className="metric-header">
                            <span className="metric-name">{metric.name}</span>
                            <div className={`trend-indicator ${metric.trend}`}>
                                <TrendingUp size={16} />
                                <span>{metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="metric-value">
                            {formatValue(metric.value, metric.format)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="overview-charts">
                <div className="chart-section">
                    <h3>Compliance Trends</h3>
                    <div className="trend-chart">
                        {trends.map((trend, index) => (
                            <div key={index} className="trend-item">
                                <div className="trend-period">{trend.period}</div>
                                <div className="trend-bars">
                                    <div className="trend-bar">
                                        <span>Compliance</span>
                                        <div className="bar-container">
                                            <div 
                                                className="bar-fill compliance"
                                                style={{ width: `${trend.complianceScore}%` }}
                                            />
                                        </div>
                                        <span>{trend.complianceScore.toFixed(1)}%</span>
                                    </div>
                                    <div className="trend-bar">
                                        <span>Risk Level</span>
                                        <div className="bar-container">
                                            <div 
                                                className="bar-fill risk"
                                                style={{ width: `${trend.riskLevel * 10}%` }}
                                            />
                                        </div>
                                        <span>{trend.riskLevel.toFixed(1)}/10</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-section">
                    <h3>Cornell Legal Integration</h3>
                    <div className="cornell-metrics">
                        <div className="cornell-stat">
                            <BookOpen size={32} />
                            <div className="stat-details">
                                <span className="stat-value">1,893</span>
                                <span className="stat-label">Legal Validations</span>
                            </div>
                        </div>
                        <div className="cornell-stat">
                            <Scale size={32} />
                            <div className="stat-details">
                                <span className="stat-value">96.2%</span>
                                <span className="stat-label">Accuracy Rate</span>
                            </div>
                        </div>
                        <div className="cornell-stat">
                            <Gavel size={32} />
                            <div className="stat-details">
                                <span className="stat-value">247</span>
                                <span className="stat-label">Legal Precedents</span>
                            </div>
                        </div>
                        <div className="cornell-stat">
                            <Award size={32} />
                            <div className="stat-details">
                                <span className="stat-value">99.1%</span>
                                <span className="stat-label">Compliance Rate</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="reports-content">
            <div className="reports-header">
                <h3>Compliance Reports</h3>
                <div className="report-filters">
                    <select 
                        value={selectedJurisdiction} 
                        onChange={(e) => setSelectedJurisdiction(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Jurisdictions</option>
                        <option value="federal">Federal</option>
                        <option value="state">State</option>
                        <option value="international">International</option>
                    </select>
                    <button className="action-btn">
                        <Download size={16} />
                        Export Reports
                    </button>
                </div>
            </div>

            <div className="reports-list">
                {reports.map((report) => (
                    <div key={report.id} className="report-card">
                        <div className="report-header">
                            <div className="report-info">
                                <h4>{report.title}</h4>
                                <div className="report-badges">
                                    <span className="jurisdiction-badge">{report.jurisdiction}</span>
                                    <span className="framework-badge">{report.framework}</span>
                                </div>
                            </div>
                            <div className="report-status">
                                <div 
                                    className="status-indicator"
                                    style={{ backgroundColor: getStatusColor(report.status) }}
                                >
                                    {report.status === 'compliant' && <CheckCircle size={20} />}
                                    {report.status === 'warning' && <AlertCircle size={20} />}
                                    {report.status === 'critical' && <XCircle size={20} />}
                                    <span>{report.status.toUpperCase()}</span>
                                </div>
                                <div className="compliance-score">
                                    <span className="score-value">{report.score.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="report-details">
                            <div className="detail-row">
                                <span className="detail-label">Last Updated:</span>
                                <span className="detail-value">{report.lastUpdated}</span>
                            </div>
                            <div className="recommendations">
                                <h5>Recommendations:</h5>
                                <ul>
                                    {report.recommendations.map((rec, index) => (
                                        <li key={index}>{rec}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        
                        <div className="report-actions">
                            <button className="action-btn">
                                <Eye size={16} />
                                View Details
                            </button>
                            <button className="action-btn">
                                <Download size={16} />
                                Export
                            </button>
                            <button className="action-btn">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTrends = () => (
        <div className="trends-content">
            <div className="trends-header">
                <h3>Legal Intelligence Trends</h3>
                <div className="trend-controls">
                    <div className="period-selector">
                        {['7d', '30d', '90d', '1y'].map((period) => (
                            <button
                                key={period}
                                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                                onClick={() => setSelectedPeriod(period as any)}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="trends-grid">
                <div className="trend-card">
                    <div className="card-header">
                        <FileText size={24} />
                        <h4>Document Processing Volume</h4>
                    </div>
                    <div className="trend-visualization">
                        <div className="trend-line-chart">
                            {trends.map((trend, index) => (
                                <div key={index} className="chart-point">
                                    <div 
                                        className="point-bar"
                                        style={{ height: `${(trend.casesProcessed / 500) * 100}%` }}
                                    />
                                    <span className="point-label">{trend.period}</span>
                                    <span className="point-value">{trend.casesProcessed}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="trend-card">
                    <div className="card-header">
                        <Shield size={24} />
                        <h4>Compliance Performance</h4>
                    </div>
                    <div className="compliance-trends">
                        {trends.map((trend, index) => (
                            <div key={index} className="compliance-item">
                                <div className="compliance-period">{trend.period}</div>
                                <div className="compliance-metrics">
                                    <div className="metric">
                                        <span>Score</span>
                                        <span className="metric-value">{trend.complianceScore.toFixed(1)}%</span>
                                    </div>
                                    <div className="metric">
                                        <span>Risk</span>
                                        <span className="metric-value">{trend.riskLevel.toFixed(1)}</span>
                                    </div>
                                    <div className="metric">
                                        <span>Cornell</span>
                                        <span className="metric-value">{trend.cornellValidations}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="trend-card full-width">
                    <div className="card-header">
                        <Activity size={24} />
                        <h4>Legal Intelligence Insights</h4>
                    </div>
                    <div className="insights-summary">
                        <div className="insight-metric">
                            <div className="metric-icon compliance">
                                <CheckCircle size={20} />
                            </div>
                            <div className="metric-info">
                                <span className="metric-title">Compliance Improvement</span>
                                <span className="metric-description">2.1% increase in overall compliance score</span>
                            </div>
                        </div>
                        <div className="insight-metric">
                            <div className="metric-icon risk">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="metric-info">
                                <span className="metric-title">Risk Reduction</span>
                                <span className="metric-description">15% reduction in regulatory exposure</span>
                            </div>
                        </div>
                        <div className="insight-metric">
                            <div className="metric-icon efficiency">
                                <Clock size={20} />
                            </div>
                            <div className="metric-info">
                                <span className="metric-title">Efficiency Gains</span>
                                <span className="metric-description">15.8% faster processing times achieved</span>
                            </div>
                        </div>
                        <div className="insight-metric">
                            <div className="metric-icon cornell">
                                <Star size={20} />
                            </div>
                            <div className="metric-info">
                                <span className="metric-title">Cornell Integration</span>
                                <span className="metric-description">18.7% improvement in legal accuracy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInsights = () => (
        <div className="insights-content">
            <div className="insights-header">
                <h3>Executive Insights & Recommendations</h3>
                <div className="insight-filters">
                    <button className="filter-btn active">All</button>
                    <button className="filter-btn">High Priority</button>
                    <button className="filter-btn">Compliance</button>
                    <button className="filter-btn">Risk</button>
                </div>
            </div>

            <div className="insights-list">
                {insights.map((insight) => (
                    <div key={insight.id} className="insight-card">
                        <div className="insight-header">
                            <div className="insight-info">
                                <div className="insight-title-row">
                                    <h4>{insight.title}</h4>
                                    <div className="insight-badges">
                                        <span 
                                            className="priority-badge"
                                            style={{ backgroundColor: getPriorityColor(insight.priority) }}
                                        >
                                            {insight.priority.toUpperCase()}
                                        </span>
                                        <span className="category-badge">{insight.category}</span>
                                    </div>
                                </div>
                                <p className="insight-summary">{insight.summary}</p>
                            </div>
                        </div>

                        <div className="insight-details">
                            <div className="detail-section">
                                <h5>Business Impact</h5>
                                <p>{insight.impact}</p>
                            </div>
                            <div className="detail-section">
                                <h5>Recommended Action</h5>
                                <p>{insight.recommendation}</p>
                            </div>
                            {insight.cornellReference && (
                                <div className="detail-section cornell-section">
                                    <h5>Cornell Legal Reference</h5>
                                    <div className="cornell-reference">
                                        <BookOpen size={16} />
                                        <span>{insight.cornellReference}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="insight-actions">
                            <button className="action-btn primary">
                                <Target size={16} />
                                Implement
                            </button>
                            <button className="action-btn">
                                <FileText size={16} />
                                Generate Report
                            </button>
                            <button className="action-btn">
                                <Users size={16} />
                                Assign Task
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderExport = () => (
        <div className="export-content">
            <div className="export-header">
                <h3>Export Legal Intelligence Reports</h3>
                <p>Generate comprehensive reports for stakeholders and regulatory authorities</p>
            </div>

            <div className="export-options">
                <div className="export-section">
                    <h4>Report Types</h4>
                    <div className="export-grid">
                        <div className="export-card">
                            <div className="export-icon">
                                <BarChart3 size={32} />
                            </div>
                            <h5>Executive Dashboard</h5>
                            <p>High-level metrics and KPIs for leadership</p>
                            <div className="export-formats">
                                <button className="format-btn">PDF</button>
                                <button className="format-btn">Excel</button>
                                <button className="format-btn">PowerPoint</button>
                            </div>
                        </div>

                        <div className="export-card">
                            <div className="export-icon">
                                <Shield size={32} />
                            </div>
                            <h5>Compliance Report</h5>
                            <p>Detailed compliance status and recommendations</p>
                            <div className="export-formats">
                                <button className="format-btn">PDF</button>
                                <button className="format-btn">Word</button>
                                <button className="format-btn">JSON</button>
                            </div>
                        </div>

                        <div className="export-card">
                            <div className="export-icon">
                                <AlertTriangle size={32} />
                            </div>
                            <h5>Risk Assessment</h5>
                            <p>Risk analysis and mitigation strategies</p>
                            <div className="export-formats">
                                <button className="format-btn">PDF</button>
                                <button className="format-btn">Excel</button>
                                <button className="format-btn">CSV</button>
                            </div>
                        </div>

                        <div className="export-card">
                            <div className="export-icon">
                                <BookOpen size={32} />
                            </div>
                            <h5>Cornell Legal Analysis</h5>
                            <p>Legal framework validation and references</p>
                            <div className="export-formats">
                                <button className="format-btn">PDF</button>
                                <button className="format-btn">Word</button>
                                <button className="format-btn">HTML</button>
                            </div>
                        </div>

                        <div className="export-card">
                            <div className="export-icon">
                                <TrendingUp size={32} />
                            </div>
                            <h5>Performance Analytics</h5>
                            <p>Operational metrics and trend analysis</p>
                            <div className="export-formats">
                                <button className="format-btn">Excel</button>
                                <button className="format-btn">CSV</button>
                                <button className="format-btn">Tableau</button>
                            </div>
                        </div>

                        <div className="export-card">
                            <div className="export-icon">
                                <Globe size={32} />
                            </div>
                            <h5>Regulatory Filing</h5>
                            <p>Formatted reports for regulatory submission</p>
                            <div className="export-formats">
                                <button className="format-btn">XML</button>
                                <button className="format-btn">XBRL</button>
                                <button className="format-btn">PDF</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="export-section">
                    <h4>Custom Report Builder</h4>
                    <div className="report-builder">
                        <div className="builder-controls">
                            <div className="control-group">
                                <label>Report Title</label>
                                <input type="text" placeholder="Enter report title..." />
                            </div>
                            <div className="control-group">
                                <label>Date Range</label>
                                <div className="date-range">
                                    <input type="date" />
                                    <span>to</span>
                                    <input type="date" />
                                </div>
                            </div>
                            <div className="control-group">
                                <label>Include Sections</label>
                                <div className="section-checkboxes">
                                    <label><input type="checkbox" defaultChecked /> Executive Summary</label>
                                    <label><input type="checkbox" defaultChecked /> Compliance Metrics</label>
                                    <label><input type="checkbox" defaultChecked /> Risk Analysis</label>
                                    <label><input type="checkbox" defaultChecked /> Cornell Validations</label>
                                    <label><input type="checkbox" /> Detailed Logs</label>
                                    <label><input type="checkbox" /> Recommendations</label>
                                </div>
                            </div>
                        </div>
                        <div className="builder-preview">
                            <h5>Report Preview</h5>
                            <div className="preview-content">
                                <div className="preview-section">Executive Summary</div>
                                <div className="preview-section">Key Metrics Dashboard</div>
                                <div className="preview-section">Compliance Status</div>
                                <div className="preview-section">Risk Assessment</div>
                                <div className="preview-section">Cornell Legal Analysis</div>
                                <div className="preview-section">Recommendations</div>
                            </div>
                            <button className="generate-btn">
                                <Download size={16} />
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="legal-intelligence-reporting">
            {/* Header */}
            <div className="intelligence-header">
                <div className="header-content">
                    <div className="header-icon">
                        <BarChart3 size={32} />
                    </div>
                    <div>
                        <h1>Legal Intelligence Reporting</h1>
                        <p>Comprehensive legal analytics, compliance monitoring, and executive insights powered by Cornell Law School knowledge</p>
                    </div>
                </div>
                <div className="intelligence-stats">
                    <div className="stat-item">
                        <span className="stat-value">94.8%</span>
                        <span className="stat-label">Compliance Score</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">2,847</span>
                        <span className="stat-label">Documents</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">$284k</span>
                        <span className="stat-label">Savings</span>
                    </div>
                </div>
            </div>

            {/* Intelligence Tabs */}
            <div className="intelligence-tabs">
                <div className="tab-nav">
                    <button 
                        className={`tab-button ${activeView === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveView('overview')}
                    >
                        <BarChart3 size={20} />
                        Overview
                    </button>
                    <button 
                        className={`tab-button ${activeView === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveView('reports')}
                    >
                        <FileText size={20} />
                        Reports
                    </button>
                    <button 
                        className={`tab-button ${activeView === 'trends' ? 'active' : ''}`}
                        onClick={() => setActiveView('trends')}
                    >
                        <TrendingUp size={20} />
                        Trends
                    </button>
                    <button 
                        className={`tab-button ${activeView === 'insights' ? 'active' : ''}`}
                        onClick={() => setActiveView('insights')}
                    >
                        <Target size={20} />
                        Insights
                    </button>
                    <button 
                        className={`tab-button ${activeView === 'export' ? 'active' : ''}`}
                        onClick={() => setActiveView('export')}
                    >
                        <Download size={20} />
                        Export
                    </button>
                </div>

                <div className="tab-content">
                    {activeView === 'overview' && renderOverview()}
                    {activeView === 'reports' && renderReports()}
                    {activeView === 'trends' && renderTrends()}
                    {activeView === 'insights' && renderInsights()}
                    {activeView === 'export' && renderExport()}
                </div>
            </div>
        </div>
    );
};

export default LegalIntelligenceReporting;