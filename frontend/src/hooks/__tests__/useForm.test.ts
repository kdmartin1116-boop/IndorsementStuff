import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm Hook', () => {
  it('initializes with default values', () => {
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm({ initialValues }));
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates field values', () => {
    const { result } = renderHook(() => useForm({ initialValues: { name: '' } }));
    
    act(() => {
      result.current.handleChange('name', 'John Doe');
    });
    
    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.touched.name).toBe(true);
  });

  it('validates fields on blur', () => {
    const validate = (values: any) => {
      const errors: any = {};
      if (!values.email) {
        errors.email = 'Email is required';
      }
      return errors;
    };

    const { result } = renderHook(() => 
      useForm({ 
        initialValues: { email: '' },
        validate
      })
    );
    
    act(() => {
      result.current.handleBlur('email');
    });
    
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.touched.email).toBe(true);
  });

  it('handles form submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => 
      useForm({ 
        initialValues: { name: 'Test' },
        onSubmit
      })
    );
    
    await act(async () => {
      await result.current.handleSubmit();
    });
    
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Test' });
  });

  it('prevents submission with validation errors', async () => {
    const onSubmit = jest.fn();
    const validate = () => ({ name: 'Name is required' });
    
    const { result } = renderHook(() => 
      useForm({ 
        initialValues: { name: '' },
        validate,
        onSubmit
      })
    );
    
    await act(async () => {
      await result.current.handleSubmit();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.name).toBe('Name is required');
  });

  it('resets form to initial values', () => {
    const initialValues = { name: 'Initial' };
    const { result } = renderHook(() => useForm({ initialValues }));
    
    act(() => {
      result.current.handleChange('name', 'Changed');
      result.current.reset();
    });
    
    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('sets field errors', () => {
    const { result } = renderHook(() => useForm({ initialValues: { name: '' } }));
    
    act(() => {
      result.current.setFieldError('name', 'Custom error');
    });
    
    expect(result.current.errors.name).toBe('Custom error');
  });

  it('sets field values', () => {
    const { result } = renderHook(() => useForm({ initialValues: { name: '' } }));
    
    act(() => {
      result.current.setFieldValue('name', 'New Value');
    });
    
    expect(result.current.values.name).toBe('New Value');
    expect(result.current.touched.name).toBe(true);
  });
});