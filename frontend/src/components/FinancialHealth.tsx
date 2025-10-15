import React from 'react';
import FinancialHealthChecklist from './FinancialHealthChecklist';
import BudgetCalculator from './BudgetCalculator';

const FinancialHealth: React.FC = () => {
    return (
        <>
            <FinancialHealthChecklist />
            <BudgetCalculator />
        </>
    );
};

export default FinancialHealth;
