import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, AppErrorHandler, ErrorCode } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = AppErrorHandler.createError(
      ErrorCode.UNKNOWN_ERROR,
      'Something went wrong in the application',
      error.message
    );
    AppErrorHandler.logError(appError);
    
    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = AppErrorHandler.createError(
      ErrorCode.UNKNOWN_ERROR,
      'React component error',
      `${error.message}\n\nComponent Stack:\n${errorInfo.componentStack}`
    );
    AppErrorHandler.logError(appError);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🚨 Something went wrong</h2>
            <p className="error-message">{this.state.error.message}</p>
            {this.state.error.details && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre>{this.state.error.details}</pre>
              </details>
            )}
            <button 
              onClick={this.handleReset}
              className="error-reset-button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;