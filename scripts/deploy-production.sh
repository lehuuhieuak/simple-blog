#!/bin/bash

# Production Deployment Script for Blog Application

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if running as root (not recommended for production)
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  WARNING: Running as root is not recommended for production!"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL is not installed. Please install OpenSSL first."
    exit 1
fi

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
    echo "✅ Loaded production environment variables"
else
    echo "⚠️  .env.production not found, using defaults"
fi

# Create secrets directory if it doesn't exist
mkdir -p secrets

# Generate secrets if they don't exist
echo "🔐 Setting up secrets..."

if [ ! -f "secrets/db_password.txt" ]; then
    echo "Generating database password..."
    openssl rand -base64 32 > secrets/db_password.txt
    echo "✅ Generated database password"
fi

if [ ! -f "secrets/jwt_secret.txt" ]; then
    echo "Generating JWT secret..."
    openssl rand -base64 64 > secrets/jwt_secret.txt
    echo "✅ Generated JWT secret"
fi

if [ ! -f "secrets/redis_password.txt" ]; then
    echo "Generating Redis password..."
    openssl rand -base64 32 > secrets/redis_password.txt
    echo "✅ Generated Redis password"
fi

# Set proper permissions for secrets
chmod 600 secrets/*.txt
echo "✅ Set proper permissions for secrets"

# Generate SSL certificates if they don't exist
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "🔐 Generating SSL certificates..."
    chmod +x ssl/generate-ssl.sh
    ./ssl/generate-ssl.sh
fi

# Create backup directory
mkdir -p backups
echo "✅ Created backup directory"

# Create nginx logs directory
mkdir -p nginx/logs
echo "✅ Created nginx logs directory"

# Validate nginx configuration
echo "🔍 Validating nginx configuration..."
if docker run --rm -v $(pwd)/nginx:/etc/nginx:ro nginx:alpine nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration is invalid. Please fix the configuration."
    exit 1
fi

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Build application images
echo "🔨 Building application images..."
docker-compose build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start production environment
echo "🚀 Starting production environment..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 60

# Check service health
echo "🏥 Checking service health..."

# Check database
if docker-compose exec -T mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$(cat secrets/db_password.txt)" -Q "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
    docker-compose logs mssql
    exit 1
fi

# Check API
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    docker-compose logs api
    exit 1
fi

# Check frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs client
    exit 1
fi

# Initialize database
echo "🗄️ Initializing database..."
if curl -X POST http://localhost/api/init-db > /dev/null 2>&1; then
    echo "✅ Database initialized successfully"
else
    echo "⚠️  Database initialization may have failed. Check logs."
fi

echo ""
echo "🎉 Production deployment completed successfully!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: https://${DOMAIN:-yourdomain.com}"
echo "   API:      https://${DOMAIN:-yourdomain.com}/api"
echo "   Health:   https://${DOMAIN:-yourdomain.com}/api/health"
echo ""
echo "🔐 Security Notes:"
echo "   - Update secrets/db_password.txt with a secure password"
echo "   - Update secrets/jwt_secret.txt with a secure secret"
echo "   - Replace self-signed SSL certificates with real ones"
echo "   - Update nginx/conf.d/default.conf with your domain"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:    docker-compose logs -f"
echo "   Stop:         docker-compose down"
echo "   Restart:      docker-compose restart"
echo "   Backup DB:    docker-compose exec mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P \"\$(cat secrets/db_password.txt)\" -Q \"BACKUP DATABASE blog TO DISK = '/var/backups/blog_\$(date +%Y%m%d_%H%M%S).bak'\""