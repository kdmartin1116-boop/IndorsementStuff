import React, { useState } from 'react';

interface ProcessingResult {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    type: 'analysis' | 'endorsement' | 'extraction' | 'ucc-validation' | 'legal-review';
    fileName: string;
    timestamp: string;
    progress: number;
    result?: any;
    legalGuidance?: string;
    cornellReference?: string;
}

interface LegalGuidanceItem {
    type: string;
    guidance: string;
    uccReference: string;
    cornellLink: string;
}

const DocumentProcessor: React.FC = () => {
    const [activeProcesses, setActiveProcesses] = useState<ProcessingResult[]>([]);
    const [showLegalGuidance, setShowLegalGuidance] = useState(true);
    
    // Cornell Legal Knowledge Integration
    const cornellLegalGuidance: LegalGuidanceItem[] = [
        {
            type: 'Bill of Exchange',
            guidance: 'Must contain an unconditional order to pay, be signed by the drawer, and identify the payee. UCC Article 3 governs negotiable instruments.',
            uccReference: 'UCC § 3-104(a)',
            cornellLink: 'https://www.law.cornell.edu/ucc/3/3-104'
        },
        {
            type: 'Promissory Note',
            guidance: 'Must be an unconditional promise to pay a fixed amount, payable to order or bearer, and signed by the maker.',
            uccReference: 'UCC § 3-104(e)',
            cornellLink: 'https://www.law.cornell.edu/ucc/3/3-104'
        },
        {
            type: 'Endorsement',
            guidance: 'Special endorsements must identify the person to whom the instrument is payable. Blank endorsements make instruments payable to bearer.',
            uccReference: 'UCC § 3-205',
            cornellLink: 'https://www.law.cornell.edu/ucc/3/3-205'
        },
        {
            type: 'Commercial Paper',
            guidance: 'All commercial paper must comply with UCC Article 3 requirements for negotiability, including unconditional payment terms.',
            uccReference: 'UCC Article 3',
            cornellLink: 'https://www.law.cornell.edu/ucc/3'
        }
    ];

    const [completedProcesses, setCompletedProcesses] = useState<ProcessingResult[]>([
        {
            id: '1',
            status: 'completed',
            type: 'analysis',
            fileName: 'commercial_agreement.pdf',
            timestamp: '2024-12-27 10:30',
            progress: 100,
            result: {
                documentType: 'Commercial Agreement',
                pages: 12,
                entities: ['Bank of America', 'John Smith', 'ABC Corp'],
                confidence: 95.8
            },
            legalGuidance: 'Document meets UCC Article 3 requirements for negotiable instruments',
            cornellReference: 'https://www.law.cornell.edu/ucc/3/3-104'
        },
        {
            id: '2',
            status: 'completed',
            type: 'endorsement',
            fileName: 'bill_of_exchange.pdf',
            timestamp: '2024-12-27 09:15',
            progress: 100,
            result: {
                endorsementType: 'Blank Endorsement',
                signaturePosition: 'Back of Document',
                validationStatus: 'Valid'
            },
            legalGuidance: 'Blank endorsement complies with UCC § 3-205 requirements',
            cornellReference: 'https://www.law.cornell.edu/ucc/3/3-205'
        },
        {
            id: '3',
            status: 'completed',
            type: 'ucc-validation',
            fileName: 'promissory_note.pdf',
            timestamp: '2024-12-27 08:45',
            progress: 100,
            result: {
                documentType: 'Promissory Note',
                uccCompliance: 'Fully Compliant',
                negotiability: 'Valid',
                confidence: 98.2
            },
            legalGuidance: 'Promissory note meets all UCC § 3-104(e) requirements for negotiability',
            cornellReference: 'https://www.law.cornell.edu/ucc/3/3-104'
        }
    ]);

    const mockStartProcess = (type: ProcessingResult['type']) => {
        const newProcess: ProcessingResult = {
            id: Date.now().toString(),
            status: 'processing',
            type,
            fileName: 'sample_document.pdf',
            timestamp: new Date().toLocaleString(),
            progress: 0
        };

        setActiveProcesses(prev => [...prev, newProcess]);

        // Simulate processing
        const progressInterval = setInterval(() => {
            setActiveProcesses(prev => prev.map(process => {
                if (process.id === newProcess.id) {
                    const newProgress = process.progress + 20;
                    if (newProgress >= 100) {
                        clearInterval(progressInterval);
                        
                        // Move to completed with Cornell legal guidance
                        const legalGuidanceMap = {
                            'analysis': 'Document analyzed using Cornell UCC Article 3 framework',
                            'endorsement': 'Endorsement created according to UCC § 3-205 requirements',
                            'extraction': 'Data extracted following Cornell commercial law standards',
                            'ucc-validation': 'Document validated against complete UCC Article 3 requirements',
                            'legal-review': 'Legal review completed using Cornell Law School legal database'
                        };

                        const cornellReferenceMap = {
                            'analysis': 'https://www.law.cornell.edu/ucc/3/3-104',
                            'endorsement': 'https://www.law.cornell.edu/ucc/3/3-205',
                            'extraction': 'https://www.law.cornell.edu/ucc/3',
                            'ucc-validation': 'https://www.law.cornell.edu/ucc/3/3-104',
                            'legal-review': 'https://www.law.cornell.edu/ucc/3'
                        };

                        setCompletedProcesses(prev => [...prev, {
                            ...process,
                            status: 'completed',
                            progress: 100,
                            result: {
                                documentType: process.type === 'ucc-validation' ? 'Negotiable Instrument' : 'Bill of Exchange',
                                confidence: 92.5 + Math.random() * 7,
                                status: 'Processed Successfully',
                                uccCompliance: process.type === 'ucc-validation' ? 'Fully Compliant' : undefined
                            },
                            legalGuidance: legalGuidanceMap[process.type] || 'Processed with legal compliance',
                            cornellReference: cornellReferenceMap[process.type] || 'https://www.law.cornell.edu/ucc/3'
                        }]);
                        
                        // Remove from active
                        setActiveProcesses(prev => prev.filter(p => p.id !== process.id));
                        
                        return { ...process, status: 'completed', progress: 100 };
                    }
                    return { ...process, progress: newProgress };
                }
                return process;
            }));
        }, 800);
    };

    const getTypeIcon = (type: ProcessingResult['type']) => {
        switch (type) {
            case 'analysis': return '🔍';
            case 'endorsement': return '✍️';
            case 'extraction': return '📋';
            case 'ucc-validation': return '⚖️';
            case 'legal-review': return '🏛️';
            default: return '📄';
        }
    };

    const getTypeLabel = (type: ProcessingResult['type']) => {
        switch (type) {
            case 'analysis': return 'Document Analysis';
            case 'endorsement': return 'Bill Endorsement';
            case 'extraction': return 'Data Extraction';
            case 'ucc-validation': return 'UCC Validation';
            case 'legal-review': return 'Legal Review';
            default: return 'Processing';
        }
    };

    const getStatusColor = (status: ProcessingResult['status']) => {
        switch (status) {
            case 'processing': return '#ffa500';
            case 'completed': return '#28a745';
            case 'failed': return '#dc3545';
            default: return '#6c757d';
        }
    };

    return (
        <div className="component-card">
            <h3 style={{ color: '#2a5298', marginBottom: '20px' }}>⚙️ Document Processing Center</h3>

            {/* Cornell Legal Guidance Panel */}
            {showLegalGuidance && (
                <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ color: '#2a5298', margin: 0 }}>🏛️ Cornell Legal Knowledge Center</h4>
                        <button 
                            onClick={() => setShowLegalGuidance(false)}
                            style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                        {cornellLegalGuidance.map((guidance, index) => (
                            <div key={index} style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                <h5 style={{ color: '#2a5298', marginBottom: '8px', fontSize: '0.9rem' }}>{guidance.type}</h5>
                                <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 8px 0', lineHeight: '1.4' }}>{guidance.guidance}</p>
                                <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                                    <strong>{guidance.uccReference}</strong>
                                </div>
                                <a href={guidance.cornellLink} target="_blank" rel="noopener noreferrer" 
                                   style={{ fontSize: '0.75rem', color: '#007bff', textDecoration: 'none' }}>
                                    📖 View Cornell LII Reference
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div style={{ marginBottom: '30px' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>Quick Actions</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        className="btn btn-primary"
                        onClick={() => mockStartProcess('analysis')}
                    >
                        🔍 Start Analysis
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => mockStartProcess('endorsement')}
                    >
                        ✍️ Create Endorsement
                    </button>
                    <button 
                        className="btn btn-outline"
                        onClick={() => mockStartProcess('extraction')}
                    >
                        📋 Extract Data
                    </button>
                    <button 
                        className="btn btn-success"
                        onClick={() => mockStartProcess('ucc-validation')}
                    >
                        ⚖️ UCC Validation
                    </button>
                    <button 
                        className="btn btn-info"
                        onClick={() => mockStartProcess('legal-review')}
                    >
                        🏛️ Legal Review
                    </button>
                </div>
            </div>

            {/* Active Processes */}
            {activeProcesses.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>
                        🔄 Active Processes ({activeProcesses.length})
                    </h4>
                    {activeProcesses.map(process => (
                        <div key={process.id} className="process-item active">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.5rem' }}>
                                    {getTypeIcon(process.type)}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <h5 style={{ margin: '0 0 5px 0' }}>
                                        {getTypeLabel(process.type)}
                                    </h5>
                                    <p style={{ margin: '0 0 10px 0', color: '#6c757d', fontSize: '0.9rem' }}>
                                        {process.fileName} • {process.timestamp}
                                    </p>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${process.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ 
                                        color: getStatusColor(process.status), 
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                    }}>
                                        {process.progress}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Processing History */}
            <div>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>
                    📚 Processing History ({completedProcesses.length})
                </h4>
                {completedProcesses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                        <p>No completed processes yet</p>
                    </div>
                ) : (
                    completedProcesses.slice().reverse().map(process => (
                        <div key={process.id} className="process-item completed">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.5rem' }}>
                                    {getTypeIcon(process.type)}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <h5 style={{ margin: '0 0 5px 0' }}>
                                        {getTypeLabel(process.type)}
                                    </h5>
                                    <p style={{ margin: '0 0 5px 0', color: '#6c757d', fontSize: '0.9rem' }}>
                                        {process.fileName} • {process.timestamp}
                                    </p>
                                    {process.result && (
                                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                            {process.result.documentType && (
                                                <span>Type: {process.result.documentType} • </span>
                                            )}
                                            {process.result.confidence && (
                                                <span>Confidence: {process.result.confidence}%</span>
                                            )}
                                            {process.result.uccCompliance && (
                                                <span> • UCC: {process.result.uccCompliance}</span>
                                            )}
                                        </div>
                                    )}
                                    {process.legalGuidance && (
                                        <div style={{ 
                                            fontSize: '0.8rem', 
                                            color: '#2a5298', 
                                            backgroundColor: '#f0f8ff', 
                                            padding: '8px', 
                                            borderRadius: '4px', 
                                            marginTop: '8px',
                                            border: '1px solid #d0e7ff'
                                        }}>
                                            <strong>📖 Legal Guidance:</strong> {process.legalGuidance}
                                            {process.cornellReference && (
                                                <div style={{ marginTop: '4px' }}>
                                                    <a href={process.cornellReference} target="_blank" rel="noopener noreferrer" 
                                                       style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.75rem' }}>
                                                        🏛️ Cornell Law Reference
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ 
                                        color: getStatusColor(process.status), 
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                    }}>
                                        ✅ Complete
                                    </div>
                                    <button 
                                        className="btn-link"
                                        style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Processing Stats */}
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>📊 Processing Statistics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                            {completedProcesses.length}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Completed</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffa500' }}>
                            {activeProcesses.length}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Active</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2a5298' }}>
                            98.5%
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Success Rate</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentProcessor;