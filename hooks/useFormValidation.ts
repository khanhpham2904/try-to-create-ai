import { VALIDATION_RULES, ERROR_MESSAGES } from '../constants/config';
import { useCallback, useState, useEffect } from 'react';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const useFormValidation = () => {
  const validateEmail = useCallback((email: string): boolean => {
    return VALIDATION_RULES.EMAIL_REGEX.test(email);
  }, []);

  const validatePassword = useCallback((password: string): boolean => {
    return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
  }, []);

  const validateRequired = useCallback((value: string): boolean => {
    return value.trim().length > 0;
  }, []);

  const validateLogin = useCallback((
    email: string,
    password: string
  ): ValidationResult => {
    const errors: string[] = [];

    // Check required fields
    if (!validateRequired(email)) {
      errors.push('Email is required');
    }
    if (!validateRequired(password)) {
      errors.push('Password is required');
    }

    // Check email format
    if (validateRequired(email) && !validateEmail(email)) {
      errors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [validateEmail, validateRequired]);

  const validateRegistration = useCallback((
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): ValidationResult => {
    const errors: string[] = [];

    // Check required fields
    if (!validateRequired(name)) {
      errors.push('Name is required');
    }
    if (!validateRequired(email)) {
      errors.push('Email is required');
    }
    if (!validateRequired(password)) {
      errors.push('Password is required');
    }
    if (!validateRequired(confirmPassword)) {
      errors.push('Confirm password is required');
    }

    // Check email format
    if (validateRequired(email) && !validateEmail(email)) {
      errors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }

    // Check password length
    if (validateRequired(password) && !validatePassword(password)) {
      errors.push(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
    }

    // Check password confirmation
    if (validateRequired(password) && validateRequired(confirmPassword) && password !== confirmPassword) {
      errors.push(ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [validateEmail, validatePassword, validateRequired]);

  return {
    validateEmail,
    validatePassword,
    validateRequired,
    validateLogin,
    validateRegistration,
  };
};

// Custom hook for managing form validation state
export const useFormValidationState = (validationRules: {
  [key: string]: (value: string) => boolean;
}) => {
  const [validation, setValidation] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const updateValidation = useCallback((field: string, value: string) => {
    const isValid = validationRules[field] ? validationRules[field](value) : false;
    setValidation(prev => ({ ...prev, [field]: isValid }));
  }, [validationRules]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    validation,
    errors,
    updateValidation,
    clearError,
    setError,
    clearAllErrors,
  };
}; 