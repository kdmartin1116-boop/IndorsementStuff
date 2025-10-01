import React from 'react';

export default function PrintablePacket({ packet }) {
  if (!packet) {
    return null;
  }

  return (
    <div className="printable-packet">
      <h2>Lawful Discharge Packet</h2>
      
      <h3>Conditional Acceptance Cover Letter</h3>
      <pre>{packet.cover_letter}</pre>
      
      <h3>Lawful Tender Endorsement</h3>
      <pre>{packet.endorsement}</pre>
      
      <h3>Endorsement Placement Guide</h3>
      <pre>{packet.placement_guide}</pre>
      
      <button onClick={() => window.print()}>Print Packet</button>
    </div>
  );
}
