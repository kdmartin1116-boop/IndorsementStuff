// Re-export everything from testing library
export * from '@testing-library/react';

// Mock file for testing file uploads
export const createMockFile = (name = 'test.pdf', type = 'application/pdf') => {
  return new File(['test content'], name, { type });
};