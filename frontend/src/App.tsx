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
import './App.css';
import './ProfessionalStyles.css';
import './styles/error.css';

function App(): JSX.Element {
    return (
        <ErrorBoundary>
            <div className="container">
                <header>
                    <h1>Commercial Paper Processing Center</h1>
                    <p className="subtitle">Professional Negotiable Instrument Management System</p>
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
                </Tabs>
            </div>
        </ErrorBoundary>
    );
}

export default App;
