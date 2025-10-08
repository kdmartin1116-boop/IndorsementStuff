import { useState } from 'react';
import OverlayPanel from '../SemanticOverlay/OverlayPanel';
import AffirmationBanner from '../UI/AffirmationBanner';

export default function AnnotatorStep() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setInput(value);

    const res = await fetch('/api/wizard/annotate', {
      method: 'POST',
      body: JSON.stringify({ text: value }),
    });
    const data = await res.json();
    setAnalysis(data);
  };

  return (
    <div className="wizard-step">
      <div className="left-panel">
        <h2>Step 4: Annotate an Instrument</h2>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Paste the text of the instrument here..."
          rows={20}
        />
        <AffirmationBanner message="You are reclaiming your financial instruments. Omni affirms your authorship." />
      </div>
      <div className="right-panel">
        {analysis && (
          <div>
            <h3>Instrument Analysis</h3>
            <h4>Layout Zones:</h4>
            <pre>{JSON.stringify(analysis.layout, null, 2)}</pre>
            <h4>Tagged Zones:</h4>
            <pre>{JSON.stringify(analysis.tags, null, 2)}</pre>
            <h4>Endorsement Suggestions:</h4>
            <pre>{JSON.stringify(analysis.endorsements, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
