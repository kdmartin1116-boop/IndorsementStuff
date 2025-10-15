/**
 * Enhanced Contract Scanner with proper typing and form management
 */

import React from 'react';
import { useForm, commonValidationRules } from '../hooks/useForm';
import { useApiCall } from '../hooks/useAsync';
import { TypedApiClient } from '../services/apiClient';
import { API_CONFIG } from '../apiConfig';
import { API_ENDPOINTS } from '../types/api';
import { ContractScanResponse, ContractScanTag, KeywordMap } from '../types';
import ErrorDisplay from './ErrorDisplay';

// Hardcoded KEYWORD_MAP - in a real application, this would be fetched from the backend.
const KEYWORD_MAP_FRONTEND: KeywordMap = {
  "hidden_fee": ["convenience fee", "service charge", "processing fee", "undisclosed", "surcharge"],
  "misrepresentation": ["misrepresented", "misleading", "deceptive", "false statement", "inaccurate"],
  "arbitration": ["arbitration", "arbitrator", "binding arbitration", "waive your right to"]
};

interface ContractScanFormData {
  selectedFile: File | null;
  selectedTag: ContractScanTag;
}

const apiClient = new TypedApiClient(API_CONFIG);

const ContractScanner: React.FC = () => {
  const [scanResult, setScanResult] = React.useState<string[] | null>(null);

  const performScan = React.useCallback(async (formData: ContractScanFormData): Promise<ContractScanResponse> => {
    if (!formData.selectedFile) {
      throw new Error('Please select a file');
    }

    const formDataToSend = new FormData();
    formDataToSend.append('contract', formData.selectedFile);
    formDataToSend.append('tag', formData.selectedTag);

    const response = await fetch(API_ENDPOINTS.SCAN_CONTRACT, {
      method: 'POST',
      body: formDataToSend,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: ContractScanResponse = await response.json();
    return result;
  }, []);

  const {
    data,
    loading,
    error,
    execute: executeContractScan,
    clearError
  } = useApiCall<ContractScanResponse, [ContractScanFormData]>(performScan);

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    isValid
  } = useForm<ContractScanFormData>(
    {
      selectedFile: null,
      selectedTag: 'hidden_fee'
    },
    {
      selectedFile: {
        required: true,
      },
      selectedTag: commonValidationRules.required
    }
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    // Validate file client-side
    if (file) {
      if (!file.type.includes('pdf')) {
        // Could set a field-specific error here if needed
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        // File too large
        return;
      }
    }
    
    handleChange('selectedFile', file);
  };

  const handleTagChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange('selectedTag', event.target.value as ContractScanTag);
  };

  const handleScan = handleSubmit((formData) => {
    executeContractScan(formData);
  });

  React.useEffect(() => {
    if (data) {
      setScanResult(data.found_clauses || []);
    }
  }, [data]);

  return (
    <div className="contract-scanner">
      <h2>Contract Scanner</h2>
      
      <form onSubmit={handleScan} className="scanner-form">
        <div className="form-group">
          <label htmlFor="contractFile">Upload Contract (PDF):</label>
          <input
            type="file"
            id="contractFile"
            accept=".pdf"
            onChange={handleFileChange}
            className={errors.selectedFile ? 'error' : ''}
          />
          {errors.selectedFile && (
            <span className="error-text">{errors.selectedFile}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="tagSelect">Select Tag:</label>
          <select 
            id="tagSelect" 
            value={values.selectedTag} 
            onChange={handleTagChange}
            className={errors.selectedTag ? 'error' : ''}
          >
            {Object.keys(KEYWORD_MAP_FRONTEND).map((key) => (
              <option key={key} value={key}>
                {key.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
          {errors.selectedTag && (
            <span className="error-text">{errors.selectedTag}</span>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || !isValid} 
          className="scan-button"
        >
          {loading ? 'Scanning...' : 'Scan Contract'}
        </button>
      </form>

      <ErrorDisplay 
        error={error} 
        onRetry={() => values.selectedFile && handleScan()}
        onDismiss={clearError}
      />

      {scanResult && (
        <div className="scan-results">
          <h3>Scan Results</h3>
          {scanResult.length > 0 ? (
            <div>
              <p>Found {scanResult.length} matching clause(s):</p>
              <ul className="found-clauses">
                {scanResult.map((clause, index) => (
                  <li key={index} className="clause-item">
                    {clause}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="no-results">No matching clauses found for the selected tag.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractScanner;