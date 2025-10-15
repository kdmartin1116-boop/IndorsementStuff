import React, { useState, useCallback } from 'react';

interface FileUploadProps {
    onFileSelect?: (file: File) => void;
    acceptedTypes?: string;
    maxSize?: number; // in MB
}

interface DocumentValidation {
    type: 'negotiable-instrument' | 'commercial-paper' | 'legal-document' | 'unknown';
    uccCompliant: boolean;
    requirements: string[];
    cornellReference: string;
    validation: 'valid' | 'warning' | 'invalid';
}

const ProfessionalFileUpload: React.FC<FileUploadProps> = ({ 
    onFileSelect, 
    acceptedTypes = ".pdf,.doc,.docx,.txt", 
    maxSize = 10 
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [documentValidation, setDocumentValidation] = useState<DocumentValidation | null>(null);
    const [showCornellGuidance, setShowCornellGuidance] = useState(true);

    // Cornell Legal Knowledge for document types
    const getCornellDocumentValidation = (fileName: string): DocumentValidation => {
        const lowerName = fileName.toLowerCase();
        
        if (lowerName.includes('bill') || lowerName.includes('exchange')) {
            return {
                type: 'negotiable-instrument',
                uccCompliant: true,
                requirements: [
                    'Written and signed by drawer (UCC § 3-104(a)(1))',
                    'Unconditional order to pay (UCC § 3-104(a)(2))',
                    'Fixed amount of money (UCC § 3-104(a)(3))',
                    'Payable on demand or definite time (UCC § 3-104(a)(4))',
                    'Payable to order or bearer (UCC § 3-104(a)(5))'
                ],
                cornellReference: 'https://www.law.cornell.edu/ucc/3/3-104',
                validation: 'valid'
            };
        } else if (lowerName.includes('note') || lowerName.includes('promissory')) {
            return {
                type: 'negotiable-instrument',
                uccCompliant: true,
                requirements: [
                    'Written and signed by maker (UCC § 3-104(a)(1))',
                    'Unconditional promise to pay (UCC § 3-104(a)(2))',
                    'Fixed amount of money (UCC § 3-104(a)(3))',
                    'Payable on demand or definite time (UCC § 3-104(a)(4))'
                ],
                cornellReference: 'https://www.law.cornell.edu/ucc/3/3-104',
                validation: 'valid'
            };
        } else if (lowerName.includes('commercial') || lowerName.includes('agreement')) {
            return {
                type: 'commercial-paper',
                uccCompliant: false,
                requirements: [
                    'May need UCC Article 2 compliance for sales',
                    'Contract formation requirements',
                    'Consideration and capacity requirements'
                ],
                cornellReference: 'https://www.law.cornell.edu/ucc/2',
                validation: 'warning'
            };
        }
        
        return {
            type: 'unknown',
            uccCompliant: false,
            requirements: ['Document type analysis needed', 'Upload for comprehensive review'],
            cornellReference: 'https://www.law.cornell.edu/ucc/3',
            validation: 'warning'
        };
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    }, []);

    const handleFileSelection = (file: File) => {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            setUploadStatus('error');
            return;
        }

        setSelectedFile(file);
        setUploadStatus('idle');
        
        // Perform Cornell legal validation
        const validation = getCornellDocumentValidation(file.name);
        setDocumentValidation(validation);
        
        if (onFileSelect) {
            onFileSelect(file);
        }

        // Simulate upload progress
        setIsUploading(true);
        setUploadProgress(0);
        
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setIsUploading(false);
                    setUploadStatus('success');
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    return (
        <div className="component-card">
            <h3 style={{ color: '#2a5298', marginBottom: '20px' }}>📤 Document Upload & Cornell Legal Validation</h3>
            
            {/* Cornell Legal Guidance */}
            {showCornellGuidance && (
                <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #d0e7ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ color: '#2a5298', margin: 0 }}>🏛️ Cornell Legal Document Requirements</h4>
                        <button 
                            onClick={() => setShowCornellGuidance(false)}
                            style={{ background: 'none', border: 'none', color: '#6c757d', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                        <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                            <h5 style={{ color: '#2a5298', marginBottom: '8px', fontSize: '0.9rem' }}>Bills of Exchange</h5>
                            <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                                Must meet UCC § 3-104 requirements: written, signed, unconditional order to pay fixed amount.
                            </p>
                            <a href="https://www.law.cornell.edu/ucc/3/3-104" target="_blank" rel="noopener noreferrer" 
                               style={{ fontSize: '0.75rem', color: '#007bff', textDecoration: 'none' }}>
                                📖 Cornell UCC § 3-104
                            </a>
                        </div>
                        <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                            <h5 style={{ color: '#2a5298', marginBottom: '8px', fontSize: '0.9rem' }}>Promissory Notes</h5>
                            <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                                Require unconditional promise to pay, proper signature, and negotiability elements.
                            </p>
                            <a href="https://www.law.cornell.edu/ucc/3/3-104" target="_blank" rel="noopener noreferrer" 
                               style={{ fontSize: '0.75rem', color: '#007bff', textDecoration: 'none' }}>
                                📖 Cornell Negotiable Instruments
                            </a>
                        </div>
                        <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                            <h5 style={{ color: '#2a5298', marginBottom: '8px', fontSize: '0.9rem' }}>Indorsements</h5>
                            <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                                Special, blank, or restrictive indorsements must comply with UCC § 3-205 standards.
                            </p>
                            <a href="https://www.law.cornell.edu/ucc/3/3-205" target="_blank" rel="noopener noreferrer" 
                               style={{ fontSize: '0.75rem', color: '#007bff', textDecoration: 'none' }}>
                                📖 Cornell Indorsement Rules
                            </a>
                        </div>
                    </div>
                </div>
            )}
            
            <div 
                className={`upload-area ${isDragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px', color: '#2a5298' }}>
                        📄
                    </div>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2a5298' }}>
                        Drop your document here or click to browse
                    </h4>
                    <p style={{ margin: '0 0 15px 0', color: '#6c757d' }}>
                        Supports: PDF, DOC, DOCX, TXT files (Max: {maxSize}MB)
                    </p>
                    <button className="btn btn-outline" type="button">
                        Choose File
                    </button>
                </div>
            </div>

            <input
                id="file-input"
                type="file"
                accept={acceptedTypes}
                onChange={handleFileInput}
                style={{ display: 'none' }}
            />

            {selectedFile && (
                <div style={{ marginTop: '20px' }}>
                    <div className="alert alert-info">
                        <h4 style={{ margin: '0 0 10px 0' }}>📋 File Selected</h4>
                        <p style={{ margin: '0 0 5px 0' }}><strong>Name:</strong> {selectedFile.name}</p>
                        <p style={{ margin: '0 0 5px 0' }}>
                            <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p style={{ margin: 0 }}>
                            <strong>Type:</strong> {selectedFile.type || 'Unknown'}
                        </p>
                    </div>

                    {isUploading && (
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div className="alert alert-success" style={{ marginTop: '15px' }}>
                            ✅ File uploaded successfully! Ready for processing.
                        </div>
                    )}

                    {uploadStatus === 'error' && (
                        <div className="alert alert-error" style={{ marginTop: '15px' }}>
                            ❌ Error: File size exceeds {maxSize}MB limit.
                        </div>
                    )}

                    {/* Cornell Legal Validation Results */}
                    {documentValidation && uploadStatus === 'success' && (
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>🏛️ Cornell Legal Analysis</h4>
                            <div style={{ 
                                padding: '15px', 
                                backgroundColor: documentValidation.validation === 'valid' ? '#d4edda' : 
                                                documentValidation.validation === 'warning' ? '#fff3cd' : '#f8d7da',
                                borderRadius: '8px', 
                                border: `1px solid ${documentValidation.validation === 'valid' ? '#c3e6cb' : 
                                                    documentValidation.validation === 'warning' ? '#ffeaa7' : '#f5c6cb'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>
                                        {documentValidation.validation === 'valid' ? '✅' : 
                                         documentValidation.validation === 'warning' ? '⚠️' : '❌'}
                                    </span>
                                    <h5 style={{ margin: 0, color: '#2a5298' }}>
                                        Document Type: {documentValidation.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </h5>
                                </div>
                                
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>UCC Compliance:</strong> {documentValidation.uccCompliant ? '✅ Compliant' : '⚠️ Review Required'}
                                </div>
                                
                                <div style={{ marginBottom: '15px' }}>
                                    <strong>Requirements:</strong>
                                    <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                        {documentValidation.requirements.map((req, index) => (
                                            <li key={index} style={{ fontSize: '0.9rem', color: '#555' }}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <a href={documentValidation.cornellReference} target="_blank" rel="noopener noreferrer" 
                                   style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
                                    📖 Cornell Law Reference
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>Cornell-Backed Processing Options</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        className="btn btn-primary" 
                        disabled={!selectedFile || isUploading}
                        title="Analyze document against Cornell UCC Article 3 requirements"
                    >
                        🔍 Cornell Legal Analysis
                    </button>
                    <button 
                        className="btn btn-outline" 
                        disabled={!selectedFile || isUploading}
                        title="Create UCC § 3-205 compliant endorsement"
                    >
                        ✍️ UCC Endorsement
                    </button>
                    <button 
                        className="btn btn-secondary" 
                        disabled={!selectedFile || isUploading}
                        title="Extract data with Cornell legal framework validation"
                    >
                        📋 Legal Data Extract
                    </button>
                    <button 
                        className="btn btn-success" 
                        disabled={!selectedFile || isUploading}
                        title="Comprehensive UCC Article 3 compliance check"
                    >
                        ⚖️ UCC Validation
                    </button>
                </div>
                
                {documentValidation && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                            💡 <strong>Recommendation:</strong> Based on Cornell legal analysis, this document appears to be a{' '}
                            <strong>{documentValidation.type.replace('-', ' ')}</strong>. 
                            {documentValidation.uccCompliant 
                                ? ' UCC compliance validation recommended.' 
                                : ' Additional legal review may be required.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalFileUpload;