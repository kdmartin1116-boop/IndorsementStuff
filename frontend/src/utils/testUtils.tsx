import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock providers for testing
interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render function with providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };

// Test data factories
export const createMockApiResponse = <T>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString(),
});

export const createMockEndorsementResponse = () => createMockApiResponse({
  endorsementId: 'test-123',
  status: 'completed' as const,
  endorsementText: 'Test endorsement text',
  signature: 'test-signature',
  timestamp: new Date().toISOString(),
});

export const createMockBillData = () => ({
  billId: 'bill-123',
  amount: 1000,
  currency: 'USD',
  dueDate: new Date().toISOString(),
  payee: 'Test Payee',
  description: 'Test bill description',
});

export const createMockFormData = () => ({
  name: 'John Doe',
  email: 'john@example.com',
  amount: '1000',
  description: 'Test description',
});

// Mock file for testing file uploads
export const createMockFile = (name = 'test.pdf', type = 'application/pdf', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Wait for async operations in tests
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Mock localStorage for testing
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// Mock fetch for API testing
export const createMockFetch = (responses: Array<{ data?: any; status?: number; ok?: boolean }>) => {
  let callIndex = 0;
  
  return jest.fn().mockImplementation(() => {
    const response = responses[callIndex] || responses[responses.length - 1];
    callIndex++;
    
    return Promise.resolve({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data)),
    });
  });
};

// Error boundary for testing error states
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div>Error occurred</div>;
    }

    return this.props.children;
  }
}

// Custom matchers for testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveFormData(expected: Record<string, any>): R;
      toBeValidFormField(): R;
    }
  }
}

// Extend Jest with custom matchers
expect.extend({
  toHaveFormData(received: HTMLFormElement, expected: Record<string, any>) {
    const formData = new FormData(received);
    const actualData: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      actualData[key] = value;
    });
    
    const pass = Object.keys(expected).every(key => 
      actualData[key] === expected[key]
    );
    
    return {
      message: () => 
        pass 
          ? `Expected form not to have data ${JSON.stringify(expected)}`
          : `Expected form to have data ${JSON.stringify(expected)}, but got ${JSON.stringify(actualData)}`,
      pass,
    };
  },
  
  toBeValidFormField(received: HTMLElement) {
    const isInput = received.tagName === 'INPUT';
    const isTextarea = received.tagName === 'TEXTAREA';
    const isSelect = received.tagName === 'SELECT';
    const hasName = received.hasAttribute('name');
    const hasId = received.hasAttribute('id');
    
    const pass = (isInput || isTextarea || isSelect) && (hasName || hasId);
    
    return {
      message: () =>
        pass
          ? 'Expected element not to be a valid form field'
          : 'Expected element to be a valid form field (input, textarea, or select with name or id)',
      pass,
    };
  },
});