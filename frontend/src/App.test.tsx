import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App.tsx';

test('renders main header', () => {
  render(<App />);
  const linkElement = screen.getByText(/U.S. State National Status Correction/i);
  expect(linkElement).toBeInTheDocument();
});
