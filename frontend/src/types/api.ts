/**
 * API client types and configurations
 */

import { ApiResponse, ApiError } from './index';

// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  timeout?: number;
  onUploadProgress?: (progress: number) => void;
}

// API Client interface
export interface ApiClient {
  get<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
  upload<T>(url: string, file: File, config?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
}

// Endpoint definitions
export const API_ENDPOINTS = {
  // Endorsement endpoints
  ENDORSE_BILL: '/api/endorse-bill/',
  
  // Document processing
  SCAN_CONTRACT: '/scan-for-terms',
  
  // Letter generation
  GENERATE_TENDER_LETTER: '/generate-tender-letter',
  GENERATE_PTP_LETTER: '/generate-ptp-letter',
  GENERATE_FCRA_LETTER: '/generate-fcra-letter',
  
  // File serving
  SERVE_FILE: '/uploads/{filename}',
  
  // Utilities
  POSITIONER: '/positioner',
  HEALTH_CHECK: '/health',
} as const;

// API Error codes mapping
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Request/Response type guards
export function isApiError(response: any): response is ApiError {
  return response && response.error === true && typeof response.error_code === 'string';
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response && response.success === true && response.data !== undefined;
}

// File upload specific types
export interface FileUploadConfig extends Partial<RequestConfig> {
  maxSize?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Retry configuration
export interface RetryConfig {
  attempts: number;
  delay: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: ApiError) => boolean;
}