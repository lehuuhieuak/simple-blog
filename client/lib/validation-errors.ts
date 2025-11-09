/**
 * Validation error messages mapping
 * This is used to translate Zod validation errors with i18n
 */

export type ValidationErrorKey =
  | 'email.invalid'
  | 'password.min'
  | 'password.mismatch'
  | 'username.min'
  | 'username.max'
  | 'title.required'
  | 'title.max'
  | 'content.required'
  | 'name.required'
  | 'name.max'
  | 'description.max'
  | 'required';

/**
 * Get the translation key for a validation error
 * Maps Zod error messages to i18n translation keys
 */
export function getValidationErrorKey(message: string | undefined): ValidationErrorKey {
  if (!message) return 'required';

  const messageMap: Record<string, ValidationErrorKey> = {
    'Invalid email address': 'email.invalid',
    'Password must be at least 6 characters': 'password.min',
    "Passwords don't match": 'password.mismatch',
    'Password is required': 'password.min',
    'Username must be at least 3 characters': 'username.min',
    'Username must be less than 20 characters': 'username.max',
    'Title is required': 'title.required',
    'Title must be less than 255 characters': 'title.max',
    'Content is required': 'content.required',
    'Tag name is required': 'name.required',
    'Tag name must be less than 50 characters': 'name.max',
    'Description must be less than 200 characters': 'description.max',
  };

  return messageMap[message] || 'required';
}

/**
 * Hook to get translated validation error message
 * Usage: const translatedError = useValidationError(error, t)
 */
export function translateValidationError(
  message: string | undefined,
  t: (key: string) => string
): string {
  if (!message) return t('required');

  const errorKey = getValidationErrorKey(message);

  // Map to translation keys
  const translationKeyMap: Record<ValidationErrorKey, string> = {
    'email.invalid': 'email',
    'password.min': 'passwordMin',
    'password.mismatch': 'passwordMismatch',
    'username.min': 'usernameMin',
    'username.max': 'usernameMax',
    'title.required': 'required',
    'title.max': 'maxLength',
    'content.required': 'required',
    'name.required': 'required',
    'name.max': 'maxLength',
    'description.max': 'maxLength',
    'required': 'required',
  };

  const translationKey = translationKeyMap[errorKey];
  return t(translationKey);
}
