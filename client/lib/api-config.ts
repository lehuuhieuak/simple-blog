// Direct export of the new modular API structure
// No legacy wrapper - clean, modern API client

export { ApiClient, ApiError } from './api';
export { apiClient as default } from './api';

// Re-export all types for convenience
export type { LoginRequest, RegisterRequest, AuthResponse } from './api';

// Export the main API client instance
export { apiClient } from './api';
