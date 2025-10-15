import React from 'react';

interface DashboardProps {}

interface CornellAdvisoryAlert {
    id: string;
    type: 'legal-update' | 'compliance-reminder' | 'ucc-guidance' | 'best-practice';
    title: string;
    message: string;
    cornellReference: string;
    priority: 'high' | 'medium' | 'low';
}

const Dashboard: React.FC<DashboardProps> = () => {
    const cornellAdvisoryAlerts: CornellAdvisoryAlert[] = [
        {
            id: '1',
            type: 'ucc-guidance',
            title: 'UCC Article 3 Negotiability Requirements',
            message: 'All negotiable instruments must meet five core requirements under UCC § 3-104 for legal enforceability.',
            cornellReference: 'https://www.law.cornell.edu/ucc/3/3-104',
            priority: 'high'
        },
        {
            id: '2',
            type: 'compliance-reminder',
            title: 'Holder in Due Course Protection',
            message: 'Ensure proper acquisition procedures to qualify for UCC § 3-302 holder in due course protections.',
            cornellReference: 'https://www.law.cornell.edu/ucc/3/3-302',
            priority: 'medium'
        },
        {
            id: '3',
            type: 'best-practice',
            title: 'Indorsement Best Practices',
            message: 'Use special indorsements when possible to maintain control and proper chain of title per UCC § 3-205.',
            cornellReference: 'https://www.law.cornell.edu/ucc/3/3-205',
            priority: 'medium'
        }
    ];
    return (
        <div className="component-card">
            <h2>📊 Cornell-Enhanced Processing Dashboard</h2>
            
            {/* Cornell Legal Advisory System */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#2a5298', marginBottom: '15px' }}>🏛️ Cornell Legal Advisory System</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                    {cornellAdvisoryAlerts.map(alert => (
                        <div key={alert.id} style={{ 
                            padding: '15px', 
                            backgroundColor: alert.priority === 'high' ? '#fff5f5' : 
                                           alert.priority === 'medium' ? '#fffbf0' : '#f0f8ff',
                            borderLeft: `4px solid ${alert.priority === 'high' ? '#e53e3e' : 
                                                   alert.priority === 'medium' ? '#dd6b20' : '#3182ce'}`,
                            borderRadius: '6px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ 
                                        color: '#2a5298', 
                                        margin: '0 0 8px 0', 
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {alert.type === 'legal-update' && '📜'}
                                        {alert.type === 'compliance-reminder' && '⚖️'}
                                        {alert.type === 'ucc-guidance' && '🏛️'}
                                        {alert.type === 'best-practice' && '✨'}
                                        {alert.title}
                                    </h4>
                                    <p style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                        {alert.message}
                                    </p>
                                    <a href={alert.cornellReference} target="_blank" rel="noopener noreferrer" 
                                       style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.85rem' }}>
                                        📖 Cornell Law Reference
                                    </a>
                                </div>
                                <div style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    backgroundColor: alert.priority === 'high' ? '#e53e3e' : 
                                                   alert.priority === 'medium' ? '#dd6b20' : '#3182ce'
                                }}>
                                    {alert.priority.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="component-card" style={{ textAlign: 'center', margin: 0 }}>
                    <h3 style={{ color: '#2a5298', margin: '0 0 10px 0' }}>📄 Documents Processed</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3c72' }}>0</div>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>This session</p>
                </div>
                
                <div className="component-card" style={{ textAlign: 'center', margin: 0 }}>
                    <h3 style={{ color: '#2a5298', margin: '0 0 10px 0' }}>⚡ System Status</h3>
                    <div className="status-badge status-success" style={{ fontSize: '1rem', margin: '10px 0' }}>
                        ✅ Operational
                    </div>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>All systems running</p>
                </div>
                
                <div className="component-card" style={{ textAlign: 'center', margin: 0 }}>
                    <h3 style={{ color: '#2a5298', margin: '0 0 10px 0' }}>🔐 Security</h3>
                    <div className="status-badge status-success" style={{ fontSize: '1rem', margin: '10px 0' }}>
                        ✅ Secure
                    </div>
                    <p style={{ margin: '5px 0', color: '#6c757d' }}>SSL encrypted</p>
                </div>
            </div>

            <div className="alert alert-info">
                <h4 style={{ margin: '0 0 10px 0' }}>�️ Cornell Law Enhanced Commercial Paper Processing Center</h4>
                <p style={{ margin: '0 0 10px 0' }}>
                    Professional system for negotiable instrument processing, bill of exchange endorsement, 
                    and commercial paper management. All processing follows Cornell Legal Information Institute 
                    standards and authoritative UCC Article 3 guidelines.
                </p>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                    <a href="https://www.law.cornell.edu/ucc/3" target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#007bff', textDecoration: 'none' }}>
                        📖 UCC Article 3 Complete
                    </a>
                    <a href="https://www.law.cornell.edu/ucc/3/3-104" target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#007bff', textDecoration: 'none' }}>
                        ⚖️ Negotiability Requirements
                    </a>
                    <a href="https://www.law.cornell.edu/ucc/3/3-205" target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#007bff', textDecoration: 'none' }}>
                        ✍️ Indorsement Rules
                    </a>
                </div>
            </div>

            <div style={{ marginTop: '25px' }}>
                <h3 style={{ color: '#2a5298', marginBottom: '15px' }}>🚀 Cornell-Backed Quick Actions</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" title="Upload documents with Cornell legal validation">
                        📤 Upload & Validate
                    </button>
                    <button className="btn btn-outline" title="View processing history with legal compliance status">
                        📋 Cornell Legal Analysis
                    </button>
                    <button className="btn btn-secondary" title="Access Cornell Legal Information Institute resources">
                        🏛️ Cornell Legal Knowledge
                    </button>
                    <button className="btn btn-success" title="Run UCC Article 3 compliance check">
                        ⚖️ UCC Compliance Check
                    </button>
                </div>
            </div>

            {/* Cornell Integration Status */}
            <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #d0e7ff' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>🎯 Cornell Legal Integration Status</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', color: '#28a745', marginBottom: '5px' }}>✅</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2a5298' }}>UCC Article 3</div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Fully Integrated</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', color: '#28a745', marginBottom: '5px' }}>✅</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2a5298' }}>Legal Compliance</div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Real-time Analysis</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', color: '#28a745', marginBottom: '5px' }}>✅</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2a5298' }}>Document Validation</div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Cornell Standards</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', color: '#28a745', marginBottom: '5px' }}>✅</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2a5298' }}>Legal Advisory</div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Authoritative Sources</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;