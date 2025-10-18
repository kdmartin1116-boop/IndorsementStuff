import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Camera, Upload, FileText, Eye, Brain, Zap, CheckCircle,
    AlertTriangle, Search, Filter, RotateCcw, Crop, Maximize,
    Download, Share2, Star, Clock, MapPin, User, Calendar,
    Layers, Target, Sparkles, Settings, RefreshCw, Play
} from 'lucide-react';

interface DocumentField {
    id: string;
    name: string;
    value: string;
    confidence: number;
    type: 'text' | 'date' | 'currency' | 'number' | 'signature';
    required: boolean;
    validated: boolean;
    cornellReference?: string;
}

interface DocumentTemplate {
    id: string;
    name: string;
    type: string;
    fields: DocumentField[];
    confidence: number;
    previewImage?: string;
    cornellValidation: boolean;
}

interface OCRResult {
    text: string;
    confidence: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    fieldType?: string;
}

interface ProcessingStage {
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    duration?: number;
}

const SmartDocumentRecognition: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
    const [detectedTemplate, setDetectedTemplate] = useState<DocumentTemplate | null>(null);
    const [extractedFields, setExtractedFields] = useState<DocumentField[]>([]);
    const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
    const [processingMode, setProcessingMode] = useState<'auto' | 'manual'>('auto');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [isUsingCamera, setIsUsingCamera] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Document templates based on Cornell Legal Framework
    const documentTemplates: DocumentTemplate[] = [
        {
            id: 'bill_of_exchange',
            name: 'Bill of Exchange',
            type: 'negotiable_instrument',
            confidence: 0.95,
            cornellValidation: true,
            fields: [
                { id: 'payee', name: 'Payee', value: '', confidence: 0, type: 'text', required: true, validated: false, cornellReference: 'UCC 3-103(a)(5)' },
                { id: 'payer', name: 'Payer', value: '', confidence: 0, type: 'text', required: true, validated: false, cornellReference: 'UCC 3-103(a)(3)' },
                { id: 'amount', name: 'Amount', value: '', confidence: 0, type: 'currency', required: true, validated: false, cornellReference: 'UCC 3-104(a)' },
                { id: 'date', name: 'Date', value: '', confidence: 0, type: 'date', required: true, validated: false },
                { id: 'signature', name: 'Signature', value: '', confidence: 0, type: 'signature', required: true, validated: false, cornellReference: 'UCC 3-401' }
            ]
        },
        {
            id: 'promissory_note',
            name: 'Promissory Note',
            type: 'negotiable_instrument',
            confidence: 0.92,
            cornellValidation: true,
            fields: [
                { id: 'maker', name: 'Maker', value: '', confidence: 0, type: 'text', required: true, validated: false, cornellReference: 'UCC 3-103(a)(7)' },
                { id: 'payee', name: 'Payee', value: '', confidence: 0, type: 'text', required: true, validated: false },
                { id: 'principal', name: 'Principal Amount', value: '', confidence: 0, type: 'currency', required: true, validated: false },
                { id: 'interest_rate', name: 'Interest Rate', value: '', confidence: 0, type: 'number', required: false, validated: false },
                { id: 'maturity_date', name: 'Maturity Date', value: '', confidence: 0, type: 'date', required: true, validated: false }
            ]
        },
        {
            id: 'check',
            name: 'Check',
            type: 'negotiable_instrument',
            confidence: 0.98,
            cornellValidation: true,
            fields: [
                { id: 'check_number', name: 'Check Number', value: '', confidence: 0, type: 'number', required: true, validated: false },
                { id: 'payee', name: 'Pay to the Order of', value: '', confidence: 0, type: 'text', required: true, validated: false },
                { id: 'amount_numeric', name: 'Amount (Numeric)', value: '', confidence: 0, type: 'currency', required: true, validated: false },
                { id: 'amount_words', name: 'Amount (Words)', value: '', confidence: 0, type: 'text', required: true, validated: false },
                { id: 'date', name: 'Date', value: '', confidence: 0, type: 'date', required: true, validated: false },
                { id: 'signature', name: 'Signature', value: '', confidence: 0, type: 'signature', required: true, validated: false }
            ]
        },
        {
            id: 'letter_of_credit',
            name: 'Letter of Credit',
            type: 'commercial_document',
            confidence: 0.89,
            cornellValidation: true,
            fields: [
                { id: 'issuing_bank', name: 'Issuing Bank', value: '', confidence: 0, type: 'text', required: true, validated: false },
                { id: 'beneficiary', name: 'Beneficiary', value: '', confidence: 0, type: 'text', required: true, validated: false },
                { id: 'applicant', name: 'Applicant', value: '', confidence: 0, type: 'text', required: true, validated: false },
                { id: 'credit_amount', name: 'Credit Amount', value: '', confidence: 0, type: 'currency', required: true, validated: false },
                { id: 'expiry_date', name: 'Expiry Date', value: '', confidence: 0, type: 'date', required: true, validated: false }
            ]
        }
    ];

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileSelect = useCallback((file: File) => {
        if (selectedFile && previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        
        if (processingMode === 'auto') {
            processDocument(file);
        }
    }, [processingMode, selectedFile, previewUrl]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const startCamera = async () => {
        try {
            setIsUsingCamera(true);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setIsUsingCamera(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], 'captured-document.jpg', { type: 'image/jpeg' });
                        handleFileSelect(file);
                        stopCamera();
                    }
                });
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
        setIsUsingCamera(false);
    };

    const processDocument = async (file: File) => {
        setIsProcessing(true);
        setConfidence(0);
        
        const stages: ProcessingStage[] = [
            { id: 'upload', name: 'File Processing', status: 'processing', progress: 0 },
            { id: 'ocr', name: 'OCR Analysis', status: 'pending', progress: 0 },
            { id: 'classification', name: 'Document Classification', status: 'pending', progress: 0 },
            { id: 'extraction', name: 'Field Extraction', status: 'pending', progress: 0 },
            { id: 'validation', name: 'Cornell Validation', status: 'pending', progress: 0 }
        ];
        
        setProcessingStages(stages);
        
        // Simulate processing stages
        for (let i = 0; i < stages.length; i++) {
            // Update current stage to processing
            stages[i].status = 'processing';
            setProcessingStages([...stages]);
            
            // Simulate processing time with progress updates
            for (let progress = 0; progress <= 100; progress += 10) {
                await new Promise(resolve => setTimeout(resolve, 50));
                stages[i].progress = progress;
                setProcessingStages([...stages]);
            }
            
            // Complete current stage
            stages[i].status = 'completed';
            stages[i].duration = Math.random() * 2 + 0.5; // Random duration 0.5-2.5s
            setProcessingStages([...stages]);
            
            // Simulate stage-specific results
            if (i === 0) {
                // File processing complete
                await simulateOCR();
            } else if (i === 1) {
                // OCR complete
                await simulateClassification();
            } else if (i === 2) {
                // Classification complete
                await simulateFieldExtraction();
            } else if (i === 3) {
                // Field extraction complete
                await simulateCornellValidation();
            }
        }
        
        setIsProcessing(false);
    };

    const simulateOCR = async () => {
        const mockOCRResults: OCRResult[] = [
            { text: 'PAY TO THE ORDER OF', confidence: 0.95, boundingBox: { x: 120, y: 80, width: 200, height: 20 }, fieldType: 'label' },
            { text: 'John Smith', confidence: 0.92, boundingBox: { x: 340, y: 80, width: 150, height: 20 }, fieldType: 'payee' },
            { text: '$1,500.00', confidence: 0.98, boundingBox: { x: 500, y: 80, width: 100, height: 20 }, fieldType: 'amount' },
            { text: 'One Thousand Five Hundred and 00/100 DOLLARS', confidence: 0.89, boundingBox: { x: 120, y: 120, width: 400, height: 20 }, fieldType: 'amount_words' },
            { text: '01/15/2024', confidence: 0.94, boundingBox: { x: 450, y: 50, width: 80, height: 20 }, fieldType: 'date' },
            { text: '001234', confidence: 0.97, boundingBox: { x: 550, y: 20, width: 60, height: 20 }, fieldType: 'check_number' }
        ];
        
        setOcrResults(mockOCRResults);
    };

    const simulateClassification = async () => {
        // Simulate AI classification - in this case, detecting a check
        const detectedTemplate = documentTemplates.find(t => t.id === 'check');
        if (detectedTemplate) {
            setDetectedTemplate(detectedTemplate);
            setConfidence(0.96);
        }
    };

    const simulateFieldExtraction = async () => {
        if (detectedTemplate) {
            const extractedFields = detectedTemplate.fields.map(field => {
                let extractedValue = '';
                let confidence = 0;
                
                // Simulate field extraction based on OCR results
                const relatedOCR = ocrResults.find(ocr => 
                    (field.id === 'payee' && ocr.fieldType === 'payee') ||
                    (field.id === 'amount_numeric' && ocr.fieldType === 'amount') ||
                    (field.id === 'amount_words' && ocr.fieldType === 'amount_words') ||
                    (field.id === 'date' && ocr.fieldType === 'date') ||
                    (field.id === 'check_number' && ocr.fieldType === 'check_number')
                );
                
                if (relatedOCR) {
                    extractedValue = relatedOCR.text;
                    confidence = relatedOCR.confidence;
                }
                
                return {
                    ...field,
                    value: extractedValue,
                    confidence: confidence
                };
            });
            
            setExtractedFields(extractedFields);
        }
    };

    const simulateCornellValidation = async () => {
        // Simulate Cornell legal framework validation
        const validatedFields = extractedFields.map(field => ({
            ...field,
            validated: field.confidence > 0.8 && field.value !== ''
        }));
        
        setExtractedFields(validatedFields);
    };

    const reprocessDocument = () => {
        if (selectedFile) {
            processDocument(selectedFile);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return '#10b981';
        if (confidence >= 0.7) return '#f59e0b';
        return '#ef4444';
    };

    const getFieldIcon = (type: string) => {
        switch (type) {
            case 'text': return <User size={16} />;
            case 'date': return <Calendar size={16} />;
            case 'currency': return <Target size={16} />;
            case 'number': return <Layers size={16} />;
            case 'signature': return <FileText size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <div className="smart-document-recognition">
            {/* Header */}
            <div className="recognition-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Brain size={32} />
                    </div>
                    <div>
                        <h1>Smart Document Recognition</h1>
                        <p>AI-powered document analysis with OCR, field extraction, and Cornell legal validation</p>
                    </div>
                </div>
                <div className="recognition-stats">
                    <div className="stat-item">
                        <span className="stat-value">{confidence > 0 ? `${(confidence * 100).toFixed(1)}%` : '0%'}</span>
                        <span className="stat-label">Confidence</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{extractedFields.length}</span>
                        <span className="stat-label">Fields</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{extractedFields.filter(f => f.validated).length}</span>
                        <span className="stat-label">Validated</span>
                    </div>
                </div>
            </div>

            <div className="recognition-content">
                {/* Upload Section */}
                {!selectedFile && !isUsingCamera && (
                    <div className="upload-section">
                        <div className="upload-options">
                            <div 
                                className="upload-dropzone"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={48} />
                                <h3>Upload Document</h3>
                                <p>Drag and drop your document here, or click to browse</p>
                                <div className="supported-formats">
                                    <span>Supports: PDF, JPG, PNG, TIFF</span>
                                </div>
                            </div>
                            
                            <div className="upload-divider">
                                <span>OR</span>
                            </div>
                            
                            <div className="camera-option">
                                <button className="camera-btn" onClick={startCamera}>
                                    <Camera size={24} />
                                    Use Camera
                                </button>
                                <p>Capture document with your camera</p>
                            </div>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}

                {/* Camera Section */}
                {isUsingCamera && (
                    <div className="camera-section">
                        <div className="camera-container">
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline
                                className="camera-video"
                            />
                            <div className="camera-overlay">
                                <div className="document-frame">
                                    <div className="corner top-left"></div>
                                    <div className="corner top-right"></div>
                                    <div className="corner bottom-left"></div>
                                    <div className="corner bottom-right"></div>
                                </div>
                                <p>Position your document within the frame</p>
                            </div>
                        </div>
                        <div className="camera-controls">
                            <button className="camera-control-btn cancel" onClick={stopCamera}>
                                Cancel
                            </button>
                            <button className="camera-control-btn capture" onClick={capturePhoto}>
                                <Camera size={20} />
                                Capture
                            </button>
                        </div>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>
                )}

                {/* Processing Section */}
                {selectedFile && (
                    <div className="processing-section">
                        <div className="document-preview">
                            <div className="preview-header">
                                <h3>Document Preview</h3>
                                <div className="preview-controls">
                                    <button className="control-btn">
                                        <Crop size={16} />
                                    </button>
                                    <button className="control-btn">
                                        <RotateCcw size={16} />
                                    </button>
                                    <button className="control-btn">
                                        <Maximize size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="preview-container">
                                <img src={previewUrl} alt="Document Preview" className="document-image" />
                                
                                {/* OCR Overlay */}
                                {ocrResults.length > 0 && (
                                    <div className="ocr-overlay">
                                        {ocrResults.map((result, index) => (
                                            <div
                                                key={index}
                                                className="ocr-highlight"
                                                style={{
                                                    left: `${result.boundingBox.x}px`,
                                                    top: `${result.boundingBox.y}px`,
                                                    width: `${result.boundingBox.width}px`,
                                                    height: `${result.boundingBox.height}px`,
                                                    borderColor: getConfidenceColor(result.confidence)
                                                }}
                                                title={`${result.text} (${(result.confidence * 100).toFixed(1)}% confidence)`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="analysis-panel">
                            {/* Processing Status */}
                            {isProcessing && (
                                <div className="processing-status">
                                    <h4>
                                        <Sparkles size={20} />
                                        AI Processing Pipeline
                                    </h4>
                                    <div className="processing-stages">
                                        {processingStages.map((stage) => (
                                            <div key={stage.id} className={`stage ${stage.status}`}>
                                                <div className="stage-header">
                                                    <div className="stage-icon">
                                                        {stage.status === 'processing' && <RefreshCw size={16} className="spinning" />}
                                                        {stage.status === 'completed' && <CheckCircle size={16} />}
                                                        {stage.status === 'error' && <AlertTriangle size={16} />}
                                                        {stage.status === 'pending' && <Clock size={16} />}
                                                    </div>
                                                    <span className="stage-name">{stage.name}</span>
                                                    {stage.duration && (
                                                        <span className="stage-duration">{stage.duration.toFixed(1)}s</span>
                                                    )}
                                                </div>
                                                <div className="stage-progress">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${stage.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Document Classification */}
                            {detectedTemplate && (
                                <div className="classification-results">
                                    <h4>
                                        <Target size={20} />
                                        Document Classification
                                    </h4>
                                    <div className="detected-template">
                                        <div className="template-info">
                                            <div className="template-icon">
                                                <FileText size={24} />
                                            </div>
                                            <div className="template-details">
                                                <h5>{detectedTemplate.name}</h5>
                                                <p>Type: {detectedTemplate.type.replace('_', ' ').toUpperCase()}</p>
                                                <div className="confidence-badge" style={{ backgroundColor: getConfidenceColor(confidence) }}>
                                                    {(confidence * 100).toFixed(1)}% Confidence
                                                </div>
                                            </div>
                                        </div>
                                        {detectedTemplate.cornellValidation && (
                                            <div className="cornell-badge">
                                                <Star size={16} />
                                                Cornell Validated
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Extracted Fields */}
                            {extractedFields.length > 0 && (
                                <div className="extracted-fields">
                                    <div className="fields-header">
                                        <h4>
                                            <Layers size={20} />
                                            Extracted Fields
                                        </h4>
                                        <button className="reprocess-btn" onClick={reprocessDocument}>
                                            <RefreshCw size={16} />
                                            Reprocess
                                        </button>
                                    </div>
                                    <div className="fields-list">
                                        {extractedFields.map((field) => (
                                            <div key={field.id} className={`field-item ${field.validated ? 'validated' : ''}`}>
                                                <div className="field-header">
                                                    <div className="field-info">
                                                        <div className="field-icon">
                                                            {getFieldIcon(field.type)}
                                                        </div>
                                                        <span className="field-name">{field.name}</span>
                                                        {field.required && (
                                                            <span className="required-badge">Required</span>
                                                        )}
                                                    </div>
                                                    <div className="field-status">
                                                        {field.validated ? (
                                                            <CheckCircle size={16} className="validated" />
                                                        ) : (
                                                            <AlertTriangle size={16} className="pending" />
                                                        )}
                                                        <span className="confidence" style={{ color: getConfidenceColor(field.confidence) }}>
                                                            {(field.confidence * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="field-content">
                                                    <input
                                                        type="text"
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            const updatedFields = extractedFields.map(f =>
                                                                f.id === field.id ? { ...f, value: e.target.value } : f
                                                            );
                                                            setExtractedFields(updatedFields);
                                                        }}
                                                        className="field-input"
                                                        placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                    />
                                                    {field.cornellReference && (
                                                        <div className="cornell-reference">
                                                            <MapPin size={12} />
                                                            <span>{field.cornellReference}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {!isProcessing && selectedFile && (
                                <div className="action-buttons">
                                    <button className="action-btn secondary">
                                        <Download size={16} />
                                        Export Data
                                    </button>
                                    <button className="action-btn secondary">
                                        <Share2 size={16} />
                                        Share Results
                                    </button>
                                    <button className="action-btn primary">
                                        <Play size={16} />
                                        Process Document
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartDocumentRecognition;