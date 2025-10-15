import React, { useState, useEffect } from 'react';

const checklistItems = [
    { id: 'track-expenses', label: 'Track your income and expenses for at least 30 days.' },
    { id: 'create-budget', label: 'Create a monthly budget that allocates your income to your expenses, savings, and debt repayment.' },
    { id: 'review-budget', label: 'Review your budget regularly and make adjustments as needed.' },
    { id: 'open-emergency-fund', label: 'Open a separate savings account for your emergency fund.' },
    { id: 'save-1000', label: 'Start by saving at least $1,000.' },
    { id: 'save-3-6-months', label: 'Aim to save 3-6 months of living expenses in your emergency fund.' },
    { id: 'list-debts', label: 'Make a list of all your debts, including the total amount, interest rate, and minimum monthly payment.' },
    { id: 'choose-debt-strategy', label: 'Choose a debt repayment strategy (e.g., debt snowball or debt avalanche).' },
    { id: 'make-extra-payments', label: 'Make extra payments on your highest-priority debt whenever possible.' },
    { id: 'check-credit-report', label: 'Check your credit report for errors.' },
    { id: 'pay-bills-on-time', label: 'Pay your bills on time, every time.' },
    { id: 'keep-credit-utilization-low', label: 'Keep your credit utilization low.' },
    { id: 'contribute-to-401k', label: 'If your employer offers a retirement plan (e.g., 401(k)), contribute enough to get the full employer match.' },
    { id: 'open-ira', label: 'Consider opening an Individual Retirement Account (IRA).' },
    { id: 'increase-retirement-contributions', label: 'Increase your retirement contributions over time.' },
];

const FinancialHealthChecklist: React.FC = () => {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('financialHealthChecklist');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('financialHealthChecklist', JSON.stringify(checkedItems));
    }, [checkedItems]);

    const handleCheckboxChange = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <>
            <h2>Financial Health Checklist</h2>
            <p>This checklist is designed to help you build a strong financial foundation, inspired by the principles of financial coach Brandon Joe Miller. A strong financial foundation is the first step towards achieving financial independence and building generational wealth.</p>
            <p><strong>Disclaimer:</strong> This information is for educational purposes only and does not constitute financial advice. Consult with a qualified financial advisor to discuss your specific situation.</p>
            
            <h3>1. Create a Budget</h3>
            <ul>
                {checklistItems.slice(0, 3).map(item => (
                    <li key={item.id}>
                        <input
                            type="checkbox"
                            id={item.id}
                            checked={!!checkedItems[item.id]}
                            onChange={() => handleCheckboxChange(item.id)}
                        />
                        <label htmlFor={item.id}>{item.label}</label>
                    </li>
                ))}
            </ul>

            <h3>2. Build an Emergency Fund</h3>
            <ul>
                {checklistItems.slice(3, 6).map(item => (
                    <li key={item.id}>
                        <input
                            type="checkbox"
                            id={item.id}
                            checked={!!checkedItems[item.id]}
                            onChange={() => handleCheckboxChange(item.id)}
                        />
                        <label htmlFor={item.id}>{item.label}</label>
                    </li>
                ))}
            </ul>

            <h3>3. Pay Down Debt</h3>
            <ul>
                {checklistItems.slice(6, 9).map(item => (
                    <li key={item.id}>
                        <input
                            type="checkbox"
                            id={item.id}
                            checked={!!checkedItems[item.id]}
                            onChange={() => handleCheckboxChange(item.id)}
                        />
                        <label htmlFor={item.id}>{item.label}</label>
                    </li>
                ))}
            </ul>

            <h3>4. Improve Your Credit</h3>
            <ul>
                {checklistItems.slice(9, 12).map(item => (
                    <li key={item.id}>
                        <input
                            type="checkbox"
                            id={item.id}
                            checked={!!checkedItems[item.id]}
                            onChange={() => handleCheckboxChange(item.id)}
                        />
                        <label htmlFor={item.id}>{item.label}</label>
                    </li>
                ))}
            </ul>

            <h3>5. Plan for Retirement</h3>
            <ul>
                {checklistItems.slice(12, 15).map(item => (
                    <li key={item.id}>
                        <input
                            type="checkbox"
                            id={item.id}
                            checked={!!checkedItems[item.id]}
                            onChange={() => handleCheckboxChange(item.id)}
                        />
                        <label htmlFor={item.id}>{item.label}</label>
                    </li>
                ))}
            </ul>
        </>
    );
};

export default FinancialHealthChecklist;
