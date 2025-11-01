# Blog API - Developer Guide

## Project Overview

- **Language**: Go 1.21
- **Framework**: Gin (HTTP web framework)
- **Database**: PostgreSQL
- **Authentication**: JWT with Bearer tokens
- **Documentation**: Swagger/OpenAPI with Gin-Swagger
- **Architecture**: Clean layered architecture (4-layer pattern)

## Key Technologies

- **Web Framework**: `github.com/gin-gonic/gin`
- **Database Driver**: `github.com/lib/pq` (PostgreSQL)
- **JWT**: `github.com/golang-jwt/jwt/v5`
- **Swagger**: `github.com/swaggo/gin-swagger`
- **Password Hashing**: `golang.org/x/crypto/bcrypt`
- **Environment**: `github.com/joho/godotenv`
- **CORS**: `github.com/gin-contrib/cors`

## Project Structure

### Layered Architecture (4 Layers)

```
├── main.go                    # Application entry point with Swagger setup
├── docs/                      # Auto-generated Swagger documentation
├── internal/
│   ├── domain/               # Domain entities (business objects)
│   ├── dto/                  # Data Transfer Objects (request/response)
│   ├── repository/           # Data access layer
│   ├── service/              # Business logic layer
│   ├── handler/              # HTTP handlers (controllers)
│   └── middleware/           # HTTP middleware
├── config/                   # Configuration management
├── database/                 # Database connection and operations
└── utils/                    # Utility functions
```

### Layer Responsibilities

- **Domain**: Business entities, no dependencies on other layers
- **Repository**: Data persistence, database operations abstraction
- **Service**: Business logic, orchestrates operations between repositories
- **Handler**: HTTP request/response handling, input validation

## Development Guidelines

### Code Organization

- Use **dependency injection** pattern for clean separation of concerns
- Implement **interfaces** for repositories and services for better testability
- Follow **clean architecture** principles with clear layer boundaries
- Keep domain entities pure with no external dependencies

### Naming Conventions

- **Files**: `snake_case` (e.g., `post_repository.go`, `auth_service.go`)
- **Structs**: `PascalCase` (e.g., `PostRequest`, `UserResponse`)
- **Functions/Methods**: `PascalCase` for exported, `camelCase` for private
- **Database fields**: Use `db` tags for mapping (e.g., `db:"created_at"`)
- **JSON fields**: Use `json` tags for API responses (e.g., `json:"id"`)

### Request/Response Patterns

- Use **DTOs** for request/response objects in `internal/dto/`
- Apply **binding validation** tags (e.g., `binding:"required,max=255"`)
- Include **Swagger examples** in struct tags (e.g., `example:"My Blog Post"`)
- Implement **ToResponse()** methods in domain entities for data transformation

### Error Handling

- Return consistent error responses with proper HTTP status codes
- Use descriptive error messages for API consumers
- Handle repository errors gracefully in service layer
- Implement proper validation error responses

### Authentication & Authorization

- Use **JWT Bearer tokens** for authentication
- Apply `middleware.AuthMiddleware()` to protected routes
- Extract user information from JWT claims in handlers
- Validate user permissions for resource access (e.g., post ownership)

## API Documentation

### Swagger Integration

- **UI**: `http://localhost:8080/swagger/index.html`
- **JSON Spec**: `http://localhost:8080/swagger/doc.json`
- **YAML Spec**: `http://localhost:8080/swagger/swagger.yaml`

### Swagger Annotations

Always include in handlers:
- `@Summary` - Brief description
- `@Description` - Detailed description
- `@Tags` - Group endpoints
- `@Accept` and `@Produce` - Content types
- `@Param` - Request parameters
- `@Success` - Success responses
- `@Failure` - Error responses
- `@Security` - Authentication requirements

### Generating Documentation

```bash
go run github.com/swaggo/swag/cmd/swag@latest init
```

## Database Operations

### Configuration

- Use environment variables for database connection
- Default connection: PostgreSQL on localhost:5432
- SSL mode disabled for development
- Connection pooling handled by `database/sql`

### Repository Pattern

- Implement interfaces for all repositories
- Use prepared statements for SQL queries
- Handle database errors with descriptive messages
- Support pagination with `LIMIT` and `OFFSET`

### Database Initialization

- Use `POST /api/init-db` endpoint to create tables
- Seed data available through database initialization
- Migration scripts in `database/` directory

## Testing Guidelines

### Unit Testing

- Write comprehensive unit tests for all services
- Use **table-driven tests** pattern for multiple scenarios
- Mock all repository dependencies
- Test both success and error cases
- Cover edge cases and boundary values

### Test Structure

```go
tests := []struct {
    name          string
    input         InputType
    mockSetup     func(*MockRepository)
    expectedError string
    expectSuccess bool
}{
    // Test cases...
}
```

### Running Tests

```bash
# All service tests
go test ./internal/service/... -v

# With coverage
go test ./internal/service/... -v -cover

# Generate coverage report
./run_service_tests.sh
```

## Environment Setup

### Required Environment Variables

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

### Development Setup

1. Copy environment file: `cp .env.example .env`
2. Update database credentials in `.env`
3. Install dependencies: `go mod tidy`
4. Generate Swagger docs: `swag init`
5. Run application: `go run main.go`

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
- `POST /api/init-db` - Initialize database tables

## Best Practices

### Security

- Never expose passwords in JSON responses (use `json:"-"` tag)
- Validate JWT tokens on protected routes
- Use bcrypt for password hashing
- Implement proper CORS configuration
- Validate user permissions for resource access

### Performance

- Use database connection pooling
- Implement pagination for list endpoints
- Use prepared statements for SQL queries
- Index database columns used in WHERE clauses
- Optimize N+1 query problems with proper joins

### Code Quality

- Follow Go formatting standards (`gofmt`)
- Use meaningful variable and function names
- Write comprehensive tests with good coverage
- Document public functions and complex logic
- Handle errors explicitly, don't ignore them

### Maintenance

- Keep dependencies up to date
- Use semantic versioning for releases
- Maintain comprehensive API documentation
- Write migration scripts for database schema changes
- Monitor application performance and errors

## Useful Commands

```bash
# Development
go mod tidy                    # Update dependencies
go run main.go                 # Start development server
swag init                      # Generate Swagger docs

# Testing
go test ./...                  # Run all tests
./run_service_tests.sh         # Run service tests with coverage

# Building
go build -o blog-api .         # Build binary
docker build -t blog-api .     # Build Docker image

# Database
psql -h localhost -U postgres -d blog  # Connect to database
```

## CORS Configuration

Configured for frontend development:
- Allowed Origins: `http://localhost:3000`, `http://127.0.0.1:3000`
- Allowed Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Credentials: Enabled for authentication

## Health Check

- Endpoint: `GET /health`
- Response: `{"status": "ok"}`
- Use for monitoring and load balancer health checks