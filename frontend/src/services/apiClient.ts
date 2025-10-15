/**
 * Type-safe API client
 */

import { ApiClient, RequestConfig, ApiConfig, isApiError } from '../types/api';
import { ApiResponse, ApiError } from '../types';
import { AppErrorHandler, ErrorCode } from '../utils/errorHandler';

class TypedApiClient implements ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${config.url}`;
    const timeout = config.timeout || this.config.timeout;
    
    const requestInit: RequestInit = {
      method: config.method,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
      signal: AbortSignal.timeout(timeout),
    };

    if (config.data) {
      if (config.data instanceof FormData) {
        requestInit.body = config.data;
        // Remove Content-Type header for FormData - browser will set it with boundary
        delete (requestInit.headers as Record<string, string>)['Content-Type'];
      } else {
        requestInit.body = JSON.stringify(config.data);
      }
    }

    try {
      const response = await fetch(url, requestInit);
      const responseData = await response.json();

      if (!response.ok) {
        if (isApiError(responseData)) {
          throw AppErrorHandler.createError(
            responseData.error_code as ErrorCode,
            responseData.message,
            responseData.details
          );
        } else {
          throw AppErrorHandler.handleApiError(response, responseData);
        }
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw AppErrorHandler.createError(
          ErrorCode.NETWORK_ERROR,
          'Request timed out',
          `Timeout: ${timeout}ms`
        );
      }

      if (error.code) {
        // It's already an AppError
        throw error;
      }

      throw AppErrorHandler.handleNetworkError(error);
    }
  }

  async get<T>(url: string, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    const queryString = config.params 
      ? '?' + new URLSearchParams(
          Object.entries(config.params).map(([key, value]) => [key, String(value)])
        ).toString()
      : '';
    
    return this.request<T>({
      method: 'GET',
      url: url + queryString,
      ...config,
    });
  }

  async post<T>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  async put<T>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  async patch<T>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  async delete<T>(url: string, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  async upload<T>(url: string, file: File, config: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // Handle upload progress if callback provided
    if (config.onUploadProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && config.onUploadProgress) {
            const progress = Math.round((event.loaded * 100) / event.total);
            config.onUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ success: true, data });
            } catch (e) {
              reject(AppErrorHandler.createError(
                ErrorCode.PARSE_ERROR,
                'Failed to parse server response',
                xhr.responseText
              ));
            }
          } else {
            let errorData: any = {};
            try {
              errorData = JSON.parse(xhr.responseText);
            } catch (e) {
              // Response is not JSON
            }

            reject(AppErrorHandler.handleApiError(
              new Response(xhr.responseText, { status: xhr.status }),
              errorData
            ));
          }
        });

        xhr.addEventListener('error', () => {
          reject(AppErrorHandler.createError(
            ErrorCode.NETWORK_ERROR,
            'Upload failed due to network error'
          ));
        });

        xhr.addEventListener('timeout', () => {
          reject(AppErrorHandler.createError(
            ErrorCode.NETWORK_ERROR,
            'Upload timed out'
          ));
        });

        const fullUrl = `${this.config.baseURL}${url}`;
        xhr.timeout = config.timeout || this.config.timeout;
        xhr.open('POST', fullUrl);
        
        // Add custom headers
        Object.entries(config.headers || {}).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        
        xhr.send(formData);
      });
    }

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      ...config,
    });
  }
}

export { TypedApiClient };