import { useState, ChangeEvent } from 'react';
import { AppError, AppErrorHandler, ErrorCode } from '../utils/errorHandler';
import ErrorDisplay from './ErrorDisplay';

// Hardcoded KEYWORD_MAP - in a real application, this would be fetched from the backend.
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
  const [error, setError] = useState<AppError | null>(null);

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
      const validationError = AppErrorHandler.createError(
        ErrorCode.VALIDATION_ERROR,
        'Please select a PDF file to scan.'
      );
      setError(validationError);
      return;
    }
    
    if (!selectedTag) {
      const validationError = AppErrorHandler.createError(
        ErrorCode.VALIDATION_ERROR,
        'Please select a tag.'
      );
      setError(validationError);
      return;
    }

    // Validate file
    const fileValidationError = AppErrorHandler.validateFile(selectedFile, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf']
    });

    if (fileValidationError) {
      setError(fileValidationError);
      AppErrorHandler.logError(fileValidationError);
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

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // Response is not JSON
        }
        
        const apiError = AppErrorHandler.handleApiError(response, errorData);
        setError(apiError);
        AppErrorHandler.logError(apiError);
        return;
      }

      const data = await response.json();
      setScanResult(data.found_clauses || []);
      
    } catch (networkError: any) {
      const error = AppErrorHandler.handleNetworkError(networkError);
      setError(error);
      AppErrorHandler.logError(error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

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

      <ErrorDisplay 
        error={error} 
        onRetry={handleScan}
        onDismiss={clearError}
      />

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
