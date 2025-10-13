import { useState } from 'react';
import OverlayPanel from '../SemanticOverlay/OverlayPanel';
import ContradictionFlag from '../SemanticOverlay/ContradictionFlag';
import AffirmationBanner from '../UI/AffirmationBanner';

export default function NationalityStep() {
  const [input, setInput] = useState('');
  const [overlay, setOverlay] = useState(null);

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setInput(value);

    const res = await fetch('/api/wizard/nationality', {
      method: 'POST',
      body: JSON.stringify({ input: value }),
    });
    const data = await res.json();
    setOverlay(data);
  };

  return (
    <div className="wizard-step">
      <div className="left-panel">
        <h2>Step 2: Reclaim Your Lawful Nationality</h2>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Describe your nationality in your own words..."
        />
        {overlay?.contradictions?.length > 0 && (
          <ContradictionFlag flags={overlay.contradictions} />
        )}
        <AffirmationBanner message="You are reclaiming your lawful standing. Omni affirms your authorship." />
      </div>
      <div className="right-panel">
        <OverlayPanel data={overlay} />
      </div>
    </div>
  );
}
