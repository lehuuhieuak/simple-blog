# Blog API - Layered Architecture

This project has been restructured to follow a clean layered architecture pattern with integrated Swagger documentation.

## Architecture Overview

The application follows a 4-layer architecture:

```
api/
├── main.go                    # Application entry point with Swagger setup
├── docs/                      # Auto-generated Swagger documentation
├── internal/
│   ├── domain/               # Domain entities (business objects)
│   │   ├── user.go
│   │   └── post.go
│   ├── dto/                  # Data Transfer Objects (request/response)
│   │   ├── auth.go
│   │   └── post.go
│   ├── repository/           # Data access layer
│   │   ├── user_repository.go
│   │   ├── post_repository.go
│   │   └── tag_repository.go
│   ├── service/              # Business logic layer
│   │   ├── auth_service.go
│   │   ├── post_service.go
│   │   └── tag_service.go
│   ├── handler/              # HTTP handlers (controllers)
│   │   ├── auth_handler.go
│   │   ├── post_handler.go
│   │   ├── tag_handler.go
│   │   └── database_handler.go
│   └── middleware/           # HTTP middleware
│       └── auth.go
├── config/                   # Configuration
├── database/                 # Database connection and migrations
├── utils/                    # Utility functions
└── go.mod
```

## Layer Responsibilities

### 1. Domain Layer (`internal/domain/`)
- Contains business entities and core domain models
- Defines the structure of data objects
- No dependencies on other layers

### 2. Repository Layer (`internal/repository/`)
- Handles data persistence and retrieval
- Implements database operations
- Abstracts database details from business logic

### 3. Service Layer (`internal/service/`)
- Contains business logic and rules
- Orchestrates operations between repositories
- Handles complex business workflows

### 4. Handler Layer (`internal/handler/`)
- HTTP request/response handling
- Input validation and serialization
- Calls appropriate services

## Swagger Integration

The API now includes comprehensive Swagger documentation:

- **Swagger UI**: Available at `http://localhost:8080/swagger/index.html`
- **JSON Spec**: Available at `http://localhost:8080/swagger/doc.json`
- **YAML Spec**: Available at `http://localhost:8080/swagger/swagger.yaml`

### Swagger Annotations

All endpoints are documented with:
- Request/response schemas
- Authentication requirements
- Error responses
- Example values

## Key Features

### 1. Dependency Injection
- Clean separation of concerns
- Easy testing and mocking
- Flexible configuration

### 2. Interface-Based Design
- Repository and service interfaces
- Easy to swap implementations
- Better testability

### 3. Error Handling
- Consistent error responses
- Proper HTTP status codes
- Detailed error messages

### 4. Authentication
- JWT-based authentication
- Bearer token support
- Middleware-based protection

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Posts
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/{slug}` - Get post by slug
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/{slug}` - Update post (protected)
- `DELETE /api/posts/{slug}` - Delete post (protected)
- `GET /api/posts/my-posts` - Get current user's posts (protected)

### Tags
- `GET /api/tags` - Get all tags (paginated)
- `POST /api/tags` - Create new tag (protected)
- `PUT /api/tags/{id}` - Update tag (protected)
- `DELETE /api/tags/{id}` - Delete tag (protected)
- `GET /api/tags/{slug}/posts` - Get posts by tag

### Database
- `POST /api/init-db` - Initialize database tables and seed data

## Running the Application

1. Install dependencies:
   ```bash
   go mod tidy
   ```

2. Generate Swagger docs:
   ```bash
   go run github.com/swaggo/swag/cmd/swag@latest init
   ```

3. Build and run:
   ```bash
   go build -o blog-api.exe .
   ./blog-api.exe
   ```

4. Access Swagger UI:
   ```
   http://localhost:8080/swagger/index.html
   ```

## Benefits of This Architecture

1. **Maintainability**: Clear separation of concerns makes code easier to maintain
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Easy to add new features without affecting existing code
4. **Documentation**: Comprehensive API documentation with Swagger
5. **Type Safety**: Strong typing throughout the application
6. **Flexibility**: Easy to swap implementations or add new features

## Migration from Old Structure

The old structure has been completely refactored:
- `handlers/` → `internal/handler/`
- `models/` → `internal/domain/` + `internal/dto/`
- `middleware/` → `internal/middleware/`
- Added `internal/repository/` and `internal/service/` layers
- Integrated Swagger documentation
- Improved error handling and validation