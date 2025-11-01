# Blog Application - Developer Guide

## Project Overview

This is a modern, full-stack blog application with separated frontend and backend architecture, designed for developers to share knowledge and experiences.

### Core Technologies
- **Backend**: Go 1.21 with Gin framework, PostgreSQL database, JWT authentication
- **Frontend**: Next.js 15.5.0 with TypeScript, TanStack Query, Tailwind CSS v4, shadcn/ui
- **Infrastructure**: Docker, Nginx reverse proxy, Redis caching, CI/CD with GitHub Actions
- **Rich Text**: Lexical editor with Markdown support
- **Internationalization**: English and Vietnamese support

## Architecture Overview

### Project Structure
```
project-root/
├── api/          # Golang REST API server (4-layer architecture)
│   ├── internal/
│   │   ├── domain/      # Business entities
│   │   ├── dto/         # Data Transfer Objects
│   │   ├── repository/  # Data access layer
│   │   ├── service/     # Business logic layer
│   │   ├── handler/     # HTTP handlers (controllers)
│   │   └── middleware/  # HTTP middleware
│   ├── config/          # Configuration management
│   ├── database/        # Database connection and migrations
│   ├── docs/           # Auto-generated Swagger documentation
│   └── utils/          # Utility functions
└── client/      # Next.js frontend application
    ├── app/            # App Router pages and layouts
    ├── components/     # Reusable React components
    ├── components/ui/  # shadcn/ui base components
    ├── contexts/       # React Context providers
    ├── hooks/          # Custom React hooks (TanStack Query)
    ├── lib/           # Utilities, API client, configurations
    └── messages/      # i18n messages (en.json, vi.json)
```

### Key Features
- **Authentication**: JWT-based with localStorage storage
- **Rich Text Editing**: Lexical WYSIWYG editor with Markdown compatibility
- **Tag System**: Complete CRUD with many-to-many relationships
- **State Management**: TanStack Query for server state, React Context for client state
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Production Ready**: Docker containers, SSL, monitoring, backups

## Development Setup

### Quick Start (Recommended)
```bash
# Automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or use Makefile
make setup
```

### Manual Setup
```bash
# 1. Environment files
cp api/.env.example api/.env
cp client/.env.local.example client/.env.local

# 2. Start development environment
docker-compose -f docker-compose.dev.yml up --build

# 3. Initialize database
curl -X POST http://localhost:8080/api/init-db
```

### Services
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger/index.html
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Coding Conventions

### Backend (Go)

#### File Naming
- Use `snake_case` for files: `post_repository.go`, `auth_service.go`
- Use `PascalCase` for structs: `PostRequest`, `UserResponse`
- Use `PascalCase` for exported functions, `camelCase` for private

#### Architecture Patterns
- **Clean Architecture**: 4-layer pattern with clear separation
- **Dependency Injection**: Use interfaces for repositories and services
- **Repository Pattern**: Abstract database operations
- **DTO Pattern**: Separate request/response objects from domain entities

#### Code Organization
```go
// Domain entity (internal/domain/)
type Post struct {
    ID        int       `json:"id" db:"id"`
    Title     string    `json:"title" db:"title"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// DTO for requests (internal/dto/)
type CreatePostRequest struct {
    Title   string `json:"title" binding:"required,max=255" example:"My Blog Post"`
    Content string `json:"content" binding:"required" example:"Post content..."`
}

// Repository interface
type PostRepository interface {
    GetByID(id int) (*domain.Post, error)
    Create(post *domain.Post) error
}

// Service with business logic
type PostService struct {
    repo PostRepository
}
```

#### Database Operations
- Use prepared statements for SQL queries
- Implement proper error handling with descriptive messages
- Support pagination with `LIMIT` and `OFFSET`
- Use database transactions for complex operations

#### API Documentation
- Always include Swagger annotations on handlers:
```go
// @Summary Create a new post
// @Description Create a new blog post with tags
// @Tags posts
// @Accept json
// @Produce json
// @Param post body dto.CreatePostRequest true "Post data"
// @Success 201 {object} domain.Post
// @Failure 400 {object} ErrorResponse
// @Security BearerAuth
// @Router /posts [post]
```

### Frontend (Next.js)

#### File Naming
- Use `kebab-case` for files: `create-post-form.tsx`
- Use `PascalCase` for components: `CreatePostForm`
- Use `camelCase` for hooks: `useCreatePost`

#### Component Structure
```typescript
interface CreatePostFormProps {
  onSuccess?: () => void;
}

