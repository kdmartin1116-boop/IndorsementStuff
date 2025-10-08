import React from 'react';

export default function ContradictionFlag({ flags }) {
  if (!flags || flags.length === 0) {
    return null;
  }

  return (
    <div className="contradiction-flag">
      <h4>Contradiction Alert!</h4>
      <p>The following terms may be presumptions of corporate status:</p>
      <ul>
        {flags.map((flag) => (
          <li key={flag}>{flag}</li>
        ))}
      </ul>
      <p>Consider using lawful alternatives to affirm your standing.</p>
    </div>
  );
}
