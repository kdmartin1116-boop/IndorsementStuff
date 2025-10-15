/**
 * Centralized error handling utilities
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  API_ERROR = 'API_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AppErrorHandler {
  static createError(code: ErrorCode, message: string, details?: string): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date()
    };
  }

  static handleApiError(response: Response, errorData?: any): AppError {
    switch (response.status) {
      case 400:
        return this.createError(
          ErrorCode.VALIDATION_ERROR,
          errorData?.detail || 'Invalid request data',
          `Status: ${response.status}`
        );
      case 401:
        return this.createError(
          ErrorCode.UNAUTHORIZED,
          'Authentication required',
          `Status: ${response.status}`
        );
      case 404:
        return this.createError(
          ErrorCode.NOT_FOUND,
          'Resource not found',
          `Status: ${response.status}`
        );
      case 500:
        return this.createError(
          ErrorCode.SERVER_ERROR,
          'Internal server error',
          `Status: ${response.status}`
        );
      default:
        return this.createError(
          ErrorCode.API_ERROR,
          errorData?.detail || `Request failed with status ${response.status}`,
          `Status: ${response.status}`
        );
    }
  }

  static handleNetworkError(error: any): AppError {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createError(
        ErrorCode.NETWORK_ERROR,
        'Unable to connect to server. Please check your internet connection.',
        error.message
      );
    }

    return this.createError(
      ErrorCode.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred',
      error.stack
    );
  }

  static handleFileUploadError(error: any): AppError {
    if (error.name === 'FileTooLargeError') {
      return this.createError(
        ErrorCode.FILE_UPLOAD_ERROR,
        'File is too large. Please select a smaller file.',
        error.message
      );
    }

    if (error.name === 'FileTypeError') {
      return this.createError(
        ErrorCode.FILE_UPLOAD_ERROR,
        'Invalid file type. Please select a valid file.',
        error.message
      );
    }

    return this.createError(
      ErrorCode.FILE_UPLOAD_ERROR,
      'Failed to upload file. Please try again.',
      error.message
    );
  }

  static validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): AppError | null {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = ['application/pdf'] } = options;

    if (file.size > maxSize) {
      return this.createError(
        ErrorCode.VALIDATION_ERROR,
        `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
        `File size: ${Math.round(file.size / (1024 * 1024))}MB`
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return this.createError(
        ErrorCode.VALIDATION_ERROR,
        `File type must be one of: ${allowedTypes.join(', ')}`,
        `File type: ${file.type}`
      );
    }

    return null;
  }

  static logError(error: AppError): void {
    console.error(`[${error.code}] ${error.message}`, {
      details: error.details,
      timestamp: error.timestamp
    });
  }
}