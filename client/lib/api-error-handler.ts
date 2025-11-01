import { ApiError } from './api';

/**
 * Utility function to handle API errors consistently across the application
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 422;
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'NETWORK_ERROR';
}

/**
 * Extract validation errors from API response
 */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.status === 422) {
    // Try to extract field-specific errors if the API provides them
    // This would depend on your API's error response format
    return {};
  }
  return {};
}