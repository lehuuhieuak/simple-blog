# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **blog application with separated frontend and backend**:
- **Backend**: Go REST API using Gin framework with PostgreSQL
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, and Lexical rich text editor
- **Database**: PostgreSQL 15 (migrated from MSSQL)
- **Authentication**: JWT tokens with 24-hour expiration
- **Architecture**: Monorepo with independently deployable services

## Common Development Commands

### Backend (API)

```bash
# Development
cd api
go mod tidy              # Install/update dependencies
go run main.go           # Run API server (port 8080)

# Building
go build -o blog-api     # Build binary

# Code quality
go fmt ./...             # Format code
go vet ./...             # Analyze code

# Testing (when tests exist)
go test ./...            # Run all tests
go test -v -run TestAuthService ./internal/service/...  # Run specific test

# Database initialization (after server starts)
curl -X POST http://localhost:8080/api/init-db  # Creates schema and seeds data
```

**API Health & Documentation**:
- Health check: `http://localhost:8080/health` (returns `{"status":"ok"}`)
- Swagger docs: `http://localhost:8080/swagger/index.html` (auto-generated from code annotations)

### Frontend (Client)

```bash
# Development
cd client
npm install              # Install dependencies
npm run dev              # Run dev server with Turbopack (port 3000)

# Building
npm run build            # Production build
npm start                # Run production server

# Code quality
npm run lint             # Run ESLint
npm run lint -- --fix    # Fix linting issues automatically
```

### Full Stack - Docker

```bash
# Development environment (hot reload)
docker-compose -f docker-compose.dev.yml up --build

# Production environment
docker-compose up --build -d
docker-compose exec api curl -X POST http://localhost:8080/api/init-db  # Init database

# View logs
docker-compose logs -f [api|client|postgres]

# Stop services
docker-compose down
```

## Architecture Overview

### Backend Structure (Clean Layered Architecture)

```
api/
├── main.go                           # Entry point, route setup
├── config/config.go                  # Environment configuration
├── database/                         # Database setup & queries
│   ├── connection.go
│   ├── init.go                       # Schema creation & triggers
│   └── seed.go                       # Default data seeding
├── internal/
│   ├── domain/                       # Business entities (User, Post, Tag)
│   ├── dto/                          # Request/response models
│   ├── repository/                   # Data access layer (with interfaces)
│   ├── service/                      # Business logic layer (with interfaces)
│   ├── handler/                      # HTTP handlers (controllers)
│   └── middleware/
│       └── auth.go                   # JWT validation middleware
├── utils/
│   └── auth.go                       # JWT & password utilities
└── docs/                             # Auto-generated Swagger docs
```

**Key Pattern**: Each layer depends only on layers below it. Interfaces (repository.UserRepository, service.AuthService) enable loose coupling and testability.

### Frontend Structure (Component-Driven with Query State)

```
client/
├── app/                              # Next.js App Router (pages & layouts)
│   ├── layout.tsx                    # Root layout with providers
│   ├── [slug]/                       # Dynamic post detail pages
│   ├── dashboard/                    # User's posts (my-posts)
│   ├── create-post/ & edit-post/     # Post creation/editing
│   └── [locale]/                     # i18n routing (if used)
├── components/                       # Reusable UI components
│   ├── lexical-editor.tsx            # Rich text editor component
│   ├── post-detail.tsx
│   ├── create-post-form.tsx
│   └── ui/                           # shadcn/ui pre-built components
├── lib/
│   ├── api/                          # Modular API client
│   │   ├── base.ts                   # BaseApiClient with axios + interceptors
│   │   ├── auth.ts                   # Auth endpoints
│   │   ├── posts.ts                  # CRUD operations
│   │   └── (tags.ts, users.ts, etc)
│   ├── api-error-handler.ts          # Centralized error handling
│   ├── validations.ts                # Zod schemas for form validation
│   └── utils.ts
├── hooks/
│   └── api/                          # TanStack Query hooks (useQuery, useMutation)
│       ├── posts.ts                  # usePosts, useCreatePost, etc.
│       └── (auth.ts, tags.ts, etc)
├── contexts/
│   ├── AuthContext.tsx               # Global auth state (user, login, logout)
│   └── QueryProvider.tsx             # TanStack Query provider
└── messages/                         # i18n translations
    ├── en.json
    └── vi.json
```

**State Management**:
- **Server state** (posts, tags, users): TanStack Query v5 (automatic caching, refetching, sync)
- **Client state** (auth, theme): React Context
- **Form state**: react-hook-form + zod validation

### Database Schema

