# Blog API - Golang Backend

This is the Golang REST API backend for the blog application.

## Setup

1. Install dependencies:
```bash
go mod tidy
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update the `.env` file with your database configuration.

4. Run the server:
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires authentication)

### Posts
- `GET /api/posts` - Get all published posts (with pagination)
- `GET /api/posts/:slug` - Get a specific post by slug
- `POST /api/posts` - Create a new post (requires authentication)
- `PUT /api/posts/:slug` - Update a post (requires authentication)
- `DELETE /api/posts/:slug` - Delete a post (requires authentication)
- `GET /api/posts/my-posts` - Get current user's posts (requires authentication)

### Database
- `POST /api/init-db` - Initialize database tables

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## CORS

The API is configured to allow requests from `http://localhost:3000` for the Next.js frontend.