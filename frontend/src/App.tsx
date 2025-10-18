import React from 'react';
import Tabs from './components/Tabs';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import ProfessionalFileUpload from './components/ProfessionalFileUpload';
import DocumentProcessor from './components/DocumentProcessor';
import ProfessionalSettings from './components/ProfessionalSettings';
import SystemStatus from './components/SystemStatus';
import LegalComplianceChecker from './components/LegalComplianceChecker';
import CornellLegalKnowledge from './components/CornellLegalKnowledge';
import StateNationalStatus from './components/StateNationalStatus';
import Endorser from './components/Endorser';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstall from './components/PWAInstall';
import NetworkStatus from './components/NetworkStatus';
import AdvancedAnalyticsDashboard from './components/AdvancedAnalyticsDashboard';
import AILegalAnalysis from './components/AILegalAnalysis';
import AdvancedWorkflowAutomation from './components/AdvancedWorkflowAutomation';
import EnhancedSecurityFramework from './components/EnhancedSecurityFramework';
import APIEcosystemIntegration from './components/APIEcosystemIntegration';
import MultiJurisdictionSupport from './components/MultiJurisdictionSupport';
import IndustrySpecificModules from './components/IndustrySpecificModules';
import BlockchainIntegration from './components/BlockchainIntegration';
import LegalIntelligenceReporting from './components/LegalIntelligenceReporting';
import SmartDocumentRecognition from './components/SmartDocumentRecognition';
import InteractiveVisualEditor from './components/InteractiveVisualEditor';
import AdvancedNotificationSystem from './components/AdvancedNotificationSystem';
import CollaborativeWorkspace from './components/CollaborativeWorkspace';
import AdvancedSearchDiscovery from './components/AdvancedSearchDiscovery';
import './App.css';
import './ProfessionalStyles.css';
import './styles/error.css';
import './styles/pwa.css';
import './styles/analytics.css';
import './components/notification-system.css';
import './components/collaborative-workspace.css';
import './components/search-discovery.css';
import './styles/ai-analysis.css';
import './styles/workflow.css';
import './styles/security.css';
import './styles/api-ecosystem.css';
import './styles/multi-jurisdiction.css';
import './styles/industry-modules.css';
import './styles/blockchain-integration.css';
import './styles/legal-intelligence.css';
import './styles/smart-document.css';
import './styles/visual-editor.css';

function App(): JSX.Element {
    return (
        <ErrorBoundary>
            {/* PWA Install Banner */}
            <PWAInstall variant="banner" />
            
            <div className="container">
                <header>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1>Commercial Paper Processing Center</h1>
                            <p className="subtitle">Professional Negotiable Instrument Management System</p>
                        </div>
                        <PWAInstall variant="button" className="pwa-install-button" />
                    </div>
                </header>
                <Tabs>
                    <div id="dashboard" title="📊 Dashboard">
                        <ErrorBoundary>
                            <ProfessionalDashboard />
                        </ErrorBoundary>
                    </div>
                    <div id="file-upload" title="📤 Upload Documents">
                        <ErrorBoundary>
                            <ProfessionalFileUpload />
                        </ErrorBoundary>
                    </div>
                    <div id="document-processing" title="⚙️ Processing Center">
                        <ErrorBoundary>
                            <DocumentProcessor />
                        </ErrorBoundary>
                    </div>
                    <div id="endorse-bill" title="✍️ Bill Processing">
                        <ErrorBoundary>
                            <Endorser />
                        </ErrorBoundary>
                    </div>
                    <div id="commercial-law" title="📚 Cornell Legal Knowledge">
                        <ErrorBoundary>
                            <CornellLegalKnowledge />
                        </ErrorBoundary>
                    </div>
                    <div id="compliance-checker" title="⚖️ Legal Compliance">
                        <ErrorBoundary>
                            <LegalComplianceChecker />
                        </ErrorBoundary>
                    </div>
                    <div id="status-management" title="📋 Status Management">
                        <ErrorBoundary>
                            <StateNationalStatus />
                        </ErrorBoundary>
                    </div>
                    <div id="settings" title="⚙️ Settings">
                        <ErrorBoundary>
                            <ProfessionalSettings />
                        </ErrorBoundary>
                    </div>
                    <div id="system-status" title="📊 System Status">
                        <ErrorBoundary>
                            <SystemStatus />
                        </ErrorBoundary>
                    </div>
                    <div id="analytics" title="📈 Advanced Analytics">
                        <ErrorBoundary>
                            <AdvancedAnalyticsDashboard />
                        </ErrorBoundary>
                    </div>
                    <div id="ai-analysis" title="🧠 AI Legal Analysis">
                        <ErrorBoundary>
                            <AILegalAnalysis />
                        </ErrorBoundary>
                    </div>
                    <div id="workflow-automation" title="⚡ Workflow Automation">
                        <ErrorBoundary>
                            <AdvancedWorkflowAutomation />
                        </ErrorBoundary>
                    </div>
                    <div id="security-framework" title="🔒 Security Framework">
                        <ErrorBoundary>
                            <EnhancedSecurityFramework />
                        </ErrorBoundary>
                    </div>
                    <div id="api-ecosystem" title="🌐 API & Integrations">
                        <ErrorBoundary>
                            <APIEcosystemIntegration />
                        </ErrorBoundary>
                    </div>
                    <div id="multi-jurisdiction" title="🏛️ Multi-Jurisdiction">
                        <ErrorBoundary>
                            <MultiJurisdictionSupport />
                        </ErrorBoundary>
                    </div>
                    <div id="industry-modules" title="🏢 Industry Modules">
                        <ErrorBoundary>
                            <IndustrySpecificModules />
                        </ErrorBoundary>
                    </div>
                    <div id="blockchain-integration" title="⛓️ Blockchain Integration">
                        <ErrorBoundary>
                            <BlockchainIntegration />
                        </ErrorBoundary>
                    </div>
                    <div id="legal-intelligence" title="📊 Legal Intelligence">
                        <ErrorBoundary>
                            <LegalIntelligenceReporting />
                        </ErrorBoundary>
                    </div>
                    <div id="smart-document" title="🤖 Smart Recognition">
                        <ErrorBoundary>
                            <SmartDocumentRecognition />
                        </ErrorBoundary>
                    </div>
                    <div id="visual-editor" title="✏️ Visual Editor">
                        <ErrorBoundary>
                            <InteractiveVisualEditor />
                        </ErrorBoundary>
                    </div>
                    <div id="notification-system" title="🔔 Notifications">
                        <ErrorBoundary>
                            <AdvancedNotificationSystem />
                        </ErrorBoundary>
                    </div>
                    <div id="collaborative-workspace" title="👥 Collaboration">
                        <ErrorBoundary>
                            <CollaborativeWorkspace />
                        </ErrorBoundary>
                    </div>
                    <div id="search-discovery" title="🔍 Smart Search">
                        <ErrorBoundary>
                            <AdvancedSearchDiscovery />
                        </ErrorBoundary>
                    </div>
                </Tabs>
                
                {/* Network Status Indicator */}
                <NetworkStatus showOnlineStatus={true} />
            </div>
        </ErrorBoundary>
    );
}

export default App;
