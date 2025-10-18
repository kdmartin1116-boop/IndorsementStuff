import React, { useState, useRef, useCallback } from 'react'
import { 
  Brain, FileText, CheckCircle, 
  Zap, Target, BookOpen, Shield, Gavel,
  Upload, Download, Eye, Clock
} from 'lucide-react'

interface LegalClause {
  id: string
  type: 'liability' | 'payment' | 'termination' | 'compliance' | 'warranty' | 'indemnification'
  content: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  suggestions: string[]
  cornellReference: string
  position: { start: number; end: number }
}

interface ComplianceIssue {
  id: string
  category: 'UCC' | 'Contract Law' | 'Commercial Law' | 'Regulatory'
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  recommendation: string
  cornellCitation: string
  autoFixAvailable: boolean
}

interface AIAnalysisResult {
  documentType: string
  confidence: number
  overallRiskScore: number
  clauses: LegalClause[]
  complianceIssues: ComplianceIssue[]
  keyInsights: string[]
  cornellRecommendations: string[]
  processingTime: number
}

const AILegalAnalysis: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [documentText, setDocumentText] = useState('')
  const [selectedClause, setSelectedClause] = useState<LegalClause | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisResult[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const simulateAIAnalysis = useCallback(async (text: string): Promise<AIAnalysisResult> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

    const mockResult: AIAnalysisResult = {
      documentType: detectDocumentType(text),
      confidence: 92.5 + Math.random() * 7,
      overallRiskScore: Math.floor(Math.random() * 30) + 15, // 15-45 risk score
      clauses: generateMockClauses(text),
      complianceIssues: generateMockComplianceIssues(),
      keyInsights: generateKeyInsights(text),
      cornellRecommendations: generateCornellRecommendations(),
      processingTime: 1.2 + Math.random() * 2.5
    }

    return mockResult
  }, [])

  const detectDocumentType = (text: string): string => {
    const lowerText = text.toLowerCase()
    if (lowerText.includes('promissory note') || lowerText.includes('bill of exchange')) {
      return 'Negotiable Instrument'
    } else if (lowerText.includes('contract') || lowerText.includes('agreement')) {
      return 'Commercial Contract'
    } else if (lowerText.includes('affidavit') || lowerText.includes('sworn statement')) {
      return 'Legal Affidavit'
    }
    return 'Legal Document'
  }

  const generateMockClauses = (_text: string): LegalClause[] => {
    const clauses: LegalClause[] = [
      {
        id: '1',
        type: 'payment',
        content: 'Payment terms and conditions as specified in UCC Article 3',
        riskLevel: 'low',
        confidence: 94.2,
        suggestions: ['Consider adding late payment penalties', 'Specify currency denomination'],
        cornellReference: 'Cornell Legal Information Institute - UCC § 3-104',
        position: { start: 120, end: 280 }
      },
      {
        id: '2',
        type: 'liability',
        content: 'Limitation of liability clause may be unenforceable',
        riskLevel: 'high',
        confidence: 87.6,
        suggestions: ['Revise liability caps', 'Add mutual indemnification', 'Consider state law limitations'],
        cornellReference: 'Cornell Legal Information Institute - Contract Law Principles',
        position: { start: 450, end: 620 }
      },
      {
        id: '3',
        type: 'compliance',
        content: 'Regulatory compliance requirements identified',
        riskLevel: 'medium',
        confidence: 91.3,
        suggestions: ['Update to current regulations', 'Add compliance monitoring clauses'],
        cornellReference: 'Cornell Legal Information Institute - Commercial Law Standards',
        position: { start: 800, end: 950 }
      }
    ]

    return clauses
  }

  const generateMockComplianceIssues = (): ComplianceIssue[] => {
    return [
      {
        id: '1',
        category: 'UCC',
        severity: 'warning',
        message: 'Missing required UCC Article 3 negotiability requirements',
        recommendation: 'Add "payable to bearer or order" language for negotiability',
        cornellCitation: 'UCC § 3-104(a)(1) - Requirements of Negotiable Instrument',
        autoFixAvailable: true
      },
      {
        id: '2',
        category: 'Contract Law',
        severity: 'error',
        message: 'Consideration clause may be insufficient under common law',
        recommendation: 'Specify mutual consideration and performance obligations',
        cornellCitation: 'Restatement (Second) of Contracts § 71',
        autoFixAvailable: false
      },
      {
        id: '3',
        category: 'Commercial Law',
        severity: 'info',
        message: 'Document follows best practices for commercial transactions',
        recommendation: 'Consider adding choice of law and jurisdiction clauses',
        cornellCitation: 'Commercial Law Principles - Cornell Legal Information Institute',
        autoFixAvailable: true
      }
    ]
  }

  const generateKeyInsights = (_text: string): string[] => {
    return [
      'Document demonstrates strong legal structure with 94.2% compliance confidence',
      'Cornell Legal Framework analysis identifies 3 potential optimization areas',
      'UCC Article 3 compliance detected with minor enhancement opportunities',
      'Risk assessment indicates medium-level legal exposure requiring attention',
      'AI confidence in document classification: 96.8% accuracy rate'
    ]
  }

  const generateCornellRecommendations = (): string[] => {
    return [
      'Review UCC § 3-104 requirements for enhanced negotiability',
      'Consider Cornell Legal precedents for liability limitation clauses',
      'Implement Cornell-recommended compliance monitoring procedures',
      'Add Cornell Legal Information Institute citation references',
      'Follow Cornell best practices for commercial document structure'
    ]
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setDocumentText(text)
    }
    reader.readAsText(file)
  }

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      alert('Please enter document text or upload a file to analyze')
      return
    }

    setAnalyzing(true)
    setSelectedClause(null)

    try {
      const result = await simulateAIAnalysis(documentText)
      setAnalysisResult(result)
      setAnalysisHistory(prev => [result, ...prev.slice(0, 4)]) // Keep last 5 analyses
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleClauseSelect = (clause: LegalClause) => {
    setSelectedClause(selectedClause?.id === clause.id ? null : clause)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#ef4444'
      case 'critical': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return '#3b82f6'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      case 'critical': return '#dc2626'
      default: return '#6b7280'
    }
  }

  return (
    <div className="ai-legal-analysis">
      <div className="analysis-header">
        <div className="header-content">
          <div className="header-icon">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h1>AI-Powered Legal Analysis</h1>
            <p>Advanced document analysis with Cornell Legal Framework integration</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-header">
          <h2>Document Input</h2>
          <div className="input-controls">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          placeholder="Paste your legal document text here or upload a file..."
          className="document-input"
          rows={8}
        />

        <div className="analyze-section">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !documentText.trim()}
            className="analyze-btn"
          >
            {analyzing ? (
              <>
                <div className="analyzing-spinner" />
                Analyzing with Cornell AI...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Analyze Document
              </>
            )}
          </button>
          
          {analyzing && (
            <div className="analysis-progress">
              <div className="progress-steps">
                <div className="progress-step active">
                  <Brain className="w-4 h-4" />
                  <span>AI Processing</span>
                </div>
                <div className="progress-step active">
                  <BookOpen className="w-4 h-4" />
                  <span>Cornell Legal Analysis</span>
                </div>
                <div className="progress-step active">
                  <Shield className="w-4 h-4" />
                  <span>Risk Assessment</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {analysisResult && (
        <div className="results-section">
          {/* Overview Cards */}
          <div className="overview-cards">
            <div className="overview-card">
              <div className="card-icon document-type">
                <FileText className="w-6 h-6" />
              </div>
              <div className="card-content">
                <h3>{analysisResult.documentType}</h3>
                <p>{analysisResult.confidence.toFixed(1)}% confidence</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon risk-score">
                <Target className="w-6 h-6" />
              </div>
              <div className="card-content">
                <h3>Risk Score: {analysisResult.overallRiskScore}/100</h3>
                <p>
                  {analysisResult.overallRiskScore <= 20 ? 'Low Risk' :
                   analysisResult.overallRiskScore <= 40 ? 'Medium Risk' : 'High Risk'}
                </p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon processing-time">
                <Clock className="w-6 h-6" />
              </div>
              <div className="card-content">
                <h3>{analysisResult.processingTime.toFixed(1)}s</h3>
                <p>Processing time</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon clauses-found">
                <Gavel className="w-6 h-6" />
              </div>
              <div className="card-content">
                <h3>{analysisResult.clauses.length} Clauses</h3>
                <p>Legal elements identified</p>
              </div>
            </div>
          </div>

          {/* Legal Clauses */}
          <div className="clauses-section">
            <h2>Legal Clause Analysis</h2>
            <div className="clauses-grid">
              {analysisResult.clauses.map((clause) => (
                <div
                  key={clause.id}
                  className={`clause-card ${selectedClause?.id === clause.id ? 'selected' : ''}`}
                  onClick={() => handleClauseSelect(clause)}
                  style={{ borderLeftColor: getRiskColor(clause.riskLevel) }}
                >
                  <div className="clause-header">
                    <div className="clause-type">{clause.type.toUpperCase()}</div>
                    <div 
                      className="risk-badge"
                      style={{ backgroundColor: getRiskColor(clause.riskLevel) }}
                    >
                      {clause.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  <div className="clause-content">
                    <p>{clause.content}</p>
                    <div className="clause-confidence">
                      AI Confidence: {clause.confidence.toFixed(1)}%
                    </div>
                  </div>
                  {selectedClause?.id === clause.id && (
                    <div className="clause-details">
                      <div className="suggestions">
                        <h4>Suggestions:</h4>
                        <ul>
                          {clause.suggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="cornell-reference">
                        <h4>Cornell Reference:</h4>
                        <p>{clause.cornellReference}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Issues */}
          <div className="compliance-section">
            <h2>Compliance Analysis</h2>
            <div className="compliance-issues">
              {analysisResult.complianceIssues.map((issue) => (
                <div key={issue.id} className="compliance-issue">
                  <div className="issue-header">
                    <div 
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(issue.severity) }}
                    >
                      {issue.severity.toUpperCase()}
                    </div>
                    <div className="issue-category">{issue.category}</div>
                    {issue.autoFixAvailable && (
                      <div className="auto-fix-badge">
                        <CheckCircle className="w-4 h-4" />
                        Auto-fix available
                      </div>
                    )}
                  </div>
                  <div className="issue-content">
                    <h4>{issue.message}</h4>
                    <p><strong>Recommendation:</strong> {issue.recommendation}</p>
                    <p><strong>Cornell Citation:</strong> {issue.cornellCitation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="insights-section">
            <div className="insights-grid">
              <div className="insights-card">
                <h3>Key Insights</h3>
                <ul>
                  {analysisResult.keyInsights.map((insight, idx) => (
                    <li key={idx}>
                      <CheckCircle className="w-4 h-4 insight-icon" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="recommendations-card">
                <h3>Cornell Recommendations</h3>
                <ul>
                  {analysisResult.cornellRecommendations.map((recommendation, idx) => (
                    <li key={idx}>
                      <BookOpen className="w-4 h-4 recommendation-icon" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="export-section">
            <h2>Export Analysis</h2>
            <div className="export-options">
              <button className="export-btn">
                <Download className="w-4 h-4" />
                Export PDF Report
              </button>
              <button className="export-btn">
                <FileText className="w-4 h-4" />
                Export JSON Data
              </button>
              <button className="export-btn">
                <Eye className="w-4 h-4" />
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <div className="history-section">
          <h2>Recent Analyses</h2>
          <div className="history-list">
            {analysisHistory.map((analysis, idx) => (
              <div key={idx} className="history-item">
                <div className="history-info">
                  <h4>{analysis.documentType}</h4>
                  <p>Risk Score: {analysis.overallRiskScore}/100</p>
                </div>
                <div className="history-stats">
                  <span>{analysis.clauses.length} clauses</span>
                  <span>{analysis.complianceIssues.length} issues</span>
                </div>
                <button 
                  className="history-reload"
                  onClick={() => setAnalysisResult(analysis)}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AILegalAnalysis