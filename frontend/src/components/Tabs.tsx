import React, { useState, ReactElement, Children } from 'react';

interface TabPaneProps {
    id: string;
    title: string;
    children: React.ReactNode;
}

interface TabsProps {
    children: ReactElement<TabPaneProps>[];
}

const Tabs: React.FC<TabsProps> = ({ children }) => {
    const [activeTab, setActiveTab] = useState(children[0].props.id);

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
