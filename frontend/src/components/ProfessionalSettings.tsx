import React, { useState } from 'react';

interface SettingSection {
    title: string;
    icon: string;
    settings: Setting[];
}

interface Setting {
    key: string;
    label: string;
    type: 'toggle' | 'select' | 'input' | 'textarea';
    value: any;
    options?: string[];
    description?: string;
}

const ProfessionalSettings: React.FC = () => {
    const [settings, setSettings] = useState<SettingSection[]>([
        {
            title: 'Processing Configuration',
            icon: '⚙️',
            settings: [
                {
                    key: 'auto_process',
                    label: 'Auto-process uploaded documents',
                    type: 'toggle',
                    value: true,
                    description: 'Automatically start document analysis when files are uploaded'
                },
                {
                    key: 'ocr_enabled',
                    label: 'Enable OCR for scanned documents',
                    type: 'toggle',
                    value: true,
                    description: 'Use optical character recognition for image-based documents'
                },
                {
                    key: 'confidence_threshold',
                    label: 'Confidence Threshold (%)',
                    type: 'input',
                    value: '85',
                    description: 'Minimum confidence level for automatic processing'
                },
                {
                    key: 'processing_mode',
                    label: 'Processing Mode',
                    type: 'select',
                    value: 'standard',
                    options: ['fast', 'standard', 'thorough'],
                    description: 'Select processing speed vs accuracy balance'
                }
            ]
        },
        {
            title: 'Endorsement Settings',
            icon: '✍️',
            settings: [
                {
                    key: 'default_endorsement_type',
                    label: 'Default Endorsement Type',
                    type: 'select',
                    value: 'blank',
                    options: ['blank', 'special', 'restrictive', 'qualified'],
                    description: 'Default type for new endorsements'
                },
                {
                    key: 'require_signature',
                    label: 'Require digital signature',
                    type: 'toggle',
                    value: true,
                    description: 'Require digital signature for all endorsements'
                },
                {
                    key: 'endorsement_template',
                    label: 'Default Endorsement Template',
                    type: 'textarea',
                    value: 'Pay to the order of [PAYEE]\n\nWithout recourse\n\nDate: [DATE]\nSignature: [SIGNATURE]',
                    description: 'Default template for endorsement text'
                }
            ]
        },
        {
            title: 'Security & Compliance',
            icon: '🔐',
            settings: [
                {
                    key: 'encryption_enabled',
                    label: 'Enable document encryption',
                    type: 'toggle',
                    value: true,
                    description: 'Encrypt all stored documents and data'
                },
                {
                    key: 'audit_logging',
                    label: 'Enable audit logging',
                    type: 'toggle',
                    value: true,
                    description: 'Log all document processing activities'
                },
                {
                    key: 'retention_period',
                    label: 'Document Retention (days)',
                    type: 'input',
                    value: '365',
                    description: 'Number of days to retain processed documents'
                },
                {
                    key: 'compliance_mode',
                    label: 'Compliance Framework',
                    type: 'select',
                    value: 'ucc',
                    options: ['ucc', 'federal', 'international'],
                    description: 'Select applicable legal framework'
                }
            ]
        },
        {
            title: 'Notification Preferences',
            icon: '🔔',
            settings: [
                {
                    key: 'email_notifications',
                    label: 'Email notifications',
                    type: 'toggle',
                    value: true,
                    description: 'Receive email notifications for processing events'
                },
                {
                    key: 'notification_email',
                    label: 'Notification Email',
                    type: 'input',
                    value: 'user@example.com',
                    description: 'Email address for notifications'
                },
                {
                    key: 'notification_types',
                    label: 'Notification Events',
                    type: 'select',
                    value: 'all',
                    options: ['all', 'errors_only', 'completions_only', 'none'],
                    description: 'Types of events to receive notifications for'
                }
            ]
        }
    ]);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const handleSettingChange = (sectionIndex: number, settingKey: string, newValue: any) => {
        setSettings(prev => prev.map((section, idx) => 
            idx === sectionIndex 
                ? {
                    ...section,
                    settings: section.settings.map(setting =>
                        setting.key === settingKey
                            ? { ...setting, value: newValue }
                            : setting
                    )
                }
                : section
        ));
        setHasUnsavedChanges(true);
        setSaveStatus('idle');
    };

    const handleSaveSettings = () => {
        setSaveStatus('saving');
        setHasUnsavedChanges(false);

        // Simulate API call
        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 1500);
    };

    const handleResetSettings = () => {
        // Reset to defaults logic would go here
        setHasUnsavedChanges(false);
        setSaveStatus('idle');
    };

    const renderSetting = (setting: Setting, sectionIndex: number) => {
        switch (setting.type) {
            case 'toggle':
                return (
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={setting.value}
                            onChange={(e) => handleSettingChange(sectionIndex, setting.key, e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                );

            case 'select':
                return (
                    <select
                        value={setting.value}
                        onChange={(e) => handleSettingChange(sectionIndex, setting.key, e.target.value)}
                        className="form-control"
                    >
                        {setting.options?.map(option => (
                            <option key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                        ))}
                    </select>
                );

            case 'input':
                return (
                    <input
                        type="text"
                        value={setting.value}
                        onChange={(e) => handleSettingChange(sectionIndex, setting.key, e.target.value)}
                        className="form-control"
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={setting.value}
                        onChange={(e) => handleSettingChange(sectionIndex, setting.key, e.target.value)}
                        className="form-control"
                        rows={4}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="component-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ color: '#2a5298', margin: 0 }}>⚙️ System Configuration</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="btn btn-outline"
                        onClick={handleResetSettings}
                    >
                        🔄 Reset
                    </button>
                    <button 
                        className={`btn ${hasUnsavedChanges ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={handleSaveSettings}
                        disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                    >
                        {saveStatus === 'saving' ? '💾 Saving...' : '💾 Save Changes'}
                    </button>
                </div>
            </div>

            {/* Save Status */}
            {saveStatus === 'saved' && (
                <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                    ✅ Settings saved successfully!
                </div>
            )}

            {saveStatus === 'error' && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                    ❌ Error saving settings. Please try again.
                </div>
            )}

            {hasUnsavedChanges && (
                <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                    ⚠️ You have unsaved changes. Don't forget to save your settings.
                </div>
            )}

            {/* Settings Sections */}
            {settings.map((section, sectionIndex) => (
                <div key={section.title} className="settings-section">
                    <h4 style={{ color: '#2a5298', marginBottom: '20px' }}>
                        {section.icon} {section.title}
                    </h4>
                    
                    {section.settings.map(setting => (
                        <div key={setting.key} className="setting-item">
                            <div className="setting-header">
                                <label className="setting-label">
                                    {setting.label}
                                </label>
                                <div className="setting-control">
                                    {renderSetting(setting, sectionIndex)}
                                </div>
                            </div>
                            {setting.description && (
                                <p className="setting-description">
                                    {setting.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            {/* Advanced Settings */}
            <div className="settings-section">
                <h4 style={{ color: '#2a5298', marginBottom: '20px' }}>
                    🔧 Advanced Configuration
                </h4>
                
                <div className="setting-item">
                    <div className="setting-header">
                        <label className="setting-label">Configuration Export/Import</label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="btn btn-outline">
                            📤 Export Config
                        </button>
                        <button className="btn btn-outline">
                            📥 Import Config
                        </button>
                    </div>
                    <p className="setting-description">
                        Export your current configuration or import a previously saved configuration file.
                    </p>
                </div>

                <div className="setting-item">
                    <div className="setting-header">
                        <label className="setting-label">System Diagnostics</label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button className="btn btn-outline">
                            🔍 Run Diagnostics
                        </button>
                        <button className="btn btn-outline">
                            📊 View Logs
                        </button>
                    </div>
                    <p className="setting-description">
                        Run system diagnostics or view detailed application logs.
                    </p>
                </div>
            </div>

            {/* System Information */}
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ color: '#2a5298', marginBottom: '15px' }}>📋 System Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                        <strong>Version:</strong> v2.1.0
                    </div>
                    <div>
                        <strong>Last Updated:</strong> 2024-12-27
                    </div>
                    <div>
                        <strong>License:</strong> Commercial
                    </div>
                    <div>
                        <strong>Support:</strong> Active
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalSettings;