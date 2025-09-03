#!/bin/bash

# Blog Application Docker Setup Script

echo "🚀 Setting up Blog Application with Docker..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment files if they don't exist
echo "📝 Setting up environment files..."

if [ ! -f "api/.env" ]; then
    cp api/.env.example api/.env
    echo "✅ Created api/.env from example"
fi

if [ ! -f "client/.env.local" ]; then
    cp client/.env.local.example client/.env.local
    echo "✅ Created client/.env.local from example"
fi

# Ask user which environment to run
echo ""
echo "🔧 Which environment would you like to run?"
echo "1) Production (docker-compose.yml)"
echo "2) Development with hot reload (docker-compose.dev.yml)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        COMPOSE_FILE="docker-compose.yml"
        echo "🏭 Starting production environment..."
        ;;
    2)
        COMPOSE_FILE="docker-compose.dev.yml"
        echo "🛠️ Starting development environment with hot reload..."
        ;;
    *)
        echo "❌ Invalid choice. Defaulting to development environment."
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
esac

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Initialize database
echo "🗄️ Initializing database..."
curl -X POST http://localhost:8080/api/init-db || echo "⚠️ Database initialization failed. You may need to run this manually."

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:8080"
echo "   Health:   http://localhost:8080/health"
echo ""
echo "🗄️ Database Connection:"
echo "   Host:     localhost"
echo "   Port:     1433"
echo "   Database: blog"
echo "   Username: sa"
echo "   Password: BlogApp123!"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stop:         docker-compose -f $COMPOSE_FILE down"
echo "   Restart:      docker-compose -f $COMPOSE_FILE restart"
echo "   Clean up:     docker-compose -f $COMPOSE_FILE down -v"