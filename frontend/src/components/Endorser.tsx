import React, { useState } from 'react';

const Endorser: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        // DISABLED FOR LEGAL SAFETY
        setError('🚨 ENDORSEMENT FUNCTIONALITY DISABLED FOR LEGAL SAFETY 🚨\n\nThis feature has been disabled because:\n• UCC endorsement theories are not recognized by courts\n• Using this could constitute document fraud\n• It may result in criminal charges\n\nFor legitimate legal advice, please consult with a licensed attorney.\n\nLegal Resources:\n• American Bar Association: https://www.americanbar.org/\n• Legal Services Corporation: https://www.lsc.gov/find-legal-aid/\n• FindLaw: https://www.findlaw.com/find-a-lawyer/');
        return;
        
        // ORIGINAL CODE COMMENTED FOR SAFETY
        /*
        if (!file) {
            setError('Please select a file to endorse.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setResponse(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Submitting endorsement request...');
            const res = await fetch('/api/endorse-bill/', {
                method: 'POST',
                body: formData,
            });

            console.log('Response status:', res.status);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'An error occurred during endorsement.');
            }

            const data = await res.json();
            console.log('Endorsement response:', data);
            setResponse(data);
            setError(null);
        } catch (err: any) {
            console.error('Endorsement error:', err);
            setError(err.message);
            setResponse(null);
        } finally {
            setIsProcessing(false);
        }
        */
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Endorse a Bill</h2>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label htmlFor="file-input" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Select PDF Bill to Endorse:
                    </label>
                    <input 
                        id="file-input"
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".pdf"
                        style={{ marginBottom: '10px' }}
                    />
                </div>
                <button 
                    onClick={handleSubmit} 
                    disabled={!file || isProcessing}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: isProcessing ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isProcessing ? 'Processing...' : 'Endorse Bill'}
                </button>
            </div>

            {isProcessing && (
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', marginBottom: '10px' }}>
                    <p>⏳ Processing your bill endorsement...</p>
                </div>
            )}

            {error && (
                <div style={{ 
                    color: 'red', 
                    padding: '10px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    marginBottom: '10px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {response && (
                <div style={{ 
                    padding: '15px',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    marginTop: '10px'
                }}>
                    <h3 style={{ color: '#155724', marginTop: 0 }}>✅ {response.message}</h3>
                    {response.endorsed_files && response.endorsed_files.length > 0 && (
                        <div>
                            <p><strong>Endorsed Files Created:</strong></p>
                            <ul style={{ margin: '10px 0' }}>
                                {response.endorsed_files.map((filePath: string, index: number) => {
                                    const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
                                    return (
                                        <li key={index} style={{ marginBottom: '8px' }}>
                                            <a 
                                                href={`/${filePath}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#0066cc',
                                                    textDecoration: 'underline',
                                                    fontSize: '14px'
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.open(`http://127.0.0.1:8002/${filePath}`, '_blank');
                                                }}
                                            >
                                                📄 {fileName}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                            <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
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