export function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const createPost = useCreatePost();
  
  const handleSubmit = async (data: CreatePostRequest) => {
    try {
      await createPost.mutateAsync(data);
      onSuccess?.();
    } catch (error) {
      // Handle error
    }
  };

  if (createPost.isPending) return <LoadingSpinner />;

  return <form onSubmit={handleSubmit}>{/* form content */}</form>;
}
```

#### State Management Rules
- **TanStack Query** for server state (API data)
- **React Context** for global client state (auth, theme)
- **useState** for local component state
- **Avoid prop drilling** - use context when data needs to be shared

#### API Integration
- All API calls use TanStack Query hooks from `hooks/useApi.ts`
- Follow query key pattern: `['resource', ...params]`
- Use mutations for create/update/delete operations
- Always handle loading, error, and success states

#### Styling Guidelines
- Use **Tailwind CSS classes exclusively**
- Utilize **shadcn/ui components** for consistency
- Use `cn()` utility for conditional classes
- Follow **mobile-first responsive design**
- Leverage **CSS variables** for theming

## Best Practices

### Security
- **Never expose passwords** in JSON responses (use `json:"-"` tag)
- **Validate JWT tokens** on protected routes
- **Use bcrypt** for password hashing
- **Implement proper CORS** configuration
- **Validate user permissions** for resource access
- **Sanitize all inputs** with Zod schemas

### Performance
- **Use database connection pooling**
- **Implement pagination** for list endpoints
- **Use prepared statements** for SQL queries
- **Index database columns** used in WHERE clauses
- **Optimize N+1 queries** with proper joins
- **Leverage TanStack Query caching**

### Error Handling
- **Return consistent error responses** with proper HTTP status codes
- **Use descriptive error messages**
- **Handle repository errors gracefully** in service layer
- **Implement proper validation** error responses
- **Use error boundaries** in React components

### Testing
- **Write comprehensive unit tests** for all services
- **Use table-driven tests** for multiple scenarios
- **Mock all repository dependencies**
- **Test both success and error cases**
- **Cover edge cases and boundary values**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Posts
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:slug` - Get post by slug
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/:slug` - Update post (protected)
- `DELETE /api/posts/:slug` - Delete post (protected)
- `GET /api/posts/my-posts` - Get current user's posts (protected)

### Tags
- `GET /api/tags` - Get all tags (paginated)
- `POST /api/tags` - Create new tag (protected)
- `PUT /api/tags/:id` - Update tag (protected)
- `DELETE /api/tags/:id` - Delete tag (protected)
- `GET /api/tags/:slug/posts` - Get posts by tag

### Database
- `POST /api/init-db` - Initialize database tables and seed data

## Environment Configuration

### API (.env)
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blog
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSLMODE=disable
JWT_SECRET=your-secret-key
PORT=8080
```

### Client (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Development Workflows

### Making Changes

#### Backend Changes
1. **Update domain entities** if schema changes
2. **Modify repository layer** for data access changes
3. **Update service layer** for business logic changes
4. **Modify handlers** for API endpoint changes
5. **Regenerate Swagger docs**: `swag init`
6. **Run tests**: `go test ./internal/service/... -v`

#### Frontend Changes
1. **Update API hooks** in `hooks/useApi.ts` if needed
2. **Modify components** with proper TypeScript interfaces
3. **Update validation schemas** in `lib/validations.ts`
4. **Test with TanStack Query DevTools**
5. **Run linting**: `npm run lint`

### Database Migrations
1. **Update database schema** in `database/init.go`
2. **Test locally** with `make init-db`
3. **Update repository interfaces** if needed
4. **Run integration tests**

### Adding New Features
1. **Design API endpoints** with Swagger annotations
2. **Implement backend layers** (domain → repository → service → handler)
3. **Create frontend hooks** and components
4. **Add proper error handling** and loading states
5. **Write comprehensive tests**
6. **Update documentation**

