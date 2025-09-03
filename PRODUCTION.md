# Production Deployment Guide

This guide covers deploying the blog application to production using Docker Compose with enterprise-grade security and performance features.

## 🏗️ Production Architecture

The production setup includes:

- **Nginx Reverse Proxy** with SSL termination and rate limiting
- **Golang API** with security hardening
- **Next.js Frontend** with optimized builds
- **Microsoft SQL Server** with encrypted connections
- **Redis** for caching and session storage
- **Docker Secrets** for sensitive data management
- **Network Isolation** between frontend and backend
- **Health Checks** and automatic restarts
- **Resource Limits** and monitoring

## 🚀 Quick Production Deployment

```bash
# Clone and navigate to project
git clone <your-repo>
cd blog-application

# Run automated production setup
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

## 📋 Pre-Deployment Checklist

### 1. Domain and DNS Setup
- [ ] Domain name registered and configured
- [ ] DNS A record pointing to your server IP
- [ ] Subdomain configured (if using www)

### 2. Server Requirements
- [ ] Linux server (Ubuntu 20.04+ recommended)
- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] OpenSSL installed
- [ ] Minimum 4GB RAM, 2 CPU cores
- [ ] 20GB+ disk space

### 3. Security Setup
- [ ] Server firewall configured (ports 80, 443 open)
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Regular security updates enabled

## 🔧 Manual Production Setup

### Step 1: Environment Configuration

```bash
# Copy and customize environment file
cp .env.production .env.production.local

# Edit with your settings
nano .env.production.local
```

Required changes:
```env
DOMAIN=yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
DB_NAME=blog_production
```

### Step 2: Secrets Management

```bash
# Copy secret templates
cp secrets/db_password.txt.example secrets/db_password.txt
cp secrets/jwt_secret.txt.example secrets/jwt_secret.txt
cp secrets/redis_password.txt.example secrets/redis_password.txt
cp secrets/.env.prod.example secrets/.env.prod

# Generate secure passwords
openssl rand -base64 32 > secrets/db_password.txt
openssl rand -base64 64 > secrets/jwt_secret.txt
openssl rand -base64 32 > secrets/redis_password.txt

# Set proper permissions
chmod 600 secrets/*.txt
```

### Step 3: SSL Certificates

#### Option A: Self-Signed (Development/Testing)
```bash
chmod +x ssl/generate-ssl.sh
./ssl/generate-ssl.sh
```

#### Option B: Let's Encrypt (Recommended for Production)
```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### Option C: Custom Certificates
```bash
# Copy your certificates
cp /path/to/your/certificate.pem ssl/cert.pem
cp /path/to/your/private-key.pem ssl/key.pem
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem
```

### Step 4: Nginx Configuration

```bash
# Update nginx configuration with your domain
nano nginx/conf.d/default.conf
```

Replace `yourdomain.com` with your actual domain in:
- `server_name` directive
- SSL certificate paths (if needed)
- CORS origins in API configuration

### Step 5: Deploy

```bash
# Build and start services
docker-compose up --build -d

# Wait for services to start
sleep 60

# Initialize database
curl -X POST https://yourdomain.com/api/init-db

# Check service status
docker-compose ps
```

## 🔍 Post-Deployment Verification

### Health Checks
```bash
# Check all services
curl https://yourdomain.com/health

# Check API
curl https://yourdomain.com/api/health

# Check database connectivity
docker-compose exec mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$(cat secrets/db_password.txt)" -Q "SELECT 1"
```

### Performance Tests
```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# Test API endpoints
curl -X GET https://yourdomain.com/api/posts
```

### Security Verification
```bash
# Check SSL configuration
curl -I https://yourdomain.com

# Test rate limiting
for i in {1..20}; do curl https://yourdomain.com/api/posts; done

# Verify HTTPS redirect
curl -I http://yourdomain.com
```

## 🔧 Production Management

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nginx
docker-compose logs -f api
docker-compose logs -f mssql
```

### Database Backup
```bash
# Manual backup
docker-compose exec mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$(cat secrets/db_password.txt)" -Q "BACKUP DATABASE blog TO DISK = '/var/backups/blog_$(date +%Y%m%d_%H%M%S).bak'"

# Automated backup (add to crontab)
0 2 * * * cd /path/to/blog-app && docker-compose exec -T mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$(cat secrets/db_password.txt)" -Q "BACKUP DATABASE blog TO DISK = '/var/backups/blog_$(date +\%Y\%m\%d_\%H\%M\%S).bak'"
```

### Updates and Maintenance
```bash
# Update application
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Update base images
docker-compose pull
docker-compose up -d

# Clean up old images
docker system prune -f
```

### Scaling Services
```bash
# Scale API instances
docker-compose up -d --scale api=3

# Scale frontend instances
docker-compose up -d --scale client=2
```

## 🚨 Troubleshooting

### Common Issues

#### SSL Certificate Errors
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Verify certificate chain
curl -vI https://yourdomain.com
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs mssql

# Test database connection
docker-compose exec mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$(cat secrets/db_password.txt)" -Q "SELECT @@VERSION"
```

#### API Not Responding
```bash
# Check API logs
docker-compose logs api

# Verify API health
docker-compose exec api wget -qO- http://localhost:8080/health
```

#### High Memory Usage
```bash
# Check resource usage
docker stats

# Adjust memory limits in docker-compose.yml
```

## 🔒 Security Best Practices

### Regular Maintenance
- [ ] Update Docker images monthly
- [ ] Rotate secrets quarterly
- [ ] Review access logs weekly
- [ ] Update SSL certificates before expiry
- [ ] Monitor security advisories

### Monitoring Setup
```bash
# Add monitoring stack (optional)
# Prometheus, Grafana, AlertManager
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Backup Strategy
- [ ] Daily database backups
- [ ] Weekly full system backups
- [ ] Test restore procedures monthly
- [ ] Store backups off-site

## 📊 Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX IX_Posts_CreatedAt ON Posts(CreatedAt DESC);
CREATE INDEX IX_Posts_Published ON Posts(Published) WHERE Published = 1;
```

### Nginx Caching
```nginx
# Add to nginx configuration for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Redis Caching
```bash
# Monitor Redis usage
docker-compose exec redis redis-cli INFO memory
```

## 🆘 Support and Monitoring

### Log Aggregation
Consider setting up centralized logging with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Fluentd
- Grafana Loki

### Monitoring Solutions
- Prometheus + Grafana
- DataDog
- New Relic
- AWS CloudWatch

### Alerting
Set up alerts for:
- Service downtime
- High error rates
- Resource exhaustion
- SSL certificate expiry