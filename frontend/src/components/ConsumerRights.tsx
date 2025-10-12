import React from 'react';

const ConsumerRights: React.FC = () => {
    return (
        <>
            <h2>Understanding Your Consumer Rights</h2>
            
            <div className="info-box" style={{
                backgroundColor: '#e8f5e8',
                border: '2px solid #4CAF50',
                borderRadius: '5px',
                padding: '15px',
                margin: '15px 0'
            }}>
                <h3>✅ Legitimate Consumer Protections</h3>
                <p>These are <strong>real, court-recognized rights</strong> that actually protect consumers:</p>
            </div>

            <h3>Federal Consumer Protection Laws</h3>
            
            <h4>1. Fair Debt Collection Practices Act (FDCPA)</h4>
            <ul>
                <li><strong>What it does:</strong> Protects you from abusive debt collection practices</li>
                <li><strong>Your rights:</strong> Debt collectors cannot harass, threaten, or lie to you</li>
                <li><strong>How to use it:</strong> Request debt validation, report violations to CFPB</li>
                <li><strong>Enforcement:</strong> You can sue for violations and recover damages</li>
            </ul>

            <h4>2. Fair Credit Reporting Act (FCRA)</h4>
            <ul>
                <li><strong>What it does:</strong> Regulates credit reporting agencies</li>
                <li><strong>Your rights:</strong> Free credit reports, dispute inaccuracies, sue for violations</li>
                <li><strong>How to use it:</strong> Check reports annually, dispute errors in writing</li>
                <li><strong>Time limits:</strong> Most negative info must be removed after 7 years</li>
            </ul>

            <h4>3. Truth in Lending Act (TILA)</h4>
            <ul>
                <li><strong>What it does:</strong> Requires clear disclosure of loan terms</li>
                <li><strong>Your rights:</strong> Know the true cost of credit before you borrow</li>
                <li><strong>Rescission rights:</strong> Cancel certain loans within 3 days</li>
                <li><strong>Violations:</strong> Can result in damages and attorney fees</li>
            </ul>

            <h4>4. Fair Credit Billing Act (FCBA)</h4>
            <ul>
                <li><strong>What it does:</strong> Protects against billing errors on credit cards</li>
                <li><strong>Your rights:</strong> Dispute charges, withhold payment during disputes</li>
                <li><strong>Process:</strong> Write to creditor within 60 days of statement</li>
                <li><strong>Timeline:</strong> Creditor must respond within 30 days</li>
            </ul>

            <h3>State Consumer Protection Laws</h3>
            <ul>
                <li><strong>Unfair and Deceptive Practices Acts:</strong> Most states have these</li>
                <li><strong>Lemon Laws:</strong> Protection for defective vehicles</li>
                <li><strong>Home Improvement Contractor Laws:</strong> Licensing and bonding requirements</li>
                <li><strong>Telemarketing Restrictions:</strong> Do Not Call registries</li>
            </ul>

            <h3>Effective Legal Strategies That Actually Work</h3>
            
            <h4>For Debt Issues:</h4>
            <ol>
                <li><strong>Request debt validation</strong> under FDCPA within 30 days</li>
                <li><strong>Negotiate payment plans</strong> directly with creditors</li>
                <li><strong>Consider bankruptcy</strong> with proper legal counsel if overwhelmed</li>
                <li><strong>Use credit counseling</strong> from HUD-approved agencies</li>
            </ol>

            <h4>For Credit Report Problems:</h4>
            <ol>
                <li><strong>Dispute inaccuracies</strong> in writing with credit bureaus</li>
                <li><strong>Contact furnishers</strong> (original creditors) directly</li>
                <li><strong>Document everything</strong> - keep copies of all correspondence</li>
                <li><strong>Know your rights</strong> under FCRA and state laws</li>
            </ol>

            <h3>Resources for Help</h3>
            <ul>
                <li><strong>Consumer Financial Protection Bureau:</strong> https://www.consumerfinance.gov/</li>
                <li><strong>Federal Trade Commission:</strong> https://www.ftc.gov/</li>
                <li><strong>National Association of Consumer Advocates:</strong> https://www.consumeradvocates.org/</li>
                <li><strong>Legal Aid Societies:</strong> https://www.lsc.gov/find-legal-aid/</li>
            </ul>

            <div className="warning" style={{
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '5px',
                padding: '15px',
                margin: '15px 0'
            }}>
                <h3>⚖️ Important Legal Advice</h3>
                <p>These consumer protections are <strong>recognized by courts</strong> and have helped millions of Americans. Unlike sovereign citizen theories, these laws are:</p>
                <ul>
                    <li>✅ Recognized by all courts</li>
                    <li>✅ Enforced by government agencies</li>
                    <li>✅ Have resulted in billions in consumer recoveries</li>
                    <li>✅ Safe to use with proper legal guidance</li>
                </ul>
            </div>
        </>
    );
};

export default ConsumerRights;