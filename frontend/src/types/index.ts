/**
 * Type definitions for API responses and common data structures
 */

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: boolean;
  error_code?: string;
  message?: string;
  details?: string;
  status_code?: number;
  path?: string;
}

// Error types
export interface ApiError {
  error: boolean;
  error_code: string;
  message: string;
  details?: string;
  status_code: number;
  path?: string;
}

// File upload types
export interface FileUploadResponse {
  message: string;
  file_id?: string;
  file_path?: string;
  processed_at?: string;
}

// Endorsement types
export interface EndorsementRequest {
  file: File;
  options?: EndorsementOptions;
}

export interface EndorsementOptions {
  ink_color?: 'black' | 'blue' | 'red';
  placement?: 'front' | 'back';
  position?: {
    x: number;
    y: number;
  };
}

export interface EndorsementResponse {
  message: string;
  endorsed_files: string[];
  bill_data?: BillData;
  endorsements?: EndorsementDetails[];
}

export interface EndorsementDetails {
  endorser_name: string;
  text: string;
  signature: string;
  timestamp: string;
  next_payee?: string;
}

// Bill parsing types
export interface BillData {
  bill_number?: string;
  issuer?: string;
  customer_name?: string;
  customer_address?: string;
  total_amount?: number;
  currency?: string;
  due_date?: string;
  description?: string;
  account_number?: string;
  line_items?: BillLineItem[];
}

export interface BillLineItem {
  description: string;
  amount: number;
  quantity?: number;
  unit_price?: number;
}

// Contract scanning types
export interface ContractScanRequest {
  contract: File;
  tag: ContractScanTag;
}

export interface ContractScanResponse {
  found_clauses: string[];
  total_matches: number;
  confidence_score?: number;
}

export type ContractScanTag = 'hidden_fee' | 'misrepresentation' | 'arbitration';

export interface KeywordMap {
  [key: string]: string[];
}

// Letter generation types
export interface LetterGenerationRequest {
  type: 'tender' | 'ptp' | 'fcra';
  data: TenderLetterData | PTPLetterData | FCRALetterData;
}

export interface TenderLetterData {
  userName: string;
  userAddress: string;
  creditorName: string;
  creditorAddress: string;
  billFileName: string;
}

export interface PTPLetterData {
  userName: string;
  userAddress: string;
  creditorName: string;
  creditorAddress: string;
  accountNumber: string;
  promiseAmount: string;
  promiseDate: string;
}

export interface FCRALetterData {
  userName: string;
  userAddress: string;
  accountNumber: string;
  reason: string;
  violationTemplate: string;
  selectedBureaus: CreditBureau[];
}

export type CreditBureau = 'equifax' | 'experian' | 'transunion';

export interface LetterGenerationResponse {
  letterContent: string;
  letterType: string;
  generated_at: string;
}

// Component props types
export interface TabsProps {
  children: React.ReactNode;
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export interface TabPanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

// Form types
export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  error?: string;
  helpText?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// State management types
export interface AppState {
  user?: UserProfile;
  loading: boolean;
  error?: string | null;
  notifications: Notification[];
}

export interface UserProfile {
  name: string;
  email?: string;
  address: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultInkColor: 'black' | 'blue' | 'red';
  autoSave: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
  dismissed?: boolean;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[];
}

// Configuration types
export interface AppConfig {
  apiBaseUrl: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  features: FeatureFlags;
}

export interface FeatureFlags {
  endorsement: boolean;
  contractScanning: boolean;
  letterGeneration: boolean;
  bulkProcessing: boolean;
}

// Hook return types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseFormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (e?: React.FormEvent) => void;
  reset: () => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
}