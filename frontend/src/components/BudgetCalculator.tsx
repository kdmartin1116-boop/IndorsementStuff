import React, { useState, ChangeEvent } from 'react';

const BudgetCalculator: React.FC = () => {
    const [income, setIncome] = useState<string>('');
    const [expenses, setExpenses] = useState<string>('');
    const [result, setResult] = useState<React.ReactNode | null>(null);

    const calculateBudget = () => {
        if (income && expenses) {
            const surplus = parseFloat(income) - parseFloat(expenses);
            if (surplus >= 0) {
                setResult(<p>Your monthly surplus is: <strong>${surplus.toFixed(2)}</strong></p>);
            } else {
                setResult(<p>Your monthly deficit is: <strong>${Math.abs(surplus).toFixed(2)}</strong></p>);
            }
        } else {
            setResult(<p>Please enter both your income and expenses.</p>);
        }
    };

    const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
    };

    return (
        <>
            <hr />
            <h2>Budget Calculator</h2>
            <div className="calculator">
                <div className="form-group">
                    <label htmlFor="income">Monthly Income:</label>
                    <input type="number" id="income" placeholder="Enter your monthly income" value={income} onChange={handleChange(setIncome)} />
                </div>
                <div className="form-group">
                    <label htmlFor="expenses">Monthly Expenses:</label>
                    <input type="number" id="expenses" placeholder="Enter your total monthly expenses" value={expenses} onChange={handleChange(setExpenses)} />
                </div>
                <button onClick={calculateBudget}>Calculate</button>
                <div id="result">{result}</div>
            </div>
        </>
    );
};

export default BudgetCalculator;