**Tables**:
- `users`: email, username, password (bcrypt), timestamps
- `posts`: title, slug (unique), content (HTML from Lexical), author_id, published, timestamps
- `tags`: name, slug, description, color (hex)
- `post_tags`: junction table for many-to-many relationship

**Key Features**:
- Cascading deletes (delete user → delete their posts → delete post_tags)
- Auto-updated `updated_at` timestamps via PostgreSQL trigger
- Indexes on `posts(slug)`, `posts(author_id)`, `posts(published)` for fast queries

## Authentication Flow

1. **User registers/logs in**: Sends credentials to `POST /api/auth/register` or `POST /api/auth/login`
2. **Backend**: Hashes password with bcrypt, generates JWT token (HS256, 24-hour expiration)
3. **Frontend**: Stores token in `localStorage` under key `auth-token`
4. **API Requests**: Axios interceptor automatically adds `Authorization: Bearer <token>` header
5. **Protected Routes**: Backend middleware validates token, sets user in request context
6. **Token Expiry**: 401 response triggers logout and redirect to login page

**Important**: Currently uses basic authorization—users can only edit/delete their own posts (validated at repository level by checking `post.author_id === user.id`).

## Technology Stack Summary

### Backend
- **Go 1.21** with **Gin** framework (REST API)
- **PostgreSQL 15** with `github.com/lib/pq` driver
- **JWT** (HS256) for authentication
- **bcrypt** for password hashing (cost 12)
- **Swagger** for API documentation

