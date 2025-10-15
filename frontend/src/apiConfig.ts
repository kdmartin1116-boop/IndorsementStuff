import { ApiConfig } from './types/api';

export const API_BASE_URL = 'http://127.0.0.1:8002';

export const API_CONFIG: ApiConfig = {
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes
  headers: {
    'Content-Type': 'application/json',
  },
};

export const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf'],
  timeout: 300000, // 5 minutes
};
