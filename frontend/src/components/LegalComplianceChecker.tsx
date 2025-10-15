import React, { useState } from 'react';

interface ComplianceCheck {
    id: string;
    requirement: string;
    status: 'compliant' | 'non-compliant' | 'warning' | 'unknown';
    details: string;
    reference: string;
    cornellUrl?: string;
}

interface ComplianceCategory {
    category: string;
    description: string;
    checks: ComplianceCheck[];
}

const LegalComplianceChecker: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('ucc-article-3');
    const [documentText, setDocumentText] = useState('');
    const [complianceResults, setComplianceResults] = useState<ComplianceCheck[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const complianceCategories: ComplianceCategory[] = [
        {
            category: 'ucc-article-3',
            description: 'UCC Article 3 Negotiable Instrument Requirements',
            checks: [
                {
                    id: 'written-signed',
                    requirement: 'Document must be in writing and signed',
                    status: 'unknown',
                    details: 'UCC § 3-104(a)(1) requires negotiable instruments to be in writing and signed by the maker or drawer.',
                    reference: 'UCC § 3-104(a)(1)',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-104'
                },
                {
                    id: 'unconditional-promise',
                    requirement: 'Contains unconditional promise or order to pay',
                    status: 'unknown',
                    details: 'The instrument must contain an unconditional promise (note) or order (draft) to pay money.',
                    reference: 'UCC § 3-104(a)(2)',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-104'
                },
                {
                    id: 'fixed-amount',
                    requirement: 'States a fixed amount of money',
                    status: 'unknown',
                    details: 'The instrument must specify a fixed amount of money with or without interest or other charges.',
                    reference: 'UCC § 3-104(a)(3)',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-104'
                },
                {
                    id: 'payable-time',
                    requirement: 'Payable on demand or at definite time',
                    status: 'unknown',
                    details: 'The instrument must be payable on demand or at a definite time.',
                    reference: 'UCC § 3-104(a)(4)',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-104'
                },
                {
                    id: 'payable-order-bearer',
                    requirement: 'Payable to order or bearer',
                    status: 'unknown',
                    details: 'The instrument must be payable to order or bearer unless it is a check.',
                    reference: 'UCC § 3-104(a)(5)',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-104'
                }
            ]
        },
        {
            category: 'endorsement-compliance',
            description: 'Proper Indorsement Requirements per UCC § 3-204/3-205',
            checks: [
                {
                    id: 'signature-present',
                    requirement: 'Valid signature present on instrument',
                    status: 'unknown',
                    details: 'Indorsement requires a signature made on the instrument for negotiation, restriction, or liability purposes.',
                    reference: 'UCC § 3-204(a)',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-204'
                },
                {
                    id: 'indorsement-type',
                    requirement: 'Proper indorsement type (blank, special, restrictive)',
                    status: 'unknown',
                    details: 'Indorsement must be properly classified as blank (bearer), special (order), or restrictive (limited).',
                    reference: 'UCC § 3-205',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-205'
                },
                {
                    id: 'authorized-signature',
                    requirement: 'Signature by authorized party',
                    status: 'unknown',
                    details: 'Only the holder or authorized representative may make a valid indorsement for negotiation.',
                    reference: 'UCC § 3-204(a)',
                    cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-204'
                }
            ]
        },
        {
            category: 'federal-compliance',
            description: 'Federal Banking and Commercial Regulations',
            checks: [
                {
                    id: 'aml-requirements',
                    requirement: 'Anti-Money Laundering (AML) compliance',
                    status: 'unknown',
                    details: 'Large transactions must comply with Bank Secrecy Act and AML requirements.',
                    reference: '31 USC 5311 et seq.',
                    cornellUrl: 'https://www.law.cornell.edu/uscode/text/31/5311'
                },
                {
                    id: 'reporting-requirements',
                    requirement: 'Currency transaction reporting',
                    status: 'unknown',
                    details: 'Transactions over $10,000 require CTR filing with FinCEN.',
                    reference: '31 CFR 1020.315',
                    cornellUrl: 'https://www.law.cornell.edu/cfr/text/31/1020.315'
                }
            ]
        }
    ];

    const getCornellLegalAnalysis = (checkId: string, documentText: string): { status: ComplianceCheck['status'], guidance: string } => {
        // Enhanced Cornell legal analysis
        const lowerText = documentText.toLowerCase();
        
        const cornellAnalysis = {
            'written-signed': {
                keywords: ['signature', 'signed', 'sign', 'executed', 'maker', 'drawer'],
                compliantIf: (text: string) => cornellAnalysis['written-signed'].keywords.some(k => text.includes(k)),
                guidance: 'Cornell LII: UCC § 3-104(a)(1) requires written form with maker/drawer signature'
            },
            'unconditional-promise': {
                keywords: ['pay', 'promise to pay', 'order to pay', 'shall pay'],
                conditionalWords: ['if', 'when', 'unless', 'provided that', 'subject to'],
                compliantIf: (text: string) => {
                    const hasPayment = cornellAnalysis['unconditional-promise'].keywords.some(k => text.includes(k));
                    const hasCondition = cornellAnalysis['unconditional-promise'].conditionalWords.some(k => text.includes(k));
                    return hasPayment && !hasCondition;
                },
                guidance: 'Cornell LII: UCC § 3-104(a)(2) prohibits conditional language in payment terms'
            },
            'fixed-amount': {
                regex: /\$[\d,]+(\.\d{2})?/,
                compliantIf: (text: string) => cornellAnalysis['fixed-amount'].regex.test(text),
                guidance: 'Cornell LII: UCC § 3-104(a)(3) requires specific monetary amount'
            },
            'payable-time': {
                demandWords: ['on demand', 'at sight', 'payable immediately'],
                definiteTimeWords: ['on', 'at', 'before', 'by', 'not later than'],
                compliantIf: (text: string) => {
                    return cornellAnalysis['payable-time'].demandWords.some(k => text.includes(k)) ||
                           cornellAnalysis['payable-time'].definiteTimeWords.some(k => text.includes(k));
                },
                guidance: 'Cornell LII: UCC § 3-104(a)(4) requires demand or definite time payment'
            },
            'payable-order-bearer': {
                orderWords: ['pay to the order of', 'pay to order of'],
                bearerWords: ['pay to bearer', 'payable to bearer'],
                compliantIf: (text: string) => {
                    return cornellAnalysis['payable-order-bearer'].orderWords.some(k => text.includes(k)) ||
                           cornellAnalysis['payable-order-bearer'].bearerWords.some(k => text.includes(k));
                },
                guidance: 'Cornell LII: UCC § 3-104(a)(5) requires order or bearer language'
            }
        };

        const analysis = cornellAnalysis[checkId as keyof typeof cornellAnalysis];
        if (!analysis) {
            return { status: 'unknown', guidance: 'No Cornell analysis available for this requirement' };
        }

        const isCompliant = analysis.compliantIf(lowerText);
        return {
            status: isCompliant ? 'compliant' : 'non-compliant',
            guidance: analysis.guidance
        };
    };

    const mockComplianceAnalysis = () => {
        setIsAnalyzing(true);
        
        // Simulate analysis delay
        setTimeout(() => {
            const results: ComplianceCheck[] = [];
            const activeChecks = complianceCategories.find(cat => cat.category === activeCategory)?.checks || [];
            
            activeChecks.forEach(check => {
                if (documentText.length > 0) {
                    const cornellAnalysis = getCornellLegalAnalysis(check.id, documentText);
                    results.push({
                        ...check,
                        status: cornellAnalysis.status,
                        details: `${check.details}\n\n🏛️ ${cornellAnalysis.guidance}`
                    });
                } else {
                    // Enhanced default analysis with Cornell guidance
                    results.push({
                        ...check,
                        status: 'unknown' as const,
                        details: `${check.details}\n\n🏛️ Cornell LII: Add document text for comprehensive legal analysis`
                    });
                }
            });
            
            setComplianceResults(results);
            setIsAnalyzing(false);
        }, 2000);
    };

    const getStatusColor = (status: ComplianceCheck['status']) => {
        switch (status) {
            case 'compliant': return '#28a745';
            case 'non-compliant': return '#dc3545';
            case 'warning': return '#ffc107';
            case 'unknown': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getStatusIcon = (status: ComplianceCheck['status']) => {
        switch (status) {
            case 'compliant': return '✅';
            case 'non-compliant': return '❌';
            case 'warning': return '⚠️';
            case 'unknown': return '❓';
            default: return '❓';
        }
    };

    const currentCategory = complianceCategories.find(cat => cat.category === activeCategory);
    const complianceScore = complianceResults.length > 0 ? 
        (complianceResults.filter(r => r.status === 'compliant').length / complianceResults.length) * 100 : 0;

    return (
        <div className="component-card">
            <h3 style={{ color: '#2a5298', marginBottom: '20px' }}>
                ⚖️ Legal Compliance Checker
            </h3>

            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>📋 Cornell Law School Integration</h4>
                <p style={{ margin: '0 0 10px 0' }}>
                    This compliance checker uses UCC Article 3 requirements and federal regulations 
                    as documented by Cornell Legal Information Institute to validate commercial paper documents.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a href="https://www.law.cornell.edu/ucc/3" target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
                        📖 UCC Article 3 Complete Text
                    </a>
                    <a href="https://www.law.cornell.edu/ucc/3/3-104" target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
                        ⚖️ Negotiable Instrument Requirements
                    </a>
                    <a href="https://www.law.cornell.edu/ucc/3/3-205" target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
                        ✍️ Indorsement Rules
                    </a>
                </div>
            </div>

            {/* Category Selection */}
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>Select Compliance Framework</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {complianceCategories.map(category => (
                        <button
                            key={category.category}
                            onClick={() => setActiveCategory(category.category)}
                            className={`btn ${activeCategory === category.category ? 'btn-primary' : 'btn-outline'}`}
                        >
                            {category.category === 'ucc-article-3' && '📜'} 
                            {category.category === 'endorsement-compliance' && '✍️'}
                            {category.category === 'federal-compliance' && '🏛️'}
                            {' '}
                            {category.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
                {currentCategory && (
                    <p style={{ marginTop: '10px', color: '#6c757d', fontSize: '0.9rem' }}>
                        {currentCategory.description}
                    </p>
                )}
            </div>

            {/* Document Input */}
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>Document Text Analysis</h4>
                <textarea
                    placeholder="Paste your commercial paper document text here for compliance analysis..."
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    className="form-control"
                    rows={6}
                    style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={mockComplianceAnalysis}
                        disabled={!documentText.trim() || isAnalyzing}
                        className="btn btn-primary"
                    >
                        {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze Compliance'}
                    </button>
                    <button 
                        onClick={() => {setDocumentText(''); setComplianceResults([]);}}
                        className="btn btn-outline"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            {/* Compliance Results */}
            {complianceResults.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ color: '#2a5298', margin: 0 }}>📊 Compliance Analysis Results</h4>
                        <div style={{ 
                            padding: '8px 16px', 
                            borderRadius: '20px',
                            background: complianceScore >= 80 ? '#d4edda' : complianceScore >= 60 ? '#fff3cd' : '#f8d7da',
                            color: complianceScore >= 80 ? '#155724' : complianceScore >= 60 ? '#856404' : '#721c24',
                            fontWeight: 'bold'
                        }}>
                            {complianceScore.toFixed(0)}% Compliant
                        </div>
                    </div>

                    {complianceResults.map(result => (
                        <div key={result.id} style={{
                            padding: '15px',
                            marginBottom: '10px',
                            border: `2px solid ${getStatusColor(result.status)}`,
                            borderRadius: '8px',
                            backgroundColor: result.status === 'compliant' ? '#d4edda' : 
                                           result.status === 'non-compliant' ? '#f8d7da' :
                                           result.status === 'warning' ? '#fff3cd' : '#f8f9fa'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h5 style={{ 
                                        margin: '0 0 5px 0', 
                                        color: getStatusColor(result.status),
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {getStatusIcon(result.status)} {result.requirement}
                                    </h5>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                                        {result.details}
                                    </p>
                                    <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                        <strong>Legal Reference:</strong> {result.reference}
                                        {result.cornellUrl && (
                                            <span>
                                                {' • '}
                                                <a 
                                                    href={result.cornellUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#2a5298' }}
                                                >
                                                    Cornell LII Reference
                                                </a>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Compliance Requirements List */}
            {currentCategory && (
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>
                        📋 {currentCategory.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Requirements
                    </h4>
                    {currentCategory.checks.map(check => (
                        <div key={check.id} style={{
                            padding: '15px',
                            marginBottom: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h5 style={{ margin: '0 0 10px 0', color: '#2a5298' }}>
                                {check.requirement}
                            </h5>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                                {check.details}
                            </p>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                    <strong>Reference:</strong> {check.reference}
                                </span>
                                {check.cornellUrl && (
                                    <a 
                                        href={check.cornellUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-link"
                                        style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                                    >
                                        📖 View at Cornell LII
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Reference */}
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>🔗 Quick Legal References</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <a 
                        href="https://www.law.cornell.edu/ucc/3/3-104" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                    >
                        📜 UCC § 3-104 (Negotiable Instrument)
                    </a>
                    <a 
                        href="https://www.law.cornell.edu/ucc/3/3-204" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                    >
                        ✍️ UCC § 3-204 (Indorsement)
                    </a>
                    <a 
                        href="https://www.law.cornell.edu/ucc/3/3-205" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                    >
                        📋 UCC § 3-205 (Indorsement Types)
                    </a>
                    <a 
                        href="https://www.law.cornell.edu/ucc/3" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                    >
                        🏛️ Complete UCC Article 3
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LegalComplianceChecker;