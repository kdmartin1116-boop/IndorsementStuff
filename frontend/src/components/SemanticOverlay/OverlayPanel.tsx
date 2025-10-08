export default function OverlayPanel({ data }) {
  return (
    <div className="overlay-panel">
      <h3>Semantic Guidance</h3>
      {data?.contradictions?.length > 0 && (
        <div className="contradictions">
          <h4>⚠️ Contradictions Detected</h4>
          <ul>
            {data.contradictions.map((item, idx) => (
              <li key={idx}>
                <strong>{item.term}</strong>: {item.reason}
                <br />
                <em>Remedy:</em> {item.remedy}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data?.suggested_nationalities?.length > 0 && (
        <div className="suggestions">
          <h4>✅ Suggested Nationalities</h4>
          <ul>
            {data.suggested_nationalities.map((nat, idx) => (
              <li key={idx}>{nat}</li>
            ))}
          </ul>
        </div>
      )}
      {data?.affidavit_preview && (
        <div className="preview">
          <h4>📝 Affidavit Preview</h4>
          <pre>{data.affidavit_preview}</pre>
        </div>
      )}
    </div>
  );
}