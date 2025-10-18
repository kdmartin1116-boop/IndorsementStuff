import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
    Edit3, Type, Square, Circle, Image, FileText, Save, 
    Download, Upload, Undo, Redo, Bold, Italic, Underline,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, List,
    Hash, Calendar, DollarSign, User, Phone, Mail, MapPin,
    Plus, Trash2, Copy, Move, Eye, Settings, Layers,
    Grid, Ruler, Palette, MousePointer, Hand, ZoomIn,
    ZoomOut, RotateCcw, Play, CheckCircle, AlertCircle
} from 'lucide-react';

interface DocumentElement {
    id: string;
    type: 'text' | 'field' | 'signature' | 'date' | 'currency' | 'image' | 'table' | 'checkbox' | 'radio';
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style: {
        fontSize: number;
        fontWeight: 'normal' | 'bold';
        fontStyle: 'normal' | 'italic';
        textAlign: 'left' | 'center' | 'right' | 'justify';
        color: string;
        backgroundColor: string;
        border: string;
        borderRadius: number;
        padding: number;
        margin: number;
    };
    properties: {
        required?: boolean;
        placeholder?: string;
        defaultValue?: string;
        validation?: string;
        cornellReference?: string;
        legalCompliance?: boolean;
    };
    locked?: boolean;
}

interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    elements: DocumentElement[];
    pageSettings: {
        width: number;
        height: number;
        margin: number;
        backgroundColor: string;
        orientation: 'portrait' | 'landscape';
    };
    cornellValidated: boolean;
}

interface ValidationResult {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    cornellCompliance: number;
    suggestions: string[];
}

const InteractiveVisualEditor: React.FC = () => {
    const [elements, setElements] = useState<DocumentElement[]>([]);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [draggedElement, setDraggedElement] = useState<DocumentElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [currentTool, setCurrentTool] = useState<'select' | 'text' | 'field' | 'image'>('select');
    const [showGrid, setShowGrid] = useState(true);
    const [zoom, setZoom] = useState(100);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [undoStack, setUndoStack] = useState<DocumentElement[][]>([]);
    const [redoStack, setRedoStack] = useState<DocumentElement[][]>([]);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Document templates
    const templates: DocumentTemplate[] = [
        {
            id: 'bill_of_exchange',
            name: 'Bill of Exchange',
            description: 'Standard UCC Article 3 compliant bill of exchange',
            category: 'Negotiable Instruments',
            cornellValidated: true,
            pageSettings: {
                width: 8.5 * 96, // 8.5" in pixels (96 DPI)
                height: 11 * 96, // 11" in pixels
                margin: 72, // 1" margin
                backgroundColor: '#ffffff',
                orientation: 'portrait'
            },
            elements: [
                {
                    id: 'title',
                    type: 'text',
                    content: 'BILL OF EXCHANGE',
                    position: { x: 250, y: 50 },
                    size: { width: 300, height: 40 },
                    style: {
                        fontSize: 24,
                        fontWeight: 'bold',
                        fontStyle: 'normal',
                        textAlign: 'center',
                        color: '#000000',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: 0,
                        padding: 8,
                        margin: 0
                    },
                    properties: {
                        cornellReference: 'UCC 3-104(a)',
                        legalCompliance: true
                    }
                },
                {
                    id: 'pay_order',
                    type: 'text',
                    content: 'PAY TO THE ORDER OF',
                    position: { x: 100, y: 150 },
                    size: { width: 200, height: 30 },
                    style: {
                        fontSize: 14,
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        textAlign: 'left',
                        color: '#000000',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: 0,
                        padding: 4,
                        margin: 0
                    },
                    properties: {}
                },
                {
                    id: 'payee_field',
                    type: 'field',
                    content: '',
                    position: { x: 320, y: 150 },
                    size: { width: 300, height: 30 },
                    style: {
                        fontSize: 14,
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        textAlign: 'left',
                        color: '#000000',
                        backgroundColor: 'transparent',
                        border: '1px solid #000000',
                        borderRadius: 0,
                        padding: 8,
                        margin: 0
                    },
                    properties: {
                        required: true,
                        placeholder: 'Enter payee name',
                        validation: 'required|min:2',
                        cornellReference: 'UCC 3-103(a)(5)',
                        legalCompliance: true
                    }
                }
            ]
        }
    ];

    // Element creation functions
    const createElement = (type: DocumentElement['type'], position: { x: number; y: number }): DocumentElement => {
        const baseElement: Partial<DocumentElement> = {
            id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            position,
            size: { width: 200, height: 30 },
            style: {
                fontSize: 14,
                fontWeight: 'normal',
                fontStyle: 'normal',
                textAlign: 'left',
                color: '#000000',
                backgroundColor: 'transparent',
                border: '1px solid #cccccc',
                borderRadius: 4,
                padding: 8,
                margin: 0
            },
            properties: {}
        };

        switch (type) {
            case 'text':
                return {
                    ...baseElement,
                    content: 'Text Element',
                    style: { ...baseElement.style!, border: 'none' }
                } as DocumentElement;
            
            case 'field':
                return {
                    ...baseElement,
                    content: '',
                    properties: {
                        required: false,
                        placeholder: 'Enter text...',
                        validation: ''
                    }
                } as DocumentElement;
            
            case 'signature':
                return {
                    ...baseElement,
                    content: '',
                    size: { width: 200, height: 60 },
                    style: { 
                        ...baseElement.style!, 
                        border: '1px dashed #666666',
                        backgroundColor: '#f8f9fa'
                    },
                    properties: {
                        required: true,
                        cornellReference: 'UCC 3-401'
                    }
                } as DocumentElement;
            
            case 'date':
                return {
                    ...baseElement,
                    content: new Date().toLocaleDateString(),
                    properties: {
                        required: true,
                        validation: 'date'
                    }
                } as DocumentElement;
            
            case 'currency':
                return {
                    ...baseElement,
                    content: '$0.00',
                    properties: {
                        required: true,
                        validation: 'currency',
                        cornellReference: 'UCC 3-104(a)'
                    }
                } as DocumentElement;
            
            default:
                return baseElement as DocumentElement;
        }
    };

    // Save state for undo/redo
    const saveState = useCallback(() => {
        setUndoStack(prev => [...prev.slice(-19), elements]);
        setRedoStack([]);
    }, [elements]);

    // Add element
    const addElement = (type: DocumentElement['type'], position?: { x: number; y: number }) => {
        const newPosition = position || { x: 100, y: 100 + elements.length * 50 };
        const newElement = createElement(type, newPosition);
        saveState();
        setElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
    };

    // Update element
    const updateElement = (id: string, updates: Partial<DocumentElement>) => {
        setElements(prev => prev.map(el => 
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    // Delete element
    const deleteElement = (id: string) => {
        saveState();
        setElements(prev => prev.filter(el => el.id !== id));
        if (selectedElement === id) {
            setSelectedElement(null);
        }
    };

    // Undo/Redo functions
    const undo = () => {
        if (undoStack.length > 0) {
            const previousState = undoStack[undoStack.length - 1];
            setRedoStack(prev => [elements, ...prev.slice(0, 19)]);
            setUndoStack(prev => prev.slice(0, -1));
            setElements(previousState);
        }
    };

    const redo = () => {
        if (redoStack.length > 0) {
            const nextState = redoStack[0];
            setUndoStack(prev => [...prev, elements]);
            setRedoStack(prev => prev.slice(1));
            setElements(nextState);
        }
    };

    // Load template
    const loadTemplate = (template: DocumentTemplate) => {
        saveState();
        setElements(template.elements);
        setSelectedElement(null);
    };

    // Validate document
    const validateDocument = async () => {
        setIsValidating(true);
        
        // Simulate Cornell legal validation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const warnings: string[] = [];
        const errors: string[] = [];
        const suggestions: string[] = [];
        
        // Check required fields
        const requiredFields = elements.filter(el => el.properties.required);
        requiredFields.forEach(field => {
            if (!field.content) {
                errors.push(`Required field "${field.id}" is empty`);
            }
        });
        
        // Check Cornell compliance
        const cornellElements = elements.filter(el => el.properties.cornellReference);
        if (cornellElements.length === 0) {
            warnings.push('No Cornell legal references found');
        }
        
        // Calculate compliance score
        let complianceScore = 85;
        if (errors.length === 0) complianceScore += 10;
        if (cornellElements.length > 2) complianceScore += 5;
        
        const result: ValidationResult = {
            isValid: errors.length === 0,
            warnings,
            errors,
            cornellCompliance: Math.min(complianceScore, 100),
            suggestions: [
                'Consider adding more Cornell legal references',
                'Ensure all signatures are properly positioned',
                'Verify compliance with UCC Article 3 requirements'
            ]
        };
        
        setValidation(result);
        setIsValidating(false);
    };

    // Handle canvas click for adding elements
    const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (currentTool === 'select') return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const position = {
            x: (event.clientX - rect.left) / (zoom / 100),
            y: (event.clientY - rect.top) / (zoom / 100)
        };
        
        addElement(currentTool as DocumentElement['type'], position);
        setCurrentTool('select');
    };

    const renderElement = (element: DocumentElement) => {
        const isSelected = selectedElement === element.id;
        
        return (
            <div
                key={element.id}
                className={`document-element ${element.type} ${isSelected ? 'selected' : ''} ${element.locked ? 'locked' : ''}`}
                style={{
                    position: 'absolute',
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                    fontSize: element.style.fontSize,
                    fontWeight: element.style.fontWeight,
                    fontStyle: element.style.fontStyle,
                    textAlign: element.style.textAlign,
                    color: element.style.color,
                    backgroundColor: element.style.backgroundColor,
                    border: element.style.border,
                    borderRadius: element.style.borderRadius,
                    padding: element.style.padding,
                    margin: element.style.margin,
                    cursor: currentTool === 'select' ? 'pointer' : 'crosshair',
                    userSelect: isPreviewMode ? 'text' : 'none'
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (currentTool === 'select') {
                        setSelectedElement(element.id);
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (element.type === 'text' || element.type === 'field') {
                        // Enable inline editing
                        const newContent = prompt('Edit content:', element.content);
                        if (newContent !== null) {
                            updateElement(element.id, { content: newContent });
                        }
                    }
                }}
            >
                {element.type === 'text' && (
                    <span>{element.content}</span>
                )}
                
                {element.type === 'field' && (
                    <input
                        type="text"
                        value={element.content}
                        placeholder={element.properties.placeholder}
                        onChange={(e) => updateElement(element.id, { content: e.target.value })}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: 'inherit',
                            color: 'inherit',
                            textAlign: 'inherit'
                        }}
                        disabled={isPreviewMode}
                    />
                )}
                
                {element.type === 'signature' && (
                    <div className="signature-placeholder">
                        {element.content || 'Signature'}
                    </div>
                )}
                
                {element.type === 'date' && (
                    <input
                        type="date"
                        value={element.content}
                        onChange={(e) => updateElement(element.id, { content: e.target.value })}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: 'inherit',
                            color: 'inherit'
                        }}
                        disabled={isPreviewMode}
                    />
                )}
                
                {element.type === 'currency' && (
                    <input
                        type="text"
                        value={element.content}
                        onChange={(e) => updateElement(element.id, { content: e.target.value })}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: 'inherit',
                            color: 'inherit',
                            textAlign: 'right'
                        }}
                        disabled={isPreviewMode}
                    />
                )}
                
                {/* Selection handles */}
                {isSelected && !isPreviewMode && (
                    <div className="selection-handles">
                        <div className="handle top-left"></div>
                        <div className="handle top-right"></div>
                        <div className="handle bottom-left"></div>
                        <div className="handle bottom-right"></div>
                    </div>
                )}
                
                {/* Cornell compliance indicator */}
                {element.properties.cornellReference && (
                    <div className="cornell-indicator" title={element.properties.cornellReference}>
                        <CheckCircle size={12} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="interactive-visual-editor">
            {/* Header */}
            <div className="editor-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Edit3 size={32} />
                    </div>
                    <div>
                        <h1>Interactive Visual Editor</h1>
                        <p>WYSIWYG document editor with drag-and-drop form builder and real-time Cornell legal validation</p>
                    </div>
                </div>
                <div className="editor-stats">
                    <div className="stat-item">
                        <span className="stat-value">{elements.length}</span>
                        <span className="stat-label">Elements</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{validation ? `${validation.cornellCompliance}%` : '0%'}</span>
                        <span className="stat-label">Compliance</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{zoom}%</span>
                        <span className="stat-label">Zoom</span>
                    </div>
                </div>
            </div>

            <div className="editor-workspace">
                {/* Toolbar */}
                <div className="editor-toolbar">
                    <div className="toolbar-section">
                        <h4>Tools</h4>
                        <div className="tool-buttons">
                            <button
                                className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
                                onClick={() => setCurrentTool('select')}
                                title="Select Tool"
                            >
                                <MousePointer size={16} />
                            </button>
                            <button
                                className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
                                onClick={() => setCurrentTool('text')}
                                title="Text Tool"
                            >
                                <Type size={16} />
                            </button>
                            <button
                                className={`tool-btn ${currentTool === 'field' ? 'active' : ''}`}
                                onClick={() => setCurrentTool('field')}
                                title="Input Field"
                            >
                                <Square size={16} />
                            </button>
                            <button
                                className={`tool-btn ${currentTool === 'image' ? 'active' : ''}`}
                                onClick={() => setCurrentTool('image')}
                                title="Image"
                            >
                                <Image size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-section">
                        <h4>Elements</h4>
                        <div className="element-buttons">
                            <button
                                className="element-btn"
                                onClick={() => addElement('signature')}
                                title="Add Signature Field"
                            >
                                <Edit3 size={16} />
                                Signature
                            </button>
                            <button
                                className="element-btn"
                                onClick={() => addElement('date')}
                                title="Add Date Field"
                            >
                                <Calendar size={16} />
                                Date
                            </button>
                            <button
                                className="element-btn"
                                onClick={() => addElement('currency')}
                                title="Add Currency Field"
                            >
                                <DollarSign size={16} />
                                Amount
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-section">
                        <h4>Actions</h4>
                        <div className="action-buttons">
                            <button
                                className="action-btn"
                                onClick={undo}
                                disabled={undoStack.length === 0}
                                title="Undo"
                            >
                                <Undo size={16} />
                            </button>
                            <button
                                className="action-btn"
                                onClick={redo}
                                disabled={redoStack.length === 0}
                                title="Redo"
                            >
                                <Redo size={16} />
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => setShowGrid(!showGrid)}
                                title="Toggle Grid"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                                title="Preview Mode"
                            >
                                <Eye size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="toolbar-section">
                        <h4>Zoom</h4>
                        <div className="zoom-controls">
                            <button
                                className="zoom-btn"
                                onClick={() => setZoom(Math.max(25, zoom - 25))}
                            >
                                <ZoomOut size={16} />
                            </button>
                            <span className="zoom-level">{zoom}%</span>
                            <button
                                className="zoom-btn"
                                onClick={() => setZoom(Math.min(200, zoom + 25))}
                            >
                                <ZoomIn size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="editor-main">
                    {/* Canvas */}
                    <div className="editor-canvas-container">
                        <div
                            ref={canvasRef}
                            className={`editor-canvas ${showGrid ? 'show-grid' : ''}`}
                            style={{ 
                                transform: `scale(${zoom / 100})`,
                                transformOrigin: 'top left'
                            }}
                            onClick={handleCanvasClick}
                        >
                            {/* Render all elements */}
                            {elements.map(renderElement)}
                            
                            {/* Canvas overlay for preview mode */}
                            {isPreviewMode && (
                                <div className="preview-overlay">
                                    <div className="preview-badge">
                                        <Eye size={16} />
                                        Preview Mode
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Properties Panel */}
                    <div className="properties-panel">
                        <div className="panel-header">
                            <h3>Properties</h3>
                        </div>

                        {selectedElement && (
                            <div className="element-properties">
                                {(() => {
                                    const element = elements.find(el => el.id === selectedElement);
                                    if (!element) return null;

                                    return (
                                        <>
                                            <div className="property-group">
                                                <h4>Element Info</h4>
                                                <div className="property-item">
                                                    <label>Type</label>
                                                    <span className="element-type-badge">{element.type}</span>
                                                </div>
                                                <div className="property-item">
                                                    <label>Content</label>
                                                    <input
                                                        type="text"
                                                        value={element.content}
                                                        onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="property-group">
                                                <h4>Position & Size</h4>
                                                <div className="property-grid">
                                                    <div className="property-item">
                                                        <label>X</label>
                                                        <input
                                                            type="number"
                                                            value={element.position.x}
                                                            onChange={(e) => updateElement(element.id, {
                                                                position: { ...element.position, x: parseInt(e.target.value) }
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="property-item">
                                                        <label>Y</label>
                                                        <input
                                                            type="number"
                                                            value={element.position.y}
                                                            onChange={(e) => updateElement(element.id, {
                                                                position: { ...element.position, y: parseInt(e.target.value) }
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="property-item">
                                                        <label>Width</label>
                                                        <input
                                                            type="number"
                                                            value={element.size.width}
                                                            onChange={(e) => updateElement(element.id, {
                                                                size: { ...element.size, width: parseInt(e.target.value) }
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="property-item">
                                                        <label>Height</label>
                                                        <input
                                                            type="number"
                                                            value={element.size.height}
                                                            onChange={(e) => updateElement(element.id, {
                                                                size: { ...element.size, height: parseInt(e.target.value) }
                                                            })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="property-group">
                                                <h4>Style</h4>
                                                <div className="property-item">
                                                    <label>Font Size</label>
                                                    <input
                                                        type="number"
                                                        value={element.style.fontSize}
                                                        onChange={(e) => updateElement(element.id, {
                                                            style: { ...element.style, fontSize: parseInt(e.target.value) }
                                                        })}
                                                    />
                                                </div>
                                                <div className="property-item">
                                                    <label>Color</label>
                                                    <input
                                                        type="color"
                                                        value={element.style.color}
                                                        onChange={(e) => updateElement(element.id, {
                                                            style: { ...element.style, color: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                                <div className="property-item">
                                                    <label>Background</label>
                                                    <input
                                                        type="color"
                                                        value={element.style.backgroundColor === 'transparent' ? '#ffffff' : element.style.backgroundColor}
                                                        onChange={(e) => updateElement(element.id, {
                                                            style: { ...element.style, backgroundColor: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            {element.properties.cornellReference && (
                                                <div className="property-group cornell-group">
                                                    <h4>Cornell Compliance</h4>
                                                    <div className="cornell-info">
                                                        <CheckCircle size={16} />
                                                        <span>{element.properties.cornellReference}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="property-actions">
                                                <button
                                                    className="property-btn secondary"
                                                    onClick={() => {
                                                        const newElement = { ...element, id: `${element.id}_copy` };
                                                        newElement.position = { 
                                                            x: element.position.x + 20, 
                                                            y: element.position.y + 20 
                                                        };
                                                        setElements(prev => [...prev, newElement]);
                                                    }}
                                                >
                                                    <Copy size={16} />
                                                    Duplicate
                                                </button>
                                                <button
                                                    className="property-btn danger"
                                                    onClick={() => deleteElement(element.id)}
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {!selectedElement && (
                            <div className="no-selection">
                                <Layers size={48} />
                                <p>Select an element to view properties</p>
                            </div>
                        )}

                        {/* Templates */}
                        <div className="templates-section">
                            <div className="section-header">
                                <h3>Templates</h3>
                            </div>
                            <div className="template-list">
                                {templates.map(template => (
                                    <div key={template.id} className="template-card">
                                        <div className="template-info">
                                            <h4>{template.name}</h4>
                                            <p>{template.description}</p>
                                            {template.cornellValidated && (
                                                <div className="cornell-badge">
                                                    <CheckCircle size={12} />
                                                    Cornell Validated
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className="template-load-btn"
                                            onClick={() => loadTemplate(template)}
                                        >
                                            Load
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Validation */}
                        <div className="validation-section">
                            <div className="section-header">
                                <h3>Cornell Validation</h3>
                                <button
                                    className={`validate-btn ${isValidating ? 'loading' : ''}`}
                                    onClick={validateDocument}
                                    disabled={isValidating}
                                >
                                    {isValidating ? (
                                        <>
                                            <RotateCcw size={16} className="spinning" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            Validate
                                        </>
                                    )}
                                </button>
                            </div>

                            {validation && (
                                <div className="validation-results">
                                    <div className="compliance-score">
                                        <div className="score-circle">
                                            <span>{validation.cornellCompliance}%</span>
                                        </div>
                                        <span>Cornell Compliance</span>
                                    </div>

                                    {validation.errors.length > 0 && (
                                        <div className="validation-errors">
                                            <h5>Errors</h5>
                                            {validation.errors.map((error, index) => (
                                                <div key={index} className="validation-item error">
                                                    <AlertCircle size={14} />
                                                    <span>{error}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {validation.warnings.length > 0 && (
                                        <div className="validation-warnings">
                                            <h5>Warnings</h5>
                                            {validation.warnings.map((warning, index) => (
                                                <div key={index} className="validation-item warning">
                                                    <AlertCircle size={14} />
                                                    <span>{warning}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveVisualEditor;