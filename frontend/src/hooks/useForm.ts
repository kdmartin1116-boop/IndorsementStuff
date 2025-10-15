/**
 * Type-safe form management hook
 */

import { useState, useCallback } from 'react';
import { UseFormState } from '../types';

interface ValidationRule<T> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T[keyof T]) => string | undefined;
}

type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T>>>;

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {}
): UseFormState<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, value: any): string | undefined => {
      const rules = validationRules[field];
      if (!rules) return undefined;

      if (rules.required && (!value || value.toString().trim() === '')) {
        return `${String(field)} is required`;
      }

      if (value && rules.minLength && value.toString().length < rules.minLength) {
        return `${String(field)} must be at least ${rules.minLength} characters`;
      }

      if (value && rules.maxLength && value.toString().length > rules.maxLength) {
        return `${String(field)} must be no more than ${rules.maxLength} characters`;
      }

      if (value && rules.pattern && !rules.pattern.test(value.toString())) {
        return `${String(field)} format is invalid`;
      }

      if (rules.custom) {
        return rules.custom(value);
      }

      return undefined;
    },
    [validationRules]
  );

  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      
      const error = validateField(field, values[field]);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [validateField, values]
  );

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      const field = key as keyof T;
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );

    return isValid;
  }, [values, validateField]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) =>
      (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }

        if (validateAll()) {
          onSubmit(values);
        }
      },
    [values, validateAll]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = Object.keys(errors).every((key) => !errors[key as keyof T]);
  const isDirty = Object.keys(values).some(
    (key) => values[key as keyof T] !== initialValues[key as keyof T]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  };
}

// Specific form validation rules
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
  },
  required: {
    required: true,
  },
  minLength: (min: number) => ({
    required: true,
    minLength: min,
  }),
  maxLength: (max: number) => ({
    maxLength: max,
  }),
  currency: {
    pattern: /^\d+(\.\d{1,2})?$/,
    custom: (value: string) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return 'Must be a valid positive number';
      }
      return undefined;
    },
  },
};