import React, { useState } from 'react';

// Cornell Law School Legal Information Integration
interface UCCSection {
    section: string;
    title: string;
    summary: string;
    fullText: string;
    keyPoints: string[];
    cornellUrl: string;
}

interface LegalResource {
    id: string;
    title: string;
    category: string;
    summary: string;
    relevance: 'critical' | 'high' | 'medium' | 'low';
    lastUpdated: string;
    source: 'cornell-lii' | 'ucc' | 'federal' | 'state';
    url?: string;
    sections?: UCCSection[];
}

interface LegalTopic {
    id: string;
    title: string;
    description: string;
    icon: string;
    resources: LegalResource[];
}

const CornellLegalKnowledge: React.FC = () => {
    const [activeTab, setActiveTab] = useState('ucc-article-3');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Comprehensive Legal Topics with Cornell Law School Integration
    const legalTopics: LegalTopic[] = [
        {
            id: 'ucc-article-3',
            title: 'UCC Article 3 - Negotiable Instruments',
            description: 'Complete framework for negotiable instruments from Cornell Law School',
            icon: '📜',
            resources: [
                {
                    id: 'ucc-3-complete',
                    title: 'UCC Article 3 - Complete Text (Cornell LII)',
                    category: 'primary-law',
                    summary: 'Official text of UCC Article 3 governing negotiable instruments, maintained by Cornell Legal Information Institute',
                    relevance: 'critical',
                    lastUpdated: '2024-12-27',
                    source: 'cornell-lii',
                    url: 'https://www.law.cornell.edu/ucc/3',
                    sections: [
                        {
                            section: '§ 3-104',
                            title: 'Negotiable Instrument Requirements',
                            summary: 'Defines what makes an instrument negotiable under Article 3',
                            fullText: 'An instrument is negotiable if it: (1) is in writing and signed by maker/drawer; (2) contains unconditional promise/order to pay; (3) states fixed amount of money; (4) is payable on demand or at definite time; (5) is payable to order or bearer.',
                            keyPoints: [
                                'Written and signed document required',
                                'Unconditional promise or order to pay', 
                                'Fixed amount of money specified',
                                'Payable on demand or at definite time',
                                'Must be payable to order or bearer',
                                'No other promise/order/obligation except payment'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-104'
                        },
                        {
                            section: '§ 3-204',
                            title: 'Indorsement Definition & Requirements',
                            summary: 'Legal definition of indorsement and its requirements under UCC',
                            fullText: '"Indorsement" means a signature, other than that of maker/drawer/acceptor, made on instrument for: (i) negotiating instrument, (ii) restricting payment, or (iii) incurring indorser liability. Paper affixed to instrument is part of instrument.',
                            keyPoints: [
                                'Signature made for negotiation purposes',
                                'Can restrict payment of instrument',
                                'Creates liability for the indorser',
                                'Must be made on the instrument itself',
                                'Attached papers become part of instrument',
                                'Intent determines indorsement purpose'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-204'
                        },
                        {
                            section: '§ 3-205',
                            title: 'Types of Indorsement',
                            summary: 'Special, blank, and anomalous indorsements with different legal effects',
                            fullText: 'Special indorsement identifies payee and requires their indorsement for further negotiation. Blank indorsement makes instrument payable to bearer. Anomalous indorsement is made by non-holder.',
                            keyPoints: [
                                'Special indorsement: names specific payee',
                                'Blank indorsement: creates bearer instrument',
                                'Bearer instruments negotiable by delivery alone',
                                'Holder can convert blank to special indorsement',
                                'Anomalous indorsement: made by accommodation party',
                                'Different negotiation requirements for each type'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-205'
                        },
                        {
                            section: '§ 3-206',
                            title: 'Restrictive Indorsement',
                            summary: 'Indorsements that limit or restrict the use of the instrument',
                            fullText: 'Restrictive indorsement limits payment to particular person, prohibits further transfer, or makes transfer conditional. Does not prevent further negotiation except for conditional indorsements.',
                            keyPoints: [
                                'Limits payment to specific parties',
                                'Can prohibit further negotiation',
                                'May make transfer conditional',
                                'Different effects on subsequent holders',
                                'Protects against unauthorized use',
                                'Common in commercial transactions'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-206'
                        }
                    ]
                }
            ]
        },
        {
            id: 'bills-of-exchange',
            title: 'Bills of Exchange Law',
            description: 'Comprehensive guide to bills of exchange under commercial law',
            icon: '💰',
            resources: [
                {
                    id: 'bill-exchange-framework',
                    title: 'Bills of Exchange Legal Framework',
                    category: 'commercial-law',
                    summary: 'Three-party commercial instruments governed by UCC Article 3 and federal commercial law',
                    relevance: 'critical',
                    lastUpdated: '2024-12-27',
                    source: 'ucc',
                    sections: [
                        {
                            section: 'Structure',
                            title: 'Three-Party Instrument Design',
                            summary: 'Drawer orders drawee to pay payee a sum certain',
                            fullText: 'A bill of exchange involves three parties: (1) Drawer - person who draws/creates the bill; (2) Drawee - person ordered to pay; (3) Payee - person entitled to payment. The drawer gives an unconditional order to the drawee to pay a fixed amount to the payee.',
                            keyPoints: [
                                'Drawer: creates and signs the bill',
                                'Drawee: ordered to make payment',
                                'Payee: entitled to receive payment',
                                'Unconditional order requirement',
                                'Fixed amount specification',
                                'Clear payment instructions'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/ucc/3'
                        },
                        {
                            section: 'Acceptance',
                            title: 'Acceptance and Payment Process',
                            summary: 'How drawees accept bills and the legal consequences',
                            fullText: 'Acceptance occurs when drawee signs the bill agreeing to pay. Acceptance creates absolute liability to pay according to terms. Presentation for acceptance may be required before payment due date.',
                            keyPoints: [
                                'Acceptance requires drawee signature',
                                'Creates absolute payment liability',
                                'May require presentment for acceptance',
                                'Time limits for acceptance decisions',
                                'Dishonor procedures if not accepted',
                                'Rights of holder on acceptance/dishonor'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/ucc/3/3-409'
                        }
                    ]
                }
            ]
        },
        {
            id: 'commercial-law',
            title: 'Commercial Law Resources',
            description: 'Cornell Law School commercial law database and resources',
            icon: '🏛️',
            resources: [
                {
                    id: 'cornell-commercial-law',
                    title: 'Cornell LII Commercial Law Collection',
                    category: 'legal-resources',
                    summary: 'Comprehensive commercial law resources from Cornell Legal Information Institute',
                    relevance: 'high',
                    lastUpdated: '2024-12-27',
                    source: 'cornell-lii',
                    url: 'https://www.law.cornell.edu/wex/category/business_law',
                    sections: [
                        {
                            section: 'UCC Resources',
                            title: 'Uniform Commercial Code Complete',
                            summary: 'All UCC articles with state adoption information',
                            fullText: 'Cornell LII provides complete text of all UCC articles including Article 1 (General Provisions), Article 2 (Sales), Article 3 (Negotiable Instruments), Article 4 (Bank Deposits), and all others, with information about state adoptions and variations.',
                            keyPoints: [
                                'Complete UCC text all articles',
                                'State adoption tracking',
                                'Historical versions available',
                                'Cross-references and citations',
                                'Free public access',
                                'Regular updates from official sources'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/ucc'
                        },
                        {
                            section: 'Federal Resources',
                            title: 'Federal Commercial Regulations',
                            summary: 'Federal regulations affecting commercial transactions',
                            fullText: 'Federal oversight of commercial transactions through various agencies including Federal Reserve (Regulation CC), FDIC, OCC, and others. Includes anti-money laundering requirements, consumer protection laws, and international trade regulations.',
                            keyPoints: [
                                'Federal Reserve regulations',
                                'FDIC commercial banking rules',
                                'Consumer protection laws',
                                'Anti-money laundering (AML)',
                                'International trade compliance',
                                'Reporting requirements'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/cfr'
                        }
                    ]
                }
            ]
        },
        {
            id: 'legal-research',
            title: 'Legal Research Tools',
            description: 'Cornell LII research tools and legal databases',
            icon: '🔍',
            resources: [
                {
                    id: 'cornell-research-tools',
                    title: 'Cornell LII Research Platform',
                    category: 'research-tools',
                    summary: 'Free legal research tools including Wex Legal Encyclopedia, case law databases, and citation tools',
                    relevance: 'high',
                    lastUpdated: '2024-12-27',
                    source: 'cornell-lii',
                    url: 'https://www.law.cornell.edu/',
                    sections: [
                        {
                            section: 'Wex Encyclopedia',
                            title: 'Wex Legal Dictionary and Encyclopedia',
                            summary: 'Free legal encyclopedia with definitions and explanations',
                            fullText: 'Wex provides plain-English explanations of legal concepts, with comprehensive coverage of commercial law, constitutional law, and procedural topics. Maintained by law students and faculty at Cornell Law School.',
                            keyPoints: [
                                'Plain-English legal explanations',
                                'Comprehensive topic coverage',
                                'Regular updates and revisions',
                                'Cross-linked references',
                                'Free public access',
                                'Academic quality control'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/wex'
                        },
                        {
                            section: 'Case Law',
                            title: 'Supreme Court and Federal Cases',
                            summary: 'Complete Supreme Court opinions and federal case law',
                            fullText: 'Full text of Supreme Court decisions from 1990 onward, plus selected federal appellate and district court cases. Includes recent commercial law decisions affecting negotiable instruments and banking law.',
                            keyPoints: [
                                'Supreme Court decisions (1990+)',
                                'Selected federal appellate cases',
                                'Commercial law specialization',
                                'Full-text searchable database',
                                'Citation and linking tools',
                                'Regular updates with new decisions'
                            ],
                            cornellUrl: 'https://www.law.cornell.edu/supremecourt/text'
                        }
                    ]
                }
            ]
        }
    ];

    const filteredTopics = legalTopics.filter(topic =>
        activeTab === 'all' || topic.id === activeTab
    );

    const searchResults = legalTopics.flatMap(topic =>
        topic.resources.filter(resource =>
            resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.sections?.some(section => 
                section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                section.summary.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    );

    const toggleSection = (sectionId: string) => {
        setExpandedSection(expandedSection === sectionId ? null : sectionId);
    };

    const getRelevanceColor = (relevance: string) => {
        switch (relevance) {
            case 'critical': return '#dc3545';
            case 'high': return '#fd7e14';
            case 'medium': return '#ffc107';
            case 'low': return '#6c757d';
            default: return '#6c757d';
        }
    };

    return (
        <div className="component-card">
            <h3 style={{ color: '#2a5298', marginBottom: '20px' }}>
                🏛️ Cornell Law School Legal Knowledge Base
            </h3>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2a5298' }}>
                    📚 Powered by Cornell Legal Information Institute
                </h4>
                <p style={{ margin: '0', fontSize: '0.9rem' }}>
                    Authoritative legal resources from Cornell Law School's Legal Information Institute, 
                    providing free access to constitutional law, statutes, regulations, and case law.
                </p>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search legal resources, UCC sections, case law..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '1rem' }}
                />
            </div>

            {/* Topic Navigation */}
            <div className="tab-navigation" style={{ marginBottom: '20px' }}>
                <button 
                    className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    📋 All Resources
                </button>
                {legalTopics.map(topic => (
                    <button
                        key={topic.id}
                        className={`tab-button ${activeTab === topic.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(topic.id)}
                    >
                        {topic.icon} {topic.title}
                    </button>
                ))}
            </div>

            {/* Search Results */}
            {searchTerm && (
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>
                        🔍 Search Results ({searchResults.length})
                    </h4>
                    {searchResults.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                            <p>No resources found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        searchResults.map(resource => (
                            <div key={resource.id} className="component-card" style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h5 style={{ margin: 0, color: '#2a5298' }}>{resource.title}</h5>
                                    <span style={{ 
                                        color: getRelevanceColor(resource.relevance),
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        {resource.relevance}
                                    </span>
                                </div>
                                <p style={{ margin: '10px 0 0 0', color: '#6c757d' }}>{resource.summary}</p>
                                {resource.url && (
                                    <a 
                                        href={resource.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn btn-outline"
                                        style={{ marginTop: '10px' }}
                                    >
                                        🔗 View at Cornell LII
                                    </a>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Topic Content */}
            {!searchTerm && filteredTopics.map(topic => (
                <div key={topic.id} style={{ marginBottom: '30px' }}>
                    <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>
                        {topic.icon} {topic.title}
                    </h4>
                    <p style={{ marginBottom: '20px', color: '#6c757d' }}>{topic.description}</p>

                    {topic.resources.map(resource => (
                        <div key={resource.id} className="component-card" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <h5 style={{ margin: '0 0 10px 0', color: '#2a5298' }}>{resource.title}</h5>
                                    <p style={{ margin: '0 0 10px 0' }}>{resource.summary}</p>
                                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                                        <strong>Source:</strong> {resource.source.toUpperCase()} • 
                                        <strong> Updated:</strong> {resource.lastUpdated} •
                                        <span style={{ 
                                            color: getRelevanceColor(resource.relevance),
                                            fontWeight: 'bold',
                                            marginLeft: '5px'
                                        }}>
                                            {resource.relevance.toUpperCase()} PRIORITY
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {resource.url && (
                                <a 
                                    href={resource.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ marginBottom: '15px' }}
                                >
                                    🔗 View at Cornell LII
                                </a>
                            )}

                            {resource.sections && (
                                <div>
                                    <h6 style={{ color: '#2a5298', marginBottom: '10px' }}>📖 Detailed Sections:</h6>
                                    {resource.sections.map(section => (
                                        <div key={section.section} style={{ marginBottom: '15px' }}>
                                            <button
                                                onClick={() => toggleSection(`${resource.id}-${section.section}`)}
                                                className="btn btn-outline"
                                                style={{ width: '100%', textAlign: 'left', marginBottom: '10px' }}
                                            >
                                                <strong>{section.section}</strong> - {section.title}
                                                <span style={{ float: 'right' }}>
                                                    {expandedSection === `${resource.id}-${section.section}` ? '▼' : '▶'}
                                                </span>
                                            </button>
                                            
                                            {expandedSection === `${resource.id}-${section.section}` && (
                                                <div style={{ 
                                                    padding: '15px', 
                                                    background: '#f8f9fa', 
                                                    borderRadius: '8px',
                                                    border: '1px solid #dee2e6'
                                                }}>
                                                    <p><strong>Summary:</strong> {section.summary}</p>
                                                    <p><strong>Full Text:</strong> {section.fullText}</p>
                                                    <div>
                                                        <strong>Key Points:</strong>
                                                        <ul style={{ marginTop: '5px' }}>
                                                            {section.keyPoints.map((point, index) => (
                                                                <li key={index}>{point}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <a 
                                                        href={section.cornellUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="btn btn-link"
                                                    >
                                                        📖 Read Full Text at Cornell LII →
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            {/* Footer */}
            <div style={{ marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>📚 About Cornell Legal Information Institute</h4>
                <p style={{ marginBottom: '15px', fontSize: '0.9rem' }}>
                    The Legal Information Institute (LII) at Cornell Law School is a research, engineering, and editorial activity 
                    that has pioneered the free publication of law online since 1992. LII publishes law for free on the Internet 
                    in forms that are useful to legal professionals, educators, and the public.
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a 
                        href="https://www.law.cornell.edu/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                    >
                        🏛️ Visit Cornell LII
                    </a>
                    <a 
                        href="https://www.law.cornell.edu/ucc" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                    >
                        📜 UCC Complete Text
                    </a>
                    <a 
                        href="https://www.law.cornell.edu/wex" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                    >
                        📚 Wex Legal Encyclopedia
                    </a>
                </div>
            </div>
        </div>
    );
};

export default CornellLegalKnowledge;