import React from 'react';
import { render, screen, fireEvent, userEvent } from '../../../utils/testUtils';
import { Input, TextArea, Select, Checkbox, FileInput, FormField } from '../FormComponents';
import { createMockFile } from '../../../utils/testUtils';

describe('Form Components', () => {
  describe('Input Component', () => {
    it('renders basic input', () => {
      render(<Input name="test" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('name', 'test');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('handles different input types', () => {
      const { rerender } = render(<Input type="email" name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" name="password" />);
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');

      rerender(<Input type="number" name="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('shows error state', () => {
      render(<Input name="test" error="This field is required" />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass('form-input-error');
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('can be disabled', () => {
      render(<Input name="test" disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('handles value changes', async () => {
      const handleChange = jest.fn();
      render(<Input name="test" onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('hello');
    });
  });

  describe('TextArea Component', () => {
    it('renders textarea', () => {
      render(<TextArea name="message" placeholder="Enter message" />);
      const textarea = screen.getByPlaceholderText('Enter message');
      
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('applies custom rows and cols', () => {
      render(<TextArea name="test" rows={10} cols={50} />);
      const textarea = screen.getByRole('textbox');
      
      expect(textarea).toHaveAttribute('rows', '10');
      expect(textarea).toHaveAttribute('cols', '50');
    });

    it('shows character count when maxLength is set', () => {
      render(<TextArea name="test" maxLength={100} showCharCount />);
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });

    it('updates character count on input', async () => {
      render(<TextArea name="test" maxLength={100} showCharCount />);
      const textarea = screen.getByRole('textbox');
      
      await userEvent.type(textarea, 'Hello world');
      expect(screen.getByText('11/100')).toBeInTheDocument();
    });
  });

  describe('Select Component', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    it('renders select with options', () => {
      render(<Select name="test" options={options} />);
      const select = screen.getByRole('combobox');
      
      expect(select).toBeInTheDocument();
      expect(screen.getByDisplayValue('Select an option')).toBeInTheDocument();
    });

    it('shows custom placeholder', () => {
      render(<Select name="test" options={options} placeholder="Choose option" />);
      expect(screen.getByDisplayValue('Choose option')).toBeInTheDocument();
    });

    it('handles selection changes', async () => {
      const handleChange = jest.fn();
      render(<Select name="test" options={options} onChange={handleChange} />);
      
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'option2');
      
      expect(handleChange).toHaveBeenCalled();
      expect(select).toHaveValue('option2');
    });

    it('supports multiple selection', async () => {
      render(<Select name="test" options={options} multiple />);
      const select = screen.getByRole('listbox');
      
      await userEvent.selectOptions(select, ['option1', 'option2']);
      expect(select).toHaveValue(['option1', 'option2']);
    });
  });

  describe('Checkbox Component', () => {
    it('renders checkbox', () => {
      render(<Checkbox name="test" label="Accept terms" />);
      const checkbox = screen.getByRole('checkbox');
      
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('handles checked state', async () => {
      const handleChange = jest.fn();
      render(<Checkbox name="test" label="Test" onChange={handleChange} />);
      
      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);
      
      expect(handleChange).toHaveBeenCalled();
      expect(checkbox).toBeChecked();
    });

    it('can be disabled', () => {
      render(<Checkbox name="test" label="Disabled" disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('supports indeterminate state', () => {
      render(<Checkbox name="test" label="Indeterminate" indeterminate />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });
  });

  describe('FileInput Component', () => {
    it('renders file input', () => {
      render(<FileInput name="upload" />);
      const fileInput = screen.getByLabelText(/choose file/i);
      
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('accepts specific file types', () => {
      render(<FileInput name="upload" accept=".pdf,.doc" />);
      expect(screen.getByLabelText(/choose file/i)).toHaveAttribute('accept', '.pdf,.doc');
    });

    it('supports multiple files', () => {
      render(<FileInput name="upload" multiple />);
      expect(screen.getByLabelText(/choose files/i)).toHaveAttribute('multiple');
    });

    it('handles file selection', async () => {
      const handleChange = jest.fn();
      render(<FileInput name="upload" onChange={handleChange} />);
      
      const file = createMockFile('test.pdf');
      const input = screen.getByLabelText(/choose file/i);
      
      await userEvent.upload(input, file);
      
      expect(handleChange).toHaveBeenCalled();
      expect(input.files?.[0]).toBe(file);
    });

    it('shows selected file name', async () => {
      render(<FileInput name="upload" />);
      
      const file = createMockFile('document.pdf');
      const input = screen.getByLabelText(/choose file/i);
      
      await userEvent.upload(input, file);
      
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });
  });

  describe('FormField Component', () => {
    it('renders with label and input', () => {
      render(
        <FormField label="Full Name" name="name" required>
          <Input name="name" />
        </FormField>
      );
      
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows help text', () => {
      render(
        <FormField label="Email" name="email" helpText="We'll never share your email">
          <Input name="email" type="email" />
        </FormField>
      );
      
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('shows error message', () => {
      render(
        <FormField label="Password" name="password" error="Password is required">
          <Input name="password" type="password" />
        </FormField>
      );
      
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toHaveClass('form-field-error');
    });

    it('applies error styling to child input', () => {
      render(
        <FormField label="Name" name="name" error="Required">
          <Input name="name" />
        </FormField>
      );
      
      expect(screen.getByRole('textbox')).toHaveClass('form-input-error');
    });

    it('connects label to input with proper ID', () => {
      render(
        <FormField label="Username" name="username">
          <Input name="username" />
        </FormField>
      );
      
      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', expect.stringContaining('username'));
      expect(input).toHaveAttribute('id', expect.stringContaining('username'));
    });
  });
});