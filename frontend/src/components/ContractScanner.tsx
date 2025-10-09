import { useState, ChangeEvent } from 'react';

// Hardcoding KEYWORD_MAP for now, as there's no API to fetch it.
// In a real application, this would ideally be fetched from the backend.
const KEYWORD_MAP_FRONTEND: { [key: string]: string[] } = {
  "hidden_fee": ["convenience fee", "service charge", "processing fee", "undisclosed", "surcharge"],
  "misrepresentation": ["misrepresented", "misleading", "deceptive", "false statement", "inaccurate"],
  "arbitration": ["arbitration", "arbitrator", "binding arbitration", "waive your right to"]
};

function ContractScanner() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>(Object.keys(KEYWORD_MAP_FRONTEND)[0]);
  const [scanResult, setScanResult] = useState<string[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleTagChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTag(event.target.value);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file to scan.');
      return;
    }
    if (!selectedTag) {
      alert('Please select a tag.');
      return;
    }

    setLoading(true);
    setError(null);
    setScanResult(null);

    const formData = new FormData();
    formData.append('contract', selectedFile);
    formData.append('tag', selectedTag);

    try {
      const response = await fetch('/scan-for-terms', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred.');
      }

      if (data.found_clauses) {
        setScanResult(data.found_clauses);
      } else {
        setScanResult([]);
      }
    } catch (e: any) {
      setError(e.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Contract Scanner</h2>
      <div>
        <label htmlFor="contractFile">Upload Contract (PDF):</label>
        <input
          type="file"
          id="contractFile"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <label htmlFor="tagSelect">Select Tag:</label>
        <select id="tagSelect" value={selectedTag} onChange={handleTagChange}>
          {Object.keys(KEYWORD_MAP_FRONTEND).map((key) => (
            <option key={key} value={key}>
              {key.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleScan} disabled={loading} style={{ marginTop: '10px' }}>
        {loading ? 'Scanning...' : 'Scan Contract'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {scanResult && scanResult.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Found Sentences:</h3>
          <ul>
            {scanResult.map((sentence, index) => (
              <li key={index}>{sentence}</li>
            ))}
          </ul>
        </div>
      )}

      {scanResult && scanResult.length === 0 && !loading && (
        <p style={{ marginTop: '20px' }}>No sentences found for the selected tag.</p>
      )}
    </div>
  );
}

export default ContractScanner;