## Deployment

### Development
```bash
make dev           # Start development environment
make logs          # View logs
make init-db       # Initialize database
```

### Production
```bash
make deploy-prod   # Automated production deployment
make prod          # Manual production start
make backup        # Backup database
make status        # Check service status
```

### Docker Services
- **postgres**: PostgreSQL database with persistent volumes
- **api**: Golang API server with health checks
- **client**: Next.js frontend application
- **nginx**: Reverse proxy with SSL termination
- **redis**: Caching and session storage

## Monitoring and Maintenance

### Health Checks
- **API**: `GET /health` returns `{"status": "ok"}`
- **Frontend**: Port 3000 accessibility check
- **Database**: PostgreSQL connection test
- **Redis**: Ping command test

### Logging
- **Application logs**: Docker container logs
- **Nginx logs**: Access and error logs in `/var/log/nginx`
- **Database logs**: PostgreSQL container logs

### Backup Strategy
- **Database**: Automated backups via `make backup`
- **Application**: Git repository and Docker images
- **Configuration**: Environment files and secrets

## Troubleshooting

### Common Issues

#### Backend
- **Database connection failed**: Check PostgreSQL service and credentials
- **JWT token invalid**: Verify JWT_SECRET environment variable
- **CORS errors**: Check allowed origins in CORS configuration
- **Build failures**: Run `go mod tidy` to update dependencies

#### Frontend
- **API calls failing**: Verify NEXT_PUBLIC_API_URL environment variable
- **Authentication loops**: Check token storage and API responses
- **Build errors**: Run `npm install` to update dependencies
- **Styling conflicts**: Use `cn()` utility for class merging

#### Infrastructure
- **Container startup failures**: Check Docker logs with `docker-compose logs`
- **SSL certificate issues**: Regenerate certificates with `make ssl-cert`
- **Network connectivity**: Verify Docker network configuration
- **Resource constraints**: Check container memory limits

### Debug Tools
- **Swagger UI**: API endpoint testing and documentation
- **TanStack Query DevTools**: Cache inspection and query debugging
- **Browser DevTools**: Network inspection and performance monitoring
- **Docker logs**: Container-specific debugging

## Migration and Upgrade Notes

### Recent Major Changes
- **Separated architecture**: Frontend and backend are now independent applications
- **TanStack Query integration**: Replaced manual state management
- **Lexical editor**: WYSIWYG editing with Markdown compatibility
- **Tag system**: Complete CRUD functionality with many-to-many relationships
- **Authentication change**: From cookies to JWT tokens with localStorage

### Upgrade Considerations
- **Database compatibility**: Same PostgreSQL schema maintained
- **API versioning**: Backward compatibility maintained
- **Environment variables**: Updated configuration format
- **Deployment**: New Docker compose setup for production

## Useful Commands

### Development
```bash
# Backend
go mod tidy                    # Update dependencies
go run main.go                 # Start development server
swag init                      # Generate Swagger docs
go test ./internal/service/... # Run tests

# Frontend
npm install                    # Install dependencies
npm run dev                    # Start development server
npm run build                  # Build for production
npm run lint                   # Run linting

# Database
psql -h localhost -U postgres -d blog  # Connect to database
```

### Docker
```bash
# Development
docker-compose -f docker-compose.dev.yml up --build
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose up --build -d
docker-compose down
docker-compose logs -f

# Cleanup
docker system prune -f
docker volume prune -f
```

### Makefile Shortcuts
```bash
make help          # Show all available commands
make setup         # Development setup
make dev           # Start development
make deploy-prod   # Production deployment
make status        # Service status
make clean         # Cleanup containers and volumes
```

## Resources and Documentation

### Internal Documentation
- [API Layered Architecture](api/README_LAYERED_ARCHITECTURE.md)
- [Lexical Editor Integration](client/README_LEXICAL_INTEGRATION.md)
- [TanStack Query Integration](client/TANSTACK_QUERY_INTEGRATION.md)
- [Docker Setup Guide](DOCKER.md)
- [CI/CD Pipeline](CI-CD.md)
- [Production Deployment](PRODUCTION.md)

### External Resources
- [Go Gin Framework](https://gin-gonic.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lexical Editor](https://lexical.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)