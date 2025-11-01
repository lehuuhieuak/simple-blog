import { AuthApi } from './auth';
import { PostsApi } from './posts';
import { TagsApi } from './tags';
import { UsersApi } from './users';
import { DatabaseApi } from './database';

// Export the base class and error for other modules
export { BaseApiClient, ApiError } from './base';

// Export all API classes
export { AuthApi } from './auth';
export { PostsApi } from './posts';
export { TagsApi } from './tags';
export { UsersApi } from './users';
export { DatabaseApi } from './database';

// Export all types
export type { LoginRequest, RegisterRequest, AuthResponse } from './auth';

// Main API client that combines all modules
export class ApiClient {
  public auth: AuthApi;
  public posts: PostsApi;
  public tags: TagsApi;
  public users: UsersApi;
  public database: DatabaseApi;

  constructor() {
    this.auth = new AuthApi();
    this.posts = new PostsApi();
    this.tags = new TagsApi();
    this.users = new UsersApi();
    this.database = new DatabaseApi();
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
