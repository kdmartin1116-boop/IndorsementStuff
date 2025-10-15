import React, { useState } from 'react';

interface LegalStatusInfo {
    status: string;
    description: string;
    cornellReference: string;
    legalBasis: string;
    requirements: string[];
    limitations: string[];
}

const StateNationalStatus: React.FC = () => {
    const [acknowledged, setAcknowledged] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    
    const legalStatusTypes: LegalStatusInfo[] = [
        {
            status: 'U.S. Citizen',
            description: 'Full legal status with complete constitutional rights and obligations under U.S. law',
            cornellReference: 'https://www.law.cornell.edu/uscode/text/8/1401',
            legalBasis: '8 USC § 1401 - Nationals and citizens of United States at birth',
            requirements: ['Born in United States', 'Naturalized through legal process', 'Born to U.S. citizen parents'],
            limitations: ['Subject to full U.S. tax obligations', 'Cannot renounce without formal process']
        },
        {
            status: 'Non-Citizen U.S. National',
            description: 'Limited legal status for individuals from U.S. territories with allegiance but not full citizenship',
            cornellReference: 'https://www.law.cornell.edu/uscode/text/8/1408',
            legalBasis: '8 USC § 1408 - Nationals but not citizens at birth',
            requirements: ['Born in American Samoa or Swains Island', 'Born to national parents with residency', 'Historical Northern Mariana Islands option'],
            limitations: ['Cannot vote in federal elections', 'Limited consular protection', 'Must naturalize for full citizenship']
        },
        {
            status: 'Commercial Paper Holder Rights',
            description: 'Rights and obligations under UCC Article 3 for holders of negotiable instruments',
            cornellReference: 'https://www.law.cornell.edu/ucc/3/3-302',
            legalBasis: 'UCC § 3-302 - Holder in due course requirements',
            requirements: ['Valid negotiable instrument', 'Good faith acquisition', 'Value given', 'No notice of defects'],
            limitations: ['Subject to real defenses', 'Must follow proper endorsement procedures', 'Statute of limitations applies']
        }
    ];

    const handleAcknowledgement = () => {
        setAcknowledged(!acknowledged);
    };

    return (
        <>
            <h2>📋 Legal Status Management & Cornell Legal Knowledge</h2>

            {/* Cornell Legal Knowledge Integration */}
            <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #d0e7ff' }}>
                <h3 style={{ color: '#2a5298', marginBottom: '15px' }}>🏛️ Cornell Law School Legal Framework</h3>
                <p style={{ margin: '0 0 15px 0', color: '#555' }}>
                    This section provides authoritative legal information based on Cornell Legal Information Institute 
                    resources, including U.S. Code, UCC Article 3, and federal regulations governing legal status and commercial paper rights.
                </p>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {legalStatusTypes.map((statusType, index) => (
                        <div key={index} style={{ 
                            flex: '1', 
                            minWidth: '300px', 
                            padding: '15px', 
                            backgroundColor: '#ffffff', 
                            borderRadius: '6px', 
                            border: '1px solid #e0e0e0' 
                        }}>
                            <h4 style={{ color: '#2a5298', marginBottom: '10px', fontSize: '1rem' }}>{statusType.status}</h4>
                            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '10px', lineHeight: '1.4' }}>
                                {statusType.description}
                            </p>
                            <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '8px' }}>
                                <strong>Legal Basis:</strong> {statusType.legalBasis}
                            </div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                                <strong>Requirements:</strong>
                                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                                    {statusType.requirements.slice(0, 2).map((req, i) => (
                                        <li key={i} style={{ color: '#555' }}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                            <a href={statusType.cornellReference} target="_blank" rel="noopener noreferrer" 
                               style={{ fontSize: '0.75rem', color: '#007bff', textDecoration: 'none' }}>
                                📖 Cornell Law Reference
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        📋 Legal Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('commercial')}
                        className={`btn ${activeTab === 'commercial' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        💼 Commercial Rights
                    </button>
                    <button 
                        onClick={() => setActiveTab('compliance')}
                        className={`btn ${activeTab === 'compliance' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        ⚖️ Compliance Guide
                    </button>
                </div>
            </div>

            {/* Warning Section */}
            <div className="warning" style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '1rem' }}>
                <h3>🛑 EXTREMELY IMPORTANT LEGAL WARNING 🛑</h3>
                <p>
                    <strong>The information presented in this section is for educational and informational purposes only. It is crucial to understand the distinction between a legally recognized "non-citizen U.S. National" and the claims made by "American State National" (ASN) or "sovereign citizen" movements.</strong>
                </p>
                <p>
                    <strong>Legally recognized non-citizen U.S. National status primarily applies to individuals born in or with ties to certain U.S. outlying possessions (e.g., American Samoa, Swains Island). This status is defined by U.S. law and is distinct from U.S. citizenship. For more information, please refer to the official U.S. government sources: <a href="https://www.uscis.gov/policy-manual/volume-12-part-a-chapter-3" target="_blank" rel="noopener noreferrer">U.S. Citizenship and Immigration Services (USCIS)</a> and <a href="https://travel.state.gov/content/travel/en/legal/travel-legal-considerations/us-citizenship/Certificates-Non-Citizen-Nationality.html" target="_blank" rel="noopener noreferrer">U.S. Department of State</a>.</strong>
                </p>
                <p>
                    <strong>Conversely, the theories and methods promoted by "American State National" or "sovereign citizen" movements are NOT recognized or accepted by the United States legal system. Attempting to use these methods can have severe legal and financial consequences, including but not limited to, fines, imprisonment, and the loss of property. Law enforcement agencies identify these movements as a source of legal and physical confrontations.</strong>
                </p>
                <p>
                    <strong>YOU MUST CONSULT WITH A QUALIFIED LEGAL PROFESSIONAL BEFORE TAKING ANY ACTION BASED ON THE INFORMATION PRESENTED HERE. RELIANCE ON SOVEREIGN CITIZEN THEORIES IS ENTIRELY AT YOUR OWN RISK AND CAN LEAD TO SERIOUS ADVERSE OUTCOMES.</strong>
                </p>
                <hr />
                <label>
                    <input type="checkbox" checked={acknowledged} onChange={handleAcknowledgement} />
                    <strong> I acknowledge that I have read and understood the above warning.</strong>
                </label>
            </div>

            {acknowledged && (
                <>
                    {activeTab === 'overview' && (
                        <div>
                            <h3>🏛️ Cornell Legal Knowledge: U.S. Nationality and Citizenship Framework</h3>
                            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
                                <h4 style={{ color: '#2a5298' }}>📖 Authoritative Legal Sources</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                                    <a href="https://www.law.cornell.edu/uscode/text/8/1401" target="_blank" rel="noopener noreferrer" 
                                       style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', textDecoration: 'none', border: '1px solid #e0e0e0' }}>
                                        <div style={{ color: '#2a5298', fontWeight: 'bold', fontSize: '0.9rem' }}>8 USC § 1401</div>
                                        <div style={{ color: '#555', fontSize: '0.8rem' }}>Nationals and Citizens at Birth</div>
                                    </a>
                                    <a href="https://www.law.cornell.edu/uscode/text/8/1408" target="_blank" rel="noopener noreferrer" 
                                       style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', textDecoration: 'none', border: '1px solid #e0e0e0' }}>
                                        <div style={{ color: '#2a5298', fontWeight: 'bold', fontSize: '0.9rem' }}>8 USC § 1408</div>
                                        <div style={{ color: '#555', fontSize: '0.8rem' }}>Nationals but not Citizens</div>
                                    </a>
                                    <a href="https://www.law.cornell.edu/constitution/amendmentxiv" target="_blank" rel="noopener noreferrer" 
                                       style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', textDecoration: 'none', border: '1px solid #e0e0e0' }}>
                                        <div style={{ color: '#2a5298', fontWeight: 'bold', fontSize: '0.9rem' }}>14th Amendment</div>
                                        <div style={{ color: '#555', fontSize: '0.8rem' }}>Constitutional Citizenship</div>
                                    </a>
                                </div>
                            </div>

                            <h3>1. Understanding U.S. Nationality and Citizenship (Cornell Framework)</h3>
                    <p>
                        The Immigration and Nationality Act (INA) defines a "national" as "a person owing permanent allegiance to a state." A "national of the United States" includes all U.S. citizens and those who, though not citizens, owe permanent allegiance to the United States (non-citizen nationals).
                    </p>
                    <ul>
                        <li><strong>U.S. Citizen:</strong> Enjoys full political rights, including voting in federal elections. All U.S. citizens are U.S. nationals.</li>
                        <li><strong>Non-Citizen U.S. National:</strong> Owes permanent allegiance to the U.S. but does not possess full political rights. This status primarily applies to individuals born in or with ties to U.S. outlying possessions like American Samoa and Swains Island. They can reside and work in the U.S. without restrictions and are protected by the U.S. Bill of Rights. They can also hold a U.S. passport, which will indicate their status as a national but not a citizen.</li>
                        <li><strong>Sovereign Citizen Movement:</strong> This anti-government ideology asserts that individuals can declare themselves "sovereign" and immune from U.S. laws, courts, and government authority. These claims are not legally recognized and have severe legal consequences.</li>
                    </ul>

                    <h3>2. Acquisition of Legally Recognized Non-Citizen National Status</h3>
                    <p>
                        Legally recognized non-citizen U.S. National status is typically acquired through:
                    </p>
                    <ul>
                        <li><strong>Birth:</strong> Individuals born in American Samoa or Swains Island are automatically non-citizen U.S. nationals.</li>
                        <li><strong>Parentage:</strong> Individuals born outside these territories may qualify if one or both parents are non-citizen nationals and specific residency requirements are met.</li>
                        <li><strong>Option:</strong> Historically, certain inhabitants of the Commonwealth of the Northern Mariana Islands had the option to choose non-citizen national status under specific conditions.</li>
                    </ul>

                    <h3>3. Documentation for Legally Recognized Status</h3>
                    <p>
                        To formalize legally recognized non-citizen U.S. National status, individuals can apply for a U.S. passport.
                    </p>
                    <ul>
                        <li><strong>U.S. Passport Application:</strong> This involves completing Form DS-11 and providing documentary proof of your non-citizen national status and identity. The U.S. Department of State handles these applications.</li>
                        <li><strong>No Separate Certificates:</strong> The Department of State does not issue separate "Certificates of Non-Citizen Nationality" due to low demand.</li>
                        <li><strong>Warning against Sovereign Citizen Documents:</strong> Be extremely wary of any groups or individuals promoting "non-national citizen" passports, "Declarations of Status," "Fee Schedules," or "Notices of Revocation of Power of Attorney" outside of the official U.S. government processes. These documents are not legally recognized and can lead to legal trouble.</li>
                    </ul>

                    <h3>4. Transition to U.S. Citizenship</h3>
                    <p>
                        Legally recognized non-citizen nationals can apply for naturalization to become U.S. citizens. The process is similar to that for legal permanent residents and requires meeting eligibility criteria such as residency requirements, demonstrating good moral character, knowledge of English and civics, and attachment to the U.S. Constitution.
                    </p>

                    <h3>5. Risks and Misinformation from Sovereign Citizen Movements</h3>
                    <p>
                        Adhering to the beliefs of sovereign citizen movements and acting outside the recognized legal framework can lead to significant legal problems.
                    </p>
                    <ul>
                        <li><strong>Immunity Claims are False:</strong> Claims by sovereign citizen groups that "State National Status" grants immunity from U.S. laws, courts, and government authority are false and not recognized by any court in the United States.</li>
                        <li><strong>Legal Consequences:</strong> Individuals attempting to use sovereign citizen arguments have faced arrest, fines, imprisonment, and loss of property. This includes confrontations with law enforcement and prosecution for various offenses, including tax evasion, fraud, and obstruction of justice.</li>
                        <li><strong>Misleading Documents:</strong> Documents promoted by these movements (e.g., "non-national citizen" passports, UCC filings to claim ownership of a "strawman") have no legal standing and can be considered fraudulent.</li>
                        <li><strong>Impact on Naturalization:</strong> For legally recognized non-citizen nationals seeking U.S. citizenship, any association with sovereign citizen ideologies or activities could negatively impact their naturalization application.</li>
                    </ul>

                    <p>
                        <strong>Always consult with a qualified legal professional for accurate and reliable advice regarding your legal status and any related processes.</strong>
                    </p>
                        </div>
                    )}

                    {activeTab === 'commercial' && (
                        <div>
                            <h3>💼 Commercial Paper Rights & Cornell UCC Framework</h3>
                            <div style={{ padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px', marginBottom: '20px' }}>
                                <h4 style={{ color: '#2a5298' }}>📖 UCC Article 3 - Negotiable Instruments</h4>
                                <p style={{ margin: '0 0 15px 0', color: '#555' }}>
                                    Under Cornell Law School's comprehensive UCC Article 3 framework, holders of commercial paper have specific rights and obligations.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                                    <div style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                        <h5 style={{ color: '#2a5298', marginBottom: '10px' }}>Holder in Due Course Rights</h5>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>UCC § 3-302 establishes protection against personal defenses</p>
                                        <a href="https://www.law.cornell.edu/ucc/3/3-302" target="_blank" rel="noopener noreferrer" 
                                           style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.85rem' }}>
                                            📖 Cornell UCC § 3-302
                                        </a>
                                    </div>
                                    <div style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                        <h5 style={{ color: '#2a5298', marginBottom: '10px' }}>Negotiation Requirements</h5>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>UCC § 3-201 governs proper transfer of instruments</p>
                                        <a href="https://www.law.cornell.edu/ucc/3/3-201" target="_blank" rel="noopener noreferrer" 
                                           style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.85rem' }}>
                                            📖 Cornell UCC § 3-201
                                        </a>
                                    </div>
                                    <div style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                        <h5 style={{ color: '#2a5298', marginBottom: '10px' }}>Indorsement Rules</h5>
                                        <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>UCC § 3-205 defines special, blank, and restrictive indorsements</p>
                                        <a href="https://www.law.cornell.edu/ucc/3/3-205" target="_blank" rel="noopener noreferrer" 
                                           style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.85rem' }}>
                                            📖 Cornell UCC § 3-205
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'compliance' && (
                        <div>
                            <h3>⚖️ Legal Compliance Guide - Cornell Framework</h3>
                            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
                                <h4 style={{ color: '#2a5298' }}>📋 Compliance Checklist</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                    <div style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                        <h5 style={{ color: '#28a745', marginBottom: '10px' }}>✅ Legally Recognized Status Types</h5>
                                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                            <li>U.S. Citizen (8 USC § 1401)</li>
                                            <li>Non-Citizen U.S. National (8 USC § 1408)</li>
                                            <li>Holder in Due Course (UCC § 3-302)</li>
                                        </ul>
                                    </div>
                                    <div style={{ padding: '15px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                                        <h5 style={{ color: '#dc3545', marginBottom: '10px' }}>❌ Legally Invalid Claims</h5>
                                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                            <li>"Sovereign Citizen" status (not recognized by any court)</li>
                                            <li>"Strawman" theories (legally baseless)</li>
                                            <li>UCC financing statement "redemption" (fraudulent)</li>
                                        </ul>
                                    </div>
                                </div>
                                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404' }}>
                                        <strong>⚠️ Warning:</strong> Always verify legal status claims through official Cornell Legal Information Institute sources and consult qualified legal counsel.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default StateNationalStatus;
