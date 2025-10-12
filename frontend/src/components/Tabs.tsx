import React, { useState, ReactElement, Children, useEffect } from 'react';

interface TabPaneProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

interface TabsProps {
    children: ReactElement<TabPaneProps>[];
}

const Tabs: React.FC<TabsProps> = ({ children }) => {
    // Persist active tab in localStorage to prevent resets
    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('activeTab');
        return savedTab || children[0].props.id;
    });

    // Save active tab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    return (
        <div className="tab-container">
            <div className="tab-buttons">
                {Children.map(children, child => (
                    <button
                        key={child.props.id}
                        className={`tab-button ${activeTab === child.props.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(child.props.id)}
                    >
                        {child.props.title}
                    </button>
                ))}
            </div>
            <div className="tab-content-wrapper">
                {Children.map(children, child => {
                    if (child.props.id === activeTab) {
                        return <div key={child.props.id} className="tab-content active">{child.props.children}</div>;
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export default Tabs;
