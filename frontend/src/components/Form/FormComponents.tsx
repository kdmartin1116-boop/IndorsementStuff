/**
 * Reusable Form Components with proper TypeScript support
 */

import React from 'react';
import { FormFieldProps, SelectOption } from '../types';

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '' }) => (
  <div className={`form-group ${className}`.trim()}>
    {children}
  </div>
);

interface LabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ 
  htmlFor, 
  required = false, 
  children, 
  className = '' 
}) => (
  <label htmlFor={htmlFor} className={`form-label ${className}`.trim()}>
    {children}
    {required && <span className="required-indicator"> *</span>}
  </label>
);

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  error?: string;
  helpText?: string;
  onChange: (value: string) => void;
}

export const Input: React.FC<InputProps> = ({
  error,
  helpText,
  onChange,
  className = '',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="input-wrapper">
      <input
        {...props}
        onChange={handleChange}
        className={`form-input ${error ? 'error' : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
      />
      {helpText && !error && (
        <span id={`${props.id}-help`} className="help-text">
          {helpText}
        </span>
      )}
      {error && (
        <span id={`${props.id}-error`} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  error?: string;
  helpText?: string;
  onChange: (value: string) => void;
}

export const TextArea: React.FC<TextAreaProps> = ({
  error,
  helpText,
  onChange,
  className = '',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="textarea-wrapper">
      <textarea
        {...props}
        onChange={handleChange}
        className={`form-textarea ${error ? 'error' : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
      />
      {helpText && !error && (
        <span id={`${props.id}-help`} className="help-text">
          {helpText}
        </span>
      )}
      {error && (
        <span id={`${props.id}-error`} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  error?: string;
  helpText?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  error,
  helpText,
  onChange,
  placeholder,
  className = '',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="select-wrapper">
      <select
        {...props}
        onChange={handleChange}
        className={`form-select ${error ? 'error' : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <span id={`${props.id}-help`} className="help-text">
          {helpText}
        </span>
      )}
      {error && (
        <span id={`${props.id}-error`} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  label: string;
  error?: string;
  helpText?: string;
  onChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  helpText,
  onChange,
  className = '',
  id,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className={`checkbox-wrapper ${className}`.trim()}>
      <div className="checkbox-input-wrapper">
        <input
          {...props}
          id={id}
          type="checkbox"
          onChange={handleChange}
          className={`form-checkbox ${error ? 'error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        />
        <label htmlFor={id} className="checkbox-label">
          {label}
        </label>
      </div>
      {helpText && !error && (
        <span id={`${id}-help`} className="help-text">
          {helpText}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

interface FileInputProps {
  accept?: string;
  multiple?: boolean;
  error?: string;
  helpText?: string;
  onChange: (files: FileList | null) => void;
  className?: string;
  id: string;
  disabled?: boolean;
}

export const FileInput: React.FC<FileInputProps> = ({
  accept,
  multiple = false,
  error,
  helpText,
  onChange,
  className = '',
  id,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files);
  };

  return (
    <div className="file-input-wrapper">
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled}
        className={`form-file-input ${error ? 'error' : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
      />
      {helpText && !error && (
        <span id={`${id}-help`} className="help-text">
          {helpText}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

// Composite FormField component that handles all field types
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  options = [],
  error,
  helpText,
}) => {
  const fieldId = `field-${name}`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <TextArea
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            error={error}
            helpText={helpText}
          />
        );

      case 'select':
        return (
          <Select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            options={options}
            disabled={disabled}
            required={required}
            error={error}
            helpText={helpText}
            placeholder={placeholder}
          />
        );

      default:
        return (
          <Input
            id={fieldId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            error={error}
            helpText={helpText}
          />
        );
    }
  };

  return (
    <FormGroup>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      {renderInput()}
    </FormGroup>
  );
};