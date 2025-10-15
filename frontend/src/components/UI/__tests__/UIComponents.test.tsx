import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/testUtils';
import { Button, LoadingButton, Badge, Alert, Modal, Spinner } from '../UIComponents';
import { LoadingState } from '../../../types';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn', 'btn-primary', 'btn-md');
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');

    rerender(<Button variant="danger">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');

    rerender(<Button variant="ghost">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-ghost');
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-sm');

    rerender(<Button size="lg">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-lg');
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn-loading');
    expect(button.querySelector('.btn-spinner')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with icons', () => {
    render(
      <Button leftIcon={<span>👈</span>} rightIcon={<span>👉</span>}>
        With icons
      </Button>
    );
    
    expect(screen.getByText('👈')).toBeInTheDocument();
    expect(screen.getByText('👉')).toBeInTheDocument();
  });

  it('applies full width styling', () => {
    render(<Button fullWidth>Full width</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-full-width');
  });
});

describe('LoadingButton Component', () => {
  it('shows loading state correctly', () => {
    render(
      <LoadingButton loadingState="loading" loadingText="Processing...">
        Submit
      </LoadingButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Processing...');
  });

  it('shows normal state when not loading', () => {
    render(<LoadingButton loadingState="idle">Submit</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Submit');
  });

  it('handles error state', () => {
    render(<LoadingButton loadingState="error">Submit</LoadingButton>);
    
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent('Submit');
  });
});

describe('Badge Component', () => {
  it('renders with different variants', () => {
    const { rerender } = render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('badge-default');

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('badge-success');

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('badge-error');
  });

  it('applies different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('badge-sm');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('badge-lg');
  });
});

describe('Alert Component', () => {
  it('renders with different variants', () => {
    const { rerender } = render(<Alert>Info message</Alert>);
    let alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-info');

    rerender(<Alert variant="success">Success message</Alert>);
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-success');

    rerender(<Alert variant="warning">Warning message</Alert>);
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-warning');

    rerender(<Alert variant="error">Error message</Alert>);
    alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert-error');
  });

  it('shows title when provided', () => {
    render(<Alert title="Important">Message content</Alert>);
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Message content')).toBeInTheDocument();
  });

  it('can be closable', () => {
    const handleClose = jest.fn();
    render(
      <Alert closable onClose={handleClose}>
        Closable alert
      </Alert>
    );
    
    const closeButton = screen.getByRole('button', { name: /close alert/i });
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('Modal Component', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Test Modal">
        Modal content
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Modal content
      </Modal>
    );
    
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen onClose={handleClose}>
        Content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen onClose={handleClose} closeOnBackdrop>
        Content
      </Modal>
    );
    
    fireEvent.click(document.querySelector('.modal-overlay')!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on backdrop click when disabled', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen onClose={handleClose} closeOnBackdrop={false}>
        Content
      </Modal>
    );
    
    fireEvent.click(document.querySelector('.modal-overlay')!);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('applies different sizes', () => {
    const { rerender } = render(
      <Modal isOpen onClose={() => {}} size="sm">
        Small modal
      </Modal>
    );
    expect(document.querySelector('.modal')).toHaveClass('modal-sm');

    rerender(
      <Modal isOpen onClose={() => {}} size="lg">
        Large modal
      </Modal>
    );
    expect(document.querySelector('.modal')).toHaveClass('modal-lg');
  });
});

describe('Spinner Component', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner', 'spinner-md', 'spinner-primary');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies different sizes', () => {
    const { rerender } = render(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-sm');

    rerender(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-lg');
  });

  it('applies different colors', () => {
    const { rerender } = render(<Spinner color="secondary" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-secondary');

    rerender(<Spinner color="white" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-white');
  });
});