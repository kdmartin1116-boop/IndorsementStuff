// ===========================================
// ENTERPRISE INTEGRATIONS DASHBOARD
// React Component for Managing Business Integrations
// ===========================================

import React, { useState, useEffect, useCallback } from 'react';
import { EnterpriseIntegrationManager, IntegrationFactory } from '../services/integrations/EnterpriseIntegrationManager';

interface IntegrationStatus {
  platform: string;
  connected: boolean;
  lastSync?: string;
  health: 'healthy' | 'warning' | 'error';
  message?: string;
  recordsCount?: number;
}

interface SyncJob {
  id: string;
  platform: string;
  type: 'manual' | 'scheduled' | 'webhook';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  errors: any[];
}

const EnterpriseIntegrations: React.FC = () => {
  const [integrationManager] = useState(() => 
    IntegrationFactory.createManager(IntegrationFactory.getDefaultConfig())
  );
  
  const [integrationStatuses, setIntegrationStatuses] = useState<IntegrationStatus[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  // Platform configurations
  const platformConfigs = {
    salesforce: {
      name: 'Salesforce CRM',
      description: 'Customer relationship management and sales automation',
      icon: '⚡',
      color: '#00a1e0',
      features: ['Lead Management', 'Case Tracking', 'Sales Pipeline', 'Custom Objects']
    },
    hubspot: {
      name: 'HubSpot CRM',
      description: 'Inbound marketing, sales, and customer service platform',
      icon: '🧡',
      color: '#ff7a59',
      features: ['Contact Management', 'Deal Tracking', 'Email Marketing', 'Analytics']
    },
    googleWorkspace: {
      name: 'Google Workspace',
      description: 'Document management and collaboration suite',
      icon: '📁',
      color: '#4285f4',
      features: ['Drive Storage', 'Docs Creation', 'Gmail Integration', 'Calendar Events']
    },
    slack: {
      name: 'Slack',
      description: 'Team communication and collaboration platform',
      icon: '💬',
      color: '#4a154b',
      features: ['Channel Notifications', 'Direct Messages', 'File Sharing', 'Bot Integration']
    },
    quickbooks: {
      name: 'QuickBooks',
      description: 'Accounting and financial management software',
      icon: '💰',
      color: '#0077c5',
      features: ['Invoice Management', 'Expense Tracking', 'Financial Reporting', 'Tax Preparation']
    }
  };

  // Load integration statuses
  const loadIntegrationStatuses = useCallback(() => {
    const statuses = integrationManager.getIntegrationStatus();
    setIntegrationStatuses(statuses);
  }, [integrationManager]);

  // Load sync jobs
  const loadSyncJobs = useCallback(() => {
    const jobs = integrationManager.getSyncJobs();
    setSyncJobs(jobs.slice(0, 10)); // Show latest 10 jobs
  }, [integrationManager]);

  useEffect(() => {
    loadIntegrationStatuses();
    loadSyncJobs();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadIntegrationStatuses();
      loadSyncJobs();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadIntegrationStatuses, loadSyncJobs]);

  // Handle platform authentication
  const handleConnect = async (platform: string) => {
    try {
      setIsLoading(true);
      setSelectedPlatform(platform);
      
      const authUrl = await integrationManager.authenticatePlatform(platform);
      setAuthUrl(authUrl);
      setShowAuthModal(true);
      
    } catch (error) {
      console.error(`Failed to initiate authentication for ${platform}:`, error);
      alert(`Failed to connect to ${platform}. Please check your configuration.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle platform disconnection
  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${platform}? This will stop all data synchronization.`)) {
      return;
    }

    try {
      setIsLoading(true);
      await integrationManager.disconnectPlatform(platform);
      loadIntegrationStatuses();
    } catch (error) {
      console.error(`Failed to disconnect from ${platform}:`, error);
      alert(`Failed to disconnect from ${platform}.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual sync
  const handleSync = async (platform: string) => {
    try {
      setIsLoading(true);
      await integrationManager.schedulePlatformSync(platform, 'manual');
      
      // Refresh job list after a short delay
      setTimeout(() => {
        loadSyncJobs();
        loadIntegrationStatuses();
      }, 1000);
      
    } catch (error) {
      console.error(`Failed to sync ${platform}:`, error);
      alert(`Failed to sync ${platform}.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sync all platforms
  const handleSyncAll = async () => {
    try {
      setIsLoading(true);
      await integrationManager.syncAllPlatforms();
      
      setTimeout(() => {
        loadSyncJobs();
        loadIntegrationStatuses();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to sync all platforms:', error);
      alert('Failed to sync all platforms.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (health: string) => {
    switch (health) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="enterprise-integrations">
      <div className="integrations-header">
        <div className="header-content">
          <h2>🔗 Enterprise Integrations</h2>
          <p>Connect and synchronize with your business systems</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={handleSyncAll}
            disabled={isLoading}
          >
            {isLoading ? '🔄 Syncing...' : '🔄 Sync All'}
          </button>
        </div>
      </div>

      {/* Integration Status Overview */}
      <div className="status-overview">
        <div className="overview-cards">
          {Object.entries(platformConfigs).map(([platform, config]) => {
            const status = integrationStatuses.find(s => s.platform === platform);
            
            return (
              <div key={platform} className="integration-card">
                <div className="card-header">
                  <div className="platform-info">
                    <span className="platform-icon">{config.icon}</span>
                    <div>
                      <h3>{config.name}</h3>
                      <p>{config.description}</p>
                    </div>
                  </div>
                  
                  <div className="connection-status">
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: getStatusColor(status?.health || 'error') }}
                    />
                    <span className="status-text">
                      {status?.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                </div>

                <div className="card-content">
                  <div className="features">
                    {config.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>

                  {status?.connected && (
                    <div className="sync-info">
                      <div className="sync-stat">
                        <span>Last Sync:</span>
                        <span>{status.lastSync ? formatDate(status.lastSync) : 'Never'}</span>
                      </div>
                      {status.recordsCount && (
                        <div className="sync-stat">
                          <span>Records:</span>
                          <span>{status.recordsCount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {status?.message && (
                    <div className="status-message" style={{ color: getStatusColor(status.health) }}>
                      {status.message}
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  {status?.connected ? (
                    <>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleSync(platform)}
                        disabled={isLoading}
                      >
                        🔄 Sync Now
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDisconnect(platform)}
                        disabled={isLoading}
                      >
                        🔌 Disconnect
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleConnect(platform)}
                      disabled={isLoading}
                    >
                      🔗 Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Sync Jobs */}
      <div className="sync-jobs-section">
        <h3>📊 Recent Sync Jobs</h3>
        
        {syncJobs.length === 0 ? (
          <div className="no-jobs">
            <p>No sync jobs found. Connect to platforms to start syncing data.</p>
          </div>
        ) : (
          <div className="jobs-table">
            <div className="table-header">
              <span>Platform</span>
              <span>Type</span>
              <span>Status</span>
              <span>Records</span>
              <span>Started</span>
              <span>Duration</span>
            </div>
            
            {syncJobs.map((job) => (
              <div key={job.id} className="table-row">
                <span className="platform-name">
                  {platformConfigs[job.platform as keyof typeof platformConfigs]?.icon} 
                  {platformConfigs[job.platform as keyof typeof platformConfigs]?.name || job.platform}
                </span>
                
                <span className="job-type">{job.type}</span>
                
                <span className={`job-status status-${job.status}`}>
                  {job.status === 'running' && '🔄 '}
                  {job.status === 'completed' && '✅ '}
                  {job.status === 'failed' && '❌ '}
                  {job.status === 'pending' && '⏳ '}
                  {job.status}
                </span>
                
                <span className="records-count">
                  {job.recordsProcessed.toLocaleString()}
                  {job.errors.length > 0 && (
                    <span className="error-count"> ({job.errors.length} errors)</span>
                  )}
                </span>
                
                <span className="start-time">{formatDate(job.startTime)}</span>
                
                <span className="duration">
                  {job.endTime 
                    ? `${Math.round((new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 1000)}s`
                    : job.status === 'running' 
                      ? `${Math.round((Date.now() - new Date(job.startTime).getTime()) / 1000)}s`
                      : '-'
                  }
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <div className="modal-header">
              <h3>🔗 Connect to {platformConfigs[selectedPlatform as keyof typeof platformConfigs]?.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAuthModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <p>Click the button below to authenticate with {selectedPlatform}:</p>
              
              <div className="auth-actions">
                <a 
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  🚀 Authenticate with {platformConfigs[selectedPlatform as keyof typeof platformConfigs]?.name}
                </a>
              </div>
              
              <div className="auth-instructions">
                <p><strong>Instructions:</strong></p>
                <ol>
                  <li>Click the authentication button above</li>
                  <li>Sign in to your {selectedPlatform} account</li>
                  <li>Grant the requested permissions</li>
                  <li>You'll be redirected back automatically</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .enterprise-integrations {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .integrations-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .header-content h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 2rem;
        }

        .header-content p {
          margin: 0;
          color: #6b7280;
          font-size: 1.1rem;
        }

        .overview-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .integration-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          transition: all 0.3s ease;
        }

        .integration-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .platform-info {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .platform-icon {
          font-size: 2.5rem;
          line-height: 1;
        }

        .platform-info h3 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .platform-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .card-content {
          padding: 1.5rem;
        }

        .features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .feature-tag {
          background: #f3f4f6;
          color: #374151;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .sync-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin: 1rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .sync-stat {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .sync-stat span:first-child {
          color: #6b7280;
        }

        .sync-stat span:last-child {
          font-weight: 500;
          color: #1f2937;
        }

        .status-message {
          font-size: 0.875rem;
          font-weight: 500;
          margin-top: 0.5rem;
        }

        .card-actions {
          padding: 1rem 1.5rem;
          border-top: 1px solid #f3f4f6;
          display: flex;
          gap: 0.75rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .sync-jobs-section {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .sync-jobs-section h3 {
          padding: 1.5rem;
          margin: 0;
          border-bottom: 1px solid #f3f4f6;
          color: #1f2937;
        }

        .no-jobs {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }

        .jobs-table {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1fr;
          gap: 1rem;
        }

        .table-header {
          display: contents;
        }

        .table-header span {
          padding: 1rem 1.5rem;
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .table-row {
          display: contents;
        }

        .table-row span {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          font-size: 0.875rem;
        }

        .platform-name {
          font-weight: 500;
          gap: 0.5rem;
        }

        .job-status {
          font-weight: 500;
        }

        .status-completed { color: #10b981; }
        .status-running { color: #f59e0b; }
        .status-failed { color: #ef4444; }
        .status-pending { color: #6b7280; }

        .error-count {
          color: #ef4444;
          font-size: 0.75rem;
        }

        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .auth-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
        }

        .close-btn:hover {
          color: #374151;
        }

        .modal-content {
          padding: 1.5rem;
        }

        .auth-actions {
          margin: 1.5rem 0;
          text-align: center;
        }

        .auth-instructions {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        .auth-instructions p {
          margin: 0 0 0.5rem 0;
          font-weight: 600;
          color: #374151;
        }

        .auth-instructions ol {
          margin: 0;
          padding-left: 1.5rem;
          color: #6b7280;
        }

        .auth-instructions li {
          margin-bottom: 0.25rem;
        }

        @media (max-width: 768px) {
          .enterprise-integrations {
            padding: 1rem;
          }

          .integrations-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .overview-cards {
            grid-template-columns: 1fr;
          }

          .jobs-table {
            grid-template-columns: 1fr;
          }

          .table-header span,
          .table-row span {
            padding: 0.75rem 1rem;
          }

          .table-header {
            display: none;
          }

          .table-row {
            display: block;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
          }

          .table-row span {
            display: block;
            border-bottom: 1px solid #f3f4f6;
          }

          .table-row span:before {
            content: attr(data-label) ': ';
            font-weight: 600;
            color: #374151;
          }
        }
      `}</style>
    </div>
  );
};

export default EnterpriseIntegrations;