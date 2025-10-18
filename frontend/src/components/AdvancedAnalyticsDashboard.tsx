import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  FileText, Scale, Clock, Target
} from 'lucide-react'

interface AnalyticsData {
  documentProcessing: Array<{
    date: string
    processed: number
    compliant: number
    flagged: number
  }>
  complianceMetrics: {
    overallScore: number
    trend: number
    criticalIssues: number
    resolvedIssues: number
  }
  legalUsage: Array<{
    category: string
    usage: number
    accuracy: number
    color: string
  }>
  riskAssessment: Array<{
    risk: string
    level: number
    trend: 'up' | 'down' | 'stable'
    category: 'high' | 'medium' | 'low'
  }>
  performanceMetrics: {
    avgProcessingTime: number
    successRate: number
    userSatisfaction: number
    cornellAccuracy: number
  }
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalytics = async () => {
      setLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate mock data based on time range
      const mockData: AnalyticsData = {
        documentProcessing: generateProcessingData(selectedTimeRange),
        complianceMetrics: {
          overallScore: 87.3,
          trend: 5.2,
          criticalIssues: 3,
          resolvedIssues: 47
        },
        legalUsage: [
          { category: 'UCC Article 3', usage: 342, accuracy: 94.2, color: '#8884d8' },
          { category: 'Contract Analysis', usage: 198, accuracy: 91.7, color: '#82ca9d' },
          { category: 'Compliance Check', usage: 156, accuracy: 96.1, color: '#ffc658' },
          { category: 'Risk Assessment', usage: 89, accuracy: 89.3, color: '#ff7c7c' },
          { category: 'Legal Research', usage: 134, accuracy: 92.8, color: '#8dd1e1' }
        ],
        riskAssessment: [
          { risk: 'Non-compliance Documentation', level: 23, trend: 'down', category: 'medium' },
          { risk: 'Incomplete Legal Filings', level: 12, trend: 'up', category: 'high' },
          { risk: 'Missing Cornell Citations', level: 8, trend: 'stable', category: 'low' },
          { risk: 'Regulatory Changes', level: 18, trend: 'up', category: 'medium' },
          { risk: 'Process Violations', level: 5, trend: 'down', category: 'low' }
        ],
        performanceMetrics: {
          avgProcessingTime: 2.4,
          successRate: 94.7,
          userSatisfaction: 4.6,
          cornellAccuracy: 96.2
        }
      }
      
      setAnalyticsData(mockData)
      setLoading(false)
    }

    loadAnalytics()
  }, [selectedTimeRange])

  const generateProcessingData = (timeRange: string) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const processed = Math.floor(Math.random() * 50) + 20
      const compliant = Math.floor(processed * (0.8 + Math.random() * 0.15))
      const flagged = processed - compliant
      
      data.push({
        date: date.toISOString().split('T')[0],
        processed,
        compliant,
        flagged
      })
    }
    
    return data
  }

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Analytics Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="analytics-dashboard error">
        <AlertTriangle className="error-icon" />
        <p>Failed to load analytics data</p>
      </div>
    )
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="trend-up" size={16} />
    if (trend < 0) return <TrendingDown className="trend-down" size={16} />
    return <div className="trend-stable" />
  }

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  return (
    <div className="analytics-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Advanced Analytics Dashboard</h1>
          <p>Comprehensive insights into legal compliance and document processing</p>
        </div>
        
        <div className="dashboard-controls">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <FileText className="kpi-icon" />
            <span className="kpi-label">Processing Success Rate</span>
          </div>
          <div className="kpi-value">{analyticsData.performanceMetrics.successRate}%</div>
          <div className="kpi-trend">
            {getTrendIcon(5.2)}
            <span>+5.2% from last period</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <Scale className="kpi-icon" />
            <span className="kpi-label">Compliance Score</span>
          </div>
          <div className="kpi-value">{analyticsData.complianceMetrics.overallScore}%</div>
          <div className="kpi-trend">
            {getTrendIcon(analyticsData.complianceMetrics.trend)}
            <span>+{analyticsData.complianceMetrics.trend}% improvement</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <Clock className="kpi-icon" />
            <span className="kpi-label">Avg Processing Time</span>
          </div>
          <div className="kpi-value">{analyticsData.performanceMetrics.avgProcessingTime}min</div>
          <div className="kpi-trend">
            {getTrendIcon(-12.3)}
            <span>-12.3% faster processing</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <Target className="kpi-icon" />
            <span className="kpi-label">Cornell Legal Accuracy</span>
          </div>
          <div className="kpi-value">{analyticsData.performanceMetrics.cornellAccuracy}%</div>
          <div className="kpi-trend">
            {getTrendIcon(2.1)}
            <span>+2.1% accuracy improvement</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Document Processing Trends */}
        <div className="chart-container large">
          <div className="chart-header">
            <h3>Document Processing Trends</h3>
            <p>Daily processing volume and compliance rates</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.documentProcessing}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="compliant" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                name="Compliant Documents"
              />
              <Area 
                type="monotone" 
                dataKey="flagged" 
                stackId="1" 
                stroke="#ef4444" 
                fill="#ef4444" 
                name="Flagged Documents"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cornell Legal Usage */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3>Cornell Legal Knowledge Usage</h3>
            <p>Most accessed legal categories</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.legalUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="usage"
              >
                {analyticsData.legalUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Assessment */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3>Legal Risk Assessment</h3>
            <p>Current risk factors and trends</p>
          </div>
          <div className="risk-list">
            {analyticsData.riskAssessment.map((risk, index) => (
              <div key={index} className="risk-item">
                <div className="risk-info">
                  <span className="risk-name">{risk.risk}</span>
                  <div className="risk-level">
                    <div 
                      className="risk-bar" 
                      style={{ 
                        width: `${risk.level * 2}%`, 
                        backgroundColor: getRiskColor(risk.category) 
                      }}
                    />
                    <span className="risk-value">{risk.level}</span>
                  </div>
                </div>
                <div className="risk-trend">
                  {risk.trend === 'up' && <TrendingUp size={16} className="trend-up" />}
                  {risk.trend === 'down' && <TrendingDown size={16} className="trend-down" />}
                  {risk.trend === 'stable' && <div className="trend-stable" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Metrics */}
        <div className="chart-container large">
          <div className="chart-header">
            <h3>Legal Compliance Accuracy by Category</h3>
            <p>Cornell Legal framework accuracy across different legal areas</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.legalUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="insights-section">
        <div className="insights-header">
          <h3>AI-Powered Insights & Recommendations</h3>
        </div>
        
        <div className="insights-grid">
          <div className="insight-card positive">
            <CheckCircle className="insight-icon" />
            <div className="insight-content">
              <h4>Excellent Cornell Legal Accuracy</h4>
              <p>Cornell Legal Knowledge integration shows 96.2% accuracy, exceeding industry standards.</p>
            </div>
          </div>
          
          <div className="insight-card warning">
            <AlertTriangle className="insight-icon" />
            <div className="insight-content">
              <h4>Increasing Regulatory Risk</h4>
              <p>Monitor incomplete legal filings trend. Consider automated compliance checks.</p>
            </div>
          </div>
          
          <div className="insight-card info">
            <TrendingUp className="insight-icon" />
            <div className="insight-content">
              <h4>Processing Efficiency Gains</h4>
              <p>Document processing speed improved 12.3%. UCC Article 3 queries show highest usage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedAnalyticsDashboard