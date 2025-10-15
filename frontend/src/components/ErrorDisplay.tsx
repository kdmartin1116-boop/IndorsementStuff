import React from 'react';
import { AppError, ErrorCode } from '../utils/errorHandler';

interface ErrorDisplayProps {
  error: AppError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onDismiss,
  className = 'error-display' 
}) => {
  if (!error) return null;

  const appError = typeof error === 'string' 
    ? { code: ErrorCode.UNKNOWN_ERROR, message: error, timestamp: new Date() }
    : error;

  const getErrorIcon = (code: string): string => {
    switch (code) {
      case ErrorCode.NETWORK_ERROR:
        return '🌐';
      case ErrorCode.VALIDATION_ERROR:
        return '⚠️';
      case ErrorCode.FILE_UPLOAD_ERROR:
        return '📁';
      case ErrorCode.UNAUTHORIZED:
        return '🔒';
      case ErrorCode.NOT_FOUND:
        return '🔍';
      case ErrorCode.SERVER_ERROR:
        return '🔧';
      default:
        return '❌';
    }
  };

  return (
    <div className={`${className} error-display-container`}>
      <div className="error-display-header">
        <span className="error-icon">{getErrorIcon(appError.code)}</span>
        <span className="error-title">Error</span>
        {onDismiss && (
          <button 
            className="error-dismiss-button"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="error-display-content">
        <p className="error-message">{appError.message}</p>
        
        {appError.details && (
          <details className="error-details">
            <summary>More information</summary>
            <pre className="error-details-text">{appError.details}</pre>
          </details>
        )}
        
        {onRetry && (
          <div className="error-actions">
            <button 
              className="error-retry-button"
              onClick={onRetry}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;