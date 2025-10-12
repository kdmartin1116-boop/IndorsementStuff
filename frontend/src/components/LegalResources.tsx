import React from 'react';

const LegalResources: React.FC = () => {
    return (
        <>
            <h2>Legitimate Legal Resources and How to Get Help</h2>
            
            <div className="info-box" style={{
                backgroundColor: '#e3f2fd',
                border: '2px solid #2196F3',
                borderRadius: '5px',
                padding: '15px',
                margin: '15px 0'
            }}>
                <h3>🏛️ Finding Real Legal Help</h3>
                <p>When you have legal problems, these are the <strong>legitimate, court-recognized resources</strong> that can actually help you:</p>
            </div>

            <h3>1. Finding Qualified Legal Representation</h3>
            
            <h4>State Bar Associations</h4>
            <ul>
                <li><strong>Lawyer Referral Services:</strong> Most state bars offer referral services</li>
                <li><strong>Disciplinary Records:</strong> Check if an attorney has any disciplinary actions</li>
                <li><strong>Specialization:</strong> Find attorneys certified in specific practice areas</li>
                <li><strong>Fee Information:</strong> Many offer initial consultations at reduced rates</li>
            </ul>

            <h4>Legal Aid Organizations</h4>
            <ul>
                <li><strong>Legal Services Corporation (LSC):</strong> https://www.lsc.gov/find-legal-aid/</li>
                <li><strong>Income Eligibility:</strong> Free legal services for low-income individuals</li>
                <li><strong>Practice Areas:</strong> Housing, family law, benefits, consumer issues</li>
                <li><strong>Pro Bono Programs:</strong> Volunteer attorneys providing free services</li>
            </ul>

            <h3>2. Self-Help Legal Resources</h3>
            
            <h4>Court Self-Help Centers</h4>
            <ul>
                <li><strong>Forms and Instructions:</strong> Court-approved forms for common legal issues</li>
                <li><strong>Procedural Guidance:</strong> How to file documents, deadlines, requirements</li>
                <li><strong>Limited Scope Representation:</strong> Attorneys who help with specific tasks</li>
                <li><strong>Workshops:</strong> Many courts offer free legal workshops</li>
            </ul>

            <h4>Legal Information Websites</h4>
            <ul>
                <li><strong>Justia:</strong> https://www.justia.com/ - Free legal information</li>
                <li><strong>Nolo:</strong> https://www.nolo.com/ - Self-help legal guides</li>
                <li><strong>FindLaw:</strong> https://www.findlaw.com/ - Legal information and attorney directory</li>
                <li><strong>Avvo:</strong> https://www.avvo.com/ - Attorney ratings and free legal advice</li>
            </ul>

            <h3>3. Specialized Legal Help</h3>
            
            <h4>For Consumer/Debt Issues:</h4>
            <ul>
                <li><strong>National Association of Consumer Advocates:</strong> https://www.consumeradvocates.org/</li>
                <li><strong>National Consumer Law Center:</strong> https://www.nclc.org/</li>
                <li><strong>Consumer Financial Protection Bureau:</strong> https://www.consumerfinance.gov/</li>
            </ul>

            <h4>For Immigration Issues:</h4>
            <ul>
                <li><strong>American Immigration Lawyers Association:</strong> https://www.aila.org/</li>
                <li><strong>Legal Aid Immigration Services:</strong> Many legal aid societies have immigration attorneys</li>
                <li><strong>USCIS:</strong> https://www.uscis.gov/ - Official immigration information</li>
            </ul>

            <h4>For Criminal Defense:</h4>
            <ul>
                <li><strong>National Association of Criminal Defense Lawyers:</strong> https://www.nacdl.org/</li>
                <li><strong>Public Defender Offices:</strong> Free representation for eligible defendants</li>
                <li><strong>State Criminal Defense Bar Associations:</strong> Referrals to qualified attorneys</li>
            </ul>

            <h3>4. Understanding Legal Costs</h3>
            
            <h4>Types of Fee Arrangements:</h4>
            <ul>
                <li><strong>Hourly Rates:</strong> Most common for complex matters</li>
                <li><strong>Flat Fees:</strong> Common for simple matters like wills, simple divorces</li>
                <li><strong>Contingency Fees:</strong> Attorney paid only if you win (personal injury, some consumer cases)</li>
                <li><strong>Limited Scope:</strong> Hire attorney for specific tasks only</li>
            </ul>

            <h4>Ways to Reduce Legal Costs:</h4>
            <ul>
                <li><strong>Be Prepared:</strong> Organize documents, write timeline of events</li>
                <li><strong>Ask Questions:</strong> Understand the process and likely costs upfront</li>
                <li><strong>Consider Alternatives:</strong> Mediation, arbitration, negotiation</li>
                <li><strong>Legal Insurance:</strong> Some employers offer legal insurance plans</li>
            </ul>

            <h3>5. Red Flags to Avoid</h3>
            
            <div className="warning" style={{
                backgroundColor: '#ffebee',
                border: '2px solid #f44336',
                borderRadius: '5px',
                padding: '15px',
                margin: '15px 0'
            }}>
                <h4>🚨 Warning Signs of Legal Scams</h4>
                <ul>
                    <li><strong>Promises to eliminate all debt</strong> without bankruptcy</li>
                    <li><strong>Claims about "secret" legal strategies</strong> courts don't know about</li>
                    <li><strong>"Sovereign citizen" or "state national" services</strong></li>
                    <li><strong>UCC filing services</strong> claiming to access secret accounts</li>
                    <li><strong>Constitutional law arguments</strong> that ignore established precedent</li>
                    <li><strong>Guaranteed outcomes</strong> in legal matters</li>
                </ul>
            </div>

            <h3>6. How Courts Actually Work</h3>
            
            <h4>Basic Legal Principles:</h4>
            <ul>
                <li><strong>Precedent (Stare Decisis):</strong> Courts follow previous decisions</li>
                <li><strong>Jurisdiction:</strong> Courts have specific authority over certain matters</li>
                <li><strong>Burden of Proof:</strong> Who must prove what in different types of cases</li>
                <li><strong>Evidence Rules:</strong> What information can be presented in court</li>
            </ul>

            <h4>Court Procedures:</h4>
            <ul>
                <li><strong>Filing Deadlines:</strong> Strict time limits that must be followed</li>
                <li><strong>Service of Process:</strong> Proper notification of legal actions</li>
                <li><strong>Discovery:</strong> Pre-trial information gathering process</li>
                <li><strong>Appeals:</strong> Process for challenging court decisions</li>
            </ul>

            <div className="success" style={{
                backgroundColor: '#e8f5e8',
                border: '2px solid #4CAF50',
                borderRadius: '5px',
                padding: '15px',
                margin: '15px 0'
            }}>
                <h3>✅ Key Takeaway</h3>
                <p><strong>The legal system works when you use legitimate strategies and proper legal representation.</strong> Courts recognize established law, proper procedures, and qualified attorneys. Avoid any "legal strategy" that claims courts don't understand or that offers shortcuts around established legal principles.</p>
            </div>
        </>
    );
};

export default LegalResources;