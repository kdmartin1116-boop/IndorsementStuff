import { useState } from 'react';
import OverlayPanel from '../SemanticOverlay/OverlayPanel';
import ContradictionFlag from '../SemanticOverlay/ContradictionFlag';
import AffirmationBanner from '../UI/AffirmationBanner';

export default function DischargeStep() {
  const [input, setInput] = useState('');
  const [overlay, setOverlay] = useState(null);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setInput(value);

    const res = await fetch('/api/wizard/discharge', {
      method: 'POST',
      body: JSON.stringify({ input: value }),
    });
    const data = await res.json();
    setOverlay(data);
  };

  return (
    <div className="wizard-step">
      <div className="left-panel">
        <h2>Step 3: Discharge Unlawful Debt</h2>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Paste the text of the billing statement here..."
        />
        {overlay?.contradictions?.length > 0 && (
          <ContradictionFlag flags={overlay.contradictions} />
        )}
        <AffirmationBanner message="You are reclaiming your financial sovereignty. Omni affirms your authorship." />
      </div>
      <div className="right-panel">
        <OverlayPanel data={overlay} />
      </div>
    </div>
  );
}
