# Blog Application - Separated Frontend & Backend

This project has been restructured to separate the frontend and backend into distinct applications:

## Project Structure

```
project-root/
├── api/          # Golang REST API server
│   ├── config/
│   ├── database/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── utils/
│   ├── main.go
│   ├── go.mod
│   └── README.md
└── client/       # Next.js frontend application
    ├── app/
    ├── components/
    ├── contexts/
    ├── lib/
    ├── messages/
    ├── public/
    ├── package.json
    └── README.md
```

## Quick Start

### Option 1: Docker Setup (Recommended)

#### Development Environment
The easiest way to run the entire application with all dependencies:

**Linux/macOS:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Windows:**
```cmd
scripts\setup.bat
```

**Manual Docker setup:**
```bash
# Copy environment files
cp api/.env.example api/.env
cp client/.env.local.example client/.env.local

# Start with development hot reload
docker-compose -f docker-compose.dev.yml up --build

# Initialize database
curl -X POST http://localhost:8080/api/init-db
```

#### Production Deployment
For production deployment with SSL, reverse proxy, and security features:

**Automated Production Setup:**
```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

**Manual Production Setup:**
```bash
# 1. Configure environment
cp .env.production .env.production.local
# Edit .env.production.local with your domain and settings

# 2. Set up secrets
cp secrets/*.example secrets/
# Edit secret files with secure passwords

# 3. Generate SSL certificates (or add your own)
chmod +x ssl/generate-ssl.sh
./ssl/generate-ssl.sh

# 4. Update nginx configuration with your domain
# Edit nginx/conf.d/default.conf

# 5. Deploy
docker-compose up --build -d
```

📖 **For detailed Docker instructions, see [DOCKER.md](DOCKER.md)**
🚀 **For CI/CD pipeline setup, see [CI-CD.md](CI-CD.md)**

### Option 2: Manual Setup

If you prefer to run services individually:

#### 1. Start the API Server (Golang)

```bash
cd api
cp .env.example .env
# Edit .env with your database configuration
go mod tidy
go run main.go
```

The API will be available at `http://localhost:8080`

#### 2. Start the Frontend (Next.js)

```bash
cd client
npm install
cp .env.local.example .env.local
# Edit .env.local if needed (default API URL: http://localhost:8080/api)
npm run dev
```

The frontend will be available at `http://localhost:3000`

#### 3. Initialize Database

Make a POST request to `http://localhost:8080/api/init-db` to create the database tables.

## Key Changes Made

### Backend (Golang API)
- ✅ Created complete REST API with Gin framework
- ✅ Implemented JWT authentication with Bearer tokens
- ✅ Replicated all original API endpoints:
  - Authentication: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
  - Posts: `/api/posts`, `/api/posts/:slug`, `/api/posts/my-posts`
  - Database: `/api/init-db`
- ✅ MSSQL database integration
- ✅ CORS configuration for frontend communication
- ✅ Password hashing with bcrypt
- ✅ Input validation and error handling

### Frontend (Next.js Client)
- ✅ Removed all API routes (`/app/api/` folder deleted)
- ✅ Created API client service (`/lib/api.ts`) for HTTP communication
- ✅ Updated AuthContext to use external API with JWT tokens
- ✅ Token storage in localStorage instead of cookies
- ✅ Updated components to use new API client
- ✅ Environment configuration for API URL

### Authentication Changes
- **Before**: Cookie-based authentication with httpOnly cookies
- **After**: JWT token-based authentication with localStorage storage
- Tokens are automatically included in API requests via Authorization header

## Environment Variables

### API (.env)
```
DB_HOST=localhost
DB_PORT=1433
DB_NAME=blog
DB_USER=sa
DB_PASSWORD=your_password
DB_ENCRYPT=false
DB_TRUST_CERT=true
JWT_SECRET=your-secret-key
PORT=8080
```

### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## API Documentation

See `api/README.md` for detailed API documentation.

## Frontend Documentation

See `client/README.md` for frontend setup and features.

## Migration Notes

1. **Database**: The same MSSQL database schema is used
2. **Authentication**: Users will need to log in again due to the change from cookies to JWT tokens
3. **CORS**: The API is configured to accept requests from `http://localhost:3000`
4. **Deployment**: Both applications can now be deployed independently