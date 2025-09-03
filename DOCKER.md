# Docker Setup for Blog Application

This document provides instructions for running the blog application using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)

## Quick Start

### Option 1: Automated Setup (Recommended)

**Linux/macOS:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Windows:**
```cmd
scripts\setup.bat
```

### Option 2: Manual Setup

1. **Copy environment files:**
   ```bash
   cp api/.env.example api/.env
   cp client/.env.local.example client/.env.local
   ```

2. **Start the application:**
   
   **Development (with hot reload):**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```
   
   **Production:**
   ```bash
   docker-compose up --build
   ```

3. **Initialize the database:**
   ```bash
   curl -X POST http://localhost:8080/api/init-db
   ```

## Services

The Docker setup includes three services:

### 1. MSSQL Database (`mssql`)
- **Image:** `mcr.microsoft.com/mssql/server:2022-latest`
- **Port:** `1433`
- **Credentials:**
  - Username: `sa`
  - Password: `BlogApp123!`
  - Database: `blog`

### 2. API Backend (`api`)
- **Port:** `8080`
- **Built from:** `./api/Dockerfile` (or `./api/Dockerfile.dev` for development)
- **Environment:** Golang with Gin framework

### 3. Frontend Client (`client`)
- **Port:** `3000`
- **Built from:** `./client/Dockerfile` (or `./client/Dockerfile.dev` for development)
- **Environment:** Next.js with TypeScript

## Application URLs

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8080
- **API Health Check:** http://localhost:8080/health

## Docker Compose Files

### `docker-compose.yml` (Production)
- Optimized builds with multi-stage Dockerfiles
- Minimal runtime images
- Production-ready configuration

### `docker-compose.dev.yml` (Development)
- Hot reload for both frontend and backend
- Development dependencies included
- Volume mounts for live code editing

## Common Commands

### Start Services
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f client
docker-compose logs -f mssql
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Clean Up (Remove containers and volumes)
```bash
docker-compose down -v
```

### Rebuild Services
```bash
docker-compose up --build
```

## Database Management

### Connect to MSSQL
```bash
# Using Docker
docker exec -it blog_mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P BlogApp123!

# Using external client
Server: localhost,1433
Username: sa
Password: BlogApp123!
Database: blog
```

### Initialize Database Tables
```bash
curl -X POST http://localhost:8080/api/init-db
```

## Development Workflow

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Make code changes:**
   - API changes in `./api/` will trigger automatic rebuild
   - Frontend changes in `./client/` will trigger hot reload

3. **View logs for debugging:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

## Environment Variables

### API (.env)
```env
DB_HOST=mssql
DB_PORT=1433
DB_NAME=blog
DB_USER=sa
DB_PASSWORD=BlogApp123!
DB_ENCRYPT=false
DB_TRUST_CERT=true
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=8080
```

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Troubleshooting

### Database Connection Issues
1. Wait for MSSQL to fully start (can take 30-60 seconds)
2. Check if port 1433 is available
3. Verify MSSQL container health: `docker-compose ps`

### API Not Starting
1. Check if database is ready: `docker-compose logs mssql`
2. Verify environment variables in `api/.env`
3. Check API logs: `docker-compose logs api`

### Frontend Issues
1. Ensure API is running and accessible
2. Check if port 3000 is available
3. Verify environment variables in `client/.env.local`

### Port Conflicts
If you have port conflicts, you can modify the ports in the docker-compose files:
```yaml
ports:
  - "3001:3000"  # Change host port from 3000 to 3001
```

## Production Deployment

For production deployment:

1. **Update environment variables:**
   - Change default passwords
   - Use secure JWT secrets
   - Update API URLs for your domain

2. **Use production compose file:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Set up reverse proxy (recommended):**
   - Use nginx or traefik for SSL termination
   - Configure proper domain routing

## Security Notes

- **Change default passwords** in production
- **Use environment-specific secrets** for JWT
- **Enable SSL/TLS** for production deployments
- **Restrict database access** in production networks