// src/lib/utils/validation.ts
interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validate a birthdate string
 * @param birthdate - ISO string of birthdate
 * @returns ValidationResult object
 */
export const validateBirthdate = (birthdate: string): ValidationResult => {
  if (!birthdate) {
    return { isValid: false, message: 'Date of birth is required' };
  }

  const birthdateDate = new Date(birthdate);
  const today = new Date();

  // Check if date is valid
  if (isNaN(birthdateDate.getTime())) {
    return { isValid: false, message: 'Unvalid date' };
  }

  // Check if date is in the future
  if (birthdateDate > today) {
    return { isValid: false, message: 'Date of birth cannot be in the future' };
  }

  // Calculate age
  let age = today.getFullYear() - birthdateDate.getFullYear();
  const monthDiff = today.getMonth() - birthdateDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdateDate.getDate())) {
    age--;
  }

  // Check minimum age
  if (age < 13) {
    return { isValid: false, message: 'You have to be at least 13 years old' };
  }

  return { isValid: true };
};

/**
 * Format a date string into Dutch "dd-mm-yyyy" format
 * @param date - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
