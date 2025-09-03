# Blog Application Makefile

.PHONY: help setup dev prod deploy-prod stop logs clean restart init-db ssl-cert backup status

# Default target
help:
	@echo "Blog Application Docker Commands"
	@echo "================================"
	@echo "Development:"
	@echo "  setup       - Run automated development setup"
	@echo "  dev         - Start development environment with hot reload"
	@echo "  init-db     - Initialize database tables"
	@echo ""
	@echo "Production:"
	@echo "  deploy-prod - Deploy production environment (automated)"
	@echo "  prod        - Start production environment (manual)"
	@echo "  ssl-cert    - Generate SSL certificates"
	@echo "  backup      - Backup production database"
	@echo ""
	@echo "Management:"
	@echo "  status      - Show service status"
	@echo "  logs        - View logs from all services"
	@echo "  stop        - Stop all services"
	@echo "  restart     - Restart all services"
	@echo "  clean       - Stop and remove all containers and volumes"
	@echo ""
	@echo "Examples:"
	@echo "  make setup        # Development setup"
	@echo "  make deploy-prod  # Production deployment"
	@echo "  make logs         # View logs"

# Setup environment files and start
setup:
	@echo "Setting up environment files..."
	@cp -n api/.env.example api/.env 2>/dev/null || true
	@cp -n client/.env.local.example client/.env.local 2>/dev/null || true
	@echo "Environment files ready!"
	@echo "Starting development environment..."
	@docker-compose -f docker-compose.dev.yml up --build -d
	@echo "Waiting for services to start..."
	@sleep 30
	@echo "Initializing database..."
	@curl -X POST http://localhost:8080/api/init-db || echo "Database initialization may have failed"
	@echo "Setup complete! Visit http://localhost:3000"

# Development environment
dev:
	@docker-compose -f docker-compose.dev.yml up --build

# Production deployment (automated)
deploy-prod:
	@echo "🚀 Starting automated production deployment..."
	@chmod +x scripts/deploy-production.sh
	@./scripts/deploy-production.sh

# Production environment (manual)
prod:
	@echo "🏭 Starting production environment..."
	@docker-compose up --build -d
	@echo "✅ Production environment started"

# Generate SSL certificates
ssl-cert:
	@echo "🔐 Generating SSL certificates..."
	@chmod +x ssl/generate-ssl.sh
	@./ssl/generate-ssl.sh

# Backup production database
backup:
	@echo "💾 Creating database backup..."
	@docker-compose exec -T mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$$(cat secrets/db_password.txt)" -Q "BACKUP DATABASE blog TO DISK = '/var/backups/blog_$$(date +%Y%m%d_%H%M%S).bak'"
	@echo "✅ Database backup completed"

# Show service status
status:
	@echo "📊 Service Status:"
	@docker-compose ps
	@echo ""
	@echo "🏥 Health Checks:"
	@curl -s http://localhost/health || echo "❌ Nginx health check failed"
	@curl -s http://localhost/api/health || echo "❌ API health check failed"

# Development environment
dev:
	@docker-compose -f docker-compose.dev.yml up --build

# Stop services
stop:
	@docker-compose down
	@docker-compose -f docker-compose.dev.yml down

# View logs
logs:
	@docker-compose logs -f

# Clean up everything
clean:
	@docker-compose down -v
	@docker-compose -f docker-compose.dev.yml down -v
	@docker system prune -f

# Restart services
restart:
	@docker-compose restart
	@docker-compose -f docker-compose.dev.yml restart

# Initialize database
init-db:
	@curl -X POST http://localhost:8080/api/init-db || curl -X POST http://localhost/api/init-db