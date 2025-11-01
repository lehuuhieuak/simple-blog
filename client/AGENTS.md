# Developer Guide - Blog Next.js Frontend

## Project Overview

- **Purpose**: Modern blog platform for developers to share knowledge and experiences
- **Language**: TypeScript
- **Framework**: Next.js 15.5.0 with App Router
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Database**: SQL Server (via Golang API backend)
- **Authentication**: JWT tokens with localStorage
- **Internationalization**: English and Vietnamese (next-intl)

## Key Technologies

- **State Management**: TanStack Query (React Query) for server state
- **Rich Text Editor**: Lexical editor with Markdown support
- **Styling**: Tailwind CSS v4 with CSS variables
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Theme**: Next Themes (light/dark mode)

## Project Structure

### Core Directories
- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable React components
- `components/ui/` - shadcn/ui base components
- `contexts/` - React Context providers (Auth, Query, Theme)
- `hooks/` - Custom React hooks, especially TanStack Query hooks
- `lib/` - Utility functions, API client, configurations
- `messages/` - Internationalization messages (en.json, vi.json)
- `styles/` - Global CSS files
- `public/` - Static assets

### Key Files
- `lib/api.ts` - API client with JWT authentication
- `hooks/useApi.ts` - TanStack Query hooks for all API operations
- `contexts/QueryProvider.tsx` - TanStack Query configuration
- `contexts/AuthContext.tsx` - Authentication state management
- `lib/validations.ts` - Zod schemas for form validation
- `lib/utils.ts` - Utility functions (cn for className merging)
- `components.json` - shadcn/ui configuration

## Development Setup

### Prerequisites
- Node.js (latest LTS)
- Golang API server running on port 8080

### Installation
```bash
npm install
cp .env.local.example .env.local
npm run dev
```

### Environment Variables
- `NEXT_PUBLIC_API_URL` - API base URL (default: http://localhost:8080/api)

## Coding Conventions

### File Naming
- Use kebab-case for file names: `create-post-form.tsx`
- Use PascalCase for component names: `CreatePostForm`
- Use camelCase for hooks: `useCreatePost`

### Component Structure
- Always use TypeScript with proper interface definitions
- Prefer functional components with hooks
- Use `'use client'` directive for client components
- Export interfaces at the top of files

### State Management
- Use TanStack Query for server state (API data)
- Use React Context for global client state (auth, theme)
- Use useState for local component state
- Avoid prop drilling - use context when appropriate

### API Integration
- All API calls should use TanStack Query hooks from `hooks/useApi.ts`
- Follow the established query key pattern: `['resource', ...params]`
- Use mutations for create/update/delete operations
- Always handle loading and error states

### Styling Guidelines
- Use Tailwind CSS classes exclusively
- Utilize shadcn/ui components for consistency
- Use the `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Leverage CSS variables for theming

### Form Handling
- Use React Hook Form with Zod validation
- Define schemas in `lib/validations.ts`
- Handle form submission with TanStack Query mutations
- Provide proper error messaging

## Component Patterns

### Data Fetching Components
```typescript
export function PostList() {
  const { data, isLoading, error } = usePosts(page, limit);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* render data */}</div>;
}
```

### Mutation Components
```typescript
export function CreatePostForm() {
  const createPost = useCreatePost();
  
  const handleSubmit = async (data) => {
    try {
      await createPost.mutateAsync(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
  
  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### Error Boundaries
- Always provide error boundaries for async operations
- Use consistent error messaging patterns
- Implement retry mechanisms where appropriate

## Internationalization

### Message Keys
- Use nested keys: `home.hero.title`
- Keep messages in `messages/en.json` and `messages/vi.json`
- Use useTranslations hook: `const t = useTranslations('home')`

### Locale Handling
- Default locale: Vietnamese (`vi`)
- Supported locales: `['vi', 'en']`
- Locale switching via context and cookies

## Authentication Flow

### JWT Token Management
- Tokens stored in localStorage
- Automatic inclusion in API requests
- Token validation on route changes
- Automatic logout on token expiry

### Protected Routes
- Use `useAuth` hook to check authentication status
- Redirect to login for unauthenticated users
- Handle loading states during auth checks

## Performance Optimizations

### TanStack Query Configuration
- 5-minute stale time for cached data
- 10-minute garbage collection
- Smart retry logic (no retry on 401/403)
- Background refetching disabled by default

### Code Splitting
- Dynamic imports for heavy components
- Lazy loading for non-critical features
- Proper loading states for async components

## Best Practices

### Component Design
- Keep components small and focused
- Use composition over inheritance
- Implement proper TypeScript interfaces
- Handle edge cases (loading, error, empty states)

### Data Management
- Invalidate queries after mutations
- Use optimistic updates where appropriate
- Implement proper error recovery
- Cache management with TanStack Query

### Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast ratios

### Security
- Validate all inputs with Zod
- Sanitize user-generated content
- Handle authentication securely
- Implement proper error boundaries

## Testing Guidelines

### Component Testing
- Test user interactions
- Mock API calls with TanStack Query
- Test error and loading states
- Use React Testing Library patterns

### API Integration Testing
- Test query hooks with mock data
- Verify mutation side effects
- Test error handling scenarios
- Validate cache invalidation

## Build and Deployment

### Build Process
- `npm run build` - Production build with Turbopack
- `npm run start` - Production server
- `npm run lint` - ESLint validation

### Production Considerations
- Enable React Query DevTools only in development
- Optimize bundle size with proper imports
- Configure proper caching headers
- Monitor performance with Next.js analytics

## Troubleshooting

### Common Issues
- **TanStack Query DevTools not showing**: Check development environment
- **Authentication loops**: Verify token storage and API responses
- **Styling conflicts**: Use `cn()` utility for class merging
- **Hydration mismatches**: Ensure client/server state consistency

### Debug Tools
- React Query DevTools for cache inspection
- Next.js DevTools for performance monitoring
- Browser DevTools for network inspection
- TypeScript compiler for type checking

## Migration Notes

### TanStack Query Integration
- All components migrated from manual fetch to TanStack Query
- Automatic cache management and invalidation
- Optimistic updates for better UX
- Centralized error handling patterns

### Recent Updates
- Upgraded to Next.js 15.5.0
- Implemented TanStack Query v5
- Added comprehensive TypeScript support
- Integrated shadcn/ui component system