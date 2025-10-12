import React from 'react';
import Tabs from './components/Tabs';
import FinancialHealth from './components/FinancialHealth';
import LegalKnowledge from './components/LegalKnowledge';
import ConsumerRights from './components/ConsumerRights';
import LegalResources from './components/LegalResources';
import PseudolegalWarning from './components/PseudolegalWarning';
import LoginForm, { AuthProvider, useAuth } from './components/Authentication';
import './App.css';

const AppContent: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();

    if (!isAuthenticated) {
        return (
            <div className="container">
                <div className="critical-warning" style={{
                    backgroundColor: '#ff4444',
                    color: 'white',
                    padding: '20px',
                    margin: '10px 0',
                    border: '3px solid #cc0000',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>
                    <h2>🚨 CRITICAL LEGAL WARNING 🚨</h2>
                    <p>ORIGINAL DANGEROUS FUNCTIONALITY HAS BEEN DISABLED</p>
                    <p>The theories originally promoted by this software are NOT recognized by courts and can result in criminal charges, fines, and imprisonment.</p>
                    <p>This platform now provides legitimate legal education only.</p>
                </div>
                <header>
                    <h1>Legal Education & Consumer Rights Resource Center</h1>
                    <p style={{textAlign: 'center', color: '#666', marginTop: '10px'}}>
                        Legitimate legal information and resources for consumers
                    </p>
                </header>
                <LoginForm />
            </div>
        );
    }

    return (
        <div className="container">
            <div className="success-banner" style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '15px',
                margin: '10px 0',
                border: '2px solid #388E3C',
                borderRadius: '5px',
                textAlign: 'center'
            }}>
                <h3>✅ Welcome to Safe Legal Education</h3>
                <p>All dangerous functionality has been removed. You now have access to legitimate legal education resources.</p>
            </div>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Legal Education & Consumer Rights Resource Center</h1>
                    <p style={{color: '#666', marginTop: '10px'}}>
                        Welcome, {user?.full_name} | Purpose: {user?.purpose}
                    </p>
                </div>
                <button 
                    onClick={logout}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </header>
            <Tabs>
                <div id="financial-health" title="Financial Health">
                    <FinancialHealth />
                </div>
                <div id="legal-knowledge" title="Legal Knowledge">
                    <LegalKnowledge />
                </div>
                <div id="consumer-rights" title="Consumer Rights">
                    <ConsumerRights />
                </div>
                <div id="legal-resources" title="Legal Resources">
                    <LegalResources />
                </div>
                <div id="legal-warning" title="Pseudolegal Dangers">
                    <PseudolegalWarning />
                </div>
            </Tabs>
        </div>
    );
};

function App(): JSX.Element {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