### Frontend
- **Next.js 15.5** with App Router
- **React 19.1** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** + **Radix UI** for components
- **Lexical** for rich text editing (Meta's WYSIWYG)
- **TanStack Query v5.62** for server state
- **Axios** with interceptors for HTTP
- **react-hook-form** + **zod** for form validation
- **next-intl** for i18n (English, Vietnamese)

## Important Implementation Details

### API Design
- **RESTful conventions**: GET/POST/PUT/DELETE `/api/posts`, `/api/posts/:slug`, etc.
- **Pagination**: Offset-based with `?page=X&limit=Y`
- **Error Responses**: HTTP status codes (401, 403, 404, 422, 500) with descriptive messages
- **Data Transfer**: DTOs separate request/response models from domain entities (prevents exposing sensitive fields)
- **Protected Routes**: Endpoints requiring authentication use `AuthMiddleware()` (validates JWT token)
- **User-Scoped Data**: `/api/posts/my-posts` returns only the authenticated user's posts (requires valid token)

### Frontend Patterns
- **API Client**: Modular `BaseApiClient` with axios instance + interceptors for auth & error handling
- **Error Handling**: Global interceptor handles 401 (logout), 422 (validation), network errors
- **Optimistic Updates**: TanStack Query mutations can include `onMutate` for instant UI feedback
- **Form Validation**: Zod schemas defined in `lib/validations.ts`, used by both client and form components
- **Component Organization**: Pages coordinate data fetching, components handle rendering, hooks wrap TanStack Query

### Content Management
- **Rich Text**: Posts stored as HTML from Lexical editor
- **Markdown Support**: Lexical has markdown plugin for `**bold**`, `*italic*`, etc.
- **Slugs**: Auto-generated from title (lowercase, hyphens) and must be unique

## Development Notes

### Adding a New API Endpoint
1. Create domain entity in `api/internal/domain/`
2. Create DTOs in `api/internal/dto/`
3. Create repository interface & implementation in `api/internal/repository/`
4. Create service interface & implementation in `api/internal/service/`
5. Create handler method in `api/internal/handler/`
6. Register route in `main.go`
7. Add Swagger comments to handler (auto-documented)

### Adding a New Frontend Feature
1. Create API client methods in `client/lib/api/` (extend BaseApiClient)
2. Create TanStack Query hooks in `client/hooks/api/`
3. Create form validation schema in `client/lib/validations.ts`
4. Build UI components in `client/components/`
5. Create/update page in `client/app/`
6. Use hooks in components (automatic loading/error states)

### Database Changes
- Schema changes: Edit `api/database/init.go`
- Seed data: Edit `api/database/seed.go`
- Changes apply when `POST /api/init-db` is called (idempotent)

### Testing
- Backend: Use `testing` package + repository interfaces for mocking
- Frontend: Consider adding `@testing-library/react` + `vitest` for component tests
- Integration: Can test via docker-compose with real database

## Environment Variables

### API (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blog
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSLMODE=disable
JWT_SECRET=your-secret-key-min-32-chars
PORT=8080
GIN_MODE=debug  # or "release" for production
```

**Setup**: Copy `.env.example` to `.env` and update values for your environment.

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

**Setup**: Create `.env.local` file at `client/` root with the API URL (reachable from your browser).

### Production Considerations
- Update CORS origins in `api/main.go` (line 72) to allow your frontend domain
- Use environment variables for sensitive values (JWT_SECRET, DB_PASSWORD)
- Set `GIN_MODE=release` for production API deployments
- Ensure JWT_SECRET is at least 32 characters for security

## Deployment Considerations

- **Both services** (API and frontend) can be deployed independently to different servers
- **Docker Compose** handles local dev; for production, consider Kubernetes or managed container services
- **SSL**: Add your certificates to `ssl/` directory and update nginx config
- **Secrets**: Use Docker secrets file or environment variables for JWT_SECRET, DB_PASSWORD, etc.
- **Health Checks**: Use `/health` endpoint for API monitoring (no auth required)
- **Scalability**: Stateless API design allows horizontal scaling; use load balancer in front of multiple API instances

## Common Development Issues

### Database Connection Errors
- Ensure PostgreSQL is running on the configured host/port
- Verify credentials match your `.env` file
- Check `DB_SSLMODE=disable` for local development (change for production)
- After schema changes, call `POST /api/init-db` to apply migrations

### CORS Errors
- Frontend and API must have different origins (e.g., `localhost:3000` and `localhost:8080`)
- Update CORS whitelist in `api/main.go` if changing ports or domains
- Ensure `Authorization` header is in `AllowHeaders` list (already configured)

### JWT Token Issues
- Tokens expire after 24 hours; users must re-login
- Check that `Authorization: Bearer <token>` header is being sent (verify in axios interceptors)
- Ensure `JWT_SECRET` is at least 32 characters and consistent across restarts
- 401 responses should trigger logout and redirect to login page (see frontend error handler)

### Frontend Build Issues
- Run `npm install` after git pulls to sync dependencies
- Use `npm run lint -- --fix` to auto-fix linting issues before committing
- Clear Next.js cache with `rm -rf .next` if experiencing stale builds

## Protected Pages Pattern (Authentication)

### The Problem
Before: Each protected page needed to manually check authentication and handle state updates during render:
```tsx
// ❌ BAD: Causes "Cannot update component during render" error
if (!authLoading && !user) {
  router.push('/login');  // State update during render!
  return null;
}
```

### The Solution: ProtectedRoute Wrapper

Use the existing `ProtectedRoute` component to wrap your page content. It handles:
- ✅ Loading state display while auth is being verified
- ✅ Redirect logic in `useEffect` (safe, after render)
- ✅ Permission checking before rendering

**Pattern for Protected Pages:**

```tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';

// Split your page into two components:
// 1. Content component (has access to auth, no redirect logic)
function MyPageContent() {
  const { user } = useAuth();  // User is guaranteed to exist here
  const router = useRouter();

  // Your normal page logic here
  return <div>Page content</div>;
}

// 2. Wrapper component (handles auth check)
export default function MyPage() {
  return (
    <ProtectedRoute page="my-page">
      <MyPageContent />
    </ProtectedRoute>
  );
}
```

### Page Names (for ProtectedRoute)
These must match the `PERMISSIONS` object in `lib/permissions.ts`:
- **User Pages** (any authenticated user): `dashboard`, `create-post`, `edit-post`, `my-posts`
- **Admin Pages**: `tags`, `users`, `analytics`

### Real Example: CreatePostPage

Before (manual auth check):
```tsx
export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) { /* show loader */ }
  if (!authLoading && !user) {
    router.push('/login');  // ❌ Causes render error
    return null;
  }
  // page content...
}
```

After (using ProtectedRoute):
```tsx
function CreatePostPageContent() {
  const { user } = useAuth();  // No loading checks needed
  // page content...
}

export default function CreatePostPage() {
  return (
    <ProtectedRoute page="create-post">
      <CreatePostPageContent />
    </ProtectedRoute>
  );
}
```

### Key Benefits
- **DRY**: No duplicate auth/loading logic across pages
- **Safe**: Redirect happens in `useEffect`, not during render
- **Consistent**: All protected pages follow the same pattern
- **Flexible**: Can use `fallback` prop for custom error UI

### How ProtectedRoute Works
1. Shows loading spinner while `useAuth()` is checking auth
2. Redirects unauthenticated users to `/login` in `useEffect` (safe)
3. Checks permissions against `PERMISSIONS` config
4. Renders children only after auth is verified and user has access
