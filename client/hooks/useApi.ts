// Direct export of the new modular hook structure
// Clean, organized hooks with no legacy wrapper

'use client';

// Re-export everything from the new modular structure
export * from './api';

// Re-export query keys for external usage
export {
  authQueryKeys,
  postsQueryKeys,
  tagsQueryKeys,
  usersQueryKeys,
} from './api';
