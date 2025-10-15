import React, { useState } from 'react';
import { legalContent } from './legalData';

type Section = keyof typeof legalContent | null;

const LegalKnowledge: React.FC = () => {
    const [openSection, setOpenSection] = useState<Section>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleSection = (section: Section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const filteredGlossary = legalContent.glossary.terms.filter(item =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <h2>Legal Knowledge</h2>

            {Object.keys(legalContent).map(sectionKey => {
                const section = legalContent[sectionKey as keyof typeof legalContent];
                const isGlossary = sectionKey === 'glossary';
                const isMistakes = sectionKey === 'mistakes';

                return (
                    <div className="collapsible" key={sectionKey}>
                        <button
                            className="collapsible-button"
                            onClick={() => toggleSection(sectionKey as keyof typeof legalContent)}
                            aria-expanded={openSection === sectionKey}
                        >
                            {section.title} <i className={`fas ${openSection === sectionKey ? 'fa-minus' : 'fa-plus'}`}></i>
                        </button>
                        <div className="collapsible-content" style={{ maxHeight: openSection === sectionKey ? 'fit-content' : '0px' }}>
                            <p>{section.intro}</p>
                            <p><strong>Disclaimer:</strong> {section.disclaimer}</p>
                            
                            {isGlossary ? (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search glossary..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{ marginBottom: '1rem' }}
                                    />
                                    <dl>
                                        {filteredGlossary.map(item => (
                                            <React.Fragment key={item.term}>
                                                <dt>{item.term}</dt>
                                                <dd>{item.definition}</dd>
                                            </React.Fragment>
                                        ))}
                                    </dl>
                                </>
                            ) : isMistakes ? (
                                <>
                                    {section.points.map(point => (
                                        <div key={point.title}>
                                            <h4>{point.title}</h4>
                                            <ul>
                                                {point.items.map((item, index) => (
                                                    <li key={index}>
                                                        {item.bold ? <strong>{item.text}</strong> : item.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {section.points.map(point => (
                                        <div key={point.title}>
                                            <h4>{point.title}</h4>
                                            <ul>
                                                {point.items.map((item, index) => (
                                                    <li key={index}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                    {section.outro && <p><em>{section.outro}</em></p>}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default LegalKnowledge;
