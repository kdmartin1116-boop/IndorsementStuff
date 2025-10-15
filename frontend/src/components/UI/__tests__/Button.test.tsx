/**
 * Basic Button Component Test
 * Simple test to validate our testing infrastructure
 */

// @ts-nocheck - Skip TypeScript checking for now
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../UIComponents';

test('Button renders with text', () => {
  render(<Button onClick={() => {}}>Click me</Button>);
  const button = screen.getByText('Click me');
  expect(button).toBeInTheDocument();
});

test('Button can be clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  const button = screen.getByText('Click me');
  button.click();
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('Button shows loading state', () => {
  render(<Button loading onClick={() => {}}>Loading</Button>);
  const button = screen.getByRole('button');
  
  expect(button).toBeDisabled();
  expect(button.querySelector('.btn-spinner')).toBeTruthy();
});

test('Button applies variant classes', () => {
  const { rerender } = render(<Button variant="primary" onClick={() => {}}>Primary</Button>);
  expect(screen.getByRole('button')).toHaveClass('btn-primary');
  
  rerender(<Button variant="secondary" onClick={() => {}}>Secondary</Button>);
  expect(screen.getByRole('button')).toHaveClass('btn-secondary');
});

test('Badge renders with text and variant', () => {
  const { Badge } = require('../UIComponents');
  render(<Badge variant="success">Success Badge</Badge>);
  
  const badge = screen.getByText('Success Badge');
  expect(badge).toBeInTheDocument();
  expect(badge).toHaveClass('badge-success');
});