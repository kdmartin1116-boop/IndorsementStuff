import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEndorsement } from '../hooks/useEndorsement';
import { API_BASE_URL } from '../apiConfig';
import ErrorDisplay from './ErrorDisplay';
import './Endorser.css';

const Endorser: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const { response, error, isProcessing, uploadProgress, endorseBill, clearError, reset } = useEndorsement();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleSubmit = () => {
        if (file) {
            endorseBill(file);
        }
    };

    return (
        <div className="endorser-container">
            <h2>Endorse a Bill</h2>
            <div className="endorser-form">
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    {file ? (
                        <p>{file.name}</p>
                    ) : isDragActive ? (
                        <p>Drop the file here ...</p>
                    ) : (
                        <p>Drag 'n' drop a PDF file here, or click to select a file</p>
                    )}
                </div>
                <button onClick={handleSubmit} disabled={!file || isProcessing} className="submit-button">
                    {isProcessing ? `Processing... ${uploadProgress}%` : 'Endorse Bill'}
                </button>
            </div>

            {isProcessing && (
                <div className="processing-message">
                    <p>⏳ Processing your bill endorsement... {uploadProgress}%</p>
                    <progress value={uploadProgress} max="100" />
                </div>
            )}

            <ErrorDisplay 
                error={error} 
                onRetry={() => file && handleSubmit()}
                onDismiss={clearError}
            />

            {response && (
                <div className="response-container">
                    <h3 className="response-header">✅ {response.message}</h3>
                    {response.endorsed_files && response.endorsed_files.length > 0 && (
                        <div>
                            <p><strong>Endorsed Files Created:</strong></p>
                            <ul className="file-list">
                                {response.endorsed_files.map((filePath: string, index: number) => {
                                    const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
                                    return (
                                        <li key={index} className="file-list-item">
                                            <a
                                                href={`${API_BASE_URL}/${filePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="file-link"
                                            >
                                                📄 {fileName}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="file-link-tip">
                                💡 Click the file links above to download your endorsed documents.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Endorser;
