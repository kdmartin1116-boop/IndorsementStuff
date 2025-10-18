// ===========================================
// SECURITY DASHBOARD
// Enterprise Security Monitoring & Management
// ===========================================

import React, { useState, useEffect, useCallback } from 'react';
import { securityMonitor } from '../services/security/SecurityMonitor';
import { vulnerabilityScanner } from '../services/security/VulnerabilityScanner';
import { complianceManager } from '../services/security/ComplianceManager';

interface SecurityDashboardState {
  securityEvents: any[];
  vulnerabilities: any[];
  complianceStatus: any;
  alerts: any[];
  metrics: any;
  scanResults: any[];
  loading: boolean;
  error: string | null;
}

interface SecurityWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'status';
  size: 'small' | 'medium' | 'large';
  priority: number;
}

const SecurityDashboard: React.FC = () => {
  const [state, setState] = useState<SecurityDashboardState>({
    securityEvents: [],
    vulnerabilities: [],
    complianceStatus: null,
    alerts: [],
    metrics: null,
    scanResults: [],
    loading: true,
    error: null
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'vulnerabilities' | 'compliance' | 'alerts'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('gdpr-2018');

  // ===========================================
  // DATA LOADING
  // ===========================================

  const loadSecurityData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };

      const endTime = Date.now();
      const startTime = endTime - timeRangeMs[timeRange];

      const [
        events,
        vulnerabilities,
        alerts,
        metrics,
        scanResults,
        frameworks
      ] = await Promise.all([
        securityMonitor.getEvents({
          dateRange: { start: startTime, end: endTime },
          limit: 100
        }),
        vulnerabilityScanner.getVulnerabilities(),
        securityMonitor.getAlerts(false), // Unacknowledged alerts
        securityMonitor.getMetrics(),
        vulnerabilityScanner.getScanHistory(),
        complianceManager.getFrameworks()
      ]);

      let complianceStatus = null;
      if (selectedFramework) {
        const latestReport = complianceManager.getLatestReport(selectedFramework);
        if (latestReport) {
          complianceStatus = latestReport;
        }
      }

      setState(prev => ({
        ...prev,
        securityEvents: events,
        vulnerabilities,
        alerts,
        metrics,
        scanResults,
        complianceStatus,
        loading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load security data',
        loading: false
      }));
    }
  }, [timeRange, selectedFramework]);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadSecurityData]);

  // ===========================================
  // EVENT HANDLERS
  // ===========================================

  const handleVulnerabilityScan = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await vulnerabilityScanner.performFullScan();
      await loadSecurityData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to perform vulnerability scan'
      }));
    }
  };

  const handleComplianceAssessment = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await complianceManager.assessCompliance(selectedFramework);
      await loadSecurityData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to perform compliance assessment'
      }));
    }
  };

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      securityMonitor.acknowledgeAlert(alertId, 'dashboard-user');
      await loadSecurityData();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const exportSecurityReport = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      summary: {
        total_events: state.securityEvents.length,
        total_vulnerabilities: state.vulnerabilities.length,
        unacknowledged_alerts: state.alerts.length,
        compliance_score: state.complianceStatus?.compliance_score || 0
      },
      events: state.securityEvents,
      vulnerabilities: state.vulnerabilities,
      alerts: state.alerts,
      compliance: state.complianceStatus
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===========================================
  // UTILITY FUNCTIONS
  // ===========================================

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100';
      case 'high': return 'text-red-700 bg-red-50';
      case 'medium': return 'text-yellow-700 bg-yellow-50';
      case 'low': return 'text-blue-700 bg-blue-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'compliant': return 'text-green-800 bg-green-100';
      case 'non_compliant': return 'text-red-800 bg-red-100';
      case 'partial': return 'text-yellow-800 bg-yellow-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // ===========================================
  // RENDER COMPONENTS
  // ===========================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">!</span>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">
                {state.alerts.filter(a => a.severity === 'critical').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">⚠</span>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">High Vulnerabilities</p>
              <p className="text-2xl font-semibold text-gray-900">
                {state.vulnerabilities.filter(v => v.severity === 'high' || v.severity === 'critical').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">📊</span>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Security Events</p>
              <p className="text-2xl font-semibold text-gray-900">
                {state.securityEvents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Compliance Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {state.complianceStatus?.compliance_score || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Security Alerts</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {state.alerts.slice(0, 5).map((alert, index) => (
            <div key={alert.id || index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <h4 className="ml-3 text-sm font-medium text-gray-900">{alert.title}</h4>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{alert.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatTimeAgo(alert.timestamp)}</p>
                </div>
                <button
                  onClick={() => handleAlertAcknowledge(alert.id)}
                  className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))}
          {state.alerts.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No active security alerts
            </div>
          )}
        </div>
      </div>

      {/* Vulnerability Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Vulnerability Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['critical', 'high', 'medium', 'low'].map(severity => (
              <div key={severity} className="text-center">
                <div className={`text-2xl font-bold ${getSeverityColor(severity).split(' ')[0]}`}>
                  {state.vulnerabilities.filter(v => v.severity === severity).length}
                </div>
                <div className="text-sm text-gray-500 capitalize">{severity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Security Events</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {state.securityEvents.map((event, index) => (
              <tr key={event.id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(event.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.source}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {JSON.stringify(event.details).substring(0, 100)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.securityEvents.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No security events in the selected time range
          </div>
        )}
      </div>
    </div>
  );

  const renderVulnerabilities = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Vulnerability Management</h3>
        <button
          onClick={handleVulnerabilityScan}
          disabled={state.loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {state.loading ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discovered
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.vulnerabilities.map((vuln, index) => (
                <tr key={vuln.id || index}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{vuln.title}</div>
                      <div className="text-gray-500">{vuln.description.substring(0, 100)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vuln.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vuln.status)}`}>
                      {vuln.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vuln.risk_score}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimeAgo(vuln.discovered_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.vulnerabilities.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              No vulnerabilities found
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Compliance Management</h3>
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {complianceManager.getFrameworks().map(framework => (
              <option key={framework.id} value={framework.id}>
                {framework.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleComplianceAssessment}
          disabled={state.loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {state.loading ? 'Assessing...' : 'Run Assessment'}
        </button>
      </div>

      {state.complianceStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-medium text-gray-900">
              {complianceManager.getFramework(selectedFramework)?.name} Assessment
            </h4>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(state.complianceStatus.overall_status)}`}>
              {state.complianceStatus.overall_status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {state.complianceStatus.summary.compliant}
              </div>
              <div className="text-sm text-gray-500">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {state.complianceStatus.summary.partial}
              </div>
              <div className="text-sm text-gray-500">Partial</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {state.complianceStatus.summary.non_compliant}
              </div>
              <div className="text-sm text-gray-500">Non-Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {state.complianceStatus.summary.not_assessed}
              </div>
              <div className="text-sm text-gray-500">Not Assessed</div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h5 className="text-md font-medium text-gray-900 mb-4">Executive Summary</h5>
            <div className="bg-gray-50 rounded p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {state.complianceStatus.executive_summary}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlerts = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Active Security Alerts</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {state.alerts.map((alert, index) => (
          <div key={alert.id || index} className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="ml-3 text-sm font-medium text-gray-900">{alert.category}</span>
                </div>
                <h4 className="mt-2 text-base font-medium text-gray-900">{alert.title}</h4>
                <p className="mt-1 text-sm text-gray-500">{alert.message}</p>
                <div className="mt-2 flex items-center text-xs text-gray-400">
                  <span>Created: {formatTimeAgo(alert.timestamp)}</span>
                  {alert.event_ids.length > 0 && (
                    <span className="ml-4">Related events: {alert.event_ids.length}</span>
                  )}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => handleAlertAcknowledge(alert.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        ))}
        {state.alerts.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            No active security alerts
          </div>
        )}
      </div>
    </div>
  );

  // ===========================================
  // MAIN RENDER
  // ===========================================

  if (state.loading && !state.securityEvents.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Enterprise security monitoring, vulnerability management, and compliance tracking
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="ml-2 text-sm text-gray-600">Live monitoring active</span>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
          </label>

          <button
            onClick={exportSecurityReport}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400">⚠</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: 'Security Events' },
            { id: 'vulnerabilities', label: 'Vulnerabilities' },
            { id: 'compliance', label: 'Compliance' },
            { id: 'alerts', label: 'Alerts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'alerts' && state.alerts.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {state.alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'vulnerabilities' && renderVulnerabilities()}
        {activeTab === 'compliance' && renderCompliance()}
        {activeTab === 'alerts' && renderAlerts()}
      </div>
    </div>
  );
};

export default SecurityDashboard;